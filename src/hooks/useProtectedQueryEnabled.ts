import { useAuthStore } from '@/store/authStore';

export type Role = 'ADMIN' | 'MANAGER' | 'ENGINEER';

// Centralizes "can this protected query run?" so feature hooks do not drift.
export function useProtectedQueryEnabled(requiredRoles?: Role[]): boolean {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !accessToken || !user) return false;
  return requiredRoles ? requiredRoles.includes(user.role) : true;
}

