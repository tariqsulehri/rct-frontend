import React, { useState } from "react";
import { Info, Search } from "lucide-react";
import { useTeamRoster } from "@/hooks/useAssessment";
import { useAuthStore } from "@/store/authStore";
import { BulkAssessmentTable } from "@/components/BulkAssessmentTable";
import { usePromotionReadiness, PromotionRow } from "@/hooks/useReports";

interface AssessmentModalState {
  isOpen: boolean;
  employeeId: string | null;   // emp_code e.g. "1818"
  employeeName: string | null;
}

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <button
    type="button"
    className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
    title={text}
    aria-label={text}
  >
    <Info size={13} />
  </button>
);

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
  const [department, setDepartment] = useState<string | undefined>();
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const { user } = useAuthStore();
  const { data: roster, isLoading, error } = useTeamRoster(department);
  const { data: promotionRows } = usePromotionReadiness();

  const rosterRows = roster ?? [];
  const gradeOptions = Array.from(new Set(rosterRows.map((member) => member.current_grade.code)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const filteredRoster = rosterRows.filter((member) => selectedGrade === "all" || member.current_grade.code === selectedGrade);

  const promoByEmployeeId = new Map((promotionRows ?? []).map((row) => [row.employee_id, row]));
  const filteredPromotions = filteredRoster
    .map((member) => promoByEmployeeId.get(member.id))
    .filter((row): row is PromotionRow => Boolean(row));
  const assessedPromotions = filteredPromotions.filter((row) => row.overall_score > 0);
  const requiredRows = filteredPromotions.filter((row) => row.avg_threshold > 0);

  const avgScore = assessedPromotions.length > 0
    ? Math.round((assessedPromotions.reduce((sum, row) => sum + row.overall_score, 0) / assessedPromotions.length) * 100)
    : null;
  const avgRequired = requiredRows.length > 0
    ? Math.round((requiredRows.reduce((sum, row) => sum + row.avg_threshold, 0) / requiredRows.length) * 100)
    : 0;
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
        Please log in to view team roster.
      </p>
    );

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="section-title">Team Roster</h2>
          <p className="section-desc">{filteredRoster.length} of {rosterRows.length} resources shown</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: "rgb(var(--surface-2))", borderColor: "rgb(var(--border))" }}>
            <Search size={13} style={{ color: "rgb(var(--text-3))" }} />
            <input
              type="text"
              placeholder="Search department…"
              value={department || ""}
              onChange={(e) => setDepartment(e.target.value || undefined)}
              className="bg-transparent text-sm outline-none w-48"
              style={{ color: "rgb(var(--text-1))" }}
            />
            {department && (
              <button
                type="button"
                onClick={() => setDepartment(undefined)}
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
            className="rounded-lg px-3 py-2 text-sm border min-w-[150px]"
            style={{ backgroundColor: "rgb(var(--surface-2))", borderColor: "rgb(var(--border))", color: "rgb(var(--text-1))" }}
          >
            <option value="all">All Grades</option>
            {gradeOptions.map((gradeCode) => (
              <option key={gradeCode} value={gradeCode}>{gradeCode}</option>
            ))}
          </select>
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
                <InfoTip text="Number of people currently visible after filters." />
              </div>
              <p className="text-2xl font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>{filteredRoster.length}</p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>resources shown</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Main Grade Move</p>
                <InfoTip text="The most common current-grade to target-grade path in this filtered team." />
              </div>
              <p className="text-lg font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>{topTransition}</p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>{topTransitionCount} member{topTransitionCount === 1 ? "" : "s"}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Team Score</p>
                <InfoTip text="Average current score for assessed visible resources, compared with the average required target." />
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
                {teamGap === null ? "current / required" : `${teamGap >= 0 ? "+" : ""}${teamGap} points vs target`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Skills Completed</p>
                <InfoTip text="How many required skills are complete across the visible resources." />
              </div>
              <p className="text-2xl font-bold leading-tight mt-1" style={{ color: "rgb(var(--text-1))" }}>
                {totalCompetencies === 0 ? 'N/A' : `${meetsCount} / ${totalCompetencies}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgb(var(--text-2))" }}>{readyCount} ready</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-3))" }}>Team Health</p>
                <InfoTip text="Healthy means many resources are ready and the team score is strong. Needs Attention means the team is below target." />
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
          Error loading team roster.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-sm" style={{ color: "rgb(var(--text-2))" }}>
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
          Loading team roster…
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
          No team members match the selected grade filter.
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
                <HeaderCell label="Achieved" help="Current score from approved assessments." />
                <HeaderCell label="Required" help="Target score expected for this person's goal grade." />
                <HeaderCell label="Gap" help="Difference between achieved score and required score." />
                <HeaderCell label="Skills Met" help="Required skills completed for the target grade." />
                <HeaderCell label="Ready?" help="Yes means all required target-grade skills are met." />
                <HeaderCell label="Skill Entries" help="Number of individual skill or technology entries recorded for this person." />
                <HeaderCell label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((member) => {
                const promotion = promoByEmployeeId.get(member.id);
                const achieved = promotion ? Math.round(promotion.overall_score * 100) : null;
                const required = promotion && promotion.avg_threshold > 0 ? Math.round(promotion.avg_threshold * 100) : null;
                const gap = promotion && promotion.avg_threshold > 0
                  ? Math.round((promotion.overall_score - promotion.avg_threshold) * 100)
                  : null;
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
                      <button
                        onClick={() => setModal({ isOpen: true, employeeId: member.emp_code, employeeName: member.full_name })}
                        className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                      >
                        Assess Skills
                      </button>
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
                  onSuccess={() => {}}
                  onClose={() => setModal({ isOpen: false, employeeId: null, employeeName: null })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
