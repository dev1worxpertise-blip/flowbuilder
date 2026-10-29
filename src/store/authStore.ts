import { create } from "zustand";
import { authApi, type User, getToken } from "../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register" | "reset";
  error: string | null;
  successMessage: string | null;

  setAuthModalOpen: (open: boolean, tab?: "login" | "register" | "reset") => void;
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isLoading: true,
  isAuthModalOpen: false,
  authModalTab: "login",
  error: null,
  successMessage: null,

  setAuthModalOpen: (open, tab = "login") =>
    set({ isAuthModalOpen: open, authModalTab: tab, error: null, successMessage: null }),

  clearError: () => set({ error: null, successMessage: null }),

  initAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authApi.me();
      set({ user: res.user, token, isLoading: false });
    } catch {
      authApi.logout();
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null, successMessage: null });
      const res = await authApi.login({ email, password });
      set({ user: res.user, token: res.token, isAuthModalOpen: false, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to log in", isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null, successMessage: null });
      const res = await authApi.register({ name, email, password });
      set({ user: res.user, token: res.token, isAuthModalOpen: false, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to register", isLoading: false });
      return false;
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      set({ isLoading: true, error: null, successMessage: null });
      const res = await authApi.resetPassword({ email, newPassword });
      set({
        successMessage: res.message || "Password updated! You can now log in.",
        isLoading: false,
        authModalTab: "login",
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to reset password", isLoading: false });
      return false;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, token: null });
  },
}));
