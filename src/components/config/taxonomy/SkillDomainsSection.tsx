import React, { useEffect, useMemo, useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  ConfigSkillDomain,
  useConfigCompetencyCategories,
  useConfigSkillDomains,
  useCreateSkillDomain,
  useDeleteSkillDomain,
  useUpdateSkillDomain,
} from '@/hooks/useConfig';
import { CategoryFilterSelect } from '@/components/filters/TaxonomyFilterSelects';

const F = 'field';
const L = 'field-label';

type SkillDomainPayload = {
  name: string;
  description?: string;
  color?: string;
  category_id: number;
  is_active: boolean;
};

const SKILL_AREA_COLOR_PRESETS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#ca8a04', // Yellow
  '#65a30d', // Lime
  '#9333ea', // Purple
  '#be123c', // Rose
  '#0284c7', // Sky
  '#16a34a', // Green
];

const normalizeHexColor = (color?: string | null) => (color ?? '').trim().toLowerCase();

const getSuggestedSkillAreaColor = (domains?: ConfigSkillDomain[]) => {
  const usedColors = new Set((domains ?? []).map(domain => normalizeHexColor(domain.color)).filter(Boolean));
  return SKILL_AREA_COLOR_PRESETS.find(color => !usedColors.has(normalizeHexColor(color))) ?? SKILL_AREA_COLOR_PRESETS[(domains?.length ?? 0) % SKILL_AREA_COLOR_PRESETS.length];
};

