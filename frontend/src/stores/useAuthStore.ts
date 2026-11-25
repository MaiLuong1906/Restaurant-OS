import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StaffUser, LoginResponse } from '@/types';
import {
  getPermissionsForRole,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  KDS_TABLET_PERMISSIONS,
  PermissionCode,
} from '../lib/rbac';

// SECURITY: PIN/JWT are only authoritatively verified on the server.
// Client-side checks are UX only; Backend Spring Security (@PreAuthorize + JWT) is authoritative.

export interface KdsSession {
  token: string;
  tabletId?: string;
  authenticatedAt: string;
  expiresAt?: string;
  permissions?: string[];
}

interface AuthState {
  // B1 Staff session
  staffToken: string | null;
  staffUser: StaffUser | null;
  permissions: string[];
  isStaffAuthenticated: boolean;

  // A1 Shared Tablet KDS session
  kdsSession: KdsSession | null;
  isKdsAuthenticated: boolean;

  // Actions
  setStaffSession: (response: LoginResponse & { permissions?: string[] }) => void;
  setKdsSession: (session: KdsSession) => void;
  clearStaffSession: () => void;
  clearKdsSession: () => void;
  clearAuth: () => void;

  // Selectors
  getAccessToken: () => string | null;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (permissions: readonly PermissionCode[]) => boolean;
}

function syncAuthCookies(role: string | null, isKds: boolean) {
  if (typeof document === 'undefined') return;
  if (role) {
    document.cookie = `ros_role=${encodeURIComponent(role)}; Path=/; SameSite=Lax`;
  } else {
    document.cookie = 'ros_role=; Path=/; Max-Age=0; SameSite=Lax';
  }
  if (isKds) {
    document.cookie = 'ros_kds=1; Path=/; SameSite=Lax';
  } else {
    document.cookie = 'ros_kds=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      staffToken: null,
      staffUser: null,
      permissions: [],
      isStaffAuthenticated: false,

      kdsSession: null,
      isKdsAuthenticated: false,

      setStaffSession: (response: LoginResponse & { permissions?: string[] }) => {
        const resolvedPermissions =
          response.permissions && response.permissions.length > 0
            ? response.permissions
            : [...getPermissionsForRole(response.user.role)];

        syncAuthCookies(response.user.role, get().isKdsAuthenticated);
        set({
          staffToken: response.token,
          staffUser: response.user,
          permissions: resolvedPermissions,
          isStaffAuthenticated: true,
        });
      },

      setKdsSession: (session: KdsSession) => {
        syncAuthCookies(get().staffUser?.role ?? null, true);
        set({
          kdsSession: {
            ...session,
            permissions: session.permissions ?? [...KDS_TABLET_PERMISSIONS],
          },
          isKdsAuthenticated: true,
        });
      },

      clearStaffSession: () => {
        syncAuthCookies(null, get().isKdsAuthenticated);
        set({
          staffToken: null,
          staffUser: null,
          permissions: [],
          isStaffAuthenticated: false,
        });
      },

      clearKdsSession: () => {
        syncAuthCookies(get().staffUser?.role ?? null, false);
        set({
          kdsSession: null,
          isKdsAuthenticated: false,
        });
      },

      clearAuth: () => {
        syncAuthCookies(null, false);
        set({
          staffToken: null,
          staffUser: null,
          permissions: [],
          isStaffAuthenticated: false,
          kdsSession: null,
          isKdsAuthenticated: false,
        });
      },

      getAccessToken: () => {
        const { staffToken, kdsSession } = get();
        if (staffToken) return staffToken;
        if (kdsSession?.token) return kdsSession.token;
        return null;
      },

      hasPermission: (permission: PermissionCode) => {
        const { staffUser, permissions, isKdsAuthenticated, kdsSession } = get();
        if (staffUser) {
          return checkPermission(staffUser.role, permission, permissions);
        }
        if (isKdsAuthenticated) {
          const kdsPerms = kdsSession?.permissions ?? KDS_TABLET_PERMISSIONS;
          return kdsPerms.includes(permission);
        }
        return false;
      },

      hasAnyPermission: (requiredPermissions: readonly PermissionCode[]) => {
        const { staffUser, permissions, isKdsAuthenticated, kdsSession } = get();
        if (staffUser) {
          return checkAnyPermission(staffUser.role, requiredPermissions, permissions);
        }
        if (isKdsAuthenticated) {
          const kdsPerms = kdsSession?.permissions ?? KDS_TABLET_PERMISSIONS;
          return requiredPermissions.some((p) => kdsPerms.includes(p));
        }
        return false;
      },
    }),
    {
      name: 'ros-auth-session',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        staffToken: state.staffToken,
        staffUser: state.staffUser,
        permissions: state.permissions,
        isStaffAuthenticated: state.isStaffAuthenticated,
        kdsSession: state.kdsSession,
        isKdsAuthenticated: state.isKdsAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncAuthCookies(
            state.isStaffAuthenticated ? (state.staffUser?.role ?? null) : null,
            state.isKdsAuthenticated,
          );
        }
      },
    },
  ),
);
