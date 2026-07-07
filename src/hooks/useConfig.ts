import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { refreshAccessToken } from '@/lib/api';
import type { RoleCode } from '@/types/rbac';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ConfigUser {
  id: number;
  username: string;
  role: RoleCode;
  is_active: boolean;
  employee_id: number;
  created_at: string;
  employee?: { full_name: string; emp_code: string; department: string };
}

export interface ConfigRole {
  id: number;
  code: RoleCode;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  role_permissions?: ConfigRolePermission[];
}

export interface ConfigPermission {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ConfigRolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  permission: ConfigPermission;
}

export interface ConfigDepartmentAssignment {
  id: number;
  user_id: number;
  department_id: number;
  assignment_type: string;
  can_view: boolean;
  can_manage: boolean;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  user?: ConfigUser & { role_ref?: ConfigRole | null };
  department?: ConfigDepartment;
}

export interface ConfigLineManagerAssignment {
  id: number;
  manager_user_id: number;
  employee_id: number;
  relationship_type: string;
  can_view: boolean;
  can_assess: boolean;
  starts_at: string;
  ends_at: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  manager_user?: ConfigUser & { role_ref?: ConfigRole | null };
  employee?: ConfigEmployee;
}

export interface ConfigAccessAuditLog {
  id: number;
  actor_user_id: number | null;
  target_user_id: number | null;
  role_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
  actor_user?: ConfigUser | null;
  target_user?: ConfigUser | null;
  role?: ConfigRole | null;
}

export interface ConfigDepartment {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  employees?: { id: number }[];
}

export interface ConfigEmployee {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
  email: string | null;
  current_grade_id: number;
  target_grade_id: number;
  manager_id: number | null;
  department_id: number | null;
  current_grade?: { code: string; title: string };
  target_grade?: { code: string; title: string };
  manager?: { full_name: string };
  dept?: { id: number; name: string } | null;
}

export interface ConfigGrade {
  id: number;
  department_id: number;
  code: string;
  title: string;
  level: number;
  experience_years: number;
  performance_note: string | null;
  department?: ConfigDepartment;
}

export interface ConfigSkillDomain {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  category_id: number;
  category?: { id: number; name: string; color: string | null } | null;
  grade_weights?: { grade_id: number; weight: number }[];
  competency_domains?: { department_id: number; competency: { id: number; name: string } }[];
}

export interface ConfigCompetencyCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  weight: number;
  sort_order: number;
  is_active: boolean;
  competencies?: { id: number }[];
}

export interface ConfigCompetency {
  id: number;
  name: string;
  description: string;
  is_critical: boolean;
  category_id: number;
  competency_category?: { id: number; name: string; color: string | null } | null;
  competency_domains?: { department_id: number; is_primary: boolean; domain: { id: number; name: string; color: string | null } }[];
  technologies?: { id: number; name: string }[];
}

export interface ConfigTechnology {
  id: number;
  name: string;
  competency_id: number;
  competency?: {
    id: number;
    name: string;
    competency_domains?: { department_id: number; is_primary: boolean; domain: { name: string } }[];
  };
}

export interface ConfigAssessmentType {
  id: number;
  code: 'Primary' | 'Secondary' | 'Tertiary' | string;
  label: string;
  weight: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface ConfigAssessmentLevel {
  id: number;
  code: string;
  label: string;
  weight: number;
  threshold: number | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface ConfigAssessmentStatus {
  id: number;
  code: string;
  label: string;
  description: string | null;
  counts_toward_score: boolean;
  is_terminal: boolean;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface ConfigAssessmentProject {
  id: number;
  project_count: number;
  label: string;
  description: string | null;
  duration_months_min: number | null;
  duration_months_max: number | null;
  credit: number;
  threshold: number | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

// ── Assessment Types ─────────────────────────────────────────────────────────

export const useConfigAssessmentTypes = () =>
  useQuery({
    queryKey: ['config', 'assessment-types'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigAssessmentType[] }>('/config/assessment-types');
      return res.data.data;
    },
  });

export const useUpdateAssessmentType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ label: string; weight: number; description: string | null; sort_order: number; is_active: boolean }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigAssessmentType }>(`/config/assessment-types/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'assessment-types'] }),
  });
};

export const useConfigAssessmentLevels = () =>
  useQuery({
    queryKey: ['config', 'assessment-levels'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigAssessmentLevel[] }>('/config/assessment-levels');
      return res.data.data;
    },
  });

export const useUpdateAssessmentLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ label: string; weight: number; threshold: number | null; description: string | null; sort_order: number; is_active: boolean }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigAssessmentLevel }>(`/config/assessment-levels/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'assessment-levels'] }),
  });
};