export const SkillDomainsSection: React.FC = () => {
  const { data: domains, isLoading, isError } = useConfigSkillDomains();
  const { data: categories } = useConfigCompetencyCategories();
  const createDomain = useCreateSkillDomain();
  const updateDomain = useUpdateSkillDomain();
  const deleteDomain = useDeleteSkillDomain();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigSkillDomain | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '', category_id: '', is_active: true });
  const [formError, setFormError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const usedSkillAreaColors = useMemo(
    () => new Set((domains ?? []).map(domain => normalizeHexColor(domain.color)).filter(Boolean)),
    [domains],
  );
  const suggestedSkillAreaColor = useMemo(() => getSuggestedSkillAreaColor(domains), [domains]);
  const categoryById = useMemo(() => new Map((categories ?? []).map(category => [category.id, category])), [categories]);
  const filteredDomainsByCategory = useMemo(() => {
    return (domains ?? []).filter(domain => {
      if (categoryFilter && String(domain.category_id) !== categoryFilter) return false;
      if (statusFilter === 'active' && !domain.is_active) return false;
      if (statusFilter === 'inactive' && domain.is_active) return false;
      return true;
    });
  }, [categoryFilter, statusFilter, domains]);

  const openCreate = () => {
    setForm({ name: '', description: '', color: suggestedSkillAreaColor, category_id: categories?.[0] ? String(categories[0].id) : '', is_active: true });
    setFormError('');
    setEditing(null);
    setModal('create');
  };
  const openEdit = (d: ConfigSkillDomain) => {
    setForm({ name: d.name, description: d.description ?? '', color: d.color ?? '', category_id: String(d.category_id), is_active: d.is_active ?? true });
    setFormError('');
    setEditing(d); setModal('edit');
  };

  useEffect(() => {
    if (modal === 'create' && !form.category_id && categories?.[0]) {
      setForm(current => current.category_id ? current : { ...current, category_id: String(categories[0].id) });
    }
  }, [categories, form.category_id, modal]);

  const handleSave = async () => {
    if (!form.category_id) {
      setFormError('Please select a category.');
      return;
    }
    setFormError('');
    const payload: SkillDomainPayload = {
      name: form.name,
      description: form.description || undefined,
      color: form.color || undefined,
      category_id: Number(form.category_id),
      is_active: form.is_active,
    };
    try {
      if (modal === 'create') {
        await createDomain.mutateAsync(payload);
        toast.success(`Skill Area "${payload.name}" created successfully.`, 'Skill Area Created');
      } else if (editing) {
        await updateDomain.mutateAsync({ id: editing.id, data: payload });
        toast.success(`Skill Area "${payload.name}" updated successfully.`, 'Skill Area Updated');
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save skill area.'), 'Error');
    }
  };

  const ts = useTableState(filteredDomainsByCategory, (d, q) =>
    d.name.toLowerCase().includes(q) ||
    ((d.category ?? categories?.find(category => category.id === d.category_id))?.name ?? '').toLowerCase().includes(q) ||
    (d.description ?? '').toLowerCase().includes(q),
    (a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="skill-domains" title="Skill Areas" onAdd={openCreate} addLabel="Add Skill Area"
        headers={['Name', 'Category', 'Description', 'Color', 'Skills', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}
        toolbarExtra={(
          <>
            <div className="w-full md:w-56 shrink-0">
              <CategoryFilterSelect
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  ts.setPage(1);
                }}
                categories={categories}
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
        {ts.paged.map((d, idx) => {
          const category = d.category ?? categoryById.get(d.category_id) ?? null;
          return (
          <TR key={d.id} idx={idx} inactive={!d.is_active}>
            <TD>
              <div className="flex items-center gap-2">
                {d.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />}
                <span className={d.is_active ? '' : 'line-through opacity-70'}>{d.name}</span>
              </div>
            </TD>
            <TD>
              {category ? (
                <span className="badge text-xs font-semibold"
                  style={{
                    backgroundColor: category.color ? category.color + '22' : 'rgb(var(--accent-soft))',
                    color: category.color ?? 'rgb(var(--accent-txt))',
                    border: `1px solid ${category.color ?? 'rgb(var(--accent))'}44`,
                  }}>
                  {category.name}
                </span>
              ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
            </TD>
            <TD muted small>{d.description ?? '—'}</TD>
            <TD>
              {d.color ? (
                <span className="badge font-mono text-xs"
                  style={{
                    backgroundColor: d.color + '22',
                    color: d.color,
                    border: `1px solid ${d.color}44`,
                  }}>
                  {d.color}
                </span>
              ) : (
                <span style={{ color: 'rgb(var(--text-3))' }}>—</span>
              )}
            </TD>
            <TD>
              <span className="badge" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
                {d.competency_domains?.length ?? 0}
              </span>
            </TD>
            <TD>
              <StatusBadge active={d.is_active} />
            </TD>
            <ActionBtns onEdit={() => openEdit(d)} onDelete={async () => {
              if (await confirm({ title: 'Delete Skill Area', message: `"${d.name}" and all its skill mappings will be permanently deleted.`, confirmLabel: 'Delete' })) {
                try {
                  await deleteDomain.mutateAsync(d.id);
                  toast.success(`Skill Area "${d.name}" deleted.`, 'Skill Area Deleted');
                } catch (err: unknown) {
                  toast.error(getApiErrorMessage(err, 'Failed to delete skill area.'), 'Delete Error');
                }
              }
            }} />
          </TR>
          );
        })}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Skill Area' : 'Edit Skill Area'}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Category</label>
              <CategoryFilterSelect
                value={form.category_id}
                onChange={v => setForm({ ...form, category_id: v })}
                placeholder="Select category..."
                categories={categories}
              />
            </div>
            {formError && <p className="text-sm" style={{ color: 'rgb(var(--danger))' }}>{formError}</p>}
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className={L}>Color (hex, e.g. #3B82F6)</label>
              <div className="flex items-center gap-2">
                <input className={F} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#3B82F6" />
                {form.color && <span className="w-8 h-8 rounded border flex-shrink-0" style={{ backgroundColor: form.color }} />}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKILL_AREA_COLOR_PRESETS.map(color => {
                  const normalized = normalizeHexColor(color);
                  const selected = normalizeHexColor(form.color) === normalized;
                  const used = usedSkillAreaColors.has(normalized);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-7 h-7 rounded-full border transition-all"
                      title={`${color}${used ? ' already used' : ' available'}`}
                      aria-label={`${color}${used ? ' already used' : ' available'}`}
                      style={{
                        backgroundColor: color,
                        borderColor: selected ? 'rgb(var(--text-1))' : used ? 'rgb(var(--border))' : color,
                        boxShadow: selected ? `0 0 0 2px ${color}55` : 'none',
                        opacity: used && !selected ? 0.45 : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createDomain.isPending || updateDomain.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
