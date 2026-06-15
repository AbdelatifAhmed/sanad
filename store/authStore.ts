import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),

      clearAuth: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),

      updateAvatar: (avatarUrl) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar: avatarUrl } : null,
        })),
    }),
    {
      name: 'sanad-auth-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);