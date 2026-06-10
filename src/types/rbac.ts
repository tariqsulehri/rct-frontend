export const ROLE_CODES = ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const LEADER_ROLES: RoleCode[] = ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER'];

export const MANAGERIAL_ROLES: RoleCode[] = ['TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER'];

export const isLeaderRole = (role?: string | null): role is RoleCode =>
  !!role && LEADER_ROLES.includes(role as RoleCode);
