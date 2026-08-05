import React, { useMemo, useState } from 'react';
import { Cpu, Network, Search, Target, Zap } from 'lucide-react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { CategoryFilterSelect, SkillAreaFilterSelect } from '@/components/filters/TaxonomyFilterSelects';
import {
  ConfigCompetency,
  useConfigCompetencies,
  useConfigCompetencyCategories,
  useConfigSkillDomains,
  useCreateCompetency,
  useDeleteCompetency,
  useUpdateCompetency,
} from '@/hooks/useConfig';
import { ActionBtns, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { HEADER_GRADIENTS, useTableState } from '../ConfigTableState';
import { CompetencyThresholdMatrix, DepartmentSkillMapSection } from './DepartmentSkillMapSection';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

const F = 'field';
const L = 'field-label';

type CompetencyPayload = {
  name: string;
  description: string;
  is_critical: boolean;
  category_id: number;
  domain_ids: number[];
  is_active?: boolean;
};

export const CompetenciesSection: React.FC = () => {
  const { data: competencies, isLoading, isError } = useConfigCompetencies();
  const { data: domains } = useConfigSkillDomains();
  const { data: categories } = useConfigCompetencyCategories();
  const createCompetency = useCreateCompetency();
  const updateCompetency = useUpdateCompetency();
  const deleteCompetency = useDeleteCompetency();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigCompetency | null>(null);
  const [form, setForm] = useState({ name: '', description: '', is_critical: false, is_active: true, domain_id: '' });
  const [selectedCompetency, setSelectedCompetency] = useState<ConfigCompetency | null>(null);
  const [techSearch, setTechSearch] = useState('');
  const [managementCategoryId, setManagementCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formError, setFormError] = useState('');
  const [activeSkillModule, setActiveSkillModule] = useState<'management' | 'map' | 'targets'>('management');

  const openCreate = () => {
    setForm({ name: '', description: '', is_critical: false, is_active: true, domain_id: '' });
    setFormError('');
    setEditing(null); setModal('create');
  };
  const openEdit = (c: ConfigCompetency) => {
    const primaryDomain = [...(c.competency_domains ?? [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0]?.domain;
    setForm({
      name: c.name,
      description: c.description,
      is_critical: c.is_critical,
      is_active: c.is_active ?? true,
      domain_id: primaryDomain ? String(primaryDomain.id) : '',
    });
    setFormError('');
    setEditing(c); setModal('edit');
  };

  const handleSave = async () => {
    const selectedDomain = domains?.find((domain) => String(domain.id) === form.domain_id);
    if (!selectedDomain) {
      setFormError('Please select a skill area.');
      return;
    }
    const categoryId = Number(selectedDomain.category_id);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setFormError('Selected skill area is missing a category.');
      return;
    }
    setFormError('');
    const payload: CompetencyPayload = {
      name: form.name,
      description: form.description,
      is_critical: form.is_critical,
      is_active: form.is_active,
      category_id: categoryId,
      domain_ids: [selectedDomain.id],
    };
    try {
      if (modal === 'create') {
        await createCompetency.mutateAsync(payload);
        toast.success(`Skill "${payload.name}" created successfully.`, 'Skill Created');
      } else if (editing) {
        await updateCompetency.mutateAsync({ id: editing.id, data: payload });
        toast.success(`Skill "${payload.name}" updated successfully.`, 'Skill Updated');
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save skill.'), 'Error');
    }
  };

  const managementCompetencies = useMemo(() => {
    const all = competencies ?? [];
    return all.filter((competency) => {
      if (managementCategoryId && String(competency.category_id) !== managementCategoryId) return false;
      if (statusFilter === 'active' && !competency.is_active) return false;
      if (statusFilter === 'inactive' && competency.is_active) return false;
      return true;
    });
  }, [competencies, managementCategoryId, statusFilter]);

  const ts = useTableState(managementCompetencies, (c, q) =>
    c.name.toLowerCase().includes(q) ||
    (c.competency_category?.name ?? '').toLowerCase().includes(q) ||
    (c.competency_domains ?? []).some(d => d.domain.name.toLowerCase().includes(q)),
    (a, b) => a.name.localeCompare(b.name));

  const selectedFormDomain = domains?.find((domain) => String(domain.id) === form.domain_id);
  const selectedFormCategory = selectedFormDomain?.category
    ?? categories?.find((category) => category.id === selectedFormDomain?.category_id);


  const selectedTechs = useMemo(() => {
    if (!selectedCompetency) return [];
    return selectedCompetency.technologies ?? [];
  }, [selectedCompetency]);

  const filteredTechs = techSearch
    ? selectedTechs.filter(t => t.name.toLowerCase().includes(techSearch.toLowerCase()))
    : selectedTechs;

  return (
    <>
      {confirmDialog}
      <div className="card p-1.5 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSkillModule('management')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: activeSkillModule === 'management' ? 'rgb(var(--accent))' : 'transparent',
            color: activeSkillModule === 'management' ? 'white' : 'rgb(var(--text-2))',
          }}
        >
          <Cpu size={14} />
          Skills Management
        </button>
        <button
          type="button"
          onClick={() => setActiveSkillModule('map')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: activeSkillModule === 'map' ? 'rgb(var(--accent))' : 'transparent',
            color: activeSkillModule === 'map' ? 'white' : 'rgb(var(--text-2))',
          }}
        >
          <Network size={14} />
          Department Skill Map
        </button>
        <button
          type="button"
          onClick={() => setActiveSkillModule('targets')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: activeSkillModule === 'targets' ? 'rgb(var(--accent))' : 'transparent',
            color: activeSkillModule === 'targets' ? 'white' : 'rgb(var(--text-2))',
          }}
        >
          <Target size={14} />
          Department Skill Targets
        </button>
      </div>

      {activeSkillModule === 'map' && <DepartmentSkillMapSection />}
      {activeSkillModule === 'targets' && <CompetencyThresholdMatrix />}
      {activeSkillModule === 'management' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
          <TableShell tabKey="competencies" title="Skills" onAdd={openCreate} addLabel="Add Skill"
            headers={['Name', 'Category', 'Skill Area', 'Important', 'Tools', 'Status']}
            loading={isLoading} error={isError}
            q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}
            toolbarExtra={(
              <>
                <div className="w-full md:w-56 shrink-0">
                  <CategoryFilterSelect
                    value={managementCategoryId}
                    onChange={(value) => {
                      setManagementCategoryId(value);
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
            {ts.paged.map((c, idx) => (
              <TR key={c.id} idx={idx} inactive={!c.is_active}>
                <TD>
                  <button
                    onClick={() => { setSelectedCompetency(s => s?.id === c.id ? null : c); setTechSearch(''); }}
                    className="flex items-center gap-2 hover:underline font-semibold"
                    style={{ color: 'rgb(var(--accent))' }}>
                    <Cpu size={14} />
                    <span className={c.is_active ? '' : 'line-through opacity-70'}>{c.name}</span>
                  </button>
                </TD>
                <TD>
                  {c.competency_category ? (
                    <span className="badge text-xs font-semibold"
                      style={{
                        backgroundColor: c.competency_category.color ? c.competency_category.color + '22' : 'rgb(var(--accent-soft))',
                        color: c.competency_category.color ?? 'rgb(var(--accent-txt))',
                        border: `1px solid ${c.competency_category.color ?? 'rgb(var(--accent))'}44`,
                      }}>
                      {c.competency_category.name}
                    </span>
                  ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                </TD>
                <TD muted small>
                  {(c.competency_domains ?? []).map(d => d.domain.name).join(', ') || '—'}
                </TD>
                <TD>
                  {c.is_critical
                    ? <span className="badge badge-danger">Important</span>
                    : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                </TD>
                <TD>
                  <span className="badge" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
                    {c.technologies?.length ?? 0}
                  </span>
                </TD>
                <TD>
                  <StatusBadge active={c.is_active} />
                </TD>
                <ActionBtns onEdit={() => openEdit(c)} onDelete={async () => {
                  if (await confirm({ title: 'Delete Skill', message: `"${c.name}" and all its tool links will be deleted.`, confirmLabel: 'Delete' })) {
                    try {
                      await deleteCompetency.mutateAsync(c.id);
                      toast.success(`Skill "${c.name}" deleted.`, 'Skill Deleted');
                    } catch (err: unknown) {
                      toast.error(getApiErrorMessage(err, 'Failed to delete skill.'), 'Delete Error');
                    }
                  }
                }} />
              </TR>
            ))}
          </TableShell>
            </div>

            {/* Tools detail panel */}
            <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: '540px' }}>
              <PanelHeader
                title={selectedCompetency ? `${selectedCompetency.name}` : 'Select a Skill'}
                subtitle={selectedCompetency ? 'Tools' : undefined}
                background={HEADER_GRADIENTS['competencies']}
                dense
                highContrast
                action={selectedCompetency ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    {selectedTechs.length} tech{selectedTechs.length !== 1 ? 's' : ''}
                  </span>
                ) : undefined}
              />

              {!selectedCompetency ? (
                <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                  <Cpu size={32} className="mb-3 opacity-30" style={{ color: 'rgb(var(--text-3))' }} />
                  <p className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                    Click a skill name to view its technologies
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
                        value={techSearch}
                        onChange={e => setTechSearch(e.target.value)}
                        placeholder="Search technologies…"
                        className="bg-transparent text-sm outline-none flex-1"
                        style={{ color: 'rgb(var(--text-1))' }}
                      />
                      {techSearch && (
                        <button onClick={() => setTechSearch('')}
                          className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>✕</button>
                      )}
                    </div>
                  </div>

                  {/* Tool list */}
                  {filteredTechs.length === 0 ? (
                    <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                      <Zap size={24} className="mb-2 opacity-30" style={{ color: 'rgb(var(--text-3))' }} />
                      <p className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                        {selectedTechs.length === 0 ? 'No technologies mapped yet' : 'No results found'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                      {filteredTechs.map((t, idx) => (
                        <div key={t.id}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                          style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)' }}
                          onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.3)')}
                          onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)')}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: HEADER_GRADIENTS['technologies'] }}>
                            <Zap size={14} color="white" />
                          </div>
                          <p className="text-sm font-medium truncate flex-1" style={{ color: 'rgb(var(--text-1))' }}>{t.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {modal && (
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Skill' : 'Edit Skill'}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Skill Area</label>
              <SkillAreaFilterSelect
                value={form.domain_id}
                onChange={v => { setForm({ ...form, domain_id: v }); setFormError(''); }}
                placeholder="Select skill area…"
                skillAreas={domains}
                categories={categories}
              />
              {formError && <p className="text-xs mt-1" style={{ color: 'rgb(var(--danger))' }}>{formError}</p>}
            </div>
            <div><label className={L}>Category</label>
              <div className="min-h-[42px] flex items-center">
                {selectedFormCategory ? (
                  <span className="badge text-xs font-semibold"
                    style={{
                      backgroundColor: selectedFormCategory.color ? selectedFormCategory.color + '22' : 'rgb(var(--accent-soft))',
                      color: selectedFormCategory.color ?? 'rgb(var(--accent-txt))',
                      border: `1px solid ${selectedFormCategory.color ?? 'rgb(var(--accent))'}44`,
                    }}>
                    {selectedFormCategory.name}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>Select a skill area to derive category</span>
                )}
              </div>
            </div>
            <div><label className={L}>Description</label>
              <textarea className={F} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_critical} onChange={e => setForm({ ...form, is_critical: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Mark as an important skill</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createCompetency.isPending || updateCompetency.isPending} />
          </div>
        </Modal>
          )}
        </>
      )}
    </>
  );
};
