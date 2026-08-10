"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function useAuth() {
  const { user, tenant, isAuthenticated, login, logout, setUser, setTenant } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      const meRes = await api.get("/auth/me");
      const tenantRes = await api.get("/tenants/current");
      login(meRes.data, tenantRes.data, access_token, refresh_token);
      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    username: string;
    full_name: string;
    tenant_name: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      const meRes = await api.get("/auth/me");
      const tenantRes = await api.get("/tenants/current");
      login(meRes.data, tenantRes.data, access_token, refresh_token);
      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    setLoading(true);
    try {
      const res = await api.put("/users/me", data);
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    tenant,
    isAuthenticated,
    loading,
    signIn,
    signUp,
    signOut,
    changePassword,
    updateProfile,
  };
}