export const useConfigAssessmentStatuses = () =>
  useQuery({
    queryKey: ['config', 'assessment-statuses'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigAssessmentStatus[] }>('/config/assessment-statuses');
      return res.data.data;
    },
  });

export const useUpdateAssessmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ label: string; description: string | null; counts_toward_score: boolean; is_terminal: boolean; sort_order: number; is_active: boolean }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigAssessmentStatus }>(`/config/assessment-statuses/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'assessment-statuses'] }),
  });
};

export const useConfigAssessmentProjects = () =>
  useQuery({
    queryKey: ['config', 'assessment-projects'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigAssessmentProject[] }>('/config/assessment-projects');
      return res.data.data;
    },
  });

export const useUpdateAssessmentProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        label: string;
        description: string | null;
        duration_months_min: number | null;
        duration_months_max: number | null;
        credit: number;
        threshold: number | null;
        sort_order: number;
        is_active: boolean;
      }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigAssessmentProject }>(`/config/assessment-projects/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'assessment-projects'] }),
  });
};

// ── Departments ───────────────────────────────────────────────────────────────

export const useConfigDepartments = () =>
  useQuery({
    queryKey: ['config', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigDepartment[] }>('/config/departments');
      return res.data.data;
    },
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigDepartment }>('/config/departments', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'departments'] }),
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ name: string; description: string }> }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigDepartment }>(`/config/departments/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'departments'] }),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => { await apiClient.delete(`/config/departments/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'departments'] }),
  });
};

// ── Department Config ──────────────────────────────────────────────────────────

export interface DepartmentConfig {
  id: number;
  department_id: number;
  primary_weight: number;
  secondary_weight: number;
  tertiary_weight: number;
  notes: string | null;
  updated_at: string;
}

export interface DepartmentDomainWeight {
  id: number;
  department_id: number;
  domain_id: number;
  weight: number;
  is_active: boolean;
  domain: { id: number; name: string; description: string | null };
}

export interface FullDepartmentConfig {
  config: DepartmentConfig | null;
  domain_weights: DepartmentDomainWeight[];
  department: ConfigDepartment | null;
}

export const useDepartmentConfig = (departmentId: number | null) =>
  useQuery<FullDepartmentConfig>({
    queryKey: ['config', 'department-config', departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: FullDepartmentConfig }>(`/config/departments/${departmentId}/config`);
      return res.data.data;
    },
    enabled: !!departmentId,
  });

export const useUpsertDepartmentConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { primary_weight: number; secondary_weight: number; tertiary_weight: number; notes?: string } }) => {
      const res = await apiClient.put<{ success: boolean; data: DepartmentConfig }>(`/config/departments/${id}/config`, data);
      return res.data.data;
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['config', 'department-config', id] });
      queryClient.invalidateQueries({ queryKey: ['config', 'departments'] });
    },
  });
};

export const useUpsertDomainWeights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, weights }: { id: number; weights: Array<{ domain_id: number; weight: number; is_active: boolean }> }) => {
      const res = await apiClient.put(`/config/departments/${id}/domain-weights`, { weights });
      return res.data.data;
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['config', 'department-config', id] });
      queryClient.invalidateQueries({ queryKey: ['config', 'departments'] });
    },
  });
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const useConfigUsers = () =>
  useQuery({
    queryKey: ['config', 'users'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigUser[] }>('/config/users');
      return res.data.data;
    },
  });

export const useConfigRoles = () =>
  useQuery({
    queryKey: ['config', 'roles'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigRole[] }>('/config/roles');
      return res.data.data;
    },
  });

export const useConfigPermissions = () =>
  useQuery({
    queryKey: ['config', 'permissions'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigPermission[] }>('/config/permissions');
      return res.data.data;
    },
  });

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Pick<ConfigRole, 'name' | 'description' | 'is_active' | 'sort_order'>> & { permission_ids?: number[] };
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigRole }>(`/config/roles/${id}`, data);
      return res.data.data;
    },
    onSuccess: (updatedRole) => {
      queryClient.setQueryData<ConfigRole[]>(['config', 'roles'], (current) =>
        current?.map((role) => role.id === updatedRole.id ? updatedRole : role) ?? current
      );
      queryClient.invalidateQueries({ queryKey: ['config', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
    },
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permissionIds }: { id: number; permissionIds: number[] }) => {
      const res = await apiClient.put<{ success: boolean; data: ConfigRole }>(`/config/roles/${id}/permissions`, {
        permission_ids: permissionIds,
      });
      return res.data.data;
    },
    onSuccess: (updatedRole) => {
      queryClient.setQueryData<ConfigRole[]>(['config', 'roles'], (current) =>
        current?.map((role) => role.id === updatedRole.id ? updatedRole : role) ?? current
      );
      queryClient.invalidateQueries({ queryKey: ['config', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
    },
  });
};

export const useDepartmentAssignments = () =>
  useQuery({
    queryKey: ['config', 'department-assignments'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigDepartmentAssignment[] }>('/config/access/department-assignments');
      return res.data.data;
    },
  });

