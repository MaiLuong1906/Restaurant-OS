import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { authService } from '../../lib/auth-service';

describe('useAuthStore & authService', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('lưu staff session và trả về token qua getAccessToken()', () => {
    expect(useAuthStore.getState().isStaffAuthenticated).toBe(false);
    expect(useAuthStore.getState().getAccessToken()).toBeNull();

    useAuthStore.getState().setStaffSession({
      token: 'jwt-token-abc',
      user: {
        id: 'staff-1',
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0988888888',
        role: 'STAFF',
        isActive: true,
      },
    });

    expect(useAuthStore.getState().isStaffAuthenticated).toBe(true);
    expect(useAuthStore.getState().getAccessToken()).toBe('jwt-token-abc');
  });

  it('lưu KDS PIN session không làm đè staff session', () => {
    useAuthStore.getState().setStaffSession({
      token: 'jwt-staff-token',
      user: {
        id: 'staff-1',
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0988888888',
        role: 'STAFF',
        isActive: true,
      },
    });

    useAuthStore.getState().setKdsSession({
      token: 'kds-session-token',
      tabletId: 'tablet-1',
      authenticatedAt: new Date().toISOString(),
    });

    expect(useAuthStore.getState().isStaffAuthenticated).toBe(true);
    expect(useAuthStore.getState().isKdsAuthenticated).toBe(true);
    // Ưu tiên staffToken
    expect(useAuthStore.getState().getAccessToken()).toBe('jwt-staff-token');

    // Sau khi xóa staff session thì fallback về KDS token
    useAuthStore.getState().clearStaffSession();
    expect(useAuthStore.getState().isStaffAuthenticated).toBe(false);
    expect(useAuthStore.getState().getAccessToken()).toBe('kds-session-token');
  });

  it('authService.loginStaff thành công và cấp mock token động', async () => {
    const res = await authService.loginStaff({
      phoneNumber: '0977112233',
      password: 'mypassword',
    });

    expect(res.token).toContain('mock-jwt-');
    expect(useAuthStore.getState().isStaffAuthenticated).toBe(true);
  });

  it('authService.authKdsPin kiểm tra cấu trúc PIN 4 số', async () => {
    await expect(authService.authKdsPin({ pin: '12' })).rejects.toThrow();
    await expect(authService.authKdsPin({ pin: 'abcd' })).rejects.toThrow();

    const session = await authService.authKdsPin({ pin: '8899' });
    expect(session.token).toContain('mock-kds-');
    expect(useAuthStore.getState().isKdsAuthenticated).toBe(true);
  });
});
