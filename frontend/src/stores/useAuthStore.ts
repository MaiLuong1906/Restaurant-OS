import { create } from 'zustand';
import { StaffUser, LoginResponse } from '@/types';

// SECURITY: PIN/JWT are only authoritatively verified on the server once the backend is ready.
// Client-side presence/shape checks are UX only, never authorization — in particular A9 Head Chef
// (Bep truong) permissions MUST be enforced server-side.

export interface KdsSession {
  token: string;
  tabletId?: string;
  authenticatedAt: string;
  expiresAt?: string;
}

interface AuthState {
  // B1 Staff session
  staffToken: string | null;
  staffUser: StaffUser | null;
  isStaffAuthenticated: boolean;

  // A1 Shared Tablet KDS session
  kdsSession: KdsSession | null;
  isKdsAuthenticated: boolean;

  // Actions
  setStaffSession: (response: LoginResponse) => void;
  setKdsSession: (session: KdsSession) => void;
  clearStaffSession: () => void;
  clearKdsSession: () => void;
  clearAuth: () => void;

  // Selector
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  staffToken: null,
  staffUser: null,
  isStaffAuthenticated: false,

  kdsSession: null,
  isKdsAuthenticated: false,

  setStaffSession: (response: LoginResponse) => {
    set({
      staffToken: response.token,
      staffUser: response.user,
      isStaffAuthenticated: true,
    });
  },

  setKdsSession: (session: KdsSession) => {
    set({
      kdsSession: session,
      isKdsAuthenticated: true,
    });
  },

  clearStaffSession: () => {
    set({
      staffToken: null,
      staffUser: null,
      isStaffAuthenticated: false,
    });
  },

  clearKdsSession: () => {
    set({
      kdsSession: null,
      isKdsAuthenticated: false,
    });
  },

  clearAuth: () => {
    set({
      staffToken: null,
      staffUser: null,
      isStaffAuthenticated: false,
      kdsSession: null,
      isKdsAuthenticated: false,
    });
  },

  getAccessToken: () => {
    const { staffToken, kdsSession } = get();
    // Ưu tiên staffToken, nếu không có thì dùng token của KDS tablet
    if (staffToken) return staffToken;
    if (kdsSession?.token) return kdsSession.token;
    return null;
  },
}));