export const useCreateDepartmentAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      user_id: number;
      department_id: number;
      assignment_type: string;
      can_view: boolean;
      can_manage: boolean;
      starts_at?: string;
      ends_at?: string | null;
      is_active: boolean;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigDepartmentAssignment }>('/config/access/department-assignments', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'department-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
    },
  });
};

export const useUpdateDepartmentAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConfigDepartmentAssignment> }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigDepartmentAssignment }>(`/config/access/department-assignments/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'department-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
    },
  });
};

export const useDeleteDepartmentAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/access/department-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'department-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
    },
  });
};

export const useLineManagerAssignments = () =>
  useQuery({
    queryKey: ['config', 'line-manager-assignments'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigLineManagerAssignment[] }>('/config/access/line-manager-assignments');
      return res.data.data;
    },
  });

export const useCreateLineManagerAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      manager_user_id: number;
      employee_id: number;
      relationship_type: string;
      can_view: boolean;
      can_assess: boolean;
      starts_at?: string;
      ends_at?: string | null;
      is_primary: boolean;
      is_active: boolean;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigLineManagerAssignment }>('/config/access/line-manager-assignments', data);
      return res.data.data;
    },
    onSuccess: (assignment) => {
      queryClient.setQueryData<ConfigLineManagerAssignment[]>(['config', 'line-manager-assignments'], current => {
        if (!current) return current;
        const withoutAssignment = current.filter(item => item.id !== assignment.id);
        return [assignment, ...withoutAssignment];
      });
      queryClient.invalidateQueries({ queryKey: ['config', 'line-manager-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
    },
  });
};

export const useUpdateLineManagerAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ConfigLineManagerAssignment> }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigLineManagerAssignment }>(`/config/access/line-manager-assignments/${id}`, data);
      return res.data.data;
    },
    onSuccess: (assignment) => {
      queryClient.setQueryData<ConfigLineManagerAssignment[]>(['config', 'line-manager-assignments'], current =>
        current?.map(item => item.id === assignment.id ? assignment : item),
      );
      queryClient.invalidateQueries({ queryKey: ['config', 'line-manager-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
    },
  });
};

export const useSyncLineManagerAssignments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      manager_user_id: number;
      employee_ids: number[];
      relationship_type: string;
      can_view: boolean;
      can_assess: boolean;
      starts_at?: string;
      ends_at?: string | null;
      is_primary: boolean;
      is_active: boolean;
    }) => {
      const sync = async () => {
        const res = await apiClient.post<{ success: boolean; data: ConfigLineManagerAssignment[] }>('/config/access/line-manager-assignments/sync', data);
        return res.data.data;
      };
      const fallbackSync = async () => {
        const current = queryClient.getQueryData<ConfigLineManagerAssignment[]>(['config', 'line-manager-assignments']) ?? [];
        const selectedEmployeeIds = new Set(data.employee_ids);
        const activeAssignments = current.filter(assignment =>
          assignment.manager_user_id === data.manager_user_id &&
          assignment.is_active &&
          assignment.relationship_type === data.relationship_type,
        );
        const activeEmployeeIds = new Set(activeAssignments.map(assignment => assignment.employee_id));
        const toAdd = data.employee_ids.filter(employeeId => !activeEmployeeIds.has(employeeId));
        const toRemove = activeAssignments.filter(assignment => !selectedEmployeeIds.has(assignment.employee_id));

        await Promise.all([
          ...toAdd.map(employee_id => apiClient.post('/config/access/line-manager-assignments', { ...data, employee_id })),
          ...toRemove.map(assignment => apiClient.delete(`/config/access/line-manager-assignments/${assignment.id}`)),
        ]);

        const list = await apiClient.get<{ success: boolean; data: ConfigLineManagerAssignment[] }>('/config/access/line-manager-assignments');
        return list.data.data;
      };

      try {
        return await sync();
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 404) return fallbackSync();
        if (status === 401) {
          await refreshAccessToken();
          try {
            return await sync();
          } catch (retryError) {
            if ((retryError as { response?: { status?: number } }).response?.status === 404) return fallbackSync();
            throw retryError;
          }
        }
        throw error;
      }
    },
    onSuccess: (assignments) => {
      queryClient.setQueryData(['config', 'line-manager-assignments'], assignments);
      queryClient.invalidateQueries({ queryKey: ['config', 'line-manager-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
    },
  });
};

export const useDeleteLineManagerAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<{ success: boolean; data: ConfigLineManagerAssignment }>(`/config/access/line-manager-assignments/${id}`);
      return res.data.data;
    },
    onSuccess: (assignment) => {
      queryClient.setQueryData<ConfigLineManagerAssignment[]>(['config', 'line-manager-assignments'], current =>
        current?.map(item => item.id === assignment.id ? assignment : item),
      );
      queryClient.invalidateQueries({ queryKey: ['config', 'line-manager-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'access-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
    },
  });
};

export const useAccessAuditLogs = () =>
  useQuery({
    queryKey: ['config', 'access-audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigAccessAuditLog[] }>('/config/access/audit-logs');
      return res.data.data;
    },
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      role: RoleCode;
      employee_id: number;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigUser }>('/config/users', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['ai'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ username: string; password: string; role: RoleCode; employee_id: number; is_active: boolean }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigUser }>(`/config/users/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['ai'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['ai'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

// ── Employees ─────────────────────────────────────────────────────────────────

export const useConfigEmployees = () =>
  useQuery({
    queryKey: ['config', 'employees'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigEmployee[] }>('/config/employees');
      return res.data.data;
    },
  });

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      emp_code: string;
      full_name: string;
      department: string;
      email?: string | null;
      current_grade_id: number;
      target_grade_id: number;
      manager_id?: number | null;
      department_id?: number | null;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigEmployee }>('/config/employees', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'employees'] }),
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        emp_code: string;
        full_name: string;
        department: string;
        email: string | null;
        current_grade_id: number;
        target_grade_id: number;
        manager_id: number | null;
        department_id: number | null;
      }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigEmployee }>(`/config/employees/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'employees'] }),
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/employees/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'employees'] }),
  });
};

// ── Grades ────────────────────────────────────────────────────────────────────

export const useConfigGrades = () =>
  useQuery({
    queryKey: ['config', 'grades'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigGrade[] }>('/config/grades');
      return res.data.data;
    },
  });

export const useCreateGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      department_id: number;
      code: string;
      title: string;
      level: number;
      experience_years: number;
      performance_note?: string;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigGrade }>('/config/grades', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'grades'] }),
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ department_id: number; code: string; title: string; level: number; experience_years: number; performance_note: string }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigGrade }>(`/config/grades/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'grades'] }),
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/grades/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'grades'] }),
  });
};

