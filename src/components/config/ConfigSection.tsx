import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, X, Search, Building2, Users, Award, Layers, Cpu, Zap, User, Settings, Tag, Network, Weight, Pencil } from 'lucide-react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ActionBtns, TableShell, TD, TR } from './ConfigTable';
import { HEADER_GRADIENTS, useTableState } from './ConfigTableState';
import {
  useConfigDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
  useConfigUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useConfigEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useConfigGrades, useCreateGrade, useUpdateGrade, useDeleteGrade,
  useConfigSkillDomains, useCreateSkillDomain, useUpdateSkillDomain, useDeleteSkillDomain,
  useConfigCompetencies, useCreateCompetency, useUpdateCompetency, useDeleteCompetency,
  useConfigTechnologies, useCreateTechnology, useUpdateTechnology, useDeleteTechnology,
  useConfigCompetencyCategories, useCreateCompetencyCategory, useUpdateCompetencyCategory, useDeleteCompetencyCategory,
  useDepartmentConfig, useUpsertDepartmentConfig, useUpsertDomainWeights,
  useConfigDomainGradeWeights, useUpsertDomainGradeWeight, useDeleteDomainGradeWeight,
  ConfigDepartment, ConfigUser, ConfigEmployee, ConfigGrade, ConfigSkillDomain, ConfigCompetency, ConfigTechnology, ConfigCompetencyCategory, ConfigDomainGradeWeight,
} from '@/hooks/useConfig';
import { useCompetencyScores, useGapMatrix, usePromotionReadiness } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import SkillTaxonomyView from './SkillTaxonomyView';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
} from 'recharts';

