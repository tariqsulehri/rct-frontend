import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { ActionBtns, TableShell, TD, TR } from '../ConfigTable';
import { HEADER_GRADIENTS, useTableState } from '../ConfigTableState';
import {
  ConfigEmployee,
  useConfigDepartments,
  useConfigEmployees,
  useConfigGrades,
  useCreateEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
} from '@/hooks/useConfig';
import { useCompetencyScores, useGapMatrix, usePromotionReadiness } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend,
} from 'recharts';

const F = 'field';
const L = 'field-label';

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

export const EmployeesSection: React.FC = () => {
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

  const selectedDepartmentId = form.department_id ? Number(form.department_id) : null;
  const departmentGrades = (grades ?? []).filter((grade) => selectedDepartmentId && grade.department_id === selectedDepartmentId);
  const gradeOptions = departmentGrades.map(g => ({ value: String(g.id), label: `${g.code} – ${g.title}` }));
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
                  const gradeBelongsToDepartment = (gradeId: string) => (
                    !gradeId || (grades ?? []).some((grade) => String(grade.id) === gradeId && String(grade.department_id) === v)
                  );
                  setForm({
                    ...form,
                    department_id: v,
                    department: dept?.name ?? form.department,
                    current_grade_id: gradeBelongsToDepartment(form.current_grade_id) ? form.current_grade_id : '',
                    target_grade_id: gradeBelongsToDepartment(form.target_grade_id) ? form.target_grade_id : '',
                  });
                }} placeholder="Select department…" options={deptOptions} />
              </div>
              <div><label className={L}>Email</label><input type="email" className={F} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Current Grade</label>
                <SearchableSelect value={form.current_grade_id} onChange={v => setForm({ ...form, current_grade_id: v })}
                  placeholder={form.department_id ? 'Select grade…' : 'Select department first'} options={gradeOptions} />
              </div>
              <div><label className={L}>Target Grade</label>
                <SearchableSelect value={form.target_grade_id} onChange={v => setForm({ ...form, target_grade_id: v })}
                  placeholder={form.department_id ? 'Select grade…' : 'Select department first'} options={gradeOptions} />
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