// ── Skill Domains ─────────────────────────────────────────────────────────────

export const useConfigSkillDomains = () =>
  useQuery({
    queryKey: ['config', 'skill-domains'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigSkillDomain[] }>('/config/skill-domains');
      return res.data.data;
    },
  });

export const useCreateSkillDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; category_id: number }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigSkillDomain }>('/config/skill-domains', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'skill-domains'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'competency-categories'] });
    },
  });
};

export const useUpdateSkillDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ name: string; description: string; color: string; category_id: number }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigSkillDomain }>(`/config/skill-domains/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'skill-domains'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'competency-categories'] });
    },
  });
};

export const useDeleteSkillDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/skill-domains/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'skill-domains'] }),
  });
};

// ── Domain Grade Weights ──────────────────────────────────────────────────────

export interface ConfigDomainGradeWeight {
  id: number;
  domain_id: number;
  grade_id: number;
  weight: number;
  domain: { id: number; name: string; color: string | null };
  grade: { id: number; code: string; title: string; level: number };
}

export const useConfigDomainGradeWeights = () =>
  useQuery({
    queryKey: ['config', 'domain-grade-weights'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigDomainGradeWeight[] }>('/config/domain-grade-weights');
      return res.data.data;
    },
  });

export const useUpsertDomainGradeWeight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { domain_id: number; grade_id: number; weight: number }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigDomainGradeWeight }>('/config/domain-grade-weights', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'domain-grade-weights'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'skill-domains'] });
    },
  });
};

export const useDeleteDomainGradeWeight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/domain-grade-weights/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'domain-grade-weights'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'skill-domains'] });
    },
  });
};

export interface ConfigCompetencyGradeThreshold {
  id: number;
  department_id: number;
  grade_id: number;
  competency_id: number;
  threshold: number;
  department: { id: number; name: string };
  grade: { id: number; code: string; title: string; level: number };
  competency: ConfigCompetency;
}

export const useConfigCompetencyGradeThresholds = (departmentId: number | null) =>
  useQuery({
    queryKey: ['config', 'competency-grade-thresholds', departmentId],
    queryFn: async () => {
      const qs = departmentId ? `?department_id=${departmentId}` : '';
      const res = await apiClient.get<{ success: boolean; data: ConfigCompetencyGradeThreshold[] }>(`/config/competency-grade-thresholds${qs}`);
      return res.data.data;
    },
    enabled: !!departmentId,
  });

export const useBulkUpsertCompetencyGradeThresholds = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      department_id,
      thresholds,
    }: {
      department_id: number;
      thresholds: Array<{ grade_id: number; competency_id: number; threshold: number }>;
    }) => {
      const res = await apiClient.put<{ success: boolean; data: ConfigCompetencyGradeThreshold[] }>('/config/competency-grade-thresholds/bulk', {
        department_id,
        thresholds,
      });
      return res.data.data;
    },
    onSuccess: (_d, { department_id }) => {
      queryClient.invalidateQueries({ queryKey: ['config', 'competency-grade-thresholds', department_id] });
    },
  });
};

// ── Competencies ──────────────────────────────────────────────────────────────

export const useConfigCompetencies = () =>
  useQuery({
    queryKey: ['config', 'competencies'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigCompetency[] }>('/config/competencies');
      return res.data.data;
    },
  });

export const useCreateCompetency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      is_critical?: boolean;
      category_id: number;
      domain_ids: number[];
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigCompetency }>('/config/competencies', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] }),
  });
};

export const useUpdateCompetency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{
        name: string;
        description: string;
        is_critical: boolean;
        category_id: number;
        domain_ids: number[];
      }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigCompetency }>(`/config/competencies/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] }),
  });
};

