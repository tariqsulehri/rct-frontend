import React from 'react';
import { AlertCircle, Check, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { useApproveAssessment, useDeleteAssessment, usePendingApprovals, PendingApproval } from '@/hooks/useAssessment';
import { useConfigAssessmentLevels, useConfigAssessmentProjects, useConfigAssessmentTypes } from '@/hooks/useConfig';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

type ApprovalDraft = {
  type: PendingApproval['type'];
  projects: number;
  level: PendingApproval['level'];
};

const fallbackTypes: Array<{ code: PendingApproval['type']; label: string }> = [
  { code: 'Primary', label: 'Primary' },
  { code: 'Secondary', label: 'Secondary' },
  { code: 'Tertiary', label: 'Tertiary' },
];

const fallbackLevels: PendingApproval['level'][] = [
  'Expert',
  'Advanced',
  'Proficient',
  'Foundational',
  'Beginner',
  'Awareness',
  'Unset',
];

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function dateText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildDraft(row: PendingApproval): ApprovalDraft {
  return {
    type: row.type,
    projects: row.projects,
    level: row.level,
  };
}

export const PendingApprovalsPanel: React.FC = () => {
  const { data: approvals = [], isLoading, isError, refetch, isFetching } = usePendingApprovals();
  const approveAssessment = useApproveAssessment();
  const deleteAssessment = useDeleteAssessment();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data: typeConfigs = [] } = useConfigAssessmentTypes();
  const { data: levelConfigs = [] } = useConfigAssessmentLevels();
  const { data: projectConfigs = [] } = useConfigAssessmentProjects();
  const [search, setSearch] = React.useState('');
  const [drafts, setDrafts] = React.useState<Record<number, ApprovalDraft>>({});
  const [rowErrors, setRowErrors] = React.useState<Record<number, string>>({});
  const [savingIds, setSavingIds] = React.useState<Set<number>>(new Set());
  const [rejectingIds, setRejectingIds] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      approvals.forEach((row) => {
        if (!next[row.id]) next[row.id] = buildDraft(row);
      });
      Object.keys(next).forEach((id) => {
        if (!approvals.some((row) => row.id === Number(id))) delete next[Number(id)];
      });
      return next;
    });
  }, [approvals]);

  const typeOptions = typeConfigs.length > 0
    ? typeConfigs.filter((type) => type.is_active).map((type) => ({ code: type.code as PendingApproval['type'], label: type.label }))
    : fallbackTypes;

  const levelOptions = levelConfigs.length > 0
    ? levelConfigs.filter((level) => level.is_active).map((level) => level.code as PendingApproval['level'])
    : fallbackLevels;

  const projectOptions = projectConfigs.length > 0
    ? projectConfigs.filter((project) => project.is_active).map((project) => project.project_count)
    : [0, 1, 2, 3];

  const filteredApprovals = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return approvals;
    return approvals.filter((row) => [
      row.employee_name,
      row.employee_id,
      row.department,
      row.domain_name,
      row.competency_name,
      row.technology_name,
      row.submitted_by,
    ].join(' ').toLowerCase().includes(query));
  }, [approvals, search]);

  const updateDraft = (id: number, patch: Partial<ApprovalDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? buildDraft(approvals.find((row) => row.id === id)!)), ...patch },
    }));
  };

  const approveRow = async (row: PendingApproval) => {
    const draft = drafts[row.id] ?? buildDraft(row);
    setSavingIds((current) => new Set(current).add(row.id));
    setRowErrors((current) => ({ ...current, [row.id]: '' }));

    try {
      await approveAssessment.mutateAsync({
        id: row.id,
        data: draft,
      });
      toast.success(`Approved assessment for "${row.employee_name}" - ${row.competency_name}.`, 'Assessment Approved');
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Approval failed. Try again.');
      setRowErrors((current) => ({
        ...current,
        [row.id]: msg,
      }));
      toast.error(msg, 'Approval Error');
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  };

  const rejectRow = async (row: PendingApproval) => {
    const confirmed = await confirm({
      title: 'Reject Skill Submission',
      message: `Are you sure you want to reject the skill submission for "${row.employee_name}" (${row.technology_name} - ${row.competency_name})? This will remove it from pending approvals.`,
      confirmLabel: 'Reject Submission',
      variant: 'danger',
    });
    if (!confirmed) return;

    setRejectingIds((current) => new Set(current).add(row.id));
    setRowErrors((current) => ({ ...current, [row.id]: '' }));

    try {
      await deleteAssessment.mutateAsync(row.id);
      toast.info(`Rejected skill submission for "${row.employee_name}" - ${row.technology_name}.`, 'Submission Rejected');
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Rejection failed. Try again.');
      setRowErrors((current) => ({
        ...current,
        [row.id]: msg,
      }));
      toast.error(msg, 'Rejection Error');
    } finally {
      setRejectingIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  };

  return (
    <>
      {confirmDialog}
      <section className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: 'rgb(var(--accent))' }} />
              <h3 className="text-lg font-bold leading-tight" style={{ color: 'rgb(var(--text-1))' }}>
                Pending Approvals
              </h3>
            </div>
            <p className="text-xs mt-1 max-w-3xl" style={{ color: 'rgb(var(--text-3))' }}>
              Review skill rows submitted by engineers. Approved rows count in reports and readiness scores.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary text-xs inline-flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-center">
          <label className="relative block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-3))' }} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search person, department, skill, or tool..."
              className="field w-full h-10 pl-9"
            />
          </label>
          <span
            className="rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap"
            style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: '#f97316' }}
          >
            {approvals.length} waiting
          </span>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm" style={{ color: 'rgb(var(--text-2))' }}>
            Loading pending approvals...
          </div>
        )}

        {isError && (
          <div className="rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2" style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}>
            <AlertCircle size={15} />
            Could not load pending approvals.
          </div>
        )}

        {!isLoading && !isError && approvals.length === 0 && (
          <div className="rounded-lg px-4 py-6 text-center text-sm" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
            No pending approvals right now.
          </div>
        )}

        {!isLoading && !isError && approvals.length > 0 && (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'rgb(var(--border))' }}>
            <table className="w-full text-xs" style={{ minWidth: '1050px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(var(--surface-2))', borderBottom: '1px solid rgb(var(--border))' }}>
                  {['Person', 'Skill Area', 'Skill', 'Tool', 'Importance', 'Projects', 'Level', 'Score', 'Submitted', 'Action'].map((header) => (
                    <th key={header} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                {filteredApprovals.map((row) => {
                  const draft = drafts[row.id] ?? buildDraft(row);
                  const isSaving = savingIds.has(row.id);
                  const isRejecting = rejectingIds.has(row.id);
                  const isProcessing = isSaving || isRejecting;
                  const error = rowErrors[row.id];

                  return (
                    <tr key={row.id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                      <td className="px-3 py-3 align-top font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                        <div>{row.employee_name}</div>
                        <div className="text-[11px] font-normal" style={{ color: 'rgb(var(--text-3))' }}>
                          {row.employee_id} {row.department ? `· ${row.department}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top" style={{ color: 'rgb(var(--text-1))' }}>{row.domain_name}</td>
                      <td className="px-3 py-3 align-top" style={{ color: 'rgb(var(--text-1))' }}>{row.competency_name}</td>
                      <td className="px-3 py-3 align-top font-medium" style={{ color: 'rgb(var(--text-1))' }}>{row.technology_name}</td>
                      <td className="px-3 py-3 align-top">
                        <select
                          className="field h-9 w-full min-w-[110px]"
                          value={draft.type}
                          onChange={(event) => updateDraft(row.id, { type: event.target.value as PendingApproval['type'] })}
                          disabled={isProcessing}
                        >
                          {typeOptions.map((type) => (
                            <option key={type.code} value={type.code}>{type.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <select
                          className="field h-9 w-full min-w-[90px]"
                          value={draft.projects}
                          onChange={(event) => updateDraft(row.id, { projects: Number(event.target.value) })}
                          disabled={isProcessing}
                        >
                          {projectOptions.map((projects) => (
                            <option key={projects} value={projects}>{projects === 3 ? '3+' : projects}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <select
                          className="field h-9 w-full min-w-[130px]"
                          value={draft.level}
                          onChange={(event) => updateDraft(row.id, { level: event.target.value as PendingApproval['level'] })}
                          disabled={isProcessing}
                        >
                          {levelOptions.map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 align-top font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{percent(row.score)}</td>
                      <td className="px-3 py-3 align-top" style={{ color: 'rgb(var(--text-2))' }}>
                        <p>{dateText(row.submitted_at)}</p>
                        <p className="mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>{row.submitted_by}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-primary text-xs inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5"
                            onClick={() => approveRow(row)}
                            disabled={isProcessing}
                            title="Approve this skill assessment"
                          >
                            {isSaving ? (
                              <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 hover:text-[rgb(var(--danger))] hover:border-[rgb(var(--danger))]"
                            onClick={() => rejectRow(row)}
                            disabled={isProcessing}
                            title="Reject and remove this skill submission"
                          >
                            {isRejecting ? (
                              <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X size={13} />
                            )}
                            Reject
                          </button>
                        </div>
                        {error && (
                          <p className="mt-2 text-[11px] leading-snug" style={{ color: 'rgb(var(--danger))' }}>
                            {error}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredApprovals.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                No pending approvals match your search.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};
