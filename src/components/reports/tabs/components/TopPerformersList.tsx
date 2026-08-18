import React from 'react';
import { Trophy, CheckCircle2, Lock } from 'lucide-react';
import type { PromotionRow } from '@/hooks/useReports';
import { toPct } from '@/lib/formatters';
import { Stars } from '../../shared';

interface TopPerformersListProps {
  topPerformers: PromotionRow[];
}

export const TopPerformersList: React.FC<TopPerformersListProps> = ({ topPerformers }) => {
  return (
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
        {topPerformers.map((emp, index) => {
          const score = toPct(emp.overall_score);
          const target = toPct(emp.avg_threshold);
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
  );
};
