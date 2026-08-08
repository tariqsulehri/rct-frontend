import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/routes';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { ToastContainer } from '@/components/ui/ToastContainer';

const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  : '/api/v1';

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded)) as { exp?: number };
    return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Renders nothing until Zustand has finished reading localStorage.
// This is the single source of truth for hydration — no per-route guards needed.
function HydrationGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const validatePersistedSession = async () => {
      try {
        const { accessToken, isAuthenticated, setTokens, setUser, logout } = useAuthStore.getState();
        let token = accessToken;

        if (isAuthenticated && (!token || isTokenExpired(token))) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            });
            if (!response.ok) throw new Error('Refresh failed');
            const data = await response.json();
            const newToken = data.accessToken || data.data?.accessToken;
            if (!newToken) throw new Error('Missing access token');
            setTokens(newToken);
            token = newToken;
          } catch {
            logout();
            queryClient.clear();
            return;
          }
        }

        if (isAuthenticated && token) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include',
            });
            if (!response.ok) throw new Error('Current user lookup failed');
            const data = await response.json();
            setUser({ ...data.user, permissions: data.user.permissions ?? [] });
          } catch {
            logout();
            queryClient.clear();
          }
        }
      } finally {
        setHydrated(true);
      }
    };

    if (useAuthStore.persist.hasHydrated()) {
      void validatePersistedSession();
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      void validatePersistedSession();
    });
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgb(var(--bg, 255 255 255))',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgb(var(--accent, 99 102 241))',
          borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationGate>
        <RouterProvider router={router} />
        <ToastContainer />
      </HydrationGate>
    </QueryClientProvider>
  );
}
