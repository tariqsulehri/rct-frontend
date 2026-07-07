import React, { useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import {
  ConfigCompetencyCategory,
  useConfigCompetencyCategories,
  useCreateCompetencyCategory,
  useDeleteCompetencyCategory,
  useUpdateCompetencyCategory,
} from '@/hooks/useConfig';
import { ActionBtns, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';

const F = 'field';
const L = 'field-label';

type CompetencyCategoryPayload = {
  name: string;
  description?: string;
  color?: string;
  weight?: number;
  sort_order?: number;
  is_active?: boolean;
};

export const CategoriesSection: React.FC = () => {
  const { data: categories, isLoading, isError } = useConfigCompetencyCategories();
  const createCategory = useCreateCompetencyCategory();
  const updateCategory = useUpdateCompetencyCategory();
  const deleteCategory = useDeleteCompetencyCategory();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigCompetencyCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', weight: '1', sort_order: '0', is_active: true });

  const openCreate = () => { setForm({ name: '', description: '', color: '#6366f1', weight: '1', sort_order: String((categories?.length ?? 0) + 1), is_active: true }); setEditing(null); setModal('create'); };
  const openEdit = (c: ConfigCompetencyCategory) => {
    setForm({
      name: c.name,
      description: c.description ?? '',
      color: c.color ?? '#6366f1',
      weight: String(c.weight ?? 1),
      sort_order: String(c.sort_order ?? 0),
      is_active: c.is_active,
    });
    setEditing(c); setModal('edit');
  };

  const handleSave = async () => {
    const payload: CompetencyCategoryPayload = {
      name: form.name,
      description: form.description || undefined,
      color: form.color || undefined,
      weight: Number(form.weight),
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };
    if (modal === 'create') await createCategory.mutateAsync(payload);
    else if (editing) await updateCategory.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(categories, (c, q) =>
    c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  // Preset colors for quick pick
  const COLOR_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#3b82f6'];

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="categories" title="Skill Categories" onAdd={openCreate} addLabel="Add Category"
        headers={['Name', 'Weight', 'Order', 'Status', 'Color', 'Description', 'Skills']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((c, idx) => (
          <TR key={c.id} idx={idx}>
            <TD>
              <div className="flex items-center gap-2">
                {c.color && (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                )}
                <span className="font-semibold"
                  style={{
                    color: c.color ?? 'rgb(var(--text-1))',
                  }}>{c.name}</span>
              </div>
            </TD>
            <TD>{Math.round((c.weight ?? 0) * 100)}%</TD>
            <TD mono>{c.sort_order}</TD>
            <TD><span className={c.is_active ? 'badge badge-success' : 'badge'}>{c.is_active ? 'Active' : 'Inactive'}</span></TD>
            <TD>
              {c.color ? (
                <span className="badge font-mono text-xs"
                  style={{
                    backgroundColor: c.color + '22',
                    color: c.color,
                    border: `1px solid ${c.color}44`,
                  }}>
                  {c.color}
                </span>
              ) : (
                <span style={{ color: 'rgb(var(--text-3))' }}>—</span>
              )}
            </TD>
            <TD muted small>{c.description ?? '—'}</TD>
            <TD>
              <span className="badge" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
                {c.competencies?.length ?? 0}
              </span>
            </TD>
            <ActionBtns onEdit={() => openEdit(c)} onDelete={async () => { if (await confirm({ title: 'Delete Category', message: `"${c.name}" will be permanently deleted. Skills using this category must be reassigned.`, confirmLabel: 'Delete' })) deleteCategory.mutate(c.id); }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Category' : 'Edit Category'}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cloud, DevSecOps…" /></div>
            <div><label className={L}>Description (optional)</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this category covers…" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={L}>Weight</label>
                <input type="number" min="0" max="1" step="0.01" className={F} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div>
                <label className={L}>Sort Order</label>
                <input type="number" min="0" step="1" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm pt-7" style={{ color: 'rgb(var(--text-1))' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
                Active
              </label>
            </div>

            {/* Color picker */}
            <div>
              <label className={L}>Badge Color</label>
              <div className="flex items-center gap-3 mt-1.5">
                {/* Live preview */}
                <span className="badge font-semibold text-xs shrink-0"
                  style={{
                    backgroundColor: form.color + '22',
                    color: form.color,
                    border: `1px solid ${form.color}55`,
                    minWidth: '90px',
                    textAlign: 'center',
                  }}>
                  {form.name || 'Preview'}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {COLOR_PRESETS.map(clr => (
                    <button key={clr} type="button"
                      onClick={() => setForm({ ...form, color: clr })}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{
                        backgroundColor: clr,
                        outline: form.color === clr ? `2px solid ${clr}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>

                <input type="color" value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0.5 shrink-0"
                  style={{ backgroundColor: 'transparent' }}
                  title="Custom color" />
              </div>
            </div>

            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createCategory.isPending || updateCategory.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
