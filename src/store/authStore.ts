import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  empCode: string;     // Real employee code e.g. "1818" — use this for all employee identification
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'ENGINEER';
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken) => set({ accessToken }),

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
