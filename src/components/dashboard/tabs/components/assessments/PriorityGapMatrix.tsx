import React from 'react';
import { Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { clampPct } from '@/lib/formatters';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';

export interface PriorityGapItem {
  name: string;
  domain: string;
  score: number;
  threshold: number;
  gap: number;
  isCritical: boolean;
}

export interface PriorityGapMatrixProps {
  topGaps: PriorityGapItem[];
  chartTheme: any;
}

export const PriorityGapMatrix: React.FC<PriorityGapMatrixProps> = ({
  topGaps,
  chartTheme: c,
}) => {
  return (
    <div
      className="card p-5 space-y-4 flex flex-col justify-between"
      style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconBadge icon={<Target size={14} />} color="danger" size="sm" />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--text-1))' }}>
              Priority Action Matrix (Top Blockers)
            </h3>
            <InfoTip text="Algorithmic ranking of the top priority skill gaps currently blocking role promotion, ordered by weight deficit and criticality." />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            Prescriptive learning priorities for maximum promotion ROI.
          </p>
        </div>

        <span
          className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
          style={{ color: 'rgb(var(--danger))', backgroundColor: 'rgb(var(--danger-soft))' }}
        >
          {topGaps.length} Action Items
        </span>
      </div>

      {/* Gap List */}
      <div className="space-y-3 flex-1 justify-center flex flex-col">
        {topGaps.length > 0 ? (
          topGaps.slice(0, 3).map((gap, index) => (
            <div
              key={gap.name}
              className="p-3.5 rounded-xl border transition-all hover:scale-[1.005] flex items-center justify-between gap-4"
              style={{
                backgroundColor: 'rgba(var(--danger), 0.03)',
                borderColor: 'rgba(var(--danger), 0.2)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0"
                  style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}
                >
                  #{index + 1}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs truncate" style={{ color: 'rgb(var(--text-1))' }}>
                      {gap.name}
                    </span>
                    {gap.isCritical && (
                      <span
                        className="text-[9px] font-extrabold uppercase rounded-full px-1.5 py-0.2 shrink-0"
                        style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}
                      >
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: 'rgb(var(--text-3))' }}>
                    {gap.domain} • Current: {gap.score}% / Req: {gap.threshold}%
                  </p>
                </div>
              </div>

              {/* Deficit Badge */}
              <div className="text-right shrink-0 flex items-center gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-rose-500 block">
                    -{gap.gap}% Deficit
                  </span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${clampPct(gap.score)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
            <p className="text-xs font-bold text-emerald-400">Zero Skill Deficits!</p>
            <p className="text-[11px]" style={{ color: 'rgb(var(--text-3))' }}>
              Candidate meets or exceeds all technical competency thresholds for this grade.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'rgb(var(--border))' }}>
        <span className="font-medium" style={{ color: 'rgb(var(--text-3))' }}>
          Focus training on Quadrant I blockers
        </span>
        <div className="flex items-center gap-1 font-bold text-indigo-400 hover:underline cursor-pointer">
          <span>View Detailed Competencies</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );
};
