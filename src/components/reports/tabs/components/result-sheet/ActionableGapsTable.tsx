import React from 'react';

interface ActionableGapsTableProps {
  gapChartData: { fullSkill: string; score: number; target: number; gap: number }[];
}

export const ActionableGapsTable: React.FC<ActionableGapsTableProps> = ({ gapChartData }) => {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Top Skill Gaps (Current vs Target Requirement)
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Priority development areas ranked by required growth
        </p>
      </div>

      {gapChartData.length === 0 ? (
        <p className="text-xs py-6 text-center text-emerald-600 font-medium">
          ✓ No open gaps. This person meets all target skill requirements!
        </p>
      ) : (
        <div className="space-y-3">
          {gapChartData.map((g) => (
            <div key={g.fullSkill} className="p-2.5 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {g.fullSkill}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-[11px]">
                    Current: <strong className="text-amber-600">{g.score}%</strong> / Target: <strong className="text-indigo-600">{g.target}%</strong>
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200">
                    Gap: -{g.gap}%
                  </span>
                </div>
              </div>

              {/* Dual Track Bar */}
              <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {/* Target Indicator Fill */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-indigo-200 dark:bg-indigo-900/60 rounded-full"
                  style={{ width: `${Math.min(100, g.target)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, g.score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
