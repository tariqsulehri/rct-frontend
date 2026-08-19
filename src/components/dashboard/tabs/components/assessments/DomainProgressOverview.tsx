import React, { useState } from 'react';
import { ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';
import { clampPct } from '@/lib/formatters';

export interface SkillDomainScore {
  domain: string;
  score: number;
  threshold: number;
  count: number;
  meetsCount: number;
  requiredCount: number;
}

export interface DomainProgressOverviewProps {
  filteredSkillDomainScores: SkillDomainScore[];
  chartTheme: any;
}

export const DomainProgressOverview: React.FC<DomainProgressOverviewProps> = ({
  filteredSkillDomainScores,
  chartTheme: c,
}) => {
  const [showDomainSummaries, setShowDomainSummaries] = useState(true);

  if (filteredSkillDomainScores.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setShowDomainSummaries((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 hover:opacity-80 transition-opacity"
        style={{ color: 'rgb(var(--text-2))' }}
      >
        {showDomainSummaries ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <IconBadge icon={<BarChart3 size={13} />} color="warning" size="sm" />
        Domain Progress Overview
      </button>

      {showDomainSummaries && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
        >
          {filteredSkillDomainScores.map((domainScore, idx) => {
            const meetsDomain = domainScore.threshold > 0 && domainScore.score >= domainScore.threshold;
            const nearDomain =
              domainScore.threshold > 0 && !meetsDomain && domainScore.threshold - domainScore.score <= 10;
            const color =
              domainScore.threshold > 0
                ? meetsDomain
                  ? c.success
                  : nearDomain
                    ? c.warning
                    : c.danger
                : c.domains[idx % c.domains.length];
            const statusLabel =
              domainScore.requiredCount > 0
                ? `${domainScore.meetsCount}/${domainScore.requiredCount} met`
                : `${domainScore.count} comp${domainScore.count !== 1 ? 's' : ''}`;
            const statusBg =
              domainScore.threshold > 0
                ? meetsDomain
                  ? 'rgb(var(--success-soft))'
                  : nearDomain
                    ? 'rgb(var(--warning-soft))'
                    : 'rgb(var(--danger-soft))'
                : 'rgb(var(--surface-3))';
            const bgWash =
              domainScore.threshold > 0
                ? meetsDomain
                  ? 'rgba(var(--success), 0.03)'
                  : nearDomain
                    ? 'rgba(var(--warning), 0.03)'
                    : 'rgba(var(--danger), 0.03)'
                : 'rgb(var(--surface-2))';

            return (
              <div
                key={domainScore.domain}
                className="rounded-md border px-2.5 py-2 min-h-[60px] transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_2px_8px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),_0_6px_12px_rgba(0,0,0,0.3)] cursor-default"
                style={{ backgroundColor: bgWash, borderColor: 'rgb(var(--border))' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[11px] font-bold leading-tight min-w-0"
                    style={{
                      color: 'rgb(var(--text-1))',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={domainScore.domain}
                  >
                    {domainScore.domain}
                  </p>
                  <span
                    className="text-[9px] font-extrabold rounded-full px-1.5 py-0.5 shrink-0 uppercase tracking-wide"
                    style={{ color, backgroundColor: statusBg }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold leading-none" style={{ color }}>
                      {domainScore.score}%
                    </span>
                    {domainScore.threshold > 0 && (
                      <>
                        <span className="text-xs font-semibold opacity-50" style={{ color: 'rgb(var(--text-2))' }}>
                          /
                        </span>
                        <span className="text-xs font-semibold opacity-70" style={{ color: 'rgb(var(--text-2))' }}>
                          {domainScore.threshold}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="h-1 rounded-full mt-1.5 overflow-hidden shadow-inner"
                  style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                >
                  <div
                    className="h-full rounded-full shadow-[0_0_4px_currentColor]"
                    style={{ width: `${clampPct(domainScore.score)}%`, backgroundColor: color }}
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
