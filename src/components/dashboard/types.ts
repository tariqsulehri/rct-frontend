import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart2,
  Settings2,
  Sun,
  Moon,
  Zap,
  Bot,
  CheckSquare,
  Award,
  MessageSquareText,
} from 'lucide-react';
import { Theme } from '@/store/themeStore';
import { type PermissionCode, type RoleCode } from '@/types/rbac';

export type TabType =
  | 'admin'
  | 'overview'
  | 'approvals'
  | 'team'
  | 'assessments'
  | 'communication'
  | 'behavioral'
  | 'ai'
  | 'reports'
  | 'config';

export const LEADERS: RoleCode[] = ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER'];

export interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  roles: RoleCode[];
  permission?: PermissionCode;
}

export const NAV: NavItem[] = [
  { id: 'admin',       label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { id: 'overview',    label: 'Overview',        icon: LayoutDashboard, roles: ['TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'] },
  { id: 'approvals',   label: 'Pending Approvals', icon: CheckSquare,   roles: LEADERS },
  { id: 'team',        label: 'Team Roster',     icon: Users,           roles: LEADERS },
  { id: 'assessments', label: 'Technical Skills', icon: ClipboardCheck,  roles: ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'] },
  { id: 'communication', label: 'CEFR Communication', icon: MessageSquareText, roles: ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'] },
  { id: 'behavioral',  label: 'Behavioral Framework', icon: Award,     roles: ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'] },
  { id: 'ai',          label: 'AI Dashboard',     icon: Bot,             roles: LEADERS },
  { id: 'reports',     label: 'Reports',         icon: BarChart2,       roles: LEADERS, permission: 'reports.view' },
  { id: 'config',      label: 'Setup',           icon: Settings2,       roles: ['ADMIN'] },
];

export interface ThemeOption {
  id: Theme;
  label: string;
  icon: React.ElementType;
  desc: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'light',    label: 'Light',    icon: Sun,  desc: 'Clean & bright' },
  { id: 'dark',     label: 'Dark',     icon: Moon, desc: 'Easy on the eyes' },
  { id: 'midnight', label: 'Midnight', icon: Zap,  desc: 'DevOps terminal' },
];

export const ROLE_GRADIENT: Record<string, string> = {
  ADMIN:          'from-violet-500 to-purple-600',
  TOP_MANAGEMENT: 'from-sky-500 to-blue-600',
  MANAGER:        'from-blue-500 to-indigo-600',
  LINE_MANAGER:   'from-cyan-500 to-teal-600',
  ENGINEER:       'from-emerald-500 to-teal-600',
};

export const CURRENT_ORGANIZATION = {
  name: 'tkxel',
  logoUrl: '/assets/organizations/tkxel-logo.svg',
  baseUrl: 'https://tkxel.com',
};

export const defaultDashboardTabForRole = (role?: string | null): TabType => (
  role === 'ADMIN' ? 'admin' : 'overview'
);
