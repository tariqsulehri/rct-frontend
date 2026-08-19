import React from 'react';
import { BarChart3 } from 'lucide-react';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';
import { clampPct } from '@/lib/formatters';

export interface SkillAreaGapMapProps {
  barData: Array<{
    fullDomain: string;
    score: number;
    threshold: number;
    meets: boolean;
  }>;
  targetLabel: string;
  chartTheme: any;
}

export const SkillAreaGapMap: React.FC<SkillAreaGapMapProps> = ({
  barData,
  targetLabel,
  chartTheme: c,
}) => {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconBadge icon={<BarChart3 size={13} />} color="warning" size="sm" />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
              Score by Skill Area
            </p>
            <InfoTip text="Compares achieved score with the required target for each skill area." />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            Gap map of skill-area strength against the required target.
          </p>
        </div>
        <div
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgb(var(--surface-3))', color: 'rgb(var(--text-1))' }}
        >
          {barData.length} areas
        </div>
      </div>

      <div
        className="mb-3 grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: 'rgb(var(--text-3))' }}
      >
        <span>Skill area</span>
        <div className="relative">
          <div className="absolute left-0">0</div>
          <div className="absolute left-1/4 -translate-x-1/2">25</div>
          <div className="absolute left-2/4 -translate-x-1/2">50</div>
          <div className="absolute left-3/4 -translate-x-1/2">75</div>
          <div className="absolute right-0">100%</div>
        </div>
        <span className="text-right">Gap</span>
      </div>

      <div className="space-y-3">
        {barData.map((d, idx) => {
          const rowColor =
            d.threshold > 0
              ? d.meets
                ? c.success
                : c.danger
              : c.domains[idx % c.domains.length];
          const gap = d.threshold > 0 ? d.threshold - d.score : 0;
          const statusLabel = d.meets ? '✓ Meets' : '✗ Below';

          return (
            <div
              key={d.fullDomain}
              className="grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] items-center gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug" style={{ color: 'rgb(var(--text-1))' }}>
                  {d.fullDomain}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>
                  {d.score}% achieved{d.threshold > 0 ? ` / ${d.threshold}% required` : ''}
                </p>
              </div>

              <div className="relative h-6" title={`${d.fullDomain}: ${d.score}% achieved. ${targetLabel}.`}>
                <div
                  className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                  style={{ backgroundColor: 'rgb(var(--border))' }}
                />
                {[25, 50, 75].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                    style={{ left: `${tick}%`, backgroundColor: 'rgb(var(--border))' }}
                  />
                ))}
                <div
                  className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                  style={{ width: `${clampPct(d.score)}%`, backgroundColor: rowColor }}
                />
                {d.threshold > 0 && (
                  <div
                    className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                    style={{
                      left: `calc(${clampPct(d.threshold)}% - 1px)`,
                      backgroundColor: c.warning,
                      boxShadow: '0 0 0 2px rgb(var(--surface-1))',
                    }}
                  />
                )}
              </div>

              <div className="text-right">
                <span
                  className="inline-flex min-w-14 justify-center rounded-full px-2 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: `${rowColor}22`, color: rowColor }}
                >
                  {d.threshold > 0 && !d.meets ? `${gap}%` : statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
