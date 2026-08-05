import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  Archive,
  FileEdit,
  Sparkles,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ActionBtns, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import {
  ConfigAppraisalPeriod,
  CreateAppraisalPeriodPayload,
  useAppraisalPeriods,
  useCreateAppraisalPeriod,
  useDeleteAppraisalPeriod,
  useUpdateAppraisalPeriod,
} from '@/hooks/useConfig';

const F = 'field';
const L = 'field-label';

const PERIOD_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Annual (Full Year)' },
  { value: 'BIANNUAL', label: 'Biannual (6 Months / Half-Year)' },
  { value: 'QUARTERLY', label: 'Quarterly (3 Months)' },
  { value: 'CUSTOM', label: 'Custom Window' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft (Setup in progress, not visible to engineers)' },
  { value: 'OPEN', label: 'Open (Engineers & managers can submit appraisals)' },
  { value: 'LOCKED', label: 'Locked (Review period closed, scores finalized)' },
  { value: 'ARCHIVED', label: 'Archived (Historical reference only)' },
];

const formatDateInput = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: ConfigAppraisalPeriod['status']) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle size={12} /> Open
        </span>
      );
    case 'LOCKED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Lock size={12} /> Locked
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <Archive size={12} /> Archived
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <FileEdit size={12} /> Draft
        </span>
      );
  }
};

