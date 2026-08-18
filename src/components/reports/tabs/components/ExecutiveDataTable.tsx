import React from 'react';
import type { PromotionRow } from '@/hooks/useReports';
import { DataTable, TR, Stars } from '../../shared';
import { toPct } from '@/lib/formatters';

interface ExecutiveDataTableProps {
  filteredEmployees: PromotionRow[];
}

export const ExecutiveDataTable: React.FC<ExecutiveDataTableProps> = ({ filteredEmployees }) => {
  return (
    <DataTable headers={['Rank', 'Name', 'Code', 'Department', 'Grade', 'Tech Score', 'Target', 'Star Rating', 'CEFR Level', 'Status']}>
      {filteredEmployees.map((r, i) => {
        const score = toPct(r.overall_score);
        const target = toPct(r.avg_threshold);
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
  );
};
