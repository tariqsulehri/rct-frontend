import React, { useMemo, useState } from 'react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import {
  ConfigEmployee,
  ConfigUser,
  useConfigEmployees,
  useConfigRoles,
  useConfigUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from '@/hooks/useConfig';
import { ROLE_CODES } from '@/types/rbac';

const F = 'field';
const L = 'field-label';

type UserRole = ConfigUser['role'];
type UserPayload = {
  username: string;
  password?: string;
  role: UserRole;
  employee_id: number;
  is_active: boolean;
};

export const UsersSection: React.FC = () => {
  const { data: users, isLoading, isError } = useConfigUsers();
  const { data: employees } = useConfigEmployees();
  const { data: roles } = useConfigRoles();
  const currentUser = useAuthStore((state) => state.user);
  const setCurrentUser = useAuthStore((state) => state.setUser);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'ENGINEER', employee_id: '', is_active: true });
  const [statusFilter, setStatusFilter] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const openCreate = () => { setForm({ username: '', password: '', role: 'ENGINEER', employee_id: '', is_active: true }); setEditing(null); setSaveError(null); setModal('create'); };
  const openEdit = (u: ConfigUser) => { setForm({ username: u.username, password: '', role: u.role, employee_id: String(u.employee_id), is_active: u.is_active }); setEditing(u); setSaveError(null); setModal('edit'); };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (!form.employee_id) {
        setSaveError('Please select an employee for this user account.');
        return;
      }
      if (modal === 'create') {
        await createUser.mutateAsync({
          username: form.username,
          password: form.password,
          role: form.role as UserRole,
          employee_id: Number(form.employee_id),
          is_active: form.is_active,
        });
        toast.success(`User "${form.username}" created successfully.`, 'User Created');
      } else if (editing) {
        const data: Partial<UserPayload> = {
          username: form.username,
          role: form.role as UserRole,
          employee_id: Number(form.employee_id),
          is_active: form.is_active,
        };
        if (form.password) data.password = form.password;
        const updated = await updateUser.mutateAsync({ id: editing.id, data });
        toast.success(`User "${form.username}" updated successfully.`, 'User Updated');
        if (currentUser?.id === updated.id) {
          const selectedEmployee = (employees ?? []).find((employee) => employee.id === updated.employee_id);
          setCurrentUser({
            ...currentUser,
            username: updated.username,
            role: updated.role,
            employeeId: updated.employee_id,
            empCode: updated.employee?.emp_code ?? currentUser.empCode,
            employeeName: updated.employee?.full_name ?? currentUser.employeeName,
            department: updated.employee?.department ?? currentUser.department,
            currentGrade: selectedEmployee?.current_grade?.code ?? currentUser.currentGrade,
            currentGradeTitle: selectedEmployee?.current_grade?.title ?? currentUser.currentGradeTitle,
            targetGrade: selectedEmployee?.target_grade?.code ?? currentUser.targetGrade,
            targetGradeTitle: selectedEmployee?.target_grade?.title ?? currentUser.targetGradeTitle,
          });
        }
      }
      setModal(null);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Failed to save user. Please check the details and try again.');
      setSaveError(msg);
      toast.error(msg, 'Error');
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'badge badge-accent',
    TOP_MANAGEMENT: 'badge badge-accent',
    MANAGER: 'badge',
    LINE_MANAGER: 'badge',
    ENGINEER: 'badge badge-success',
  };
  const roleOptions = (roles?.length ? roles.filter(r => r.is_active).map(r => ({
    value: r.code,
    label: r.name || r.code,
    sub: r.description ?? undefined,
  })) : ROLE_CODES.map(role => ({
    value: role,
    label: role.replace(/_/g, ' '),
  })));

  const filteredUsers = useMemo(() => (users ?? []).filter(user => {
    if (statusFilter === 'active') return user.is_active;
    if (statusFilter === 'inactive') return !user.is_active;
    return true;
  }), [users, statusFilter]);

  const ts = useTableState(filteredUsers, (u, q) =>
    u.username.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q) ||
    (u.employee?.full_name ?? '').toLowerCase().includes(q),
    (a, b) => (a.employee?.full_name ?? a.username).localeCompare(b.employee?.full_name ?? b.username));

  const formatEmployeeSelection = (employee: Pick<ConfigEmployee, 'emp_code' | 'full_name' | 'department' | 'dept'>) => {
    const departmentName = employee.dept?.name ?? employee.department;
    return `${employee.emp_code} - ${employee.full_name} - ${departmentName || 'No department'}`;
  };
  const empOptions = (employees ?? []).map(e => ({
    value: String(e.id),
    label: formatEmployeeSelection(e),
    sub: e.current_grade?.code && e.target_grade?.code ? `${e.current_grade.code} -> ${e.target_grade.code}` : undefined,
  }));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="users" title="Users" onAdd={openCreate} addLabel="Add User"
        headers={['Username', 'Role', 'Employee', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}
        toolbarExtra={(
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              ts.setPage(1);
            }}
          />
        )}>
        {ts.paged.map((u, idx) => (
          <TR key={u.id} idx={idx} inactive={!u.is_active}>
            <TD><span className={`font-semibold ${u.is_active ? '' : 'line-through opacity-70'}`} style={{ color: 'rgb(var(--text-1))' }}>{u.username}</span></TD>
            <TD><span className={ROLE_BADGE[u.role] ?? 'badge'}>{u.role}</span></TD>
            <TD muted>
              {u.employee
                ? `${u.employee.emp_code} - ${u.employee.full_name} - ${u.employee.department || 'No department'}`
                : `#${u.employee_id}`}
            </TD>
            <TD>
              <StatusBadge active={u.is_active} />
            </TD>
            <ActionBtns onEdit={() => openEdit(u)} onDelete={async () => {
              if (await confirm({ title: 'Deactivate User', message: `"${u.username}" will be deactivated and lose access.`, confirmLabel: 'Deactivate', variant: 'warning' })) {
                try {
                  await deleteUser.mutateAsync(u.id);
                  toast.success(`User "${u.username}" deactivated.`, 'User Deactivated');
                } catch (err: unknown) {
                  toast.error(getApiErrorMessage(err, 'Failed to deactivate user.'), 'Error');
                }
              }
            }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => { setModal(null); setSaveError(null); }} wide title={modal === 'create' ? 'Create User' : 'Edit User'}>
          <div className="space-y-4">
            {saveError && (
              <div className="rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'rgba(248, 113, 113, 0.35)',
                  backgroundColor: 'rgba(127, 29, 29, 0.20)',
                  color: 'rgb(var(--danger))',
                }}>
                {saveError}
              </div>
            )}
            <div><label className={L}>Username</label><input className={F} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div>
              <label className={L}>Password {modal === 'edit' && <span style={{ color: 'rgb(var(--text-3))' }} className="font-normal normal-case">(leave blank to keep)</span>}</label>
              <input type="password" className={F} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div><label className={L}>Role</label>
              <SearchableSelect value={form.role} onChange={v => setForm({ ...form, role: v })}
                placeholder="Select role…"
                options={roleOptions} />
            </div>
            <div><label className={L}>Employee</label>
              <SearchableSelect value={form.employee_id} onChange={v => setForm({ ...form, employee_id: v })}
                placeholder="Select employee…" options={empOptions} />
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--accent))' }}
              />
              Active user
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createUser.isPending || updateUser.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
