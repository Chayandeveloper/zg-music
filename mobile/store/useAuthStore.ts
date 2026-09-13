import { create } from 'zustand';
import { MobileApi } from '../services/api';

interface UserProfile {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: 'LISTENER' | 'ARTIST' | 'ADMIN' | 'SUPER_ADMIN';
  avatar_url?: string | null;
  artist?: any | null;
  artistApplication?: any | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isArtist: boolean;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMessage: string | null;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  sendOtp: (phone: string, type?: 'login' | 'register') => Promise<{ message: string; phone: string; expires_in: number; debug_otp?: string }>;
  verifyOtp: (data: { phone: string; otp: string; name?: string }) => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

let onLoginCallback: (() => void) | null = null;
let onLogoutCallback: (() => void) | null = null;

export const registerAuthListener = (onLogin: () => void, onLogout: () => void) => {
  onLoginCallback = onLogin;
  onLogoutCallback = onLogout;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isArtist: false,
  loading: true,
  isAuthModalOpen: false,
  authModalMessage: null,

  openAuthModal: (message) => {
    set({ isAuthModalOpen: true, authModalMessage: message || null });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false, authModalMessage: null });
  },

  checkAuth: async () => {
    try {
      const token = await MobileApi.getToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isArtist: false, loading: false });
        return;
      }

      const res = await MobileApi.getMe();
      const user = res.data?.user;
      const isArtist = user?.role === 'ARTIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      set({ user, isAuthenticated: true, isArtist, loading: false });
    } catch {
      await MobileApi.removeToken();
      set({ user: null, isAuthenticated: false, isArtist: false, loading: false });
    }
  },

  sendOtp: async (phone: string, type?: 'login' | 'register') => {
    return await MobileApi.sendOtp(phone, type);
  },

  verifyOtp: async (data: { phone: string; otp: string; name?: string }) => {
    const res = await MobileApi.verifyOtp(data);
    const token = res.data?.token;
    const user = res.data?.user;
    await MobileApi.setToken(token);
    const isArtist = user?.role === 'ARTIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    set({ user, isAuthenticated: true, isArtist, isAuthModalOpen: false, authModalMessage: null });

    // Notify listeners (e.g. resume pending playback)
    onLoginCallback?.();
  },

  login: async (credentials) => {
    const res = await MobileApi.login(credentials);
    const token = res.data?.token;
    const user = res.data?.user;
    await MobileApi.setToken(token);
    const isArtist = user?.role === 'ARTIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    set({ user, isAuthenticated: true, isArtist, isAuthModalOpen: false, authModalMessage: null });

    // Notify listeners (e.g. resume pending playback)
    onLoginCallback?.();
  },

  register: async (data) => {
    const res = await MobileApi.register(data);
    const token = res.data?.token;
    const user = res.data?.user;
    await MobileApi.setToken(token);
    set({ user, isAuthenticated: true, isArtist: false, isAuthModalOpen: false, authModalMessage: null });

    onLoginCallback?.();
  },

  logout: async () => {
    try {
      await MobileApi.logout();
    } catch {}
    await MobileApi.removeToken();
    set({ user: null, isAuthenticated: false, isArtist: false });

    onLogoutCallback?.();
  },
}));
