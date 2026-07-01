import { useAuthStore } from '@/store/authStore';
import { hasPermission, type PermissionCode, type RoleCode } from '@/types/rbac';

// Centralizes "can this protected query run?" so feature hooks do not drift.
export function useProtectedQueryEnabled(requiredRoles?: RoleCode[]): boolean {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !accessToken || !user) return false;
  return requiredRoles ? requiredRoles.includes(user.role) : true;
}

export function useProtectedPermissionQueryEnabled(
  permission: PermissionCode,
  fallbackRoles: RoleCode[] = [],
): boolean {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !accessToken || !user) return false;
  return hasPermission(user.permissions, permission) || fallbackRoles.includes(user.role);
}
