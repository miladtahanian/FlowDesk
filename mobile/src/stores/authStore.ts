import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  user: any | null;
  tenant: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: any) => void;
  setTenant: (tenant: any) => void;
  login: async (user: any, tenant: any, accessToken: string, refreshToken: string) => Promise<void>;
  logout: async () => Promise<void>;
  loadStoredAuth: async () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTenant: (tenant) => set({ tenant }),
  login: async (user, tenant, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("access_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    set({ user, tenant, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
  },
  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        const api = (await import("../lib/api")).default;
        const meRes = await api.get("/auth/me");
        const tenantRes = await api.get("/tenants/current");
        set({ user: meRes.data, tenant: tenantRes.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
