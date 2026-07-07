import React from 'react';
import {
  ConfigEmployee,
  ConfigLineManagerAssignment,
  ConfigUser,
} from '@/hooks/useConfig';

export const F = 'field';
export const L = 'field-label';

export type AccessPanel = 'roles' | 'departments' | 'line-managers' | 'audit';
export type AssignmentStatusFilter = 'active' | 'inactive' | 'all';
export type ResourceStatusFilter = 'assignable' | 'assigned' | 'all';

export type RoleAccessForm = {
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

export type DepartmentAccessForm = {
  user_id: string;
  department_id: string;
  department_ids: string[];
  assignment_type: string;
  can_view: boolean;
  can_manage: boolean;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

export type LineManagerAccessForm = {
  manager_user_id: string;
  employee_id: string;
  relationship_type: string;
  can_view: boolean;
  can_assess: boolean;
  starts_at: string;
  ends_at: string;
  is_primary: boolean;
  is_active: boolean;
};

export type LineManagerBulkAccessForm = {
  manager_user_id: string;
  employee_ids: string[];
  relationship_type: string;
  can_view: boolean;
  can_assess: boolean;
  starts_at: string;
  ends_at: string;
  is_primary: boolean;
  is_active: boolean;
};

export type SelectOption = {
  value: string;
  label: string;
  sub?: string;
};

export type AccessTableState<T> = {
  q: string;
  onSearch: (value: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  filtered: T[];
  paged: T[];
};

export type LineManagerResourceRow = {
  employee: ConfigEmployee;
  activeAssignment?: ConfigLineManagerAssignment;
  assignedToSelectedManager: boolean;
  assignedElsewhere: boolean;
  managerLabel: string;
  department: string;
  grade: string;
  targetGrade: string;
  checked: boolean;
  newlySelected: boolean;
  disabled: boolean;
};

export const formatUserLabel = (user?: ConfigUser | null) => {
  if (!user) return 'Unknown user';
  const emp = user.employee;
  return emp ? `${emp.emp_code} - ${emp.full_name} - ${emp.department || 'No department'}` : user.username;
};

export const formatEmployeeLabel = (employee?: ConfigEmployee | null) => {
  if (!employee) return 'Unknown employee';
  const department = employee.dept?.name ?? employee.department;
  return `${employee.emp_code} - ${employee.full_name} - ${department || 'No department'}`;
};

export const toDateInput = (value?: string | null) => value ? value.slice(0, 10) : '';
export const fromDateInput = (value: string) => value ? value : null;
