import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe } from '../api/auth.api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }
        try {
          const { data } = await getMe();
          set({ user: data, isLoading: false });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        }
      },

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isLoading: false });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        // Clear persisted store
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
