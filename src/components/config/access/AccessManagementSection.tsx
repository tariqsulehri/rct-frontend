import React, { useState } from 'react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiError';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTableState } from '../ConfigTableState';
import {
  ConfigDepartmentAssignment,
  ConfigLineManagerAssignment,
  ConfigPermission,
  ConfigRole,
  useAccessAuditLogs,
  useConfigDepartments,
  useConfigEmployees,
  useConfigPermissions,
  useConfigRoles,
  useConfigUsers,
  useCreateDepartmentAssignment,
  useDeleteDepartmentAssignment,
  useDeleteLineManagerAssignment,
  useDepartmentAssignments,
  useLineManagerAssignments,
  useSyncLineManagerAssignments,
  useUpdateDepartmentAssignment,
  useUpdateLineManagerAssignment,
  useUpdateRole,
} from '@/hooks/useConfig';
import { AccessAuditPanel } from './AccessAuditPanel';
import { DepartmentAccessModal } from './DepartmentAccessModal';
import { DepartmentAccessPanel } from './DepartmentAccessPanel';
import { LineManagerAccessPanel } from './LineManagerAccessPanel';
import { LineManagerAccessModal } from './LineManagerAccessModal';
import { RoleAccessModal } from './RoleAccessModal';
import { RolesAccessPanel } from './RolesAccessPanel';
import {
  AccessPanel,
  AssignmentStatusFilter,
  DepartmentAccessForm,
  LineManagerBulkAccessForm,
  LineManagerAccessForm,
  ResourceStatusFilter,
  RoleAccessForm,
  formatEmployeeLabel,
  formatUserLabel,
  fromDateInput,
  toDateInput,
} from './accessUtils';
import { useLineManagerResourceState } from './useLineManagerResourceState';

