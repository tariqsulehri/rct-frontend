import React, { useState } from 'react';
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
import { ActionBtns, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';

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
  const [form, setForm] = useState({ name: '', competency_id: '' });

  const openCreate = () => { setForm({ name: '', competency_id: '' }); setEditing(null); setModal('create'); };
  const openEdit = (t: ConfigTechnology) => { setForm({ name: t.name, competency_id: String(t.competency_id) }); setEditing(t); setModal('edit'); };

  const handleSave = async () => {
    const payload = { name: form.name, competency_id: Number(form.competency_id) };
    if (modal === 'create') await createTechnology.mutateAsync(payload);
    else if (editing) await updateTechnology.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(technologies, (t, q) =>
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
        headers={['Name', 'Skill', 'Skill Area']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((t, idx) => (
          <TR key={t.id} idx={idx}>
            <TD>{t.name}</TD>
            <TD muted>{t.competency?.name ?? `#${t.competency_id}`}</TD>
            <TD muted small>{t.competency?.competency_domains?.find(d => d.is_primary)?.domain.name ?? '—'}</TD>
            <ActionBtns onEdit={() => openEdit(t)} onDelete={async () => { if (await confirm({ title: 'Delete Tool', message: `"${t.name}" will be deleted.`, confirmLabel: 'Delete' })) deleteTechnology.mutate(t.id); }} />
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
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createTechnology.isPending || updateTechnology.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
