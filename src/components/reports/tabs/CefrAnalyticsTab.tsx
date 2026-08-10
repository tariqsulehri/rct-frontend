import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { ContextualHelpCallout } from '@/components/common/ContextualHelpCallout';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

interface CombinedMatrixItem {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
  current_grade: string;
  target_grade: string;
  techScore: number;
  cefrLevel: string;
  cefrExpected: string;
  isCefrGated: boolean;
  overallStatus: 'READY' | 'GATED' | 'BELOW';
}

export const CefrAnalyticsTab: React.FC<{ reportFilters?: ReportFilters }> = ({
  reportFilters = DEFAULT_REPORT_FILTERS,
}) => {
  const [allEmployees, setEmployees] = useState<CombinedMatrixItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/reports/combined-matrix');
        setEmployees(response.data.data.employees || []);
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchMatrixData();
  }, []);

  const q = reportFilters.search.trim().toLowerCase();
  const employees = allEmployees.filter((emp) => {
    const matchesSearch = !q || `${emp.full_name} ${emp.emp_code}`.toLowerCase().includes(q);
    const matchesDepartment = reportFilters.department === 'all' || emp.department === reportFilters.department;
    const matchesCurrent = reportFilters.currentGrade === 'all' || emp.current_grade === reportFilters.currentGrade;
    const matchesTarget = reportFilters.targetGrade === 'all' || emp.target_grade === reportFilters.targetGrade;
    const isReady = emp.overallStatus === 'READY';
    const isGated = emp.overallStatus === 'GATED';
    const matchesReadiness =
      reportFilters.readiness === 'all' ||
      (reportFilters.readiness === 'ready' && isReady) ||
      (reportFilters.readiness === 'near-ready' && isGated) ||
      (reportFilters.readiness === 'not-ready' && !isReady);
    return matchesSearch && matchesDepartment && matchesCurrent && matchesTarget && matchesReadiness;
  });

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 mx-auto border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading CEFR Communication Analytics...</p>
      </div>
    );
  }

  const gatedCount = employees.filter((e) => e.isCefrGated).length;
  const readyCount = employees.filter((e) => e.overallStatus === 'READY').length;

  return (
    <div className="space-y-4">
      <ContextualHelpCallout title="CEFR Communication & Promotion Gating Matrix">
        CEFR communication benchmarks serve as mandatory promotion gating criteria across all grade levels. Employees marked as <strong className="text-rose-600">GATED</strong> meet technical competency scores but require communication benchmark certification before final promotion approval.
      </ContextualHelpCallout>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{readyCount}</div>
            <div className="text-xs text-slate-500 font-medium">Fully Ready (Tech + CEFR)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{gatedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Blocked by CEFR Gating</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{employees.length}</div>
            <div className="text-xs text-slate-500 font-medium">Evaluated Resources</div>
          </div>
        </div>
      </div>

      {/* CEFR Employee Matrix */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                <th className="py-2.5 px-3 font-bold">Employee</th>
                <th className="py-2.5 px-3 font-bold">Department</th>
                <th className="py-2.5 px-3 font-bold">Target Grade</th>
                <th className="py-2.5 px-3 font-bold">Tech Score</th>
                <th className="py-2.5 px-3 font-bold">Current CEFR</th>
                <th className="py-2.5 px-3 font-bold">Required CEFR</th>
                <th className="py-2.5 px-3 font-bold text-right">Promotion Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {emp.full_name} <span className="text-slate-400 font-normal">({emp.emp_code})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {emp.department}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                    {emp.target_grade}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {emp.techScore}%
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {emp.cefrLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {emp.cefrExpected}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {emp.overallStatus === 'READY' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> PROMOTION READY
                      </span>
                    )}
                    {emp.overallStatus === 'GATED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <Lock className="w-3 h-3" /> CEFR GATED
                      </span>
                    )}
                    {emp.overallStatus === 'BELOW' && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        DEVELOPING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