const F = 'field';
const L = 'field-label';

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENT CONFIG MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const DepartmentConfigModal: React.FC<{ dept: ConfigDepartment; onClose: () => void }> = ({ dept, onClose }) => {
  const { data, isLoading } = useDepartmentConfig(dept.id);
  const { data: allDomains } = useConfigSkillDomains();
  const upsertConfig = useUpsertDepartmentConfig();
  const upsertWeights = useUpsertDomainWeights();

  const [tab, setTab] = useState<'formula' | 'domains'>('formula');

  // Formula weights state
  const [fw, setFw] = useState({ primary: 0.5, secondary: 0.3, tertiary: 0.2, notes: '' });
  // Domain weights state: domain_id -> { weight, is_active }
  const [dw, setDw] = useState<Record<number, { weight: number; is_active: boolean }>>({});

  // Populate state from loaded data
  useEffect(() => {
    if (data?.config) {
      setFw({
        primary: data.config.primary_weight,
        secondary: data.config.secondary_weight,
        tertiary: data.config.tertiary_weight,
        notes: data.config.notes ?? '',
      });
    }
    if (allDomains) {
      const map: Record<number, { weight: number; is_active: boolean }> = {};
      for (const d of allDomains) {
        const existing = data?.domain_weights?.find(w => w.domain_id === d.id);
        map[d.id] = existing
          ? { weight: existing.weight, is_active: existing.is_active }
          : { weight: 0, is_active: true };
      }
      setDw(map);
    }
  }, [data, allDomains]);

  const fwTotal = Math.round((fw.primary + fw.secondary + fw.tertiary) * 100) / 100;
  const fwValid = Math.abs(fwTotal - 1.0) < 0.001;

  const handleSaveFormula = async () => {
    if (!fwValid) return;
    await upsertConfig.mutateAsync({
      id: dept.id,
      data: { primary_weight: fw.primary, secondary_weight: fw.secondary, tertiary_weight: fw.tertiary, notes: fw.notes || undefined },
    });
  };

  const handleSaveDomains = async () => {
    const weights = Object.entries(dw).map(([domainId, val]) => ({
      domain_id: Number(domainId),
      weight: val.weight,
      is_active: val.is_active,
    }));
    await upsertWeights.mutateAsync({ id: dept.id, weights });
  };

  const domainTotal = Math.round(Object.values(dw).filter(d => d.is_active).reduce((s, d) => s + d.weight, 0) * 100) / 100;

  return (
    <Modal onClose={onClose} wide>
      {/* Custom header */}
      <div className="-mx-6 -mt-6 px-6 py-5 mb-6 rounded-t-2xl"
        style={{ background: HEADER_GRADIENTS['departments'] }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base">{dept.name} — Scoring Setup</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Department-specific skill importance and skill area weights
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mt-4">
          {(['formula', 'domains'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === t ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                color: tab === t ? '#6366f1' : 'white',
              }}>
              {t === 'formula' ? 'Skill Importance' : 'Skill Area Weights'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-8" style={{ color: 'rgb(var(--text-3))' }}>Loading…</p>
      ) : tab === 'formula' ? (
        /* ── Skill importance weights ─────────────────────── */
        <div className="space-y-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
              How skill types count for this department
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
              Primary skills are the main skills, Secondary skills support the work, and Tertiary skills are related extras.
              Weights must sum to <strong>1.00</strong>.
            </p>
          </div>

          {/* Primary */}
          {(['primary', 'secondary', 'tertiary'] as const).map((key, i) => {
            const colors = ['#6366f1', '#10b981', '#f59e0b'];
            const labels = ['Primary', 'Secondary', 'Tertiary'];
            const val = fw[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[i] }} />
                    {labels[i]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="1" step="0.01"
                      value={val}
                      onChange={e => setFw({ ...fw, [key]: parseFloat(e.target.value) || 0 })}
                      className="field w-20 text-center py-1 text-sm"
                    />
                    <span className="text-xs font-mono" style={{ color: 'rgb(var(--text-3))' }}>
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${val * 100}%`, backgroundColor: colors[i] }} />
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              backgroundColor: fwValid ? 'rgb(var(--success-soft, var(--accent-soft)))' : 'rgb(var(--danger-soft))',
              border: `1px solid ${fwValid ? 'rgb(var(--success, var(--accent)))' : 'rgb(var(--danger))'}`,
            }}>
            <span className="text-sm font-semibold" style={{ color: fwValid ? 'rgb(var(--success, var(--accent)))' : 'rgb(var(--danger))' }}>
              Total
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: fwValid ? 'rgb(var(--success, var(--accent)))' : 'rgb(var(--danger))' }}>
              {fwTotal.toFixed(2)} {fwValid ? '✓' : '≠ 1.00'}
            </span>
          </div>

          <div>
            <label className={L}>Notes (optional)</label>
            <input className={F} value={fw.notes} onChange={e => setFw({ ...fw, notes: e.target.value })}
              placeholder="e.g. DevOps team weights infrastructure skills higher" />
          </div>

          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
            <button onClick={handleSaveFormula} disabled={!fwValid || upsertConfig.isPending}
              className="btn-primary flex-1 py-2">
              {upsertConfig.isPending ? 'Saving…' : upsertConfig.isSuccess ? '✓ Saved' : 'Save Skill Importance'}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 py-2">Close</button>
          </div>
        </div>
      ) : (
        /* ── Skill area weights ───────────────────────────── */
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs mb-1 font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
              Active skill areas and their importance for {dept.name}
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
              Turn skill areas on or off and adjust how much they count. Turned-off areas are excluded from scoring.
              Active weights total: <strong>{domainTotal.toFixed(2)}</strong>
            </p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {(allDomains ?? []).map((domain, i) => {
              const entry = dw[domain.id] ?? { weight: 0, is_active: true };
              const color = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316'][i % 7];
              return (
                <div key={domain.id} className="rounded-xl p-3 transition-all"
                  style={{
                    border: `1px solid ${entry.is_active ? color + '40' : 'rgb(var(--border))'}`,
                    backgroundColor: entry.is_active ? color + '08' : 'rgb(var(--surface-2))',
                  }}>
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button onClick={() => setDw({ ...dw, [domain.id]: { ...entry, is_active: !entry.is_active } })}
                      className="shrink-0 transition-colors">
                      {entry.is_active ? (
                        <div className="w-10 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: color }}>
                          <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                        </div>
                      ) : (
                        <div className="w-10 h-5 rounded-full flex items-center px-0.5" style={{ backgroundColor: 'rgb(var(--border))' }}>
                          <div className="w-4 h-4 rounded-full bg-white" />
                        </div>
                      )}
                    </button>

                    {/* Domain name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate"
                        style={{ color: entry.is_active ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))' }}>
                        {domain.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>
                        Counts in scoring
                      </p>
                    </div>

                    {/* Weight input */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number" min="0" max="1" step="0.01"
                        value={entry.weight}
                        disabled={!entry.is_active}
                        onChange={e => setDw({ ...dw, [domain.id]: { ...entry, weight: parseFloat(e.target.value) || 0 } })}
                        className="field w-18 text-center py-1 text-sm"
                        style={{ width: '72px', opacity: entry.is_active ? 1 : 0.4 }}
                      />
                      <span className="text-xs font-mono w-8 text-right" style={{ color: 'rgb(var(--text-3))' }}>
                        {(entry.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  {entry.is_active && (
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--border))' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(entry.weight * 100 / 0.3 * 100, 100)}%`, backgroundColor: color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
            <button onClick={handleSaveDomains} disabled={upsertWeights.isPending}
              className="btn-primary flex-1 py-2">
              {upsertWeights.isPending ? 'Saving…' : upsertWeights.isSuccess ? '✓ Saved' : 'Save Skill Area Weights'}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 py-2">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const DepartmentsSection: React.FC = () => {
  const { data: departments, isLoading, isError } = useConfigDepartments();
  const { data: employees } = useConfigEmployees();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigDepartment | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedDept, setSelectedDept] = useState<ConfigDepartment | null>(null);
  const [configuringDept, setConfiguringDept] = useState<ConfigDepartment | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const openCreate = () => { setForm({ name: '', description: '' }); setEditing(null); setModal('create'); };
  const openEdit = (d: ConfigDepartment) => { setForm({ name: d.name, description: d.description ?? '' }); setEditing(d); setModal('edit'); };

  const handleSave = async () => {
    const payload = { name: form.name, description: form.description || undefined };
    if (modal === 'create') await createDept.mutateAsync(payload);
    else if (editing) await updateDept.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(departments, (d, q) =>
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
            headers={['Name', 'Description', 'Employees']}
            loading={isLoading} error={isError}
            q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
            {ts.paged.map((d, idx) => (
              <TR key={d.id} idx={idx}>
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
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => setConfiguringDept(d)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      <Settings size={11} /> Configure
                    </button>
                    <button onClick={() => openEdit(d)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
                    <button onClick={async () => { if (await confirm({ title: 'Delete Department', message: `"${d.name}" will be permanently deleted.`, confirmLabel: 'Delete' })) deleteDept.mutate(d.id); }}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium transition-colors"
                      style={{ color: 'rgb(var(--danger))' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--danger-soft))')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      Delete
                    </button>
                  </div>
                </td>
              </TR>
            ))}
          </TableShell>
        </div>

        {/* Department detail panel */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: '540px' }}>
          {/* Header */}
          <div className="px-4 py-3 shrink-0" style={{ background: HEADER_GRADIENTS['departments'] }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {selectedDept ? `${selectedDept.name} Members` : 'Select a Department'}
              </h3>
              {selectedDept && deptEmployees.length > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {deptEmployees.length}
                </span>
              )}
            </div>
          </div>

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
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createDept.isPending || updateDept.isPending} />
          </div>
        </Modal>
      )}

      {configuringDept && (
        <DepartmentConfigModal dept={configuringDept} onClose={() => setConfiguringDept(null)} />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
const UsersSection: React.FC = () => {
  const { data: users, isLoading, isError } = useConfigUsers();
  const { data: employees } = useConfigEmployees();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'ENGINEER', employee_id: '' });

  const openCreate = () => { setForm({ username: '', password: '', role: 'ENGINEER', employee_id: '' }); setEditing(null); setModal('create'); };
  const openEdit = (u: ConfigUser) => { setForm({ username: u.username, password: '', role: u.role, employee_id: String(u.employee_id) }); setEditing(u); setModal('edit'); };

  const handleSave = async () => {
    if (modal === 'create') {
      await createUser.mutateAsync({ username: form.username, password: form.password, role: form.role as any, employee_id: Number(form.employee_id) });
    } else if (editing) {
      const data: any = { username: form.username, role: form.role };
      if (form.password) data.password = form.password;
      await updateUser.mutateAsync({ id: editing.id, data });
    }
    setModal(null);
  };

  const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'badge badge-accent', MANAGER: 'badge', ENGINEER: 'badge badge-success',
  };

  const ts = useTableState(users, (u, q) =>
    u.username.toLowerCase().includes(q) ||
    u.role.toLowerCase().includes(q) ||
    (u.employee?.full_name ?? '').toLowerCase().includes(q),
    (a, b) => (a.employee?.full_name ?? a.username).localeCompare(b.employee?.full_name ?? b.username));

  const empOptions = (employees ?? []).map(e => ({ value: String(e.id), label: e.full_name, sub: e.emp_code }));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="users" title="Users" onAdd={openCreate} addLabel="Add User"
        headers={['Username', 'Role', 'Employee', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((u, idx) => (
          <TR key={u.id} idx={idx}>
            <TD><span className="font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{u.username}</span></TD>
            <TD><span className={ROLE_BADGE[u.role] ?? 'badge'}>{u.role}</span></TD>
            <TD muted>{u.employee?.full_name ?? `#${u.employee_id}`}</TD>
            <TD>
              <span className={u.is_active ? 'badge badge-success' : 'badge'}>{u.is_active ? 'Active' : 'Inactive'}</span>
            </TD>
            <ActionBtns onEdit={() => openEdit(u)} onDelete={async () => { if (await confirm({ title: 'Deactivate User', message: `"${u.username}" will be deactivated and lose access.`, confirmLabel: 'Deactivate', variant: 'warning' })) deleteUser.mutate(u.id); }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className={L}>Username</label><input className={F} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div>
              <label className={L}>Password {modal === 'edit' && <span style={{ color: 'rgb(var(--text-3))' }} className="font-normal normal-case">(leave blank to keep)</span>}</label>
              <input type="password" className={F} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div><label className={L}>Role</label>
              <SearchableSelect value={form.role} onChange={v => setForm({ ...form, role: v })}
                placeholder="Select role…"
                options={[{ value: 'ADMIN', label: 'ADMIN' }, { value: 'MANAGER', label: 'MANAGER' }, { value: 'ENGINEER', label: 'ENGINEER' }]} />
            </div>
            <div><label className={L}>Employee</label>
              <SearchableSelect value={form.employee_id} onChange={v => setForm({ ...form, employee_id: v })}
                placeholder="Select employee…" options={empOptions} />
            </div>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createUser.isPending || updateUser.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES  — with single-employee profile view
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeProfile: React.FC<{ employee: ConfigEmployee; onClose: () => void }> = ({ employee, onClose }) => {
  const { data: compData } = useCompetencyScores();
  const { data: promoData } = usePromotionReadiness();
  const { data: gapData } = useGapMatrix();
  const c = useChartColors();

  const empComp = compData?.find(r => r.employee_id === employee.id);
  const empPromo = promoData?.find(r => r.employee_id === employee.id);
  const empGap = gapData?.employees.find(r => r.employee_id === employee.id);
  const avgThreshold = empPromo && empPromo.avg_threshold > 0
    ? Math.round(empPromo.avg_threshold * 100)
    : 0;

  const domains = empComp ? Object.keys(empComp.domain_scores) : [];
  const radarData = domains.map(d => {
    const score = Math.round((empComp?.domain_scores[d] ?? 0) * 100);
    const threshold = empGap?.domain_gaps[d]?.threshold
      ? Math.round(empGap.domain_gaps[d].threshold * 100)
      : avgThreshold;
    return {
      domain: d.length > 12 ? d.slice(0, 12) + '…' : d,
      fullDomain: d,
      score,
      threshold,
      meets: threshold > 0 && score >= threshold,
    };
  });

  const barData = [...radarData].sort((a, b) => b.score - a.score);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: HEADER_GRADIENTS['employees'] }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
            {employee.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{employee.full_name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {employee.emp_code} · {employee.current_grade?.code} → {employee.target_grade?.code}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
          <X size={15} />
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Promotion status */}
        <div className="col-span-full grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs mb-1" style={{ color: 'rgb(var(--text-3))' }}>Overall Score</p>
            <p className="text-xl font-bold" style={{ color: 'rgb(var(--accent))' }}>
              {Math.round((empPromo?.overall_score ?? 0) * 100)}%
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs mb-1" style={{ color: 'rgb(var(--text-3))' }}>Avg Stars</p>
            <p className="text-xl font-bold" style={{ color: 'rgb(var(--warning))' }}>
              ★ {(empPromo?.star_rating ?? 0).toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs mb-1" style={{ color: 'rgb(var(--text-3))' }}>Promo Status</p>
            <span className={empPromo?.promotion_ready ? 'badge badge-success' : 'badge'}>
              {empPromo?.promotion_ready ? 'Ready' : 'Not Ready'}
            </span>
          </div>
        </div>

        {/* Radar */}
        {radarData.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>Skill Area Radar</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="domain" tick={{ fill: c.text, fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2} />
                {radarData.some((d) => d.threshold > 0) && (
                  <Radar name="Required" dataKey="threshold" stroke={c.warning} fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
                )}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle(c)}>
                        <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{d.fullDomain ?? d.domain}</p>
                        <p style={{ color: c.text }}>Score: <b>{d.score}%</b></p>
                        {d.threshold > 0 && (
                          <p style={{ color: d.meets ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>
                            Required: {d.threshold}% ({d.meets ? 'Meets' : 'Below'})
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                {radarData.some((d) => d.threshold > 0) && (
                  <Legend formatter={(v) => <span style={{ color: 'rgb(var(--text-2))', fontSize: 11 }}>{v}</span>} />
                )}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar */}
        {barData.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>Skill Area Scores</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 8 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: c.text, fontSize: 10 }} />
                <YAxis type="category" dataKey="domain" width={80} tick={{ fill: c.text, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle(c)} formatter={(v: number) => [`${v}%`, 'Score']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={c.domains[i % c.domains.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {radarData.length === 0 && (
          <div className="col-span-full py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>
            <p className="text-sm">No assessment data available for this employee.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeesSection: React.FC = () => {
  const { data: employees, isLoading, isError } = useConfigEmployees();
  const { data: grades } = useConfigGrades();
  const { data: departments } = useConfigDepartments();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigEmployee | null>(null);
  const [form, setForm] = useState({
    emp_code: '', full_name: '', department: '', email: '',
    current_grade_id: '', target_grade_id: '', manager_id: '', department_id: '',
  });
  const [viewMode, setViewMode] = useState<'team' | 'single'>('team');
  const [selectedEmp, setSelectedEmp] = useState<ConfigEmployee | null>(null);

  const openCreate = () => {
    setForm({ emp_code: '', full_name: '', department: '', email: '', current_grade_id: '', target_grade_id: '', manager_id: '', department_id: '' });
    setEditing(null); setModal('create');
  };
  const openEdit = (e: ConfigEmployee) => {
    setForm({
      emp_code: e.emp_code, full_name: e.full_name, department: e.department,
      email: e.email ?? '', current_grade_id: String(e.current_grade_id),
      target_grade_id: String(e.target_grade_id),
      manager_id: e.manager_id ? String(e.manager_id) : '',
      department_id: e.department_id ? String(e.department_id) : '',
    });
    setEditing(e); setModal('edit');
  };

  const handleSave = async () => {
    const deptName = form.department_id
      ? (departments?.find(d => String(d.id) === form.department_id)?.name ?? form.department)
      : form.department;
    const payload: any = {
      emp_code: form.emp_code, full_name: form.full_name,
      department: deptName || form.department,
      email: form.email || null,
      current_grade_id: Number(form.current_grade_id),
      target_grade_id: Number(form.target_grade_id),
      manager_id: form.manager_id ? Number(form.manager_id) : null,
      department_id: form.department_id ? Number(form.department_id) : null,
    };
    if (modal === 'create') await createEmployee.mutateAsync(payload);
    else if (editing) await updateEmployee.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(employees, (e, q) =>
    e.full_name.toLowerCase().includes(q) ||
    e.emp_code.toLowerCase().includes(q) ||
    e.department.toLowerCase().includes(q) ||
    (e.current_grade?.code ?? '').toLowerCase().includes(q),
    (a, b) => a.full_name.localeCompare(b.full_name));

  const gradeOptions = (grades ?? []).map(g => ({ value: String(g.id), label: `${g.code} – ${g.title}` }));
  const empOptions = (employees ?? []).map(e => ({ value: String(e.id), label: e.full_name, sub: e.emp_code }));
  const deptOptions = (departments ?? []).map(d => ({ value: String(d.id), label: d.name }));

  return (
    <>
      {confirmDialog}
      {/* View mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
          {(['team', 'single'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: viewMode === mode ? 'rgb(var(--accent))' : 'transparent',
                color: viewMode === mode ? 'white' : 'rgb(var(--text-2))',
              }}>
              {mode === 'team' ? '👥 Team View' : '👤 Single Employee'}
            </button>
          ))}
        </div>
        {viewMode === 'single' && (
          <div style={{ minWidth: '260px' }}>
            <SearchableSelect
              value={selectedEmp ? String(selectedEmp.id) : ''}
              onChange={v => setSelectedEmp(employees?.find(e => String(e.id) === v) ?? null)}
              placeholder="Select employee to inspect…"
              options={empOptions}
            />
          </div>
        )}
      </div>

      {viewMode === 'single' && selectedEmp ? (
        <EmployeeProfile employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      ) : (
        <TableShell tabKey="employees" title="Employees" onAdd={openCreate} addLabel="Add Employee"
          headers={['Code', 'Name', 'Department', 'Current', 'Target', 'Manager']}
          loading={isLoading} error={isError}
          q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
          {ts.paged.map((e, idx) => (
            <TR key={e.id} idx={idx}>
              <TD mono><span style={{ color: 'rgb(var(--accent))' }} className="font-bold">{e.emp_code}</span></TD>
              <TD>
                <button onClick={() => { setSelectedEmp(e); setViewMode('single'); }}
                  className="hover:underline font-medium text-left"
                  style={{ color: 'rgb(var(--text-1))' }}>
                  {e.full_name}
                </button>
              </TD>
              <TD muted>{e.dept?.name ?? e.department}</TD>
              <TD><span className="badge badge-accent">{e.current_grade?.code ?? e.current_grade_id}</span></TD>
              <TD><span className="badge">{e.target_grade?.code ?? e.target_grade_id}</span></TD>
              <TD muted small>{e.manager?.full_name ?? '—'}</TD>
              <ActionBtns onEdit={() => openEdit(e)} onDelete={async () => { if (await confirm({ title: 'Archive Employee', message: `"${e.full_name}" will be archived and hidden from active rosters.`, confirmLabel: 'Archive', variant: 'warning' })) deleteEmployee.mutate(e.id); }} />
            </TR>
          ))}
        </TableShell>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Employee Code</label><input className={F} value={form.emp_code} onChange={e => setForm({ ...form, emp_code: e.target.value })} /></div>
              <div><label className={L}>Full Name</label><input className={F} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Department</label>
                <SearchableSelect value={form.department_id} onChange={v => {
                  const dept = departments?.find(d => String(d.id) === v);
                  setForm({ ...form, department_id: v, department: dept?.name ?? form.department });
                }} placeholder="Select department…" options={deptOptions} />
              </div>
              <div><label className={L}>Email</label><input type="email" className={F} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Current Grade</label>
                <SearchableSelect value={form.current_grade_id} onChange={v => setForm({ ...form, current_grade_id: v })}
                  placeholder="Select grade…" options={gradeOptions} />
              </div>
              <div><label className={L}>Target Grade</label>
                <SearchableSelect value={form.target_grade_id} onChange={v => setForm({ ...form, target_grade_id: v })}
                  placeholder="Select grade…" options={gradeOptions} />
              </div>
            </div>
            <div><label className={L}>Manager (optional)</label>
              <SearchableSelect value={form.manager_id} onChange={v => setForm({ ...form, manager_id: v })}
                placeholder="None" options={empOptions} />
            </div>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createEmployee.isPending || updateEmployee.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRADES
// ═══════════════════════════════════════════════════════════════════════════════
const GradesSection: React.FC = () => {
  const { data: grades, isLoading, isError } = useConfigGrades();
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigGrade | null>(null);
  const [form, setForm] = useState({ code: '', title: '', level: '', experience_years: '', performance_note: '' });

  const openCreate = () => { setForm({ code: '', title: '', level: '', experience_years: '', performance_note: '' }); setEditing(null); setModal('create'); };
  const openEdit = (g: ConfigGrade) => { setForm({ code: g.code, title: g.title, level: String(g.level), experience_years: String(g.experience_years), performance_note: g.performance_note ?? '' }); setEditing(g); setModal('edit'); };

  const handleSave = async () => {
    const payload: any = { code: form.code, title: form.title, level: Number(form.level), experience_years: Number(form.experience_years), performance_note: form.performance_note || undefined };
    if (modal === 'create') await createGrade.mutateAsync(payload);
    else if (editing) await updateGrade.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(grades, (g, q) =>
    g.code.toLowerCase().includes(q) || g.title.toLowerCase().includes(q),
    (a, b) => a.code.localeCompare(b.code));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="grades" title="Grades" onAdd={openCreate} addLabel="Add Grade"
        headers={['Code', 'Title', 'Level', 'Exp. Years', 'Note']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((g, idx) => (
          <TR key={g.id} idx={idx}>
            <TD><span className="badge badge-accent font-bold">{g.code}</span></TD>
            <TD>{g.title}</TD>
            <TD>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold inline-flex"
                style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
                {g.level}
              </span>
            </TD>
            <TD muted>{g.experience_years} yrs</TD>
            <TD muted small>{g.performance_note ?? '—'}</TD>
            <ActionBtns onEdit={() => openEdit(g)} onDelete={async () => { if (await confirm({ title: 'Delete Grade', message: `Grade "${g.code} – ${g.title}" will be permanently deleted.`, confirmLabel: 'Delete' })) deleteGrade.mutate(g.id); }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Code</label><input className={F} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div><label className={L}>Title</label><input className={F} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Level</label><input type="number" className={F} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} /></div>
              <div><label className={L}>Experience Years</label><input type="number" className={F} value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></div>
            </div>
            <div><label className={L}>Performance Note</label><input className={F} value={form.performance_note} onChange={e => setForm({ ...form, performance_note: e.target.value })} /></div>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createGrade.isPending || updateGrade.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL DOMAINS
// ═══════════════════════════════════════════════════════════════════════════════
const SkillDomainsSection: React.FC = () => {
  const { data: domains, isLoading, isError } = useConfigSkillDomains();
  const createDomain = useCreateSkillDomain();
  const updateDomain = useUpdateSkillDomain();
  const deleteDomain = useDeleteSkillDomain();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigSkillDomain | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '' });

  const openCreate = () => { setForm({ name: '', description: '', color: '' }); setEditing(null); setModal('create'); };
  const openEdit = (d: ConfigSkillDomain) => {
    setForm({ name: d.name, description: d.description ?? '', color: d.color ?? '' });
    setEditing(d); setModal('edit');
  };

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      color: form.color || undefined,
    };
    if (modal === 'create') await createDomain.mutateAsync(payload);
    else if (editing) await updateDomain.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(domains, (d, q) =>
    d.name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
    (a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="skill-domains" title="Skill Areas" onAdd={openCreate} addLabel="Add Skill Area"
        headers={['Name', 'Description', 'Color', 'Skills']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((d, idx) => (
          <TR key={d.id} idx={idx}>
            <TD>
              <div className="flex items-center gap-2">
                {d.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />}
                {d.name}
              </div>
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
            <ActionBtns onEdit={() => openEdit(d)} onDelete={async () => { if (await confirm({ title: 'Delete Skill Area', message: `"${d.name}" and all its skill mappings will be permanently deleted.`, confirmLabel: 'Delete' })) deleteDomain.mutate(d.id); }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className={L}>Color (hex, e.g. #3B82F6)</label>
              <div className="flex items-center gap-2">
                <input className={F} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#3B82F6" />
                {form.color && <span className="w-8 h-8 rounded border flex-shrink-0" style={{ backgroundColor: form.color }} />}
              </div>
            </div>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createDomain.isPending || updateDomain.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETENCIES
// ═══════════════════════════════════════════════════════════════════════════════
const CompetenciesSection: React.FC = () => {
  const { data: competencies, isLoading, isError } = useConfigCompetencies();
  const { data: domains } = useConfigSkillDomains();
  const { data: categories } = useConfigCompetencyCategories();
  const createCompetency = useCreateCompetency();
  const updateCompetency = useUpdateCompetency();
  const deleteCompetency = useDeleteCompetency();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigCompetency | null>(null);
  const [form, setForm] = useState({ name: '', description: '', is_critical: false, category_id: '', domain_ids: [] as string[] });
  const [selectedCompetency, setSelectedCompetency] = useState<ConfigCompetency | null>(null);
  const [techSearch, setTechSearch] = useState('');

  const openCreate = () => {
    setForm({ name: '', description: '', is_critical: false, category_id: '', domain_ids: [] });
    setEditing(null); setModal('create');
  };
  const openEdit = (c: ConfigCompetency) => {
    setForm({
      name: c.name,
      description: c.description,
      is_critical: c.is_critical,
      category_id: String(c.category_id),
      domain_ids: (c.competency_domains ?? []).map(d => String(d.domain.id)),
    });
    setEditing(c); setModal('edit');
  };

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      description: form.description,
      is_critical: form.is_critical,
      category_id: Number(form.category_id),
      domain_ids: form.domain_ids.map(Number),
    };
    if (modal === 'create') await createCompetency.mutateAsync(payload);
    else if (editing) await updateCompetency.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(competencies, (c, q) =>
    c.name.toLowerCase().includes(q) ||
    (c.competency_category?.name ?? '').toLowerCase().includes(q) ||
    (c.competency_domains ?? []).some(d => d.domain.name.toLowerCase().includes(q)),
    (a, b) => a.name.localeCompare(b.name));

  const domainOptions = (domains ?? []).map(d => ({ value: String(d.id), label: d.name }));
  const categoryOptions = (categories ?? []).map(cat => ({ value: String(cat.id), label: cat.name }));


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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
      <TableShell tabKey="competencies" title="Skills" onAdd={openCreate} addLabel="Add Skill"
        headers={['Name', 'Category', 'Skill Area', 'Important', 'Technologies']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((c, idx) => (
          <TR key={c.id} idx={idx}>
            <TD>
              <button
                onClick={() => { setSelectedCompetency(s => s?.id === c.id ? null : c); setTechSearch(''); }}
                className="flex items-center gap-2 hover:underline font-semibold"
                style={{ color: 'rgb(var(--accent))' }}>
                <Cpu size={14} />
                {c.name}
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
            <ActionBtns onEdit={() => openEdit(c)} onDelete={async () => { if (await confirm({ title: 'Delete Skill', message: `"${c.name}" and all its technology mappings will be permanently deleted.`, confirmLabel: 'Delete' })) deleteCompetency.mutate(c.id); }} />
          </TR>
        ))}
      </TableShell>
        </div>

        {/* Technologies detail panel */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: '540px' }}>
          {/* Header */}
          <div className="px-4 py-3 shrink-0" style={{ background: HEADER_GRADIENTS['competencies'] }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {selectedCompetency ? `${selectedCompetency.name}` : 'Select a Skill'}
              </h3>
              {selectedCompetency && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {selectedTechs.length} tech{selectedTechs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {selectedCompetency && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Technologies</p>
            )}
          </div>

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

              {/* Technology list */}
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
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={L}>Category (skill type)</label>
              <SearchableSelect value={form.category_id} onChange={v => setForm({ ...form, category_id: v })}
                placeholder="Select category…" options={categoryOptions} />
            </div>
            <div><label className={L}>Description</label>
              <textarea className={F} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className={L}>Skill Areas (select one or more)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {domainOptions.map(opt => {
                  const selected = form.domain_ids.includes(opt.value);
                  const domain = domains?.find(d => String(d.id) === opt.value);
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setForm({
                        ...form,
                        domain_ids: selected
                          ? form.domain_ids.filter(id => id !== opt.value)
                          : [...form.domain_ids, opt.value],
                      })}
                      className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                      style={selected ? {
                        backgroundColor: domain?.color ? domain.color + '33' : 'rgb(var(--accent-soft))',
                        color: domain?.color ?? 'rgb(var(--accent-txt))',
                        border: `1px solid ${domain?.color ?? 'rgb(var(--accent))'}`,
                      } : {
                        backgroundColor: 'rgb(var(--surface-2))',
                        color: 'rgb(var(--text-3))',
                        border: '1px solid rgb(var(--border))',
                      }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {form.domain_ids.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                  Main skill area: {domainOptions.find(o => o.value === form.domain_ids[0])?.label}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_critical} onChange={e => setForm({ ...form, is_critical: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Mark as an important skill</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createCompetency.isPending || updateCompetency.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNOLOGIES
// ═══════════════════════════════════════════════════════════════════════════════
const TechnologiesSection: React.FC = () => {
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
      <TableShell tabKey="technologies" title="Technologies" onAdd={openCreate} addLabel="Add Technology"
        headers={['Name', 'Skill', 'Skill Area']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((t, idx) => (
          <TR key={t.id} idx={idx}>
            <TD>{t.name}</TD>
            <TD muted>{t.competency?.name ?? `#${t.competency_id}`}</TD>
            <TD muted small>{t.competency?.competency_domains?.find(d => d.is_primary)?.domain.name ?? '—'}</TD>
            <ActionBtns onEdit={() => openEdit(t)} onDelete={async () => { if (await confirm({ title: 'Delete Technology', message: `"${t.name}" will be permanently deleted.`, confirmLabel: 'Delete' })) deleteTechnology.mutate(t.id); }} />
          </TR>
        ))}
      </TableShell>

      {modal && (
        <Modal onClose={() => setModal(null)}>
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

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETENCY CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
const CategoriesSection: React.FC = () => {
  const { data: categories, isLoading, isError } = useConfigCompetencyCategories();
  const createCategory = useCreateCompetencyCategory();
  const updateCategory = useUpdateCompetencyCategory();
  const deleteCategory = useDeleteCompetencyCategory();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigCompetencyCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });

  const openCreate = () => { setForm({ name: '', description: '', color: '#6366f1' }); setEditing(null); setModal('create'); };
  const openEdit = (c: ConfigCompetencyCategory) => {
    setForm({ name: c.name, description: c.description ?? '', color: c.color ?? '#6366f1' });
    setEditing(c); setModal('edit');
  };

  const handleSave = async () => {
    const payload: any = { name: form.name, description: form.description || undefined, color: form.color || undefined };
    if (modal === 'create') await createCategory.mutateAsync(payload);
    else if (editing) await updateCategory.mutateAsync({ id: editing.id, data: payload });
    setModal(null);
  };

  const ts = useTableState(categories, (c, q) =>
    c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q),
    (a, b) => a.name.localeCompare(b.name));

  // Preset colors for quick pick
  const COLOR_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#3b82f6'];

  return (
    <>
      {confirmDialog}
      <TableShell tabKey="categories" title="Skill Categories" onAdd={openCreate} addLabel="Add Category"
        headers={['Name', 'Color', 'Description', 'Skills']}
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
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className={L}>Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cloud, DevSecOps…" /></div>
            <div><label className={L}>Description (optional)</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this category covers…" /></div>

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

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN GRADE WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════════
const DomainGradeWeightsSection: React.FC = () => {
  const { data: weights, isLoading, isError } = useConfigDomainGradeWeights();
  const { data: domains } = useConfigSkillDomains();
  const { data: grades }  = useConfigGrades();
  const upsert = useUpsertDomainGradeWeight();
  const remove = useDeleteDomainGradeWeight();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  // Top form state (add new entry)
  const [form, setForm] = useState({ domain_id: '', grade_id: '', weight: '' });
  const [saving, setSaving] = useState(false);
  const [domainSearch, setDomainSearch] = useState('');

  // Inline edit state: id of the row being edited + its draft value
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editValue, setEditValue]   = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async () => {
    if (!form.domain_id || !form.grade_id || !form.weight) return;
    setSaving(true);
    try {
      await upsert.mutateAsync({
        domain_id: Number(form.domain_id),
        grade_id:  Number(form.grade_id),
        weight:    parseFloat(form.weight) / 100,
      });
      setForm({ domain_id: '', grade_id: '', weight: '' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (w: ConfigDomainGradeWeight) => {
    setEditingId(w.id);
    setEditValue(String(Math.round(w.weight * 100)));
  };

  const stopEdit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEditingId(null);
    setEditValue('');
    setAutoSaving(false);
  };

  const handleEditChange = (w: ConfigDomainGradeWeight, raw: string) => {
    const parsed = parseFloat(raw);
    const clamped = isNaN(parsed) ? '' : String(Math.min(100, Math.max(0, parsed)));
    setEditValue(clamped);
    if (!clamped) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutoSaving(true);
    debounceRef.current = setTimeout(async () => {
      await upsert.mutateAsync({ domain_id: w.domain_id, grade_id: w.grade_id, weight: parseFloat(clamped) / 100 });
      setAutoSaving(false);
    }, 700);
  };

  // Search + grade filter
  const [search,      setSearch]      = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  // Group weights by domain, then apply search + grade filter
  const grouped = useMemo(() => {
    if (!weights) return [];
    const map = new Map<number, { domain: ConfigDomainGradeWeight['domain']; rows: ConfigDomainGradeWeight[] }>();
    for (const w of weights) {
      if (!map.has(w.domain_id)) map.set(w.domain_id, { domain: w.domain, rows: [] });
      map.get(w.domain_id)!.rows.push(w);
    }
    return [...map.values()]
      .sort((a, b) => a.domain.name.localeCompare(b.domain.name))
      .filter(({ domain }) => domain.name.toLowerCase().includes(search.toLowerCase().trim()))
      .map(({ domain, rows }) => ({
        domain,
        rows: gradeFilter === 'All' ? rows : rows.filter(r => r.grade.code === gradeFilter),
      }))
      .filter(({ rows }) => rows.length > 0);
  }, [weights, search, gradeFilter]);

  const matrixGrades = (grades ?? []).filter(g => ['G13','G14','G15','G16','G17','G18','G19','G20','G21'].includes(g.code));

  const sortedDomains = useMemo(() =>
    [...(domains ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [domains]);

  const filteredDomains = useMemo(() => {
    const q = domainSearch.toLowerCase().trim();
    return q ? sortedDomains.filter(d => d.name.toLowerCase().includes(q)) : sortedDomains;
  }, [sortedDomains, domainSearch]);

  // Existing weights for the selected domain — used to pre-fill weight when re-selecting a grade
  const existingWeightForGrade = useMemo(() => {
    if (!form.domain_id || !weights) return new Map<number, number>();
    const map = new Map<number, number>();
    weights
      .filter(w => w.domain_id === Number(form.domain_id))
      .forEach(w => map.set(w.grade_id, Math.round(w.weight * 100)));
    return map;
  }, [form.domain_id, weights]);

  return (
    <>
      {confirmDialog}
      <div className="space-y-5">
        {/* ── Add Form ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 text-sm font-semibold text-white"
            style={{ background: HEADER_GRADIENTS['domain-grade-weights'] }}>
            Add / Update Grade Skill Weight
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'rgb(var(--text-2))' }}>
              Set how much each skill area counts at each grade level. Saving an existing combination will update it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={L}>Skill Area</label>
                <input
                  type="text"
                  className={F}
                  placeholder="Search skill areas…"
                  value={domainSearch}
                  onChange={e => setDomainSearch(e.target.value)}
                />
                <select className={`${F} mt-1`} value={form.domain_id}
                  onChange={e => {
                    setForm({ ...form, domain_id: e.target.value, grade_id: '' });
                    setDomainSearch('');
                  }}>
                  <option value="">
                    {filteredDomains.length === 0 ? 'No match…' : `Select skill area… (${filteredDomains.length})`}
                  </option>
                  {filteredDomains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={L}>Grade</label>
                <select className={F} value={form.grade_id}
                  onChange={e => {
                    const gradeId = e.target.value;
                    const existing = existingWeightForGrade.get(Number(gradeId));
                    setForm({ ...form, grade_id: gradeId, weight: existing !== undefined ? String(existing) : '' });
                  }}
                  disabled={!form.domain_id}>
                  <option value="">{!form.domain_id ? 'Select skill area first…' : 'Select grade…'}</option>
                  {matrixGrades.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.title}{existingWeightForGrade.has(g.id) ? ' (update)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={L}>Weight (%)</label>
                <div className="flex gap-2">
                  <input type="number" className={F} min="0" max="100" step="5"
                    placeholder="e.g. 55"
                    value={form.weight}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setForm({ ...form, weight: isNaN(v) ? '' : String(Math.min(100, Math.max(0, v))) });
                    }} />
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.domain_id || !form.grade_id || !form.weight}
                    className="btn btn-primary shrink-0 flex items-center gap-1.5 px-4"
                    style={{ whiteSpace: 'nowrap' }}>
                    <Plus size={14} />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search + Grade Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgb(var(--text-3))' }} />
            <input
              className="field pl-8 w-full text-sm"
              placeholder="Search skill area…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'rgb(var(--text-3))' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Grade quick-filter chips */}
          <div className="flex gap-1.5 flex-wrap shrink-0">
            {['All', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21'].map(g => (
              <button key={g} onClick={() => setGradeFilter(g)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: gradeFilter === g ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
                  color:           gradeFilter === g ? 'white'              : 'rgb(var(--text-2))',
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Weight Table grouped by Domain ── */}
        {isLoading && <p className="text-sm text-center py-8" style={{ color: 'rgb(var(--text-3))' }}>Loading…</p>}
        {isError   && <p className="text-sm text-center py-8 text-red-500">Failed to load weights.</p>}

        {!isLoading && grouped.map(({ domain, rows }) => (
          <div key={domain.id} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              {domain.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: domain.color }} />}
              <span className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>{domain.name}</span>
              <span className="text-xs ml-auto" style={{ color: 'rgb(var(--text-3))' }}>
                {rows.length} grade{rows.length !== 1 ? 's' : ''} configured
              </span>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {rows.map(w => {
                const pct = Math.round(w.weight * 100);
                const barColor = domain.color ?? '#6366f1';
                const isEditing = editingId === w.id;

                return (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-3">
                    {/* Grade badge */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))', minWidth: 36, textAlign: 'center' }}>
                      {w.grade.code}
                    </span>

                    {isEditing ? (
                      /* ── Inline edit mode — auto-saves on change ── */
                      <>
                        <input
                          type="number" min="0" max="100" step="5"
                          autoFocus
                          value={editValue}
                          onChange={e => handleEditChange(w, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Escape') stopEdit(); }}
                          className="field w-24 text-sm"
                        />
                        <span className="text-sm tabular-nums" style={{ color: 'rgb(var(--text-3))' }}>%</span>
                        <span className="text-xs ml-1" style={{ color: 'rgb(var(--text-3))', minWidth: 52 }}>
                          {autoSaving ? 'Saving…' : 'Saved ✓'}
                        </span>
                        <button onClick={stopEdit}
                          className="p-1.5 rounded hover:bg-red-500/10 transition-colors ml-auto"
                          style={{ color: 'rgb(var(--text-3))' }}
                          title="Close">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      /* ── Display mode ── */
                      <>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--border))' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums w-12 text-right"
                          style={{ color: 'rgb(var(--text-1))' }}>
                          {pct}%
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEdit(w)}
                            className="p-1.5 rounded hover:bg-blue-500/10 transition-colors"
                            style={{ color: 'rgb(var(--text-3))' }}
                            title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirm({
                                title: 'Remove Weight',
                                message: `Remove ${domain.name} / ${w.grade.code} weight (${pct}%)?`,
                                confirmLabel: 'Remove',
                                variant: 'danger',
                              })) remove.mutate(w.id);
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                            style={{ color: 'rgb(var(--text-3))' }}
                            title="Delete">
                            <X size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!isLoading && grouped.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'rgb(var(--text-3))' }}>
            {search || gradeFilter !== 'All'
              ? 'No results match your search or filter.'
              : 'No weights configured yet. Use the form above to add the first entry.'}
          </p>
        )}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONFIG SECTION
// ═══════════════════════════════════════════════════════════════════════════════
type ConfigTab = 'departments' | 'employees' | 'users' | 'grades' | 'skill-domains' | 'competencies' | 'technologies' | 'categories' | 'skill-map' | 'domain-grade-weights';

const CONFIG_TABS: Array<{ id: ConfigTab; label: string; help: string; icon: React.ElementType }> = [
  { id: 'departments',   label: 'Departments',       help: 'Company groups used for employees and scoring settings.', icon: Building2 },
  { id: 'employees',     label: 'Employees',         help: 'People whose skills and readiness are tracked.', icon: Users },
  { id: 'users',         label: 'Users',             help: 'Login accounts and app roles.', icon: User },
  { id: 'grades',        label: 'Grades',            help: 'Career levels such as G13, G14, and G15.', icon: Award },
  { id: 'categories',    label: 'Categories',        help: 'Simple labels used to group skills.', icon: Tag },
  { id: 'skill-domains', label: 'Skill Areas',       help: 'Large areas such as Cloud, SRE, Security, or DataOps.', icon: Layers },
  { id: 'domain-grade-weights', label: 'Grade Skill Weights', help: 'How important each skill area is for each grade.', icon: Weight },
  { id: 'competencies',  label: 'Skills',            help: 'The skills employees are assessed against.', icon: Cpu },
  { id: 'technologies',  label: 'Technologies',      help: 'Tools or technologies linked to a skill.', icon: Zap },
  { id: 'skill-map',     label: 'Skill Map',         help: 'Shows how categories, skill areas, skills, and technologies connect.', icon: Network },
];

export const ConfigSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('departments');

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="section-title">Configuration</h2>
        <p className="section-desc">
          Set up the people, grades, skill groups, skills, and technologies used across the dashboard.
        </p>
      </div>

      {/* Tab nav */}
      <div className="card p-1.5 flex gap-1 flex-wrap">
        {CONFIG_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.help}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgb(var(--accent))' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgb(var(--text-2))',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'departments'   && <DepartmentsSection />}
        {activeTab === 'employees'     && <EmployeesSection />}
        {activeTab === 'users'         && <UsersSection />}
        {activeTab === 'grades'        && <GradesSection />}
        {activeTab === 'skill-domains'        && <SkillDomainsSection />}
        {activeTab === 'domain-grade-weights' && <DomainGradeWeightsSection />}
        {activeTab === 'categories'           && <CategoriesSection />}
        {activeTab === 'competencies'  && <CompetenciesSection />}
        {activeTab === 'technologies'  && <TechnologiesSection />}
        {activeTab === 'skill-map'     && <SkillTaxonomyView />}
      </div>
    </div>
  );
};
