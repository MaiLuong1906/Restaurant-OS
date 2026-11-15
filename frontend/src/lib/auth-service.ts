import { LoginRequest, LoginResponse, KdsPinAuthRequest } from '../types';
import { useAuthStore, KdsSession } from '../stores/useAuthStore';
import { ApiError } from './api-client';

// SECURITY: PIN/JWT are only authoritatively verified on the server once the backend is ready.
// Client-side presence/shape checks are UX only, never authorization — in particular A9 Head Chef
// (Bep truong) permissions MUST be enforced server-side.

export const authService = {
  /**
   * Mock authentication cho B1 Staff Login
   * Khi backend sẵn sàng, thay thế bằng fetchApi<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(req) })
   */
  async loginStaff(req: LoginRequest): Promise<LoginResponse> {
    if (!req.phoneNumber?.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'Số điện thoại không được để trống', 400);
    }
    if (!req.password || req.password.length < 4) {
      throw new ApiError('VALIDATION_ERROR', 'Mật khẩu không hợp lệ', 400);
    }

    // Mô phỏng độ trễ mạng
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Sinh mock JWT token động tại runtime (không hardcode)
    const mockToken = `mock-jwt-${crypto.randomUUID()}`;

    const response: LoginResponse = {
      token: mockToken,
      user: {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        fullName: 'Nhân Viên Vận Hành',
        phoneNumber: req.phoneNumber,
        role: 'STAFF',
        isActive: true,
      },
      expiresIn: 86400, // 24 giờ
    };

    useAuthStore.getState().setStaffSession(response);
    return response;
  },

  /**
   * Mock authentication cho A1 KDS PIN Login
   * Khi backend sẵn sàng, thay thế bằng fetchApi<KdsSession>('/kds/auth-pin', { method: 'POST', body: JSON.stringify(req) })
   */
  async authKdsPin(req: KdsPinAuthRequest): Promise<KdsSession> {
    if (!req.pin || req.pin.length !== 4 || !/^\d{4}$/.test(req.pin)) {
      throw new ApiError('VALIDATION_ERROR', 'Mã PIN bếp phải gồm đúng 4 chữ số', 400);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Sinh token session tablet KDS động
    const session: KdsSession = {
      token: `mock-kds-${crypto.randomUUID()}`,
      tabletId: req.tabletId || 'tablet-main-kitchen',
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12h
    };

    useAuthStore.getState().setKdsSession(session);
    return session;
  },

  logoutStaff(): void {
    useAuthStore.getState().clearStaffSession();
  },

  logoutKds(): void {
    useAuthStore.getState().clearKdsSession();
  },
};