export const useDeleteCompetency = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/competencies/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] }),
  });
};

export const useSyncDepartmentSkillMap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      department_id,
      mappings,
    }: {
      department_id: number;
      mappings: Array<{ competency_id: number; domain_ids: number[] }>;
    }) => {
      const res = await apiClient.put<{ success: boolean; data: ConfigCompetency[] }>('/config/department-skill-map', {
        department_id,
        mappings,
      });
      return res.data.data;
    },
    onSuccess: (competencies) => {
      queryClient.setQueryData(['config', 'competencies'], competencies);
      queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] });
    },
  });
};

// ── Technologies ──────────────────────────────────────────────────────────────

export const useConfigTechnologies = () =>
  useQuery({
    queryKey: ['config', 'technologies'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigTechnology[] }>('/config/technologies');
      return res.data.data;
    },
  });

export const useCreateTechnology = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; competency_id: number }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigTechnology }>('/config/technologies', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'technologies'] }),
  });
};

export const useUpdateTechnology = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ name: string; competency_id: number }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigTechnology }>(`/config/technologies/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'technologies'] }),
  });
};

export const useDeleteTechnology = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/config/technologies/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config', 'technologies'] }),
  });
};

// ── Competency Categories ──────────────────────────────────────────────────────

export const useConfigCompetencyCategories = () =>
  useQuery({
    queryKey: ['config', 'competency-categories'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ConfigCompetencyCategory[] }>('/config/competency-categories');
      return res.data.data;
    },
  });

export const useCreateCompetencyCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
      weight?: number;
      sort_order?: number;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: ConfigCompetencyCategory[] }>('/config/competency-categories', data);
      return res.data.data;
    },
    onSuccess: (categories) => {
      queryClient.setQueryData(['config', 'competency-categories'], categories);
      queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] });
    },
  });
};

export const useUpdateCompetencyCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ name: string; description: string; color: string; weight: number; sort_order: number; is_active: boolean }>;
    }) => {
      const res = await apiClient.patch<{ success: boolean; data: ConfigCompetencyCategory[] }>(`/config/competency-categories/${id}`, data);
      return res.data.data;
    },
    onSuccess: (categories) => {
      queryClient.setQueryData(['config', 'competency-categories'], categories);
      queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] });
    },
  });
};

export const useDeleteCompetencyCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete<{ success: boolean; data: ConfigCompetencyCategory[] }>(`/config/competency-categories/${id}`);
      return res.data.data;
    },
    onSuccess: (categories) => {
      queryClient.setQueryData(['config', 'competency-categories'], categories);
      queryClient.invalidateQueries({ queryKey: ['config', 'competencies'] });
    },
  });
};
