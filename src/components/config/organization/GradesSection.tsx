import React, { useMemo, useState } from 'react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  ConfigGrade,
  useConfigDepartments,
  useConfigGrades,
  useCreateGrade,
  useDeleteGrade,
  useUpdateGrade,
} from '@/hooks/useConfig';

const F = 'field';
const L = 'field-label';

type GradePayload = {
  department_id: number;
  code: string;
  title: string;
  level: number;
  experience_years: number;
  performance_note?: string;
  is_active: boolean;
};

export const GradesSection: React.FC = () => {
  const { data: grades, isLoading, isError } = useConfigGrades();
  const { data: departments } = useConfigDepartments();
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigGrade | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ department_id: '', code: '', title: '', level: '', experience_years: '', performance_note: '', is_active: true });

  const defaultDepartmentId = departments?.[0]?.id ? String(departments[0].id) : '';
  const departmentOptions = (departments ?? []).map((department) => ({ value: String(department.id), label: department.name }));
  const fallbackDepartmentName = departments?.find((department) => department.name.toLowerCase() === 'devops')?.name
    ?? departments?.[0]?.name
    ?? 'Department not assigned';
  const gradeDepartmentLabel = (grade: ConfigGrade) => (
    grade.department?.name
    ?? (grade.department_id ? `#${grade.department_id}` : fallbackDepartmentName)
  );

  const openCreate = () => { setForm({ department_id: defaultDepartmentId, code: '', title: '', level: '', experience_years: '', performance_note: '', is_active: true }); setEditing(null); setModal('create'); };
  const openEdit = (g: ConfigGrade) => { setForm({ department_id: g.department_id ? String(g.department_id) : defaultDepartmentId, code: g.code, title: g.title, level: String(g.level), experience_years: String(g.experience_years), performance_note: g.performance_note ?? '', is_active: g.is_active ?? true }); setEditing(g); setModal('edit'); };

  const handleSave = async () => {
    const payload: GradePayload = {
      department_id: Number(form.department_id),
      code: form.code,
      title: form.title,
      level: Number(form.level),
      experience_years: Number(form.experience_years),
      performance_note: form.performance_note || undefined,
      is_active: form.is_active,
    };
    try {
      if (modal === 'create') {
        await createGrade.mutateAsync(payload);
        toast.success(`Grade "${payload.code}" created successfully.`, 'Grade Created');
      } else if (editing) {
        await updateGrade.mutateAsync({ id: editing.id, data: payload });
        toast.success(`Grade "${payload.code}" updated successfully.`, 'Grade Updated');
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save grade.'), 'Error');
    }
  };

  const filteredGrades = useMemo(
    () =>
      (grades ?? []).filter((grade) => {
        if (departmentFilter && String(grade.department_id) !== departmentFilter) return false;
        if (statusFilter === 'active' && !grade.is_active) return false;
        if (statusFilter === 'inactive' && grade.is_active) return false;
        return true;
      }),
    [grades, departmentFilter, statusFilter],
  );

  const ts = useTableState(filteredGrades, (g, q) =>
    g.code.toLowerCase().includes(q) || g.title.toLowerCase().includes(q) || gradeDepartmentLabel(g).toLowerCase().includes(q),
    (a, b) => gradeDepartmentLabel(a).localeCompare(gradeDepartmentLabel(b)) || a.level - b.level || a.code.localeCompare(b.code));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="grades" title="Grades" onAdd={openCreate} addLabel="Add Grade"
        headers={['Department', 'Code', 'Title', 'Level', 'Exp. Years', 'Note', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}
        toolbarExtra={(
          <>
            <div className="w-full md:w-56 shrink-0">
              <SearchableSelect
                value={departmentFilter}
                onChange={(value) => {
                  setDepartmentFilter(value);
                  ts.setPage(1);
                }}
                placeholder="All departments"
                options={departmentOptions}
              />
            </div>
            <StatusFilterSelect
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                ts.setPage(1);
              }}
            />
          </>
        )}>
        {ts.paged.map((g, idx) => (
          <TR key={g.id} idx={idx} inactive={!g.is_active}>
            <TD>{gradeDepartmentLabel(g)}</TD>
            <TD>
              <span className={g.is_active ? "badge badge-accent font-bold" : "badge font-bold opacity-60"}>
                {g.code}
              </span>
            </TD>
            <TD>{g.title}</TD>
            <TD>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold inline-flex"
                style={{
                  backgroundColor: g.is_active ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface-2))',
                  color: g.is_active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-3))',
                }}
              >
                {g.level}
              </span>
            </TD>
            <TD muted>{g.experience_years} yrs</TD>
            <TD muted small>{g.performance_note ?? '—'}</TD>
            <TD>
              <StatusBadge active={g.is_active} />
            </TD>
            <ActionBtns onEdit={() => openEdit(g)} onDelete={async () => {
              if (await confirm({ title: 'Delete Grade', message: `Grade "${g.code} – ${g.title}" will be permanently deleted.`, confirmLabel: 'Delete' })) {
                try {
                  await deleteGrade.mutateAsync(g.id);
                  toast.success(`Grade "${g.code}" deleted.`, 'Grade Deleted');
                } catch (err: unknown) {
                  toast.error(getApiErrorMessage(err, 'Failed to delete grade.'), 'Delete Error');
                }
              }
            }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Grade' : 'Edit Grade'}>
          <div className="space-y-4">
            <div>
              <label className={L}>Department</label>
              <SearchableSelect
                value={form.department_id}
                onChange={value => setForm({ ...form, department_id: value })}
                placeholder="Select department..."
                options={departmentOptions}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Code</label><input className={F} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><label className={L}>Title</label><input className={F} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Level (1-10)</label><input className={F} type="number" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} /></div>
              <div><label className={L}>Years Exp.</label><input className={F} type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></div>
            </div>
            <div><label className={L}>Note (Optional)</label><textarea className={F} rows={2} value={form.performance_note} onChange={e => setForm({ ...form, performance_note: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createGrade.isPending || updateGrade.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
