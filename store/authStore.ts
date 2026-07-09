import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, UserData } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set: any) => ({
      user: null as UserData | null,
      accessToken: null as string | null,
      isAuthenticated: false as boolean,

      setAuth: (user: UserData, accessToken: string) => 
        set({ user, accessToken, isAuthenticated: true }),

      clearAuth: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),

      updateAvatar: (avatarUrl: string) =>
        set((state: AuthState) => ({
          user: state.user ? { ...state.user, avatar: avatarUrl } : null,
        })),
    }),
    {
      name: 'sanad-auth-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);