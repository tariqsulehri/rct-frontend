import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import {
  Users,
  Award,
  ShieldCheck,
  Building2,
  TrendingUp,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { ContextualHelpCallout } from '@/components/common/ContextualHelpCallout';

interface ExecutiveKpiData {
  kpis: {
    totalEmployees: number;
    overallOrgScore: number;
    cefrReadyRate: number;
    promotionReadyCount: number;
  };
  departmentBreakdown: Array<{
    department: string;
    headcount: number;
    avgTechScore: number;
    cefrReadyRate: number;
  }>;
}

export const ExecutiveSummaryTab: React.FC = () => {
  const [data, setData] = useState<ExecutiveKpiData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/reports/executive-summary');
        setData(response.data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load executive summary data');
      } finally {
        setLoading(false);
      }
    };
    void fetchExecutiveData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 mx-auto border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Generating Executive Org Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 rounded-2xl border border-rose-200 dark:border-rose-800">
        <p className="text-sm font-semibold">{error || 'Executive summary unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ContextualHelpCallout
        title="CEO & CTO Executive Summary Dashboard"
      >
        High-level organizational health analytics combining technical domain scores, CEFR communication benchmarks, and promotion readiness counts across all departments.
      </ContextualHelpCallout>

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data.kpis.totalEmployees}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Active Employees
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data.kpis.overallOrgScore} / 100
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Org Tech Score
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data.kpis.cefrReadyRate}%
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              CEFR Communication Ready
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data.kpis.promotionReadyCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Promotion Ready Talent
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Matrix */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Department Health & Benchmark Comparison
            </h3>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Summary
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                <th className="py-2.5 px-3 font-bold">Department</th>
                <th className="py-2.5 px-3 font-bold">Headcount</th>
                <th className="py-2.5 px-3 font-bold">Avg Technical Score</th>
                <th className="py-2.5 px-3 font-bold">CEFR Communication Ready %</th>
                <th className="py-2.5 px-3 font-bold text-right">Department Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.departmentBreakdown.map((dept) => {
                const isHealthy = dept.avgTechScore >= 75 && dept.cefrReadyRate >= 70;

                return (
                  <tr key={dept.department} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {dept.department}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {dept.headcount} Engineers
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, dept.avgTechScore)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {dept.avgTechScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, dept.cefrReadyRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {dept.cefrReadyRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isHealthy ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Healthy Target
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200">
                          Attention Needed
                        </span>
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
