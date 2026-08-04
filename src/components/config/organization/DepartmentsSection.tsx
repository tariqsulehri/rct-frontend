import React, { useMemo, useState } from 'react';
import { Building2, Search, Users } from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { HEADER_GRADIENTS, useTableState } from '../ConfigTableState';
import {
  ConfigDepartment,
  useConfigDepartments,
  useConfigEmployees,
  useCreateDepartment,
  useDeleteDepartment,
  useUpdateDepartment,
} from '@/hooks/useConfig';

const F = 'field';
const L = 'field-label';

export const DepartmentsSection: React.FC = () => {
  const { data: departments, isLoading, isError } = useConfigDepartments();
  const { data: employees } = useConfigEmployees();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigDepartment | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ name: '', description: '', is_active: true });
  const [selectedDept, setSelectedDept] = useState<ConfigDepartment | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const openCreate = () => { setForm({ name: '', description: '', is_active: true }); setEditing(null); setModal('create'); };
  const openEdit = (d: ConfigDepartment) => { setForm({ name: d.name, description: d.description ?? '', is_active: d.is_active ?? true }); setEditing(d); setModal('edit'); };

  const handleSave = async () => {
    const payload = { name: form.name, description: form.description || undefined, is_active: form.is_active };
    if (modal === 'create') await createDept.mutateAsync(payload);
    else if (editing) await updateDept.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const filteredDepts = useMemo(
    () =>
      (departments ?? []).filter((d) => {
        if (statusFilter === 'active' && !d.is_active) return false;
        if (statusFilter === 'inactive' && d.is_active) return false;
        return true;
      }),
    [departments, statusFilter],
  );

  const ts = useTableState(filteredDepts, (d, q) =>
    d.name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
    (a, b) => a.name.localeCompare(b.name));

  const deptEmployees = selectedDept
    ? (employees ?? []).filter(e => e.department_id === selectedDept.id)
    : [];

  return (
    <>
      {confirmDialog}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TableShell tabKey="departments" title="Departments" onAdd={openCreate} addLabel="Add Department"
            headers={['Name', 'Description', 'Employees', 'Status']}
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
            {ts.paged.map((d, idx) => (
              <TR key={d.id} idx={idx} inactive={!d.is_active}>
                <TD>
                  <button onClick={() => { setSelectedDept(s => s?.id === d.id ? null : d); setMemberSearch(''); }}
                    className="flex items-center gap-2 hover:underline font-semibold"
                    style={{ color: 'rgb(var(--accent))' }}>
                    <Building2 size={14} />
                    {d.name}
                  </button>
                </TD>
                <TD muted small>{d.description ?? '—'}</TD>
                <TD>
                  <span className="badge" style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
                    {(employees ?? []).filter(e => e.department_id === d.id).length} members
                  </span>
                </TD>
                <TD>
                  <StatusBadge active={d.is_active} />
                </TD>
                <ActionBtns onEdit={() => openEdit(d)} onDelete={async () => { if (await confirm({ title: 'Delete Department', message: `"${d.name}" will be permanently deleted.`, confirmLabel: 'Delete' })) deleteDept.mutate(d.id); }} />
              </TR>
            ))}
          </TableShell>
        </div>

        {/* Department detail panel */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: '540px' }}>
          <PanelHeader
            title={selectedDept ? `${selectedDept.name} Members` : 'Select a Department'}
            background={HEADER_GRADIENTS['departments']}
            dense
            highContrast
            action={selectedDept && deptEmployees.length > 0 ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {deptEmployees.length}
              </span>
            ) : undefined}
          />

          {!selectedDept ? (
            <div className="p-6 text-center flex-1">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'rgb(var(--text-3))' }} />
              <p className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                Click a department name to view its members
              </p>
            </div>
          ) : (
            <>
              {/* Search bar */}
              <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: 'rgb(var(--border))' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                  <Search size={13} style={{ color: 'rgb(var(--text-3))' }} />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    className="bg-transparent text-sm outline-none flex-1"
                    style={{ color: 'rgb(var(--text-1))' }}
                  />
                  {memberSearch && (
                    <button onClick={() => setMemberSearch('')}
                      className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>✕</button>
                  )}
                </div>
              </div>

              {/* Member list */}
              {(() => {
                const filtered = deptEmployees.filter(e =>
                  e.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  e.emp_code.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  (e.current_grade?.code ?? '').toLowerCase().includes(memberSearch.toLowerCase())
                );
                return filtered.length === 0 ? (
                  <div className="p-6 text-center flex-1">
                    <Users size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'rgb(var(--text-3))' }} />
                    <p className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                      {deptEmployees.length === 0 ? 'No employees assigned yet' : 'No results found'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                    {filtered.map((e, idx) => (
                      <div key={e.id}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                        style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)' }}
                        onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.3)')}
                        onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)')}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: HEADER_GRADIENTS['employees'], color: 'white' }}>
                          {e.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--text-1))' }}>{e.full_name}</p>
                          <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                            {e.emp_code} · {e.current_grade?.code ?? '—'}
                          </p>
                        </div>
                        <span className="badge badge-accent text-xs shrink-0">{e.current_grade?.code ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Department' : 'Edit Department'}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createDept.isPending || updateDept.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
