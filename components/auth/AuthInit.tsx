"use client";

import { useEffect } from "react";
import { api } from "@/lib/services/api";
import { useAuthStore } from "@/store/authStore";

export default function AuthInit() {
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await api.post('/auth/refresh-token', {}, { withCredentials: true });
        const { accessToken, user } = res.data;
        
        if (accessToken && user) {
          useAuthStore.getState().setAuth(user, accessToken);
        }
      } catch {
        const { accessToken, isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated || !accessToken) {
          useAuthStore.getState().clearAuth();
          console.debug("AuthInit: No valid session found, cleared auth state");
        }
      }
    };

    tryRefresh();
  }, []);

  return null;
}
