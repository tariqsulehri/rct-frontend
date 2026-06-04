import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { router } from '@/routes';
import { queryClient } from '@/lib/queryClient';

// Use a relative path so browser requests go through the public nginx proxy.
const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  : '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const newToken = response.data.accessToken || response.data.data?.accessToken;
        if (!newToken) {
          throw new Error('Refresh response did not include an access token');
        }
        useAuthStore.getState().setTokens(newToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        return newToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

// Add JWT token to every request — read from the Zustand store (single source of truth)
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — but NEVER intercept the login or refresh endpoints
// (intercepting /auth/login would cause an infinite redirect loop on bad credentials)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Backend uses an httpOnly refresh cookie; only one refresh request should
        // run even when several protected queries fail with 401 at the same time.
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear ALL auth state (store + localStorage) then navigate.
        // Must call logout() rather than removeItem() directly so that auth-store
        // in localStorage also gets isAuthenticated:false — otherwise PublicRoute
        // would redirect straight back to /dashboard on the next render, causing
        // the login ↔ dashboard flicker loop seen in Chrome.
        useAuthStore.getState().logout();
        queryClient.clear();
        router.navigate('/login', { replace: true });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
