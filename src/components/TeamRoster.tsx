import React, { useState } from "react";
import { Search, RefreshCw, X } from "lucide-react";
import { useTeamRoster } from "@/hooks/useAssessment";
import { useAuthStore } from "@/store/authStore";
import { BulkAssessmentTable } from "@/components/BulkAssessmentTable";
import { usePromotionReadiness, PromotionRow } from "@/hooks/useReports";
import { toast } from "@/lib/toast";
import { toPctNullable } from "@/lib/formatters";
import { CefrAssessmentModal } from "@/components/communication/CefrAssessmentModal";
import { BehavioralAssessmentView } from "@/components/behavioral/BehavioralAssessmentView";

import { InfoTip } from "@/components/ui/InfoTip";

interface AssessmentModalState {
  isOpen: boolean;
  employeeId: string | null;   // emp_code e.g. "1818"
  employeeName: string | null;
}

const HeaderCell: React.FC<{ label: string; help?: string }> = ({ label, help }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgb(var(--text-2))" }}>
    <span className="inline-flex items-center gap-1">
      {label}
      {help && <InfoTip text={help} />}
    </span>
  </th>
);

const percentText = (value: number | null) => value === null ? "N/A" : `${value}%`;

export const TeamRoster: React.FC = () => {
  const [modal, setModal] = useState<AssessmentModalState>({ isOpen: false, employeeId: null, employeeName: null });
  const [commModal, setCommModal] = useState<{ isOpen: boolean; employeeId: string | null; employeeName: string | null; gradeLevel: number }>({
    isOpen: false,
    employeeId: null,
    employeeName: null,
    gradeLevel: 3,
  });
  const [behavModal, setBehavModal] = useState<{ isOpen: boolean; employeeId: string | null; employeeName: string | null; gradeCode: string | null }>({
    isOpen: false,
    employeeId: null,
    employeeName: null,
    gradeCode: null,
  });
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const { user } = useAuthStore();
  const { data: roster, isLoading, isFetching: isFetchingRoster, error, refetch: refetchRoster } = useTeamRoster();
  const { data: promotionRows, isFetching: isFetchingPromo, refetch: refetchPromo } = usePromotionReadiness();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchRoster(), refetchPromo()]);
      toast.success('Team roster refreshed from server.', 'Refreshed');
    } catch {
      toast.error('Failed to refresh roster. Please try again.', 'Refresh Failed');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const rosterRows = roster ?? [];
  const gradeOptions = Array.from(new Set(rosterRows.map((member) => member.current_grade.code)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const normalizedSearch = teamSearch.trim().toLowerCase();
  const filteredRoster = rosterRows.filter((member) => {
    const matchesGrade = selectedGrade === "all" || member.current_grade.code === selectedGrade;
    if (!matchesGrade) return false;
    if (!normalizedSearch) return true;

    const searchableText = [
      member.full_name,
      member.emp_code,
      member.email,
      member.department,
      member.current_grade.code,
      member.current_grade.title,
      member.target_grade.code,
      member.target_grade.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const promoByEmployeeId = new Map((promotionRows ?? []).map((row) => [row.employee_id, row]));
  const filteredPromotions = filteredRoster
    .map((member) => promoByEmployeeId.get(member.id))
    .filter((row): row is PromotionRow => Boolean(row));
  const assessedPromotions = filteredPromotions.filter((row) => row.overall_score > 0);
  const requiredRows = filteredPromotions.filter((row) => row.avg_threshold > 0);

  const rawAvgScore = assessedPromotions.length > 0
    ? assessedPromotions.reduce((sum, row) => sum + row.overall_score, 0) / assessedPromotions.length
    : null;
  const avgScore = toPctNullable(rawAvgScore);

  const rawAvgRequired = requiredRows.length > 0
    ? requiredRows.reduce((sum, row) => sum + row.avg_threshold, 0) / requiredRows.length
    : null;
  const avgRequired = toPctNullable(rawAvgRequired) ?? 0;
  const readyCount = filteredPromotions.filter((row) => row.promotion_ready).length;
  const meetsCount = filteredPromotions.reduce((sum, row) => sum + row.meets_count, 0);
  const totalCompetencies = filteredPromotions.reduce((sum, row) => sum + row.total_competencies, 0);
  const readinessRatio = filteredPromotions.length > 0 ? readyCount / filteredPromotions.length : 0;

  const transitionCounts: Record<string, number> = {};
  filteredRoster.forEach((member) => {
    const key = `${member.current_grade.code} -> ${member.target_grade.code}`;
    transitionCounts[key] = (transitionCounts[key] || 0) + 1;
  });
  const topTransitionEntry = Object.entries(transitionCounts).sort((a, b) => b[1] - a[1])[0];
  const topTransition = topTransitionEntry?.[0] ?? "N/A";
  const topTransitionCount = topTransitionEntry?.[1] ?? 0;
  const teamGap = avgScore !== null && requiredRows.length > 0 ? avgScore - avgRequired : null;

  let statusLabel = "No Data";
  let statusBg = "rgb(var(--surface-2))";
  let statusColor = "rgb(var(--text-2))";

  if (filteredRoster.length > 0) {
    if (readinessRatio >= 0.7 && (avgScore ?? 0) >= 60) {
      statusLabel = "Healthy";
      statusBg = "rgb(var(--success-soft))";
      statusColor = "rgb(var(--success))";
    } else if (readinessRatio >= 0.4 || (avgScore ?? 0) >= 40) {
      statusLabel = "Improving";
      statusBg = "rgb(var(--warning-soft))";
      statusColor = "rgb(var(--warning))";
    } else {
      statusLabel = "Needs Attention";
      statusBg = "rgb(var(--danger-soft))";
      statusColor = "rgb(var(--danger))";
    }
  }

  if (!user)
    return (
      <p className="text-sm" style={{ color: "rgb(var(--danger))" }}>
        Please sign in to view the team list.
      </p>
    );

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="section-title">Team List</h2>
          <p className="section-desc">{filteredRoster.length} of {rosterRows.length} people shown</p>
        </div>
      </div>

      {!isLoading && rosterRows.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgb(var(--border))",
            background: "linear-gradient(135deg, rgb(var(--accent-soft)) 0%, rgb(var(--surface-2)) 100%)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Team Members</p>
                <InfoTip text="Number of people shown after filters." />
              </div>
              <p className="text-2xl font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>{filteredRoster.length}</p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>people shown</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Main Grade Move</p>
                <InfoTip text="The most common move from current grade to next grade." />
              </div>
              <p className="text-lg font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>{topTransition}</p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>{topTransitionCount} member{topTransitionCount === 1 ? "" : "s"}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Team Score</p>
                <InfoTip text="Average current score compared with the needed score." />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold leading-tight"
                  style={{ color: avgScore !== null && avgRequired > 0 ? (avgScore >= avgRequired ? "rgb(var(--success))" : "rgb(var(--danger))") : "rgb(var(--text-1))" }}>
                  {avgScore !== null ? `${avgScore}%` : "N/A"}
                </span>
                <span className="text-sm font-medium" style={{ color: "rgb(var(--text-3))" }}>/</span>
                <span className="text-sm font-semibold" style={{ color: "rgb(var(--text-2))" }}>
                  {avgRequired > 0 ? `${avgRequired}%` : 'N/A'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>
                {teamGap === null ? "current / needed" : `${teamGap >= 0 ? "+" : ""}${teamGap} points vs target`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Skills Completed</p>
                <InfoTip text="How many needed skills are complete for the people shown." />
              </div>
              <p className="text-2xl font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>
                {totalCompetencies === 0 ? 'N/A' : `${meetsCount} / ${totalCompetencies}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>{readyCount} ready</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Team Health</p>
                <InfoTip text="Healthy means many people are ready. Needs Attention means the team is below target." />
              </div>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: statusBg, color: statusColor }}>
                {statusLabel}
              </div>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>{Math.round(readinessRatio * 100)}% readiness</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "rgb(var(--danger-soft))", color: "rgb(var(--danger))" }}>
          Could not load the team list.
        </div>
      )}

      {/* Search and Filters */}
      {!isLoading && rosterRows.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-end mb-2 mt-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border w-full sm:w-auto" style={{ backgroundColor: "rgb(var(--surface-2))", borderColor: "rgb(var(--border))" }}>
            <Search size={13} style={{ color: "rgb(var(--text-3))" }} />
            <input
              type="text"
              placeholder="Search name, code, or department..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full sm:w-64"
              style={{ color: "rgb(var(--text-1))" }}
            />
            {teamSearch && (
              <button
                type="button"
                onClick={() => setTeamSearch("")}
                className="text-xs font-semibold"
                style={{ color: "rgb(var(--accent))" }}
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border w-full sm:w-auto min-w-[150px]"
            style={{ backgroundColor: "rgb(var(--surface-2))", borderColor: "rgb(var(--border))", color: "rgb(var(--text-1))" }}
          >
            <option value="all">All Grades</option>
            {gradeOptions.map((gradeCode) => (
              <option key={gradeCode} value={gradeCode}>{gradeCode}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isFetchingRoster || isFetchingPromo || isManualRefreshing}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg shrink-0"
            title="Refresh team roster from server"
          >
            <RefreshCw
              size={14}
              className={isFetchingRoster || isFetchingPromo || isManualRefreshing ? 'animate-spin' : ''}
            />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-sm" style={{ color: "rgb(var(--text-2))" }}>
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
          Loading team list...
        </div>
      )}

      {/* Empty */}
      {!isLoading && rosterRows.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: "rgb(var(--text-2))" }}>
          No team members found.
        </div>
      )}

      {!isLoading && rosterRows.length > 0 && filteredRoster.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: "rgb(var(--text-2))" }}>
          No team members match the selected filters.
        </div>
      )}

      {/* Table */}
      {!isLoading && filteredRoster.length > 0 && (
        <div className="overflow-auto rounded-xl border flex-1 min-h-0" style={{ borderColor: "rgb(var(--border))" }}>
          <table className="data-table w-full">
            <thead>
              <tr style={{ backgroundColor: "rgb(var(--surface-2))", borderBottom: "1px solid rgb(var(--border))" }}>
                <HeaderCell label="Name" />
                <HeaderCell label="Code" />
                <HeaderCell label="Department" />
                <HeaderCell label="Now" help="The person's current grade." />
                <HeaderCell label="Goal" help="The target grade this person is being measured against." />
                <HeaderCell label="Current" help="Current score from approved skill checks." />
                <HeaderCell label="Needed" help="Score needed for this person's goal grade." />
                <HeaderCell label="Gap" help="Difference between current score and needed score." />
                <HeaderCell label="Skills Met" help="Needed skills completed for the goal grade." />
                <HeaderCell label="Ready?" help="Yes means all needed skills are met." />
                <HeaderCell label="Skill Rows" help="Number of skill or tool rows saved for this person." />
                <HeaderCell label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((member) => {
                const promotion = promoByEmployeeId.get(member.id);
                const achieved = promotion ? toPctNullable(promotion.overall_score) : null;
                const required = promotion && promotion.avg_threshold > 0 ? toPctNullable(promotion.avg_threshold) : null;
                const gap = achieved !== null && required !== null ? achieved - required : null;
                const skillsMet = promotion && promotion.total_competencies > 0
                  ? `${promotion.meets_count} / ${promotion.total_competencies}`
                  : "N/A";
                const readyLabel = promotion?.promotion_ready ? "Yes" : "No";

                return (
                  <tr
                    key={member.id}
                    style={{ borderBottom: "1px solid rgb(var(--border))" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(var(--surface-2) / 0.5)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-h)))" }}
                        >
                          {member.full_name[0]}
                        </div>
                        <span className="font-medium text-sm" style={{ color: "rgb(var(--text-1))" }}>
                          {member.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold" style={{ color: "rgb(var(--accent))" }}>
                        {member.emp_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "rgb(var(--text-2))" }}>
                      {member.department}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-accent text-xs font-bold">{member.current_grade.code}</span>
                      <span className="text-xs ml-1" style={{ color: "rgb(var(--text-3))" }}>
                        {member.current_grade.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge text-xs" style={{ backgroundColor: "rgb(var(--surface-2))", color: "rgb(var(--text-2))" }}>
                        {member.target_grade.code}
                      </span>
                      <span className="text-xs ml-1" style={{ color: "rgb(var(--text-3))" }}>
                        {member.target_grade.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "rgb(var(--text-1))" }}>
                      {percentText(achieved)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "rgb(var(--text-2))" }}>
                      {percentText(required)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: gap === null ? "rgb(var(--text-3))" : gap >= 0 ? "rgb(var(--success))" : "rgb(var(--danger))" }}
                      >
                        {gap === null ? "N/A" : `${gap >= 0 ? "+" : ""}${gap} pts`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "rgb(var(--text-2))" }}>
                      {skillsMet}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: promotion?.promotion_ready ? "rgb(var(--success-soft))" : "rgb(var(--danger-soft))",
                          color: promotion?.promotion_ready ? "rgb(var(--success))" : "rgb(var(--danger))",
                        }}
                      >
                        {readyLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-success">{member.skill_assessments_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setModal({ isOpen: true, employeeId: member.emp_code, employeeName: member.full_name })}
                          className="btn-secondary text-xs py-1.5 px-2.5 whitespace-nowrap"
                        >
                          Skills
                        </button>
                        <button
                          onClick={() => setCommModal({ isOpen: true, employeeId: member.emp_code, employeeName: member.full_name, gradeLevel: member.current_grade.level })}
                          className="text-xs py-1.5 px-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-bold whitespace-nowrap"
                          title="Evaluate CEFR Communication"
                        >
                          CEFR
                        </button>
                        <button
                          onClick={() => setBehavModal({ isOpen: true, employeeId: member.emp_code, employeeName: member.full_name, gradeCode: member.current_grade.code })}
                          className="text-xs py-1.5 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 font-bold whitespace-nowrap"
                          title="Evaluate Behavioral Competencies"
                        >
                          Behavioral
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment Modal */}
      {modal.isOpen && modal.employeeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          style={{
            backgroundColor: "rgb(0 0 0 / 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-[1700px] h-[92vh] rounded-2xl shadow-elevated animate-scale-in overflow-hidden"
            style={{
              backgroundColor: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
            }}
          >
            <div className="h-full overflow-y-auto">
              <div className="p-4 sm:p-6 h-full">
                <BulkAssessmentTable
                  employeeId={modal.employeeId}
                  employeeName={modal.employeeName ?? undefined}
                  canApprove
                  onSuccess={() => {
                    refetchRoster();
                    refetchPromo();
                  }}
                  onClose={() => setModal({ isOpen: false, employeeId: null, employeeName: null })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEFR Communication Modal */}
      {commModal.isOpen && commModal.employeeId && (
        <CefrAssessmentModal
          isOpen={commModal.isOpen}
          onClose={() => setCommModal({ isOpen: false, employeeId: null, employeeName: null, gradeLevel: 3 })}
          employeeId={commModal.employeeId}
          employeeName={commModal.employeeName || 'Employee'}
          currentGradeLevel={commModal.gradeLevel}
        />
      )}

      {/* Behavioral Assessment Modal */}
      {behavModal.isOpen && behavModal.employeeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          style={{
            backgroundColor: "rgb(0 0 0 / 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-[1500px] h-[92vh] rounded-2xl shadow-elevated animate-scale-in overflow-hidden flex flex-col"
            style={{
              backgroundColor: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Behavioral Evaluation: {behavModal.employeeName}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Evaluate leadership, ownership, problem solving, and collaborative competencies.
                </p>
              </div>
              <button
                onClick={() => setBehavModal({ isOpen: false, employeeId: null, employeeName: null, gradeCode: null })}
                className="btn-ghost p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <BehavioralAssessmentView
                employeeId={behavModal.employeeId}
                employeeName={behavModal.employeeName ?? undefined}
                gradeCode={behavModal.gradeCode ?? undefined}
                canAssess={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
