import { useAuthStore } from '@/store/authStore';
import type { RoleCode } from '@/types/rbac';

// Centralizes "can this protected query run?" so feature hooks do not drift.
export function useProtectedQueryEnabled(requiredRoles?: RoleCode[]): boolean {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !accessToken || !user) return false;
  return requiredRoles ? requiredRoles.includes(user.role) : true;
}
