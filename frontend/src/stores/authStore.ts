import { create } from "zustand";
import type { User, Tenant } from "@/types";

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  login: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  hydrated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTenant: (tenant) => set({ tenant }),
  login: (user, tenant, accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("tenant", JSON.stringify(tenant));
    set({ user, tenant, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    set({ user: null, tenant: null, isAuthenticated: false });
  },
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");
      const tenantStr = localStorage.getItem("tenant");
      if (token && userStr && tenantStr) {
        set({
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
      set({ hydrated: true });
    }
  },
}));
