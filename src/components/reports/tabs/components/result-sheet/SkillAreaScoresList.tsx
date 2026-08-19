import React from 'react';
import { clampPct } from '@/lib/formatters';

interface SkillAreaScoresListProps {
  domainChartData: { fullDomain: string; score: number }[];
  thresholdPct: number | null;
}

export const SkillAreaScoresList: React.FC<SkillAreaScoresListProps> = ({
  domainChartData,
  thresholdPct,
}) => {
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Skill Area Scores (Ranked)
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Technology domains ordered by current mastery
        </p>
      </div>

      {domainChartData.length === 0 ? (
        <p className="text-xs py-8 text-center text-slate-400">No domain score data available.</p>
      ) : (
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {domainChartData.map((d) => {
            const meets = thresholdPct !== null && d.score >= thresholdPct;

            return (
              <div key={d.fullDomain} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                    {d.fullDomain}
                  </span>
                  <span className={`font-bold shrink-0 ${meets ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {d.score}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      meets
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                    }`}
                    style={{ width: `${clampPct(d.score)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
