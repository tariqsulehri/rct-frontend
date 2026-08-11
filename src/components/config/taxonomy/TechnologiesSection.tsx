import React, { useMemo, useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import {
  ConfigTechnology,
  useConfigCompetencies,
  useConfigTechnologies,
  useCreateTechnology,
  useDeleteTechnology,
  useUpdateTechnology,
} from '@/hooks/useConfig';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

const F = 'field';
const L = 'field-label';

export const TechnologiesSection: React.FC = () => {
  const { data: technologies, isLoading, isError } = useConfigTechnologies();
  const { data: competencies } = useConfigCompetencies();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const createTechnology = useCreateTechnology();
  const updateTechnology = useUpdateTechnology();
  const deleteTechnology = useDeleteTechnology();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigTechnology | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [form, setForm] = useState({ name: '', competency_id: '', is_active: true });

  const openCreate = () => { setForm({ name: '', competency_id: '', is_active: true }); setEditing(null); setModal('create'); };
  const openEdit = (t: ConfigTechnology) => { setForm({ name: t.name, competency_id: String(t.competency_id), is_active: t.is_active ?? true }); setEditing(t); setModal('edit'); };

  const handleSave = async () => {
    const payload = { name: form.name, competency_id: Number(form.competency_id), is_active: form.is_active };
    try {
      if (modal === 'create') {
        await createTechnology.mutateAsync(payload);
        toast.success(`Tool "${payload.name}" created successfully.`, 'Tool Created');
      } else if (editing) {
        await updateTechnology.mutateAsync({ id: editing.id, data: payload });
        toast.success(`Tool "${payload.name}" updated successfully.`, 'Tool Updated');
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save tool.'), 'Error');
    }
  };

  const filteredTechnologies = useMemo(() => {
    return (technologies ?? []).filter(t => {
      if (statusFilter === 'active') return t.is_active;
      if (statusFilter === 'inactive') return !t.is_active;
      return true;
    });
  }, [technologies, statusFilter]);

  const ts = useTableState(filteredTechnologies, (t, q) =>
    t.name.toLowerCase().includes(q) ||
    (t.competency?.name ?? '').toLowerCase().includes(q) ||
    (t.competency?.competency_domains ?? []).some(d => d.domain.name.toLowerCase().includes(q)),
    (a, b) => a.name.localeCompare(b.name));

  const competencyOptions = (competencies ?? []).map(c => ({
    value: String(c.id), label: c.name,
    sub: (c.competency_domains ?? []).find(d => d.is_primary)?.domain.name,
  }));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="technologies" title="Tools" onAdd={openCreate} addLabel="Add Tool"
        headers={['Name', 'Skill', 'Skill Area', 'Status']}
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
        {ts.paged.map((t, idx) => (
          <TR key={t.id} idx={idx} inactive={!t.is_active}>
            <TD><span className={t.is_active ? '' : 'line-through opacity-70'}>{t.name}</span></TD>
            <TD muted>{t.competency?.name ?? `#${t.competency_id}`}</TD>
            <TD muted small>{t.competency?.competency_domains?.find(d => d.is_primary)?.domain.name ?? '—'}</TD>
            <TD><StatusBadge active={t.is_active} /></TD>
            <ActionBtns onEdit={() => openEdit(t)} onDelete={async () => {
              if (await confirm({ title: 'Delete Tool', message: `"${t.name}" will be deleted.`, confirmLabel: 'Delete' })) {
                try {
                  await deleteTechnology.mutateAsync(t.id);
                  toast.success(`Tool "${t.name}" deleted.`, 'Tool Deleted');
                } catch (err: unknown) {
                  toast.error(getApiErrorMessage(err, 'Failed to delete tool.'), 'Delete Error');
                }
              }
            }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Tool' : 'Edit Tool'}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Skill</label>
              <SearchableSelect value={form.competency_id} onChange={v => setForm({ ...form, competency_id: v })}
                placeholder="Select skill…" options={competencyOptions} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createTechnology.isPending || updateTechnology.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