export const AccessManagementSection: React.FC = () => {
  const [panel, setPanel] = useState<AccessPanel>('roles');
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useConfigRoles();
  const { data: permissions } = useConfigPermissions();
  const { data: users } = useConfigUsers();
  const { data: departments } = useConfigDepartments();
  const { data: employees } = useConfigEmployees();
  const { data: deptAssignments, isLoading: deptLoading, isError: deptError } = useDepartmentAssignments();
  const { data: lineAssignments, isLoading: lineLoading, isError: lineError } = useLineManagerAssignments();
  const { data: auditLogs, isLoading: auditLoading, isError: auditError } = useAccessAuditLogs();
  const currentUser = useAuthStore((state) => state.user);
  const setCurrentUser = useAuthStore((state) => state.setUser);

  const updateRole = useUpdateRole();
  const createDeptAssignment = useCreateDepartmentAssignment();
  const updateDeptAssignment = useUpdateDepartmentAssignment();
  const deleteDeptAssignment = useDeleteDepartmentAssignment();
  const updateLineAssignment = useUpdateLineManagerAssignment();
  const deleteLineAssignment = useDeleteLineManagerAssignment();
  const syncLineAssignments = useSyncLineManagerAssignments();

  const [roleModal, setRoleModal] = useState<ConfigRole | null>(null);
  const [roleForm, setRoleForm] = useState<RoleAccessForm>({ name: '', description: '', is_active: true, sort_order: 0 });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [deptModal, setDeptModal] = useState<'create' | 'edit' | null>(null);
  const [editingDept, setEditingDept] = useState<ConfigDepartmentAssignment | null>(null);
  const [deptForm, setDeptForm] = useState<DepartmentAccessForm>({
    user_id: '',
    department_id: '',
    department_ids: [] as string[],
    assignment_type: 'MANAGER',
    can_view: true,
    can_manage: true,
    starts_at: '',
    ends_at: '',
    is_active: true,
  });
  const [lineModal, setLineModal] = useState<'edit' | null>(null);
  const [lineStatusFilter, setLineStatusFilter] = useState<AssignmentStatusFilter>('active');
  const [resourceStatusFilter, setResourceStatusFilter] = useState<ResourceStatusFilter>('assignable');
  const [resourceDepartmentFilter, setResourceDepartmentFilter] = useState('');
  const [resourceGradeFilter, setResourceGradeFilter] = useState('');
  const [editingLine, setEditingLine] = useState<ConfigLineManagerAssignment | null>(null);
  const [lineForm, setLineForm] = useState<LineManagerAccessForm>({
    manager_user_id: '',
    employee_id: '',
    relationship_type: 'LINE_MANAGER',
    can_view: true,
    can_assess: true,
    starts_at: '',
    ends_at: '',
    is_primary: false,
    is_active: true,
  });
  const [lineBulkForm, setLineBulkForm] = useState<LineManagerBulkAccessForm>({
    manager_user_id: '',
    employee_ids: [] as string[],
    relationship_type: 'LINE_MANAGER',
    can_view: true,
    can_assess: true,
    starts_at: '',
    ends_at: '',
    is_primary: false,
    is_active: true,
  });
  const [lineEmployeeSearch, setLineEmployeeSearch] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const userOptions = (users ?? []).map(user => ({
    value: String(user.id),
    label: formatUserLabel(user),
    sub: user.role,
  }));
  const departmentOptions = (departments ?? []).map(dept => ({
    value: String(dept.id),
    label: dept.name,
    sub: dept.description ?? undefined,
  }));
  const {
    lineManagerOptions,
    activeLineAssignments,
    assignedEmployeeCount,
    unassignedEmployeeCount,
    filteredLineAssignments,
    selectedLineManager,
    selectedManagerActiveAssignments,
    hasLineBulkChanges,
    resourceDepartmentOptions,
    resourceGradeOptions,
    visibleResourceRows,
    visibleSelectableResourceIds,
    selectedLineBulkEmployees,
    newlySelectedResourceCount,
  } = useLineManagerResourceState({
    users,
    employees,
    lineAssignments,
    lineFormManagerUserId: lineForm.manager_user_id,
    lineBulkForm,
    lineStatusFilter,
    resourceStatusFilter,
    resourceDepartmentFilter,
    resourceGradeFilter,
    lineEmployeeSearch,
  });

  const roleState = useTableState(roles, (r, q) =>
    r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const groupedPermissions = (permissions ?? []).reduce<Record<string, ConfigPermission[]>>((groups, permission) => {
    const category = permission.category || 'General';
    groups[category] = groups[category] ?? [];
    groups[category].push(permission);
    return groups;
  }, {});
  const deptState = useTableState(deptAssignments, (a, q) =>
    formatUserLabel(a.user).toLowerCase().includes(q) ||
    (a.department?.name ?? '').toLowerCase().includes(q) ||
    a.assignment_type.toLowerCase().includes(q),
    (a, b) => (a.department?.name ?? '').localeCompare(b.department?.name ?? ''));
  const lineState = useTableState(filteredLineAssignments, (a, q) =>
    formatUserLabel(a.manager_user).toLowerCase().includes(q) ||
    formatEmployeeLabel(a.employee).toLowerCase().includes(q) ||
    a.relationship_type.toLowerCase().includes(q),
    (a, b) => formatUserLabel(a.manager_user).localeCompare(formatUserLabel(b.manager_user)));
  const auditState = useTableState(auditLogs, (log, q) =>
    log.action.toLowerCase().includes(q) ||
    log.entity_type.toLowerCase().includes(q) ||
    formatUserLabel(log.actor_user).toLowerCase().includes(q) ||
    formatUserLabel(log.target_user).toLowerCase().includes(q),
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const openRole = (role: ConfigRole) => {
    setRoleForm({
      name: role.name,
      description: role.description ?? '',
      is_active: role.is_active,
      sort_order: role.sort_order,
    });
    setSelectedPermissionIds([...new Set((role.role_permissions ?? []).map(item => item.permission_id))]);
    setRoleModal(role);
    setSaveError(null);
  };

  const saveRole = async () => {
    if (!roleModal) return;
    setSaveError(null);
    try {
      const permissionIds = [...new Set(selectedPermissionIds)];
      await updateRole.mutateAsync({
        id: roleModal.id,
        data: {
          name: roleForm.name,
          description: roleForm.description || null,
          is_active: roleForm.is_active,
          sort_order: roleForm.sort_order,
          permission_ids: permissionIds,
        },
      });
      if (currentUser?.role === roleModal.code) {
        const { data } = await apiClient.get<{ user: typeof currentUser }>('/auth/me');
        setCurrentUser({ ...data.user, permissions: data.user.permissions ?? [] });
      }
      setRoleModal(null);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Failed to save role.'));
    }
  };

  const openDeptCreate = () => {
    setDeptForm({ user_id: '', department_id: '', department_ids: [], assignment_type: 'MANAGER', can_view: true, can_manage: true, starts_at: '', ends_at: '', is_active: true });
    setEditingDept(null);
    setSaveError(null);
    setDeptModal('create');
  };
  const openDeptEdit = (assignment: ConfigDepartmentAssignment) => {
    setDeptForm({
      user_id: String(assignment.user_id),
      department_id: String(assignment.department_id),
      department_ids: [String(assignment.department_id)],
      assignment_type: assignment.assignment_type,
      can_view: assignment.can_view,
      can_manage: assignment.can_manage,
      starts_at: toDateInput(assignment.starts_at),
      ends_at: toDateInput(assignment.ends_at),
      is_active: assignment.is_active,
    });
    setEditingDept(assignment);
    setSaveError(null);
    setDeptModal('edit');
  };
  const saveDeptAssignment = async () => {
    setSaveError(null);
    try {
      const payload = {
        user_id: Number(deptForm.user_id),
        assignment_type: deptForm.assignment_type,
        can_view: deptForm.can_view,
        can_manage: deptForm.can_manage,
        starts_at: fromDateInput(deptForm.starts_at) ?? undefined,
        ends_at: fromDateInput(deptForm.ends_at),
        is_active: deptForm.is_active,
      };
      const departmentIds = deptModal === 'create'
        ? deptForm.department_ids.map(Number).filter(Boolean)
        : [Number(deptForm.department_id)].filter(Boolean);
      if (!payload.user_id || departmentIds.length === 0) {
        setSaveError(deptModal === 'create' ? 'Please select a user and at least one department.' : 'Please select both user and department.');
        return;
      }
      if (deptModal === 'create') {
        await Promise.all(departmentIds.map(department_id => createDeptAssignment.mutateAsync({ ...payload, department_id })));
      } else if (editingDept) {
        await updateDeptAssignment.mutateAsync({ id: editingDept.id, data: { ...payload, department_id: departmentIds[0] } });
      }
      setDeptModal(null);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Failed to save department access.'));
    }
  };

  const loadLineBulkManager = (managerUserId: string) => {
    const activeAssignments = (lineAssignments ?? []).filter(a =>
      String(a.manager_user_id) === managerUserId &&
      a.is_active &&
      a.relationship_type === lineBulkForm.relationship_type,
    );
    setLineBulkForm({
      ...lineBulkForm,
      manager_user_id: managerUserId,
      employee_ids: activeAssignments.map(a => String(a.employee_id)),
    });
    setLineEmployeeSearch('');
  };
  const openLineEdit = (assignment: ConfigLineManagerAssignment) => {
    setLineForm({
      manager_user_id: String(assignment.manager_user_id),
      employee_id: String(assignment.employee_id),
      relationship_type: assignment.relationship_type,
      can_view: assignment.can_view,
      can_assess: assignment.can_assess,
      starts_at: toDateInput(assignment.starts_at),
      ends_at: toDateInput(assignment.ends_at),
      is_primary: assignment.is_primary,
      is_active: assignment.is_active,
    });
    setEditingLine(assignment);
    setSaveError(null);
    setLineModal('edit');
  };
  const saveLineAssignment = async () => {
    setSaveError(null);
    try {
      const basePayload = {
        can_view: lineForm.can_view,
        can_assess: lineForm.can_assess,
        starts_at: fromDateInput(lineForm.starts_at) ?? undefined,
        ends_at: fromDateInput(lineForm.ends_at),
        is_primary: lineForm.is_primary,
        is_active: lineForm.is_active,
      };
      if (editingLine) await updateLineAssignment.mutateAsync({ id: editingLine.id, data: basePayload });
      setLineModal(null);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Failed to save line-manager access.'));
    }
  };
  const saveLineBulkAssignments = async () => {
    setSaveError(null);
    try {
      const managerUserId = Number(lineBulkForm.manager_user_id);
      const selectedEmployeeIds = new Set(lineBulkForm.employee_ids.map(Number).filter(Boolean));
      if (!managerUserId) {
        setSaveError('Please select a line manager.');
        return;
      }
      await syncLineAssignments.mutateAsync({
        manager_user_id: managerUserId,
        employee_ids: Array.from(selectedEmployeeIds),
        relationship_type: lineBulkForm.relationship_type,
        can_view: lineBulkForm.can_view,
        can_assess: lineBulkForm.can_assess,
        starts_at: fromDateInput(lineBulkForm.starts_at) ?? undefined,
        ends_at: fromDateInput(lineBulkForm.ends_at),
        is_primary: lineBulkForm.is_primary,
        is_active: lineBulkForm.is_active,
      });
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Failed to update line-manager employees.'));
    }
  };

  const statusBadge = (active: boolean) => (
    <span className={active ? 'badge badge-success' : 'badge'}>{active ? 'Active' : 'Removed'}</span>
  );
  const toggleLineBulkEmployee = (employeeId: string) => {
    setLineBulkForm(current => ({
      ...current,
      employee_ids: current.employee_ids.includes(employeeId)
        ? current.employee_ids.filter(id => id !== employeeId)
        : [...current.employee_ids, employeeId],
    }));
  };

  return (
    <>
      {confirmDialog}
      <div className="space-y-4">
        <div className="card p-1.5 flex gap-1 flex-wrap">
          {[
            { id: 'roles' as const, label: 'Roles' },
            { id: 'departments' as const, label: 'Department Access' },
            { id: 'line-managers' as const, label: 'Line Manager Access' },
            { id: 'audit' as const, label: 'Audit' },
          ].map(item => (
            <button key={item.id} type="button" onClick={() => setPanel(item.id)}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: panel === item.id ? 'rgb(var(--accent))' : 'transparent',
                color: panel === item.id ? 'white' : 'rgb(var(--text-2))',
              }}>
              {item.label}
            </button>
          ))}
        </div>

        {panel === 'roles' && (
          <RolesAccessPanel
            roleState={roleState}
            loading={rolesLoading}
            error={rolesError}
            statusBadge={statusBadge}
            onEditRole={openRole}
          />
        )}

        {panel === 'departments' && (
          <DepartmentAccessPanel
            deptState={deptState}
            loading={deptLoading}
            error={deptError}
            statusBadge={statusBadge}
            onAdd={openDeptCreate}
            onEdit={openDeptEdit}
            onDelete={async (assignment) => {
              if (await confirm({ title: 'Deactivate Department Access', message: 'This access assignment will be marked inactive.', confirmLabel: 'Deactivate', variant: 'warning' })) deleteDeptAssignment.mutate(assignment.id);
            }}
          />
        )}

        {panel === 'line-managers' && (
          <LineManagerAccessPanel
            assignedEmployeeCount={assignedEmployeeCount}
            unassignedEmployeeCount={unassignedEmployeeCount}
            activeLineAssignments={activeLineAssignments}
            selectedLineManager={selectedLineManager}
            selectedManagerActiveAssignments={selectedManagerActiveAssignments}
            newlySelectedResourceCount={newlySelectedResourceCount}
            visibleResourceRows={visibleResourceRows}
            visibleSelectableResourceIds={visibleSelectableResourceIds}
            selectedLineBulkEmployees={selectedLineBulkEmployees}
            lineBulkForm={lineBulkForm}
            setLineBulkForm={setLineBulkForm}
            lineManagerOptions={lineManagerOptions}
            lineAssignments={lineAssignments}
            resourceDepartmentFilter={resourceDepartmentFilter}
            setResourceDepartmentFilter={setResourceDepartmentFilter}
            resourceDepartmentOptions={resourceDepartmentOptions}
            resourceGradeFilter={resourceGradeFilter}
            setResourceGradeFilter={setResourceGradeFilter}
            resourceGradeOptions={resourceGradeOptions}
            resourceStatusFilter={resourceStatusFilter}
            setResourceStatusFilter={setResourceStatusFilter}
            lineEmployeeSearch={lineEmployeeSearch}
            setLineEmployeeSearch={setLineEmployeeSearch}
            hasLineBulkChanges={hasLineBulkChanges}
            syncLineAssignmentsPending={syncLineAssignments.isPending}
            saveError={saveError}
            lineStatusFilter={lineStatusFilter}
            setLineStatusFilter={setLineStatusFilter}
            lineState={lineState}
            lineLoading={lineLoading}
            lineError={lineError}
            statusBadge={statusBadge}
            loadLineBulkManager={loadLineBulkManager}
            saveLineBulkAssignments={saveLineBulkAssignments}
            toggleLineBulkEmployee={toggleLineBulkEmployee}
            onEditLine={openLineEdit}
            onDeactivateLine={async (assignment) => {
              if (await confirm({ title: 'Deactivate Line Manager Access', message: 'This employee resource will be removed from the line manager.', confirmLabel: 'Deactivate', variant: 'warning' })) deleteLineAssignment.mutate(assignment.id);
            }}
            onReactivateLine={async (assignment) => {
              if (await confirm({ title: 'Reactivate Line Manager Access', message: 'This employee resource will be assigned back to this line manager if no other active line manager owns it.', confirmLabel: 'Reactivate', variant: 'warning' })) {
                updateLineAssignment.mutate({ id: assignment.id, data: { is_active: true, ends_at: null } });
              }
            }}
          />
        )}

        {panel === 'audit' && (
          <AccessAuditPanel auditState={auditState} loading={auditLoading} error={auditError} />
        )}
      </div>

      {roleModal && (
        <RoleAccessModal
          role={roleModal}
          form={roleForm}
          setForm={setRoleForm}
          selectedPermissionIds={selectedPermissionIds}
          setSelectedPermissionIds={setSelectedPermissionIds}
          groupedPermissions={groupedPermissions}
          saveError={saveError}
          saving={updateRole.isPending}
          onSave={saveRole}
          onClose={() => setRoleModal(null)}
        />
      )}

      {deptModal && (
        <DepartmentAccessModal
          mode={deptModal}
          form={deptForm}
          setForm={setDeptForm}
          userOptions={userOptions}
          departmentOptions={departmentOptions}
          saveError={saveError}
          saving={createDeptAssignment.isPending || updateDeptAssignment.isPending}
          onSave={saveDeptAssignment}
          onClose={() => setDeptModal(null)}
        />
      )}

      {lineModal && (
        <LineManagerAccessModal
          editingLine={editingLine}
          form={lineForm}
          setForm={setLineForm}
          saveError={saveError}
          saving={updateLineAssignment.isPending}
          onSave={saveLineAssignment}
          onClose={() => setLineModal(null)}
        />
      )}
    </>
  );
};
