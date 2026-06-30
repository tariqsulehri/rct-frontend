import React, { useEffect, useState, useMemo } from 'react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { X, Search, Building2, Users, Award, Layers, Cpu, Zap, User, Settings, Tag, Network, Save, ShieldCheck } from 'lucide-react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { ActionBtns, TableShell, TD, TR } from './ConfigTable';
import { HEADER_GRADIENTS, useTableState } from './ConfigTableState';
import {
  useConfigAssessmentTypes, useUpdateAssessmentType,
  useConfigAssessmentLevels, useUpdateAssessmentLevel,
  useConfigAssessmentStatuses, useUpdateAssessmentStatus,
  useConfigAssessmentProjects, useUpdateAssessmentProject,
  useConfigRoles, useUpdateRole,
  useConfigPermissions, useUpdateRolePermissions,
  useDepartmentAssignments, useCreateDepartmentAssignment, useUpdateDepartmentAssignment, useDeleteDepartmentAssignment,
  useLineManagerAssignments, useCreateLineManagerAssignment, useUpdateLineManagerAssignment, useDeleteLineManagerAssignment,
  useAccessAuditLogs,
  useConfigDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
  useConfigUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useConfigEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee,
  useConfigGrades, useCreateGrade, useUpdateGrade, useDeleteGrade,
  useConfigSkillDomains, useCreateSkillDomain, useUpdateSkillDomain, useDeleteSkillDomain,
  useConfigCompetencyGradeThresholds, useBulkUpsertCompetencyGradeThresholds,
  useConfigCompetencies, useCreateCompetency, useUpdateCompetency, useDeleteCompetency,
  useConfigTechnologies, useCreateTechnology, useUpdateTechnology, useDeleteTechnology,
  useConfigCompetencyCategories, useCreateCompetencyCategory, useUpdateCompetencyCategory, useDeleteCompetencyCategory,
  ConfigAssessmentType, ConfigAssessmentLevel, ConfigAssessmentStatus, ConfigAssessmentProject,
  ConfigDepartment, ConfigUser, ConfigEmployee, ConfigGrade, ConfigSkillDomain, ConfigCompetency, ConfigTechnology, ConfigCompetencyCategory,
  ConfigRole, ConfigDepartmentAssignment, ConfigLineManagerAssignment, ConfigPermission,
} from '@/hooks/useConfig';
import { useCompetencyScores, useGapMatrix, usePromotionReadiness } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { ROLE_CODES } from '@/types/rbac';
import SkillTaxonomyView from './SkillTaxonomyView';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
} from 'recharts';

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
type EmployeePayload = {
  emp_code: string;
  full_name: string;
  department: string;
  email: string | null;
  current_grade_id: number;
  target_grade_id: number;
  manager_id: number | null;
  department_id: number | null;
};
type GradePayload = {
  code: string;
  title: string;
  level: number;
  experience_years: number;
  performance_note?: string;
};
type SkillDomainPayload = {
  name: string;
  description?: string;
  color?: string;
};
type CompetencyPayload = {
  name: string;
  description: string;
  is_critical: boolean;
  category_id: number;
  domain_ids: number[];
};
type CompetencyCategoryPayload = SkillDomainPayload & {
  weight?: number;
  sort_order?: number;
  is_active?: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASSESSMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════
const AssessmentTypesSection: React.FC = () => {
  const { data: types, isLoading, isError } = useConfigAssessmentTypes();
  const updateType = useUpdateAssessmentType();

  const [editing, setEditing] = useState<ConfigAssessmentType | null>(null);
  const [form, setForm] = useState({ label: '', weight: '', description: '', sort_order: '', is_active: true });

  const openEdit = (type: ConfigAssessmentType) => {
    setEditing(type);
    setForm({
      label: type.label,
      weight: String(type.weight),
      description: type.description ?? '',
      sort_order: String(type.sort_order),
      is_active: type.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateType.mutateAsync({
      id: editing.id,
      data: {
        label: form.label,
        weight: Number(form.weight),
        description: form.description || null,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      },
    });
    setEditing(null);
  };

  const ts = useTableState(types, (type, q) =>
    type.code.toLowerCase().includes(q) ||
    type.label.toLowerCase().includes(q) ||
    (type.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-types" title="Assessment Types"
        headers={['Type', 'Base Score', 'Description', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((type, idx) => (
          <TR key={type.id} idx={idx}>
            <TD>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: type.code === 'Primary' ? '#2563eb' : type.code === 'Secondary' ? '#059669' : '#d97706' }} />
                <span className="font-semibold">{type.label}</span>
              </div>
            </TD>
            <TD>
              <span className="font-mono font-semibold" style={{ color: 'rgb(var(--accent))' }}>
                {type.weight.toFixed(2)}
              </span>
              <span className="text-xs ml-2" style={{ color: 'rgb(var(--text-3))' }}>
                {(type.weight * 100).toFixed(0)}%
              </span>
            </TD>
            <TD muted small>{type.description ?? '—'}</TD>
            <TD><span className={type.is_active ? 'badge badge-success' : 'badge'}>{type.is_active ? 'Active' : 'Inactive'}</span></TD>
            <td className="px-4 py-3">
              <button onClick={() => openEdit(type)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
            </td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Assessment Type">
          <div className="space-y-4">
            <div><label className={L}>Type</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Base Score</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateType.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

const AssessmentLevelsSection: React.FC = () => {
  const { data: levels, isLoading, isError } = useConfigAssessmentLevels();
  const updateLevel = useUpdateAssessmentLevel();
  const [editing, setEditing] = useState<ConfigAssessmentLevel | null>(null);
  const [form, setForm] = useState({ label: '', weight: '', threshold: '', description: '', sort_order: '', is_active: true });

  const openEdit = (levelConfig: ConfigAssessmentLevel) => {
    setEditing(levelConfig);
    setForm({
      label: levelConfig.label,
      weight: String(levelConfig.weight),
      threshold: levelConfig.threshold == null ? '' : String(levelConfig.threshold),
      description: levelConfig.description ?? '',
      sort_order: String(levelConfig.sort_order),
      is_active: levelConfig.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateLevel.mutateAsync({
      id: editing.id,
      data: {
        label: form.label,
        weight: Number(form.weight),
        threshold: form.threshold === '' ? null : Number(form.threshold),
        description: form.description || null,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      },
    });
    setEditing(null);
  };

  const ts = useTableState(levels, (levelConfig, q) =>
    levelConfig.code.toLowerCase().includes(q) ||
    levelConfig.label.toLowerCase().includes(q) ||
    (levelConfig.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-levels" title="Level Config"
        headers={['Level', 'Score Factor', 'Minimum Target', 'Description', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((levelConfig, idx) => (
          <TR key={levelConfig.id} idx={idx}>
            <TD><span className="font-semibold">{levelConfig.label}</span></TD>
            <TD mono>{levelConfig.weight.toFixed(2)}</TD>
            <TD mono>{levelConfig.threshold == null ? '—' : levelConfig.threshold.toFixed(2)}</TD>
            <TD muted small>{levelConfig.description ?? '—'}</TD>
            <TD><span className={levelConfig.is_active ? 'badge badge-success' : 'badge'}>{levelConfig.is_active ? 'Active' : 'Inactive'}</span></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(levelConfig)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Level Config">
          <div className="space-y-4">
            <div><label className={L}>Code</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={L}>Score Factor</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div><label className={L}>Minimum Target</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
              <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateLevel.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

const AssessmentStatusesSection: React.FC = () => {
  const { data: statuses, isLoading, isError } = useConfigAssessmentStatuses();
  const updateStatus = useUpdateAssessmentStatus();
  const [editing, setEditing] = useState<ConfigAssessmentStatus | null>(null);
  const [form, setForm] = useState({ label: '', description: '', counts_toward_score: false, is_terminal: false, sort_order: '', is_active: true });

  const openEdit = (status: ConfigAssessmentStatus) => {
    setEditing(status);
    setForm({
      label: status.label,
      description: status.description ?? '',
      counts_toward_score: status.counts_toward_score,
      is_terminal: status.is_terminal,
      sort_order: String(status.sort_order),
      is_active: status.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateStatus.mutateAsync({
      id: editing.id,
      data: {
        label: form.label,
        description: form.description || null,
        counts_toward_score: form.counts_toward_score,
        is_terminal: form.is_terminal,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      },
    });
    setEditing(null);
  };

  const ts = useTableState(statuses, (status, q) =>
    status.code.toLowerCase().includes(q) ||
    status.label.toLowerCase().includes(q) ||
    (status.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-statuses" title="Status Config"
        headers={['Status', 'Affects Score', 'Review Complete', 'Description', 'Active']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((status, idx) => (
          <TR key={status.id} idx={idx}>
            <TD><span className="font-semibold">{status.label}</span></TD>
            <TD><span className={status.counts_toward_score ? 'badge badge-success' : 'badge'}>{status.counts_toward_score ? 'Yes' : 'No'}</span></TD>
            <TD><span className={status.is_terminal ? 'badge badge-accent' : 'badge'}>{status.is_terminal ? 'Yes' : 'No'}</span></TD>
            <TD muted small>{status.description ?? '—'}</TD>
            <TD><span className={status.is_active ? 'badge badge-success' : 'badge'}>{status.is_active ? 'Active' : 'Inactive'}</span></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(status)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Status Config">
          <div className="space-y-4">
            <div><label className={L}>Code</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.counts_toward_score} onChange={e => setForm({ ...form, counts_toward_score: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Affects score</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_terminal} onChange={e => setForm({ ...form, is_terminal: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Review complete</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateStatus.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

const AssessmentProjectsSection: React.FC = () => {
  const { data: projects, isLoading, isError } = useConfigAssessmentProjects();
  const updateProject = useUpdateAssessmentProject();
  const [editing, setEditing] = useState<ConfigAssessmentProject | null>(null);
  const [form, setForm] = useState({ label: '', description: '', duration_months_min: '', duration_months_max: '', credit: '', threshold: '', sort_order: '', is_active: true });

  const openEdit = (project: ConfigAssessmentProject) => {
    setEditing(project);
    setForm({
      label: project.label,
      description: project.description ?? '',
      duration_months_min: project.duration_months_min == null ? '' : String(project.duration_months_min),
      duration_months_max: project.duration_months_max == null ? '' : String(project.duration_months_max),
      credit: String(project.credit),
      threshold: project.threshold == null ? '' : String(project.threshold),
      sort_order: String(project.sort_order),
      is_active: project.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateProject.mutateAsync({
      id: editing.id,
      data: {
        label: form.label,
        description: form.description || null,
        duration_months_min: form.duration_months_min === '' ? null : Number(form.duration_months_min),
        duration_months_max: form.duration_months_max === '' ? null : Number(form.duration_months_max),
        credit: Number(form.credit),
        threshold: form.threshold === '' ? null : Number(form.threshold),
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      },
    });
    setEditing(null);
  };

  const ts = useTableState(projects, (project, q) =>
    project.label.toLowerCase().includes(q) ||
    String(project.project_count).includes(q) ||
    (project.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-projects" title="Project Config"
        headers={['Projects', 'Project Score', 'Duration', 'Minimum Target', 'Description', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((project, idx) => (
          <TR key={project.id} idx={idx}>
            <TD><span className="font-semibold">{project.label}</span></TD>
            <TD mono>{project.credit.toFixed(2)}</TD>
            <TD muted small>
              {project.duration_months_min == null && project.duration_months_max == null
                ? '—'
                : `${project.duration_months_min ?? 0}-${project.duration_months_max ?? '∞'} months`}
            </TD>
            <TD mono>{project.threshold == null ? '—' : project.threshold.toFixed(2)}</TD>
            <TD muted small>{project.description ?? '—'}</TD>
            <TD><span className={project.is_active ? 'badge badge-success' : 'badge'}>{project.is_active ? 'Active' : 'Inactive'}</span></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(project)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Project Config">
          <div className="space-y-4">
            <div><label className={L}>Project Count</label><input className={F} value={editing.project_count === 3 ? '3+' : String(editing.project_count)} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={L}>Min Months</label><input type="number" min="0" className={F} value={form.duration_months_min} onChange={e => setForm({ ...form, duration_months_min: e.target.value })} /></div>
              <div><label className={L}>Max Months</label><input type="number" min="0" className={F} value={form.duration_months_max} onChange={e => setForm({ ...form, duration_months_max: e.target.value })} /></div>
              <div><label className={L}>Project Score</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} /></div>
              <div><label className={L}>Minimum Target</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateProject.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

const ScoringConfigSection: React.FC = () => {
  const [active, setActive] = useState<'types' | 'levels' | 'statuses' | 'projects'>('types');
  const items = [
    { id: 'types' as const, label: 'Types' },
    { id: 'levels' as const, label: 'Levels' },
    { id: 'statuses' as const, label: 'Statuses' },
    { id: 'projects' as const, label: 'Projects' },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-1 flex gap-1 flex-wrap">
        {items.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: active === item.id ? 'rgb(var(--accent))' : 'transparent',
              color: active === item.id ? 'white' : 'rgb(var(--text-2))',
            }}>
            {item.label}
          </button>
        ))}
      </div>
      {active === 'types' && <AssessmentTypesSection />}
      {active === 'levels' && <AssessmentLevelsSection />}
      {active === 'statuses' && <AssessmentStatusesSection />}
      {active === 'projects' && <AssessmentProjectsSection />}
    </div>
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
            <FormFooter onSave={handleSave} onCancel={() => setModal(null)} saving={createDept.isPending || updateDept.isPending} />
          </div>
        </Modal>
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
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
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
      } else if (editing) {
        const data: Partial<UserPayload> = {
          username: form.username,
          role: form.role as UserRole,
          employee_id: Number(form.employee_id),
          is_active: form.is_active,
        };
        if (form.password) data.password = form.password;
        const updated = await updateUser.mutateAsync({ id: editing.id, data });
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
      setSaveError(getApiErrorMessage(err, 'Failed to save user. Please check the details and try again.'));
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
      <div className="flex items-center justify-end gap-2 mb-3">
        {(['active', 'inactive', 'all'] as const).map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
            style={{
              backgroundColor: statusFilter === status ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
              border: '1px solid rgb(var(--border))',
              color: statusFilter === status ? 'white' : 'rgb(var(--text-1))',
            }}
          >
            {status}
          </button>
        ))}
      </div>
      <TableShell tabKey="users" title="Users" onAdd={openCreate} addLabel="Add User"
        headers={['Username', 'Role', 'Employee', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((u, idx) => (
          <TR key={u.id} idx={idx}>
            <TD><span className="font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{u.username}</span></TD>
            <TD><span className={ROLE_BADGE[u.role] ?? 'badge'}>{u.role}</span></TD>
            <TD muted>
              {u.employee
                ? `${u.employee.emp_code} - ${u.employee.full_name} - ${u.employee.department || 'No department'}`
                : `#${u.employee_id}`}
            </TD>
            <TD>
              <span className={u.is_active ? 'badge badge-success' : 'badge'}>{u.is_active ? 'Active' : 'Inactive'}</span>
            </TD>
            <ActionBtns onEdit={() => openEdit(u)} onDelete={async () => { if (await confirm({ title: 'Deactivate User', message: `"${u.username}" will be deactivated and lose access.`, confirmLabel: 'Deactivate', variant: 'warning' })) deleteUser.mutate(u.id); }} />
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
      <PanelHeader
        title={employee.full_name}
        subtitle={`${employee.emp_code} · ${employee.current_grade?.code} -> ${employee.target_grade?.code}`}
        background={HEADER_GRADIENTS['employees']}
        highContrast
        action={(
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <X size={15} />
          </button>
        )}
      />

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
                <PolarGrid stroke={c.radarGrid} />
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
    const payload: EmployeePayload = {
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
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Employee' : 'Edit Employee'}>
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
    const payload: GradePayload = { code: form.code, title: form.title, level: Number(form.level), experience_years: Number(form.experience_years), performance_note: form.performance_note || undefined };
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
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Grade' : 'Edit Grade'}>
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
    const payload: SkillDomainPayload = {
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
        <Modal onClose={() => setModal(null)} wide title={modal === 'create' ? 'Create Skill Area' : 'Edit Skill Area'}>
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
const CompetencyThresholdMatrix: React.FC = () => {
  const { data: departments } = useConfigDepartments();
  const { data: grades } = useConfigGrades();
  const { data: competencies } = useConfigCompetencies();
  const [departmentId, setDepartmentId] = useState('');
  const selectedDepartmentId = departmentId ? Number(departmentId) : null;
  const { data: thresholds, isLoading, isError } = useConfigCompetencyGradeThresholds(selectedDepartmentId);
  const saveThresholds = useBulkUpsertCompetencyGradeThresholds();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [targetSearch, setTargetSearch] = useState('');
  const [targetDomainId, setTargetDomainId] = useState('');

  useEffect(() => {
    if (departmentId || !departments?.length) return;
    const devOps = departments.find((d) => d.name.toLowerCase() === 'devops');
    setDepartmentId(String((devOps ?? departments[0]).id));
  }, [departmentId, departments]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of thresholds ?? []) {
      next[`${row.competency_id}:${row.grade_id}`] = String(Math.round(row.threshold * 100));
    }
    setDraft(next);
  }, [thresholds]);

  const orderedGrades = useMemo(
    () => [...(grades ?? [])].sort((a, b) => a.level - b.level),
    [grades]
  );

  const orderedCompetencies = useMemo(
    () => [...(competencies ?? [])].sort((a, b) => {
      const ad = a.competency_domains?.find(d => d.is_primary)?.domain.name ?? a.competency_domains?.[0]?.domain.name ?? '';
      const bd = b.competency_domains?.find(d => d.is_primary)?.domain.name ?? b.competency_domains?.[0]?.domain.name ?? '';
      return ad.localeCompare(bd) || a.name.localeCompare(b.name);
    }),
    [competencies]
  );

  const domainFilterOptions = useMemo(() => {
    const domainMap = new Map<number, { value: string; label: string }>();
    for (const competency of competencies ?? []) {
      for (const map of competency.competency_domains ?? []) {
        domainMap.set(map.domain.id, { value: String(map.domain.id), label: map.domain.name });
      }
    }
    return [...domainMap.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [competencies]);

  const filteredCompetencies = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    return orderedCompetencies.filter((competency) => {
      const domainsForCompetency = competency.competency_domains ?? [];
      const matchesDomain = !targetDomainId || domainsForCompetency.some((map) => String(map.domain.id) === targetDomainId);
      if (!matchesDomain) return false;
      if (!q) return true;
      const domainText = domainsForCompetency.map((map) => map.domain.name).join(' ').toLowerCase();
      return competency.name.toLowerCase().includes(q) || domainText.includes(q);
    });
  }, [orderedCompetencies, targetDomainId, targetSearch]);

  const hasTargetFilters = targetSearch.trim().length > 0 || targetDomainId !== '';

  const departmentOptions = (departments ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
    sub: d.description ?? undefined,
  }));

  const handleDraftChange = (competencyId: number, gradeId: number, value: string) => {
    if (value === '') {
      setDraft((prev) => ({ ...prev, [`${competencyId}:${gradeId}`]: '' }));
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const clamped = Math.max(0, Math.min(100, numeric));
    setDraft((prev) => ({ ...prev, [`${competencyId}:${gradeId}`]: String(clamped) }));
  };

  const handleSaveThresholds = async () => {
    if (!selectedDepartmentId) return;
    const payload = orderedCompetencies.flatMap((competency) =>
      orderedGrades.flatMap((grade) => {
        const raw = draft[`${competency.id}:${grade.id}`];
        if (raw === undefined || raw === '') return [];
        return [{
          competency_id: competency.id,
          grade_id: grade.id,
          threshold: Number(raw) / 100,
        }];
      })
    );
    if (payload.length === 0) return;
    await saveThresholds.mutateAsync({ department_id: selectedDepartmentId, thresholds: payload });
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-1))' }}>
            Department Skill Targets
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
            Select a department, then set the minimum score required for each skill at each target grade.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-72">
            <SearchableSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department..."
              options={departmentOptions}
            />
          </div>
          <button
            onClick={handleSaveThresholds}
            disabled={!selectedDepartmentId || saveThresholds.isPending}
            className="btn-primary h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold whitespace-nowrap disabled:opacity-60"
          >
            <Save size={15} />
            {saveThresholds.isPending ? 'Saving' : 'Save Targets'}
          </button>
        </div>
      </div>

      <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2) / 0.35)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 h-10"
          style={{ backgroundColor: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))' }}>
          <Search size={15} style={{ color: 'rgb(var(--text-3))' }} />
          <input
            value={targetSearch}
            onChange={(e) => setTargetSearch(e.target.value)}
            placeholder="Search skills or skill areas..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'rgb(var(--text-1))' }}
          />
        </div>
        <div className="w-full lg:w-64">
          <SearchableSelect
            value={targetDomainId}
            onChange={setTargetDomainId}
            placeholder="All skill areas"
            options={domainFilterOptions}
          />
        </div>
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <span className="text-xs whitespace-nowrap" style={{ color: 'rgb(var(--text-2))' }}>
            {filteredCompetencies.length} / {orderedCompetencies.length} skills
          </span>
          {hasTargetFilters && (
            <button
              onClick={() => { setTargetSearch(''); setTargetDomainId(''); }}
              className="btn-ghost h-9 px-3 rounded-lg text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!selectedDepartmentId ? (
        <div className="p-6 text-sm" style={{ color: 'rgb(var(--text-3))' }}>Select a department to configure skill targets.</div>
      ) : isError ? (
        <div className="p-6 text-sm" style={{ color: 'rgb(var(--danger))' }}>Failed to load department skill targets.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill Area</th>
                {orderedGrades.map((grade) => (
                  <th key={grade.id} className="px-3 py-3 text-center text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>
                    {grade.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={orderedGrades.length + 2} className="px-4 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>Loading targets...</td></tr>
              ) : filteredCompetencies.length === 0 ? (
                <tr><td colSpan={orderedGrades.length + 2} className="px-4 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>No skills match the selected filters.</td></tr>
              ) : filteredCompetencies.map((competency, idx) => {
                const primaryDomain = competency.competency_domains?.find(d => d.is_primary)?.domain ?? competency.competency_domains?.[0]?.domain;
                return (
                  <tr key={competency.id}
                    style={{
                      borderBottom: '1px solid rgb(var(--border))',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.45)',
                    }}>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>{competency.name}</div>
                      {competency.is_critical && <span className="badge badge-danger mt-1">Important</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'rgb(var(--text-2))' }}>
                      {primaryDomain?.name ?? 'No skill area'}
                    </td>
                    {orderedGrades.map((grade) => {
                      const key = `${competency.id}:${grade.id}`;
                      return (
                        <td key={grade.id} className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={draft[key] ?? ''}
                              onChange={(e) => handleDraftChange(competency.id, grade.id, e.target.value)}
                              className="field text-center font-mono"
                              style={{ width: 70, height: 34, padding: '0 8px' }}
                            />
                            <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
    const payload: CompetencyPayload = {
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
      <div className="mb-5">
        <CompetencyThresholdMatrix />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
      <TableShell tabKey="competencies" title="Skills" onAdd={openCreate} addLabel="Add Skill"
        headers={['Name', 'Category', 'Skill Area', 'Important', 'Tools']}
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
            <ActionBtns onEdit={() => openEdit(c)} onDelete={async () => { if (await confirm({ title: 'Delete Skill', message: `"${c.name}" and all its tool links will be deleted.`, confirmLabel: 'Delete' })) deleteCompetency.mutate(c.id); }} />
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

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
type AccessPanel = 'roles' | 'departments' | 'line-managers' | 'audit';
type AssignmentStatusFilter = 'active' | 'inactive' | 'all';

const formatUserLabel = (user?: ConfigUser | null) => {
  if (!user) return 'Unknown user';
  const emp = user.employee;
  return emp ? `${emp.emp_code} - ${emp.full_name} - ${emp.department || 'No department'}` : user.username;
};

const formatEmployeeLabel = (employee?: ConfigEmployee | null) => {
  if (!employee) return 'Unknown employee';
  const department = employee.dept?.name ?? employee.department;
  return `${employee.emp_code} - ${employee.full_name} - ${department || 'No department'}`;
};

const toDateInput = (value?: string | null) => value ? value.slice(0, 10) : '';
const fromDateInput = (value: string) => value ? value : null;

const AccessManagementSection: React.FC = () => {
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

  const updateRole = useUpdateRole();
  const updateRolePermissions = useUpdateRolePermissions();
  const createDeptAssignment = useCreateDepartmentAssignment();
  const updateDeptAssignment = useUpdateDepartmentAssignment();
  const deleteDeptAssignment = useDeleteDepartmentAssignment();
  const createLineAssignment = useCreateLineManagerAssignment();
  const updateLineAssignment = useUpdateLineManagerAssignment();
  const deleteLineAssignment = useDeleteLineManagerAssignment();

  const [roleModal, setRoleModal] = useState<ConfigRole | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', is_active: true, sort_order: 0 });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [deptModal, setDeptModal] = useState<'create' | 'edit' | null>(null);
  const [editingDept, setEditingDept] = useState<ConfigDepartmentAssignment | null>(null);
  const [deptForm, setDeptForm] = useState({
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
  const [lineBulkModal, setLineBulkModal] = useState(false);
  const [lineStatusFilter, setLineStatusFilter] = useState<AssignmentStatusFilter>('active');
  const [editingLine, setEditingLine] = useState<ConfigLineManagerAssignment | null>(null);
  const [lineForm, setLineForm] = useState({
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
  const [lineBulkForm, setLineBulkForm] = useState({
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
  const [selectedEmployeeSearch, setSelectedEmployeeSearch] = useState('');
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
  const selectedBulkManagerEmployeeId = (users ?? []).find(user => String(user.id) === lineBulkForm.manager_user_id)?.employee_id;
  const selectedEditManagerEmployeeId = (users ?? []).find(user => String(user.id) === lineForm.manager_user_id)?.employee_id;
  const lineBulkEmployeeOptions = (employees ?? [])
    .filter(employee => {
      if (employee.id === selectedBulkManagerEmployeeId) return false;
      const activeAssignment = (lineAssignments ?? []).find(assignment =>
        assignment.employee_id === employee.id &&
        assignment.is_active &&
        assignment.relationship_type === lineBulkForm.relationship_type,
      );
      return !activeAssignment || String(activeAssignment.manager_user_id) === lineBulkForm.manager_user_id;
    })
    .map(employee => ({
      value: String(employee.id),
      label: formatEmployeeLabel(employee),
      sub: employee.current_grade?.code && employee.target_grade?.code ? `${employee.current_grade.code} -> ${employee.target_grade.code}` : undefined,
    }));
  const lineEditEmployeeOptions = (employees ?? [])
    .filter(employee => {
      if (employee.id === selectedEditManagerEmployeeId) return false;
      const activeAssignment = (lineAssignments ?? []).find(assignment =>
        assignment.employee_id === employee.id &&
        assignment.is_active &&
        assignment.relationship_type === lineForm.relationship_type,
      );
      return !activeAssignment || activeAssignment.id === editingLine?.id;
    })
    .map(employee => ({
      value: String(employee.id),
      label: formatEmployeeLabel(employee),
      sub: employee.current_grade?.code && employee.target_grade?.code ? `${employee.current_grade.code} -> ${employee.target_grade.code}` : undefined,
    }));
  const activeLineAssignments = (lineAssignments ?? []).filter(assignment => assignment.is_active);
  const activeAssignedEmployeeIds = new Set(activeLineAssignments.map(assignment => assignment.employee_id));
  const assignedEmployeeCount = activeAssignedEmployeeIds.size;
  const unassignedEmployeeCount = Math.max((employees ?? []).length - assignedEmployeeCount, 0);
  const filteredLineAssignments = (lineAssignments ?? []).filter(assignment => {
    if (lineStatusFilter === 'active') return assignment.is_active;
    if (lineStatusFilter === 'inactive') return !assignment.is_active;
    return true;
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
    setSelectedPermissionIds((role.role_permissions ?? []).map(item => item.permission_id));
    setRoleModal(role);
    setSaveError(null);
  };

  const saveRole = async () => {
    if (!roleModal) return;
    setSaveError(null);
    try {
      await updateRole.mutateAsync({
        id: roleModal.id,
        data: {
          name: roleForm.name,
          description: roleForm.description || null,
          is_active: roleForm.is_active,
          sort_order: roleForm.sort_order,
        },
      });
      await updateRolePermissions.mutateAsync({ id: roleModal.id, permissionIds: selectedPermissionIds });
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

  const openLineBulk = () => {
    setLineBulkForm({ manager_user_id: '', employee_ids: [], relationship_type: 'LINE_MANAGER', can_view: true, can_assess: true, starts_at: '', ends_at: '', is_primary: false, is_active: true });
    setSelectedEmployeeSearch('');
    setSaveError(null);
    setLineBulkModal(true);
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
        manager_user_id: Number(lineForm.manager_user_id),
        relationship_type: lineForm.relationship_type,
        can_view: lineForm.can_view,
        can_assess: lineForm.can_assess,
        starts_at: fromDateInput(lineForm.starts_at) ?? undefined,
        ends_at: fromDateInput(lineForm.ends_at),
        is_primary: lineForm.is_primary,
        is_active: lineForm.is_active,
      };
      const employeeId = Number(lineForm.employee_id);
      if (!basePayload.manager_user_id || !employeeId) {
        setSaveError('Please select both line manager user and employee.');
        return;
      }
      if (editingLine) await updateLineAssignment.mutateAsync({ id: editingLine.id, data: { ...basePayload, employee_id: employeeId } });
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
        setSaveError('Please select a line manager user.');
        return;
      }
      const activeAssignments = (lineAssignments ?? []).filter(a =>
        a.manager_user_id === managerUserId &&
        a.is_active &&
        a.relationship_type === lineBulkForm.relationship_type,
      );
      const activeEmployeeIds = new Set(activeAssignments.map(a => a.employee_id));
      const toAdd = Array.from(selectedEmployeeIds).filter(employeeId => !activeEmployeeIds.has(employeeId));
      const toRemove = activeAssignments.filter(a => !selectedEmployeeIds.has(a.employee_id));

      await Promise.all([
        ...toAdd.map(employee_id => createLineAssignment.mutateAsync({
          manager_user_id: managerUserId,
          employee_id,
          relationship_type: lineBulkForm.relationship_type,
          can_view: lineBulkForm.can_view,
          can_assess: lineBulkForm.can_assess,
          starts_at: fromDateInput(lineBulkForm.starts_at) ?? undefined,
          ends_at: fromDateInput(lineBulkForm.ends_at),
          is_primary: lineBulkForm.is_primary,
          is_active: lineBulkForm.is_active,
        })),
        ...toRemove.map(assignment => deleteLineAssignment.mutateAsync(assignment.id)),
      ]);
      setLineBulkModal(false);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Failed to update line-manager employees.'));
    }
  };

  const statusBadge = (active: boolean) => (
    <span className={active ? 'badge badge-success' : 'badge'}>{active ? 'Active' : 'Inactive'}</span>
  );
  const selectedLineBulkEmployees = lineBulkEmployeeOptions.filter(option => lineBulkForm.employee_ids.includes(option.value));
  const visibleSelectedLineBulkEmployees = selectedLineBulkEmployees.filter(employee => {
    const query = selectedEmployeeSearch.trim().toLowerCase();
    if (!query) return true;
    return employee.label.toLowerCase().includes(query) || (employee.sub ?? '').toLowerCase().includes(query);
  });

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
          <TableShell tabKey="roles" title="Roles" headers={['Role', 'Code', 'Description', 'Permissions', 'Status']}
            loading={rolesLoading} error={rolesError}
            q={roleState.q} onSearch={roleState.onSearch} page={roleState.page} total={roleState.filtered.length} onPage={roleState.setPage}>
            {roleState.paged.map((role, idx) => (
              <TR key={role.id} idx={idx}>
                <TD><span className="font-semibold">{role.name}</span></TD>
                <TD mono>{role.code}</TD>
                <TD muted small>{role.description ?? '-'}</TD>
                <TD small>
                  <span className="badge">{role.role_permissions?.length ?? 0} permissions</span>
                </TD>
                <TD>{statusBadge(role.is_active)}</TD>
                <td className="px-4 py-3">
                  <button onClick={() => openRole(role)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
                </td>
              </TR>
            ))}
          </TableShell>
        )}

        {panel === 'departments' && (
          <TableShell tabKey="department-access" title="Department Access" onAdd={openDeptCreate} addLabel="Assign Departments"
            headers={['User', 'Department', 'Type', 'Permissions', 'Dates', 'Status']}
            loading={deptLoading} error={deptError}
            q={deptState.q} onSearch={deptState.onSearch} page={deptState.page} total={deptState.filtered.length} onPage={deptState.setPage}>
            {deptState.paged.map((assignment, idx) => (
              <TR key={assignment.id} idx={idx}>
                <TD><span className="font-semibold">{formatUserLabel(assignment.user)}</span></TD>
                <TD>{assignment.department?.name ?? `#${assignment.department_id}`}</TD>
                <TD mono>{assignment.assignment_type}</TD>
                <TD small>{assignment.can_view ? 'View' : 'No view'} / {assignment.can_manage ? 'Manage' : 'No manage'}</TD>
                <TD small muted>{toDateInput(assignment.starts_at) || '-'} to {toDateInput(assignment.ends_at) || 'Open'}</TD>
                <TD>{statusBadge(assignment.is_active)}</TD>
                <ActionBtns onEdit={() => openDeptEdit(assignment)} onDelete={async () => { if (await confirm({ title: 'Deactivate Department Access', message: 'This access assignment will be marked inactive.', confirmLabel: 'Deactivate', variant: 'warning' })) deleteDeptAssignment.mutate(assignment.id); }} />
              </TR>
            ))}
          </TableShell>
        )}

        {panel === 'line-managers' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Assigned', value: assignedEmployeeCount, tone: 'rgb(var(--success))' },
                { label: 'Unassigned', value: unassignedEmployeeCount, tone: 'rgb(var(--warning))' },
                { label: 'Active Rows', value: activeLineAssignments.length, tone: 'rgb(var(--accent-txt))' },
              ].map(item => (
                <div key={item.label} className="rounded-lg border px-4 py-3"
                  style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                  <p className="text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>{item.label}</p>
                  <p className="text-2xl font-extrabold mt-1" style={{ color: item.tone }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="card p-1.5 inline-flex gap-1">
              {[
                { id: 'active' as const, label: 'Active' },
                { id: 'inactive' as const, label: 'Inactive' },
                { id: 'all' as const, label: 'All' },
              ].map(item => (
                <button key={item.id} type="button" onClick={() => setLineStatusFilter(item.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: lineStatusFilter === item.id ? 'rgb(var(--accent))' : 'transparent',
                    color: lineStatusFilter === item.id ? 'white' : 'rgb(var(--text-2))',
                  }}>
                  {item.label}
                </button>
              ))}
            </div>
            <TableShell tabKey="line-manager-access" title="Line Manager Access" onAdd={openLineBulk} addLabel="Manage Employees"
              headers={['Line Manager', 'Employee', 'Relationship', 'Permissions', 'Dates', 'Status']}
              loading={lineLoading} error={lineError}
              q={lineState.q} onSearch={lineState.onSearch} page={lineState.page} total={lineState.filtered.length} onPage={lineState.setPage}>
              {lineState.paged.map((assignment, idx) => (
                <TR key={assignment.id} idx={idx}>
                  <TD><span className="font-semibold">{formatUserLabel(assignment.manager_user)}</span></TD>
                  <TD>{formatEmployeeLabel(assignment.employee)}</TD>
                  <TD mono>{assignment.relationship_type}{assignment.is_primary ? ' / PRIMARY' : ''}</TD>
                  <TD small>{assignment.can_view ? 'View' : 'No view'} / {assignment.can_assess ? 'Assess' : 'No assess'}</TD>
                  <TD small muted>{toDateInput(assignment.starts_at) || '-'} to {toDateInput(assignment.ends_at) || 'Open'}</TD>
                  <TD>{statusBadge(assignment.is_active)}</TD>
                  <ActionBtns onEdit={() => openLineEdit(assignment)} onDelete={async () => { if (await confirm({ title: 'Deactivate Line Manager Access', message: 'This employee assignment will be marked inactive.', confirmLabel: 'Deactivate', variant: 'warning' })) deleteLineAssignment.mutate(assignment.id); }} />
                </TR>
              ))}
            </TableShell>
          </div>
        )}

        {panel === 'audit' && (
          <TableShell tabKey="access-audit" title="Recent Access Audit" headers={['Time', 'Actor', 'Target', 'Action', 'Entity']}
            loading={auditLoading} error={auditError}
            q={auditState.q} onSearch={auditState.onSearch} page={auditState.page} total={auditState.filtered.length} onPage={auditState.setPage}>
            {auditState.paged.map((log, idx) => (
              <TR key={log.id} idx={idx}>
                <TD small>{new Date(log.created_at).toLocaleString()}</TD>
                <TD small>{formatUserLabel(log.actor_user)}</TD>
                <TD small muted>{log.target_user ? formatUserLabel(log.target_user) : '-'}</TD>
                <TD mono small>{log.action}</TD>
                <TD small>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</TD>
                <td className="px-4 py-3" />
              </TR>
            ))}
          </TableShell>
        )}
      </div>

      {roleModal && (
        <Modal onClose={() => setRoleModal(null)} wide title="Edit Role">
          <div className="space-y-4">
            {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
            <div><label className={L}>Role Code</label><input className={F} value={roleModal.code} disabled /></div>
            <div><label className={L}>Role Name</label><input className={F} value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Sort Order</label><input type="number" className={F} value={roleForm.sort_order} onChange={e => setRoleForm({ ...roleForm, sort_order: Number(e.target.value) })} /></div>
              <label className="flex items-center gap-2 text-sm pt-7" style={{ color: 'rgb(var(--text-1))' }}>
                <input type="checkbox" checked={roleForm.is_active} onChange={e => setRoleForm({ ...roleForm, is_active: e.target.checked })} /> Active
              </label>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className={L}>Permissions</label>
                <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                  {selectedPermissionIds.length} selected
                </span>
              </div>
              <div className="rounded-lg border max-h-72 overflow-y-auto" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                {Object.entries(groupedPermissions).map(([category, items]) => (
                  <div key={category} className="border-b last:border-b-0" style={{ borderColor: 'rgb(var(--border))' }}>
                    <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))', backgroundColor: 'rgb(var(--surface))' }}>
                      {category}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                      {items.map(permission => {
                        const checked = selectedPermissionIds.includes(permission.id);
                        return (
                          <label key={permission.id} className="flex gap-2 rounded-md border px-2.5 py-2 cursor-pointer"
                            style={{
                              borderColor: checked ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                              backgroundColor: checked ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
                            }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={event => {
                                setSelectedPermissionIds(current => event.target.checked
                                  ? [...current, permission.id]
                                  : current.filter(id => id !== permission.id));
                              }}
                              className="mt-0.5"
                              style={{ accentColor: 'rgb(var(--accent))' }}
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{permission.name}</span>
                              <span className="block text-[11px] mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>{permission.description ?? permission.code}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <FormFooter onSave={saveRole} onCancel={() => setRoleModal(null)} saving={updateRole.isPending || updateRolePermissions.isPending} />
          </div>
        </Modal>
      )}

      {deptModal && (
        <Modal onClose={() => setDeptModal(null)} wide title={deptModal === 'create' ? 'Assign Departments' : 'Edit Department Access'}>
          <div className="space-y-4">
            {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
            <div><label className={L}>User</label><SearchableSelect value={deptForm.user_id} onChange={v => setDeptForm({ ...deptForm, user_id: v })} placeholder="Select user..." options={userOptions} /></div>
            {deptModal === 'create' ? (
              <div>
                <label className={L}>Departments</label>
                <SearchableMultiSelect
                  values={deptForm.department_ids}
                  onChange={values => setDeptForm({ ...deptForm, department_ids: values })}
                  placeholder="Select departments..."
                  options={departmentOptions}
                  selectAllLabel="Select visible"
                  itemLabel="department"
                  searchPlaceholder="Search departments..."
                />
              </div>
            ) : (
              <div><label className={L}>Department</label><SearchableSelect value={deptForm.department_id} onChange={v => setDeptForm({ ...deptForm, department_id: v })} placeholder="Select department..." options={departmentOptions} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Access Type</label><input className={F} value={deptForm.assignment_type} onChange={e => setDeptForm({ ...deptForm, assignment_type: e.target.value })} /></div>
              <div><label className={L}>Start Date</label><input type="date" className={F} value={deptForm.starts_at} onChange={e => setDeptForm({ ...deptForm, starts_at: e.target.value })} /></div>
              <div><label className={L}>End Date</label><input type="date" className={F} value={deptForm.ends_at} onChange={e => setDeptForm({ ...deptForm, ends_at: e.target.value })} /></div>
              <div className="flex items-center gap-4 pt-7">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={deptForm.can_view} onChange={e => setDeptForm({ ...deptForm, can_view: e.target.checked })} /> View</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={deptForm.can_manage} onChange={e => setDeptForm({ ...deptForm, can_manage: e.target.checked })} /> Manage</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={deptForm.is_active} onChange={e => setDeptForm({ ...deptForm, is_active: e.target.checked })} /> Active</label>
              </div>
            </div>
            <FormFooter onSave={saveDeptAssignment} onCancel={() => setDeptModal(null)} saving={createDeptAssignment.isPending || updateDeptAssignment.isPending} />
          </div>
        </Modal>
      )}

      {lineModal && (
        <Modal onClose={() => setLineModal(null)} wide title="Edit Line Manager Access">
          <div className="space-y-4">
            {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
            <div><label className={L}>Line Manager User</label><SearchableSelect value={lineForm.manager_user_id} onChange={v => setLineForm({ ...lineForm, manager_user_id: v })} placeholder="Select line manager..." options={userOptions} /></div>
            <div>
              <label className={L}>Employee</label>
              <SearchableSelect value={lineForm.employee_id} onChange={v => setLineForm({ ...lineForm, employee_id: v })} placeholder="Select employee..." options={lineEditEmployeeOptions} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Relationship Type</label><input className={F} value={lineForm.relationship_type} onChange={e => setLineForm({ ...lineForm, relationship_type: e.target.value })} /></div>
              <div><label className={L}>Start Date</label><input type="date" className={F} value={lineForm.starts_at} onChange={e => setLineForm({ ...lineForm, starts_at: e.target.value })} /></div>
              <div><label className={L}>End Date</label><input type="date" className={F} value={lineForm.ends_at} onChange={e => setLineForm({ ...lineForm, ends_at: e.target.value })} /></div>
              <div className="flex items-center gap-4 pt-7 flex-wrap">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineForm.can_view} onChange={e => setLineForm({ ...lineForm, can_view: e.target.checked })} /> View</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineForm.can_assess} onChange={e => setLineForm({ ...lineForm, can_assess: e.target.checked })} /> Assess</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineForm.is_primary} onChange={e => setLineForm({ ...lineForm, is_primary: e.target.checked })} /> Primary</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineForm.is_active} onChange={e => setLineForm({ ...lineForm, is_active: e.target.checked })} /> Active</label>
              </div>
            </div>
            <FormFooter onSave={saveLineAssignment} onCancel={() => setLineModal(null)} saving={createLineAssignment.isPending || updateLineAssignment.isPending} />
          </div>
        </Modal>
      )}

      {lineBulkModal && (
        <Modal onClose={() => setLineBulkModal(false)} wide title="Manage Line Manager Employees">
          <div className="space-y-4">
            {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
            <div><label className={L}>Line Manager User</label><SearchableSelect value={lineBulkForm.manager_user_id} onChange={loadLineBulkManager} placeholder="Select line manager..." options={userOptions} /></div>
            <div>
              <label className={L}>Employees</label>
              <SearchableMultiSelect
                values={lineBulkForm.employee_ids}
                onChange={values => setLineBulkForm({ ...lineBulkForm, employee_ids: values })}
                placeholder="Search and select employees..."
                options={lineBulkEmployeeOptions}
                selectAllLabel="Select all shown"
              />
            </div>
            <div className="rounded-lg border" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>Selected Employees</p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>{selectedLineBulkEmployees.length} employee{selectedLineBulkEmployees.length === 1 ? '' : 's'} selected</p>
                </div>
                {selectedLineBulkEmployees.length > 0 && (
                  <button type="button" className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium"
                    onClick={() => setLineBulkForm({ ...lineBulkForm, employee_ids: [] })}>
                    Clear All
                  </button>
                )}
              </div>
              <div className="px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgb(var(--surface))' }}>
                  <Search size={13} style={{ color: 'rgb(var(--text-3))' }} />
                  <input
                    value={selectedEmployeeSearch}
                    onChange={event => setSelectedEmployeeSearch(event.target.value)}
                    placeholder="Search selected employees..."
                    className="bg-transparent text-sm outline-none flex-1"
                    style={{ color: 'rgb(var(--text-1))' }}
                  />
                  {selectedEmployeeSearch && (
                    <button type="button" className="text-xs" style={{ color: 'rgb(var(--text-3))' }} onClick={() => setSelectedEmployeeSearch('')}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-44 overflow-y-auto p-2">
                {selectedLineBulkEmployees.length === 0 ? (
                  <p className="text-sm px-2 py-4 text-center" style={{ color: 'rgb(var(--text-3))' }}>No employees selected.</p>
                ) : visibleSelectedLineBulkEmployees.length === 0 ? (
                  <p className="text-sm px-2 py-4 text-center" style={{ color: 'rgb(var(--text-3))' }}>No selected employees match your search.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {visibleSelectedLineBulkEmployees.map(employee => (
                      <div key={employee.value} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2"
                        style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{employee.label}</p>
                          {employee.sub && <p className="text-[11px] truncate" style={{ color: 'rgb(var(--text-3))' }}>{employee.sub}</p>}
                        </div>
                        <button type="button" className="btn-ghost px-2 py-1 text-xs rounded-md shrink-0"
                          onClick={() => setLineBulkForm({ ...lineBulkForm, employee_ids: lineBulkForm.employee_ids.filter(id => id !== employee.value) })}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Relationship Type</label><input className={F} value={lineBulkForm.relationship_type} onChange={e => setLineBulkForm({ ...lineBulkForm, relationship_type: e.target.value })} /></div>
              <div><label className={L}>Start Date</label><input type="date" className={F} value={lineBulkForm.starts_at} onChange={e => setLineBulkForm({ ...lineBulkForm, starts_at: e.target.value })} /></div>
              <div><label className={L}>End Date</label><input type="date" className={F} value={lineBulkForm.ends_at} onChange={e => setLineBulkForm({ ...lineBulkForm, ends_at: e.target.value })} /></div>
              <div className="flex items-center gap-4 pt-7 flex-wrap">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineBulkForm.can_view} onChange={e => setLineBulkForm({ ...lineBulkForm, can_view: e.target.checked })} /> View</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineBulkForm.can_assess} onChange={e => setLineBulkForm({ ...lineBulkForm, can_assess: e.target.checked })} /> Assess</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineBulkForm.is_primary} onChange={e => setLineBulkForm({ ...lineBulkForm, is_primary: e.target.checked })} /> Primary</label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={lineBulkForm.is_active} onChange={e => setLineBulkForm({ ...lineBulkForm, is_active: e.target.checked })} /> Active</label>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
              Saving will add newly selected employees and deactivate employees removed from this line manager.
            </p>
            <FormFooter onSave={saveLineBulkAssignments} onCancel={() => setLineBulkModal(false)} saving={createLineAssignment.isPending || deleteLineAssignment.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONFIG SECTION
// ═══════════════════════════════════════════════════════════════════════════════
type ConfigTab = 'scoring' | 'access' | 'departments' | 'employees' | 'users' | 'grades' | 'skill-domains' | 'competencies' | 'technologies' | 'categories' | 'skill-map';

const CONFIG_TABS: Array<{ id: ConfigTab; label: string; help: string; icon: React.ElementType }> = [
  { id: 'scoring',      label: 'Scoring',          help: 'Rules used to count skill scores.', icon: Settings },
  { id: 'access',       label: 'Access',           help: 'Who can open each part of the app.', icon: ShieldCheck },
  { id: 'departments',   label: 'Departments',       help: 'Company groups for employees.', icon: Building2 },
  { id: 'employees',     label: 'Employees',         help: 'People whose skills and readiness are tracked.', icon: Users },
  { id: 'users',         label: 'Users',             help: 'Login accounts and app roles.', icon: User },
  { id: 'grades',        label: 'Grades',            help: 'Career levels such as G13, G14, and G15.', icon: Award },
  { id: 'categories',    label: 'Categories',        help: 'Simple labels used to group skills.', icon: Tag },
  { id: 'skill-domains', label: 'Skill Areas',       help: 'Large skill groups such as Cloud or SRE.', icon: Layers },
  { id: 'competencies',  label: 'Skills',            help: 'Skills that employees are checked on.', icon: Cpu },
  { id: 'technologies',  label: 'Tools',             help: 'Tools linked to a skill.', icon: Zap },
  { id: 'skill-map',     label: 'Skill Map',         help: 'See how skill groups, skills, and tools connect.', icon: Network },
];

export const ConfigSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('scoring');

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="section-title">Setup</h2>
        <p className="section-desc">
          Set up people, grades, skill groups, skills, and tools used in the app.
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
        {activeTab === 'scoring'       && <ScoringConfigSection />}
        {activeTab === 'access'        && <AccessManagementSection />}
        {activeTab === 'departments'   && <DepartmentsSection />}
        {activeTab === 'employees'     && <EmployeesSection />}
        {activeTab === 'users'         && <UsersSection />}
        {activeTab === 'grades'        && <GradesSection />}
        {activeTab === 'skill-domains'        && <SkillDomainsSection />}
        {activeTab === 'categories'           && <CategoriesSection />}
        {activeTab === 'competencies'  && <CompetenciesSection />}
        {activeTab === 'technologies'  && <TechnologiesSection />}
        {activeTab === 'skill-map'     && <SkillTaxonomyView />}
      </div>
    </div>
  );
};
