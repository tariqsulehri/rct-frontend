import React, { useState, useEffect } from 'react';
import {
  Trophy,
  ChevronDown,
} from 'lucide-react';
import { usePromotionReadiness } from '@/hooks/useReports';
import { roundPct } from '@/lib/formatters';
import type { PromotionRow } from '@/hooks/useReports';
import apiClient from '@/lib/api';
import { Empty, Loading, ViewToggle, type View } from '../shared';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';
import { ExecutiveSummaryCards } from './components/ExecutiveSummaryCards';
import { TopPerformersList } from './components/TopPerformersList';
import { DepartmentExcellenceList } from './components/DepartmentExcellenceList';
import { ExecutiveDataTable } from './components/ExecutiveDataTable';

interface DeptBreakdownItem {
  department: string;
  headcount: number;
  avgTechScore: number;
  expectedTechScore: number;
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
  const topPerformers = allEmployees
    .filter((e) => e.total_competencies > 0)
    .sort((a, b) => roundPct(b.overall_score) - roundPct(a.overall_score))
    .slice(0, 5);

  // Ready for Promotion Candidates
  const promotionReadyCandidates = filteredEmployees.filter((e) => e.promotion_ready && !e.is_cefr_gated);

  // CEFR Gated Candidates
  const cefrGatedCandidates = filteredEmployees.filter((e) => e.promotion_ready && e.is_cefr_gated);

  // Department Excellence Leaderboard
  const deptSummary = (summaryData?.departmentBreakdown ?? [])
    .map((d: DeptBreakdownItem) => ({
      ...d,
      techPct: roundPct(d.avgTechScore),
      cefrPct: roundPct(d.cefrReadyRate),
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
      </div>

        <ExecutiveSummaryCards
          topPerformers={topPerformers}
          promotionReadyCandidates={promotionReadyCandidates}
          cefrGatedCandidates={cefrGatedCandidates}
          deptSummary={deptSummary}
        />

      {view === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <TopPerformersList topPerformers={topPerformers} />
          <DepartmentExcellenceList deptSummary={deptSummary} />
        </div>
      ) : (
        <ExecutiveDataTable filteredEmployees={filteredEmployees} />
      )}
    </div>
  );
};
