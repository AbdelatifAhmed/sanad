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
      } catch (err) {
        // Silent catch: if refresh fails (guest or expired), api interceptor
        // handles logout if needed, or we just stay unauthenticated.
        console.debug('AuthInit: No valid session found');
      }
    };

    tryRefresh();
  }, []);

  return null;
}
