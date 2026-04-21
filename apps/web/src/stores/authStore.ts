import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@onyx/types';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username: string) => {
        const { data } = await apiClient.post('/auth/login', { username });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await apiClient.post('/auth/logout', { refreshToken });
        } catch {}
        // Kill the socket so it doesn't linger with the old token
        try {
          const { getSocket } = await import('../hooks/useSocket');
          const s = getSocket();
          if (s) { s.removeAllListeners(); s.disconnect(); }
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'onyx-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
