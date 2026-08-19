import React from 'react';
import { Building2 } from 'lucide-react';
import { roundPct } from '@/lib/formatters';

interface DeptBreakdownItem {
  department: string;
  headcount: number;
  avgTechScore: number;
  expectedTechScore: number;
  cefrReadyRate: number;
}

interface DepartmentExcellenceListProps {
  deptSummary: DeptBreakdownItem[];
}

export const DepartmentExcellenceList: React.FC<DepartmentExcellenceListProps> = ({ deptSummary }) => {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-indigo-500" />
          Department Excellence Ranking
        </h3>
        <div className="space-y-3">
          {deptSummary.map((d, i) => {
            const techPct = roundPct(d.avgTechScore);
            const expectedTech = roundPct(d.expectedTechScore);
            const cefrPct = roundPct(d.cefrReadyRate);

            return (
              <div key={d.department} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
                      {i + 1}
                    </span>
                    {d.department}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{techPct}% Tech</span>
                </div>

                {/* Progress Bars */}
                <div className="space-y-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Tech Score Target</span>
                      <span>{techPct}% / {expectedTech}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(techPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>CEFR Communication Pass Rate</span>
                      <span>{cefrPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(cefrPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
