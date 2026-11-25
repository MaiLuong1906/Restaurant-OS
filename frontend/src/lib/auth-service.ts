import { LoginRequest, LoginResponse, KdsPinAuthRequest, StaffRole } from '../types';
import { useAuthStore, KdsSession } from '../stores/useAuthStore';
import { ApiError, fetchApi } from './api-client';
import { getPermissionsForRole, KDS_TABLET_PERMISSIONS } from './rbac';

// SECURITY: PIN/JWT are authoritatively verified on the Backend when NEXT_PUBLIC_AUTH_MODE=live.
// Mock mode is kept strictly for offline/unit-test development without breaking existing tests.

const isLiveAuthMode = () => process.env.NEXT_PUBLIC_AUTH_MODE === 'live';

interface BackendLoginPayload {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    fullName: string;
    phone?: string | null;
    username: string;
    roleCode: StaffRole;
    isActive: boolean;
  };
  permissions: string[];
}

interface BackendKdsSessionPayload {
  accessToken: string;
  tabletId: string;
  authenticatedAt: string;
  expiresAt: string;
  permissions: string[];
}

export interface VerifyManagerPinResponse {
  approved: boolean;
  approverId: string;
  approverCode: string;
  approverName: string;
  approverRole: string;
  discountCeiling: number;
  approvalToken: string;
  expiresIn: number;
}

export const authService = {
  /**
   * Đăng nhập nhân sự (B1 Staff Login):
   * - Live mode: gọi POST /api/v1/auth/login
   * - Mock mode: giữ nguyên tương thích unit test cục bộ
   */
  async loginStaff(req: LoginRequest): Promise<LoginResponse> {
    if (!req.phoneNumber?.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'Số điện thoại không được để trống', 400);
    }
    if (!req.password || req.password.length < 4) {
      throw new ApiError('VALIDATION_ERROR', 'Mật khẩu không hợp lệ', 400);
    }

    if (isLiveAuthMode()) {
      const data = await fetchApi<BackendLoginPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: req.phoneNumber.trim(),
          password: req.password,
        }),
      });

      const response: LoginResponse & { permissions: string[] } = {
        token: data.accessToken,
        user: {
          id: data.user.id,
          fullName: data.user.fullName,
          phoneNumber: data.user.phone || data.user.username,
          role: data.user.roleCode,
          isActive: data.user.isActive,
        },
        expiresIn: data.expiresIn,
        permissions: data.permissions,
      };

      useAuthStore.getState().setStaffSession(response);
      return response;
    }

    // Mock fallback cho môi trường dev/test không bật backend auth
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockToken = `mock-jwt-${crypto.randomUUID()}`;
    const response: LoginResponse & { permissions: string[] } = {
      token: mockToken,
      user: {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        fullName: 'Nhân Viên Vận Hành',
        phoneNumber: req.phoneNumber,
        role: 'STAFF',
        isActive: true,
      },
      expiresIn: 86400,
      permissions: [...getPermissionsForRole('STAFF')],
    };

    useAuthStore.getState().setStaffSession(response);
    return response;
  },

  /**
   * Đăng nhập trạm KDS bằng mã PIN (A1 KDS PIN Login)
   */
  async authKdsPin(req: KdsPinAuthRequest): Promise<KdsSession> {
    if (!req.pin || !/^\d{4,6}$/.test(req.pin)) {
      throw new ApiError('VALIDATION_ERROR', 'Mã PIN bếp phải gồm từ 4 đến 6 chữ số', 400);
    }

    if (isLiveAuthMode()) {
      const data = await fetchApi<BackendKdsSessionPayload>('/auth/kds-pin', {
        method: 'POST',
        body: JSON.stringify({
          pin: req.pin,
          tabletId: req.tabletId || 'tablet-main-kitchen',
        }),
      });

      const session: KdsSession = {
        token: data.accessToken,
        tabletId: data.tabletId,
        authenticatedAt: data.authenticatedAt,
        expiresAt: data.expiresAt,
        permissions: data.permissions,
      };

      useAuthStore.getState().setKdsSession(session);
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    const session: KdsSession = {
      token: `mock-kds-${crypto.randomUUID()}`,
      tabletId: req.tabletId || 'tablet-main-kitchen',
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      permissions: [...KDS_TABLET_PERMISSIONS],
    };

    useAuthStore.getState().setKdsSession(session);
    return session;
  },

  /**
   * Xác thực mã PIN Quản lý / Chủ quán để duyệt ngoại lệ (hủy món, hoàn bill, giảm giá vượt trần)
   */
  async verifyManagerPin(params: {
    pin: string;
    requiredPermission?: string;
    requestedDiscountPercent?: number;
  }): Promise<VerifyManagerPinResponse> {
    if (!params.pin || !/^\d{4,6}$/.test(params.pin)) {
      throw new ApiError('VALIDATION_ERROR', 'Mã PIN Quản lý phải gồm từ 4 đến 6 chữ số', 400);
    }

    return fetchApi<VerifyManagerPinResponse>('/auth/verify-manager-pin', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  logoutStaff(): void {
    useAuthStore.getState().clearStaffSession();
  },

  logoutKds(): void {
    useAuthStore.getState().clearKdsSession();
  },
};
