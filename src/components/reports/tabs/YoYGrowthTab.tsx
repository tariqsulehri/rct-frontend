import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { ContextualHelpCallout } from '@/components/common/ContextualHelpCallout';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

interface YoYRow {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
  current_grade: string;
  currentScore: number;
  periodScores: Record<string, number | null>;
}

export const YoYGrowthTab: React.FC<{ reportFilters?: ReportFilters }> = ({
  reportFilters = DEFAULT_REPORT_FILTERS,
}) => {
  const [periods, setPeriods] = useState<string[]>([]);
  const [allEmployees, setEmployees] = useState<YoYRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchYoYData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/reports/yoy-growth');
        setPeriods(response.data.data.periods || []);
        setEmployees(response.data.data.employees || []);
      } catch {
        setPeriods([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchYoYData();
  }, []);

  const q = reportFilters.search.trim().toLowerCase();
  const employees = allEmployees.filter((emp) => {
    const matchesSearch = !q || `${emp.full_name} ${emp.emp_code}`.toLowerCase().includes(q);
    const matchesDepartment = reportFilters.department === 'all' || emp.department === reportFilters.department;
    const matchesCurrent = reportFilters.currentGrade === 'all' || emp.current_grade === reportFilters.currentGrade;
    return matchesSearch && matchesDepartment && matchesCurrent;
  });

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 mx-auto border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Calculating Multi-Year YoY Growth Analytics...</p>
      </div>
    );
  }

  const periodSummaryText = periods.join(' ➔ ') || 'Current Evaluation';

  return (
    <div className="space-y-4">
      <ContextualHelpCallout title="Multi-Year YoY Growth & Historical Progression">
        Tracks year-over-year competency score progression across fiscal appraisal periods (<strong className="text-indigo-600">{periodSummaryText}</strong>). Authentically reflects stored database evaluations without simulated metrics.
      </ContextualHelpCallout>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Year-over-Year Progression Matrix
            </h3>
          </div>
          {periods.length === 1 && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              Active Evaluation Baseline ({periods[0]} Database Scores)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                <th className="py-2.5 px-3 font-bold">Employee</th>
                <th className="py-2.5 px-3 font-bold">Department</th>
                <th className="py-2.5 px-3 font-bold">Current Grade</th>
                {periods.map((p) => (
                  <th key={p} className="py-2.5 px-3 font-bold text-center">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p}
                    </span>
                  </th>
                ))}
                <th className="py-2.5 px-3 font-bold text-right">YoY Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const validScores = periods
                  .map((p) => emp.periodScores[p])
                  .filter((val): val is number => typeof val === 'number');

                const firstScore = validScores.length > 0 ? validScores[0] : null;
                const latestScore = validScores.length > 0 ? validScores[validScores.length - 1] : null;
                const growth =
                  firstScore !== null && latestScore !== null && validScores.length > 1
                    ? Number((latestScore - firstScore).toFixed(1))
                    : null;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {emp.full_name} <span className="text-slate-400 font-normal">({emp.emp_code})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {emp.department}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                      {emp.current_grade}
                    </td>
                    {periods.map((p) => {
                      const scoreVal = emp.periodScores[p];
                      return (
                        <td key={p} className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {scoreVal !== null && scoreVal !== undefined ? (
                            `${scoreVal}%`
                          ) : (
                            <span className="text-slate-400 font-normal">N/A</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right">
                      {growth !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-black ${growth >= 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'} px-2 py-0.5 rounded-full border`}>
                          <ArrowUpRight className="w-3.5 h-3.5" /> {growth >= 0 ? `+${growth}%` : `${growth}%`}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Baseline Set</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
