import { QueryClient } from '@tanstack/react-query';

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => failureCount < 1 && !isUnauthorized(error),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => failureCount < 1 && !isUnauthorized(error),
    },
  },
});
