import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Building2,
  Lock,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { usePromotionReadiness } from '@/hooks/useReports';
import apiClient from '@/lib/api';
import { DataTable, Empty, Loading, PromotionRow, Stars, TR, ViewToggle, type View } from '../shared';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

interface DeptBreakdownItem {
  department: string;
  headcount: number;
  avgTechScore: number;
  cefrReadyRate: number;
}

interface ExecutiveKpiData {
  departmentBreakdown: DeptBreakdownItem[];
}

export const ExecutiveLeaderboardTab: React.FC<{ reportFilters?: ReportFilters }> = ({
  reportFilters = DEFAULT_REPORT_FILTERS,
}) => {
  const { data: readinessData, isLoading: loadingReadiness, isError: errorReadiness } = usePromotionReadiness();
  const [summaryData, setSummaryData] = useState<ExecutiveKpiData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [errorSummary, setErrorSummary] = useState<boolean>(false);
  const [view, setView] = useState<View>('chart');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  useEffect(() => {
    let active = true;
    apiClient
      .get('/reports/executive-summary')
      .then((res) => {
        if (active) {
          setSummaryData(res.data.data);
          setLoadingSummary(false);
        }
      })
      .catch(() => {
        if (active) {
          setErrorSummary(true);
          setLoadingSummary(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadingReadiness || loadingSummary) return <Loading />;
  if (errorReadiness || errorSummary) return <Empty msg="Failed to load Executive Leaderboard data." />;

  const allEmployees: PromotionRow[] = readinessData ?? [];

  // Filter employees
  const filteredEmployees = allEmployees.filter((emp) => {
    const q = reportFilters.search.trim().toLowerCase();
    const matchesSearch = !q || `${emp.full_name} ${emp.emp_code}`.toLowerCase().includes(q);
    const matchesDept =
      (selectedDept === 'all' && reportFilters.department === 'all') ||
      (selectedDept !== 'all' && emp.department === selectedDept) ||
      (reportFilters.department !== 'all' && emp.department === reportFilters.department);
    return matchesSearch && matchesDept;
  });

  // Calculate score helper
  const getScorePct = (score: number) => (score > 1 ? score : score * 100);

  // Top 10 High Performers (Leaderboard)
  const leaderboard = [...filteredEmployees]
    .sort((a, b) => getScorePct(b.overall_score) - getScorePct(a.overall_score))
    .slice(0, 10);

  // Ready for Promotion Candidates
  const promotionReadyCandidates = filteredEmployees.filter((e) => e.promotion_ready && !e.is_cefr_gated);

  // CEFR Gated Candidates
  const cefrGatedCandidates = filteredEmployees.filter((e) => e.promotion_ready && e.is_cefr_gated);

  // Department Excellence Leaderboard
  const deptSummary = (summaryData?.departmentBreakdown ?? [])
    .map((d: DeptBreakdownItem) => ({
      ...d,
      techPct: Math.round(d.avgTechScore > 1 ? d.avgTechScore : d.avgTechScore * 100),
      cefrPct: Math.round(d.cefrReadyRate > 1 ? d.cefrReadyRate : d.cefrReadyRate * 100),
    }))
    .sort((a: { techPct: number }, b: { techPct: number }) => b.techPct - a.techPct);

  // Unique departments list for quick dropdown filter
  const departments = Array.from(new Set(allEmployees.map((e) => e.department))).sort();

  return (
    <div className="space-y-5">
      {/* Top Banner Card */}
      <div className="rounded-2xl p-5 border shadow-card transition-all"
           style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'rgb(var(--warning-soft))',
                      borderColor: 'rgb(var(--warning) / 0.3)',
                      color: 'rgb(var(--warning))',
                    }}>
                <Trophy className="w-3.5 h-3.5" />
                EXECUTIVE LEADERBOARD
              </span>
              <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>Org Talent Leaderboard & Excellence Matrix</span>
            </div>
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'rgb(var(--text-1))' }}>
              Top Talent & Department Leaderboard
            </h2>
            <p className="text-xs mt-1 max-w-2xl" style={{ color: 'rgb(var(--text-2))' }}>
              Real-time executive ranking of top engineers and managers by technical score, star ratings, CEFR communication benchmarks, and promotion readiness.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="appearance-none text-xs rounded-xl px-3 py-2 pr-8 font-medium border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(var(--text-3))' }} />
            </div>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Top Performers</div>
            <div className="text-xl font-extrabold text-amber-500 mt-0.5">{leaderboard.length}</div>
            <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Highest domain scores</div>
          </div>
          <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Promotion Ready</div>
            <div className="text-xl font-extrabold text-emerald-500 mt-0.5">{promotionReadyCandidates.length}</div>
            <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Tech & CEFR verified</div>
          </div>
          <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>CEFR Blocked</div>
            <div className="text-xl font-extrabold text-rose-500 mt-0.5">{cefrGatedCandidates.length}</div>
            <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Tech ready, language gated</div>
          </div>
          <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Top Department</div>
            <div className="text-xl font-extrabold text-sky-500 mt-0.5 truncate">{deptSummary[0]?.department ?? 'N/A'}</div>
            <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>{deptSummary[0]?.techPct ?? 0}% Avg Tech Score</div>
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Individual Top Talent Leaderboard (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border p-4 shadow-xs"
               style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'rgb(var(--text-1))' }}>
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Individual Top Performers Leaderboard
                </h3>
                <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
                  Top engineers and team members ranked by weighted score performance and target grade fit.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Top 10 Rankings
              </span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.map((emp, index) => {
                const score = Math.round(getScorePct(emp.overall_score));
                const target = Math.round(emp.avg_threshold > 0 ? (emp.avg_threshold <= 1 ? emp.avg_threshold * 100 : emp.avg_threshold) : 80);
                const isReady = emp.promotion_ready && !emp.is_cefr_gated;
                const isGated = emp.promotion_ready && emp.is_cefr_gated;

                return (
                  <div
                    key={emp.employee_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          index === 0
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : index === 1
                            ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-white'
                            : index === 2
                            ? 'bg-amber-700/80 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {emp.full_name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                            {emp.emp_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {emp.department} • {emp.current_grade} → <span className="font-semibold text-indigo-600 dark:text-indigo-400">{emp.target_grade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Star Rating */}
                      <div className="hidden sm:block">
                        <Stars n={emp.star_rating} />
                      </div>

                      {/* CEFR Badge */}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        CEFR {emp.cefr_level ?? 'B2'}
                      </span>

                      {/* Score Indicator */}
                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            score >= target ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {score}% <span className="text-[10px] font-normal text-slate-400">/ {target}%</span>
                        </div>
                        <div className="text-[10px]">
                          {isReady ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                            </span>
                          ) : isGated ? (
                            <span className="text-amber-600 font-semibold flex items-center gap-0.5 justify-end">
                              <Lock className="w-2.5 h-2.5" /> Gated
                            </span>
                          ) : (
                            <span className="text-slate-400">Developing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Excellence Leaderboard (1 Col) */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Department Excellence Ranking
              </h3>
              <div className="space-y-3">
                {deptSummary.map((d: DeptBreakdownItem & { techPct: number; cefrPct: number }, i: number) => (
                  <div key={d.department} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
                          {i + 1}
                        </span>
                        {d.department}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">{d.techPct}% Tech</span>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-1">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>Tech Score Target</span>
                          <span>{d.techPct}% / 80%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.min(d.techPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>CEFR Communication Pass Rate</span>
                          <span>{d.cefrPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(d.cefrPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Executive Data Table */
        <DataTable headers={['Rank', 'Name', 'Code', 'Department', 'Grade', 'Tech Score', 'Target', 'Star Rating', 'CEFR Level', 'Status']}>
          {leaderboard.map((r, i) => {
            const score = Math.round(getScorePct(r.overall_score));
            const target = Math.round(r.avg_threshold > 0 ? (r.avg_threshold <= 1 ? r.avg_threshold * 100 : r.avg_threshold) : 80);
            const isReady = r.promotion_ready && !r.is_cefr_gated;
            const isGated = r.promotion_ready && r.is_cefr_gated;

            return (
              <TR key={r.employee_id}>
                <td className="px-4 py-3 font-black text-xs text-indigo-600 dark:text-indigo-400">#{i + 1}</td>
                <td className="px-4 py-3 font-bold text-sm text-slate-900 dark:text-white">{r.full_name}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.emp_code}</span></td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{r.department}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{r.current_grade} → {r.target_grade}</td>
                <td className="px-4 py-3 font-black text-sm text-emerald-600 dark:text-emerald-400">{score}%</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500">{target}%</td>
                <td className="px-4 py-3"><Stars n={r.star_rating} /></td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{r.cefr_level ?? 'B2'}</td>
                <td className="px-4 py-3">
                  {isReady ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      ✓ Ready
                    </span>
                  ) : isGated ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/50">
                      🔒 CEFR Gated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Developing
                    </span>
                  )}
                </td>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
};