export const EvaluationPeriodsSection: React.FC = () => {
  const { data: periods, isLoading, isError } = useAppraisalPeriods();
  const createPeriod = useCreateAppraisalPeriod();
  const updatePeriod = useUpdateAppraisalPeriod();
  const deletePeriod = useDeleteAppraisalPeriod();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ConfigAppraisalPeriod | null>(null);
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState<{
    code: string;
    name: string;
    period_type: 'ANNUAL' | 'BIANNUAL' | 'QUARTERLY' | 'CUSTOM';
    calendar_year: number;
    start_date: string;
    end_date: string;
    grace_period_end: string;
    status: 'DRAFT' | 'OPEN' | 'LOCKED' | 'ARCHIVED';
    is_active: boolean;
    allow_self_submission: boolean;
    auto_rollover_skills: boolean;
  }>({
    code: `CY${currentYear}`,
    name: `${currentYear} Annual Performance Review`,
    period_type: 'ANNUAL',
    calendar_year: currentYear,
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-10-31`,
    grace_period_end: `${currentYear}-11-15`,
    status: 'OPEN',
    is_active: true,
    allow_self_submission: true,
    auto_rollover_skills: true,
  });

  const activePeriod = useMemo(() => periods?.find(p => p.is_active), [periods]);
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    periods?.forEach(p => years.add(p.calendar_year));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [periods, currentYear]);

  const yearOptions = [
    { value: '', label: 'All Years' },
    ...availableYears.map(y => ({ value: String(y), label: `Year ${y}` })),
  ];

  const openCreate = () => {
    const defaultYear = currentYear;
    setForm({
      code: `CY${defaultYear}`,
      name: `${defaultYear} Annual Performance Review`,
      period_type: 'ANNUAL',
      calendar_year: defaultYear,
      start_date: `${defaultYear}-01-01`,
      end_date: `${defaultYear}-10-31`,
      grace_period_end: `${defaultYear}-11-15`,
      status: 'DRAFT',
      is_active: false,
      allow_self_submission: true,
      auto_rollover_skills: true,
    });
    setEditing(null);
    setModal('create');
  };

  const openEdit = (p: ConfigAppraisalPeriod) => {
    setForm({
      code: p.code,
      name: p.name,
      period_type: p.period_type,
      calendar_year: p.calendar_year,
      start_date: formatDateInput(p.start_date),
      end_date: formatDateInput(p.end_date),
      grace_period_end: formatDateInput(p.grace_period_end),
      status: p.status,
      is_active: p.is_active,
      allow_self_submission: p.allow_self_submission,
      auto_rollover_skills: p.auto_rollover_skills,
    });
    setEditing(p);
    setModal('edit');
  };

  const handleSave = async () => {
    const payload: CreateAppraisalPeriodPayload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      period_type: form.period_type,
      calendar_year: Number(form.calendar_year),
      start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date().toISOString(),
      grace_period_end: form.grace_period_end ? new Date(form.grace_period_end).toISOString() : null,
      status: form.status,
      is_active: form.is_active,
      allow_self_submission: form.allow_self_submission,
      auto_rollover_skills: form.auto_rollover_skills,
    };

    if (modal === 'create') {
      await createPeriod.mutateAsync(payload);
    } else if (editing) {
      await updatePeriod.mutateAsync({ id: editing.id, data: payload });
    }
    setModal(null);
  };

  const handleSetActive = async (period: ConfigAppraisalPeriod) => {
    const ok = await confirm({
      title: `Set Active Cycle: ${period.name}`,
      message: `Are you sure you want to make "${period.name} (${period.code})" the active appraisal cycle? This will become the primary period for live engineer submissions and scores.`,
      confirmLabel: 'Set as Active',
    });
    if (ok) {
      await updatePeriod.mutateAsync({ id: period.id, data: { is_active: true } });
    }
  };

  const filteredPeriods = useMemo(() => {
    return (periods ?? []).filter(p => {
      if (yearFilter && String(p.calendar_year) !== yearFilter) return false;
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;
      return true;
    });
  }, [periods, yearFilter, statusFilter]);

  const ts = useTableState(
    filteredPeriods,
    (p, q) =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      String(p.calendar_year).includes(q) ||
      p.period_type.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q),
    (a, b) => b.calendar_year - a.calendar_year || new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <>
      {confirmDialog}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Active Live Period</p>
            <h4 className="text-base font-bold truncate text-white" title={activePeriod?.name ?? 'None Active'}>
              {activePeriod ? `${activePeriod.name} (${activePeriod.code})` : 'No Active Cycle Set'}
            </h4>
            <p className="text-xs text-[rgb(var(--text-3))]">
              {activePeriod ? `Year ${activePeriod.calendar_year} • Open for appraisals` : 'Set an active period below'}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <Calendar size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Total Review Periods</p>
            <h4 className="text-base font-bold text-white">
              {periods?.length ?? 0} Configured Cycles
            </h4>
            <p className="text-xs text-[rgb(var(--text-3))]">Multi-year history available</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-purple-500">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Multi-Year Analysis</p>
            <h4 className="text-base font-bold text-white">
              {availableYears.length} Calendar Years
            </h4>
            <p className="text-xs text-[rgb(var(--text-3))]">
              {availableYears.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Shell */}
      <TableShell
        tabKey="appraisal-periods"
        title="Evaluation & Appraisal Periods"
        onAdd={openCreate}
        addLabel="New Period"
        headers={[
          'Period Code',
          'Period Name',
          'Year',
          'Type',
          'Timeline Window',
          'Self-Submission',
          'Status',
          'Active Cycle',
        ]}
        loading={isLoading}
        error={isError}
        q={ts.q}
        onSearch={ts.onSearch}
        page={ts.page}
        total={ts.filtered.length}
        onPage={ts.setPage}
        toolbarExtra={
          <>
            <div className="w-full sm:w-44 shrink-0">
              <SearchableSelect
                value={yearFilter}
                onChange={v => {
                  setYearFilter(v);
                  ts.setPage(1);
                }}
                options={yearOptions}
                placeholder="All Years"
              />
            </div>
            <StatusFilterSelect
              value={statusFilter}
              onChange={v => {
                setStatusFilter(v);
                ts.setPage(1);
              }}
            />
          </>
        }
      >
        {ts.paged.map((p, idx) => (
          <TR key={p.id} idx={idx} inactive={!p.is_active}>
            {/* Code */}
            <TD>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white px-2 py-1 rounded bg-[rgb(var(--bg-card-hover))] border border-[rgb(var(--border))]">
                  {p.code}
                </span>
                {p.is_active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Active Cycle" />
                )}
              </div>
            </TD>

            {/* Name */}
            <TD>
              <span className="font-semibold text-white">{p.name}</span>
            </TD>

            {/* Year */}
            <TD>
              <span className="text-xs font-medium text-slate-300">{p.calendar_year}</span>
            </TD>

            {/* Type */}
            <TD>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {p.period_type}
              </span>
            </TD>

            {/* Timeline Window */}
            <TD>
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Calendar size={12} className="text-[rgb(var(--accent))]" />
                  <span>{formatDateDisplay(p.start_date)} – {formatDateDisplay(p.end_date)}</span>
                </div>
                {p.grace_period_end && (
                  <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--text-3))]">
                    <Clock size={11} className="text-amber-400" />
                    <span>Grace: {formatDateDisplay(p.grace_period_end)}</span>
                  </div>
                )}
              </div>
            </TD>

            {/* Self-Submission */}
            <TD>
              {p.allow_self_submission ? (
                <span className="text-xs text-emerald-400 font-medium">Allowed</span>
              ) : (
                <span className="text-xs text-slate-400">Managers Only</span>
              )}
            </TD>

            {/* Status */}
            <TD>{getStatusBadge(p.status)}</TD>

            {/* Active Cycle */}
            <TD>
              {p.is_active ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle size={12} /> Active Cycle
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetActive(p)}
                  className="text-xs px-2.5 py-1 rounded font-medium transition-colors bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white"
                >
                  Make Active
                </button>
              )}
            </TD>

            {/* Actions */}
            <ActionBtns
              onEdit={() => openEdit(p)}
              onDelete={async () => {
                const ok = await confirm({
                  title: `Delete Period: ${p.name}`,
                  message: `Are you sure you want to delete "${p.name} (${p.code})"? This action cannot be undone.`,
                  confirmLabel: 'Delete Period',
                });
                if (ok) {
                  await deletePeriod.mutateAsync(p.id);
                }
              }}
            />
          </TR>
        ))}
      </TableShell>

      {/* Create / Edit Period Modal */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Create Evaluation Period' : `Edit Evaluation Period: ${editing?.name}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="space-y-4">
            {/* Info Banner for Laymen */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2.5 items-start">
              <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200 space-y-1">
                <p className="font-semibold text-blue-100">About Evaluation Periods</p>
                <p>
                  Evaluation periods group skill assessments into distinct cycles (e.g. 2024, 2025, 2026).
                  Only one period is marked as <strong>Active</strong> for current live appraisals.
                </p>
              </div>
            </div>

            {/* Grid 1: Code and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className={L}>Period Code</label>
                <input
                  type="text"
                  className={F}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. CY2026"
                  required
                />
                <span className="text-[11px] text-[rgb(var(--text-3))]">Unique identifier</span>
              </div>

              <div className="sm:col-span-2">
                <label className={L}>Period Name</label>
                <input
                  type="text"
                  className={F}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 2026 Annual Performance Review"
                  required
                />
              </div>
            </div>

            {/* Grid 2: Year, Type, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={L}>Calendar Year</label>
                <input
                  type="number"
                  className={F}
                  value={form.calendar_year}
                  onChange={e => setForm(f => ({ ...f, calendar_year: Number(e.target.value) }))}
                  min={2000}
                  max={2100}
                  required
                />
              </div>

              <div>
                <label className={L}>Period Type</label>
                <select
                  className={F}
                  value={form.period_type}
                  onChange={e => setForm(f => ({ ...f, period_type: e.target.value as any }))}
                >
                  {PERIOD_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={L}>Status</label>
                <select
                  className={F}
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 3: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={L}>Start Date</label>
                <input
                  type="date"
                  className={F}
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className={L}>End Date</label>
                <input
                  type="date"
                  className={F}
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className={L}>Grace Period End (Optional)</label>
                <input
                  type="date"
                  className={F}
                  value={form.grace_period_end}
                  onChange={e => setForm(f => ({ ...f, grace_period_end: e.target.value }))}
                />
              </div>
            </div>

            {/* Checkboxes & Switches */}
            <div className="p-3.5 rounded-lg bg-[rgb(var(--bg-card-hover))] border border-[rgb(var(--border))] space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-[rgb(var(--border))] text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white">Set as Active Appraisal Cycle</span>
                  <p className="text-xs text-[rgb(var(--text-3))]">
                    Makes this period the active target for engineer score submissions. (Deactivates other periods)
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_self_submission}
                  onChange={e => setForm(f => ({ ...f, allow_self_submission: e.target.checked }))}
                  className="rounded border-[rgb(var(--border))] text-[rgb(var(--accent))] focus:ring-[rgb(var(--accent))] w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white">Allow Self-Submission</span>
                  <p className="text-xs text-[rgb(var(--text-3))]">
                    Enables engineers to submit their own self-evaluations during this cycle.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.auto_rollover_skills}
                  onChange={e => setForm(f => ({ ...f, auto_rollover_skills: e.target.checked }))}
                  className="rounded border-[rgb(var(--border))] text-[rgb(var(--accent))] focus:ring-[rgb(var(--accent))] w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white">Auto-Rollover Verified Baseline</span>
                  <p className="text-xs text-[rgb(var(--text-3))]">
                    Automatically carries forward previously approved skills as starting baseline.
                  </p>
                </div>
              </label>
            </div>

            <FormFooter
              onCancel={() => setModal(null)}
              onSave={handleSave}
              saving={createPeriod.isPending || updatePeriod.isPending}
            />
          </div>
        </Modal>
      )}
    </>
  );
};
