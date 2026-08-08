import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { ContextualHelpCallout } from '@/components/common/ContextualHelpCallout';

interface YoYRow {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
  current_grade: string;
  currentScore: number;
  periodScores: Record<string, number>;
}

export const YoYGrowthTab: React.FC = () => {
  const [periods, setPeriods] = useState<string[]>([]);
  const [employees, setEmployees] = useState<YoYRow[]>([]);
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

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 mx-auto border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Calculating Multi-Year YoY Growth Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ContextualHelpCallout title="Multi-Year YoY Growth & Historical Progression">
        Tracks year-over-year competency score progression across fiscal appraisal periods (<strong className="text-indigo-600">CY2024 ➔ CY2025 ➔ CY2026</strong>). Demonstrates individual skill velocity and team talent development over time.
      </ContextualHelpCallout>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Year-over-Year Progression Matrix
          </h3>
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
                const firstPeriodScore = periods.length > 0 ? emp.periodScores[periods[0]] ?? 0 : 0;
                const latestPeriodScore = periods.length > 0 ? emp.periodScores[periods[periods.length - 1]] ?? 0 : 0;
                const growth = Number((latestPeriodScore - firstPeriodScore).toFixed(1));

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
                    {periods.map((p) => (
                      <td key={p} className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {emp.periodScores[p]}%
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +{growth}%
                      </span>
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
