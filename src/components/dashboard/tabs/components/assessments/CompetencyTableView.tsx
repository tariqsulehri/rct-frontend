import React from 'react';
import { Lightbulb, TrendingUp, Medal } from 'lucide-react';
import { clampPct } from '@/lib/formatters';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';

export interface CompetencyRowItem {
  name: string;
  domain: string;
  score: number;
  threshold: number;
  isCritical: boolean;
  meets: boolean;
  hasRequirement: boolean;
  momentum?: number;
  percentile?: number;
}

export interface CompetencyTableViewProps {
  filteredCompetencyRows: CompetencyRowItem[];
  chartTheme: any;
}

/** Utility to compute 5-star rating from percentage */
const getStars = (pct: number) => {
  const rawStars = Math.round((pct / 100) * 5);
  const starCount = Math.max(0, Math.min(5, rawStars));
  return {
    starString: '★'.repeat(starCount) + '☆'.repeat(5 - starCount),
    starCount,
  };
};

export const CompetencyTableView: React.FC<CompetencyTableViewProps> = ({
  filteredCompetencyRows,
  chartTheme: c,
}) => {
  const tableHeaderLampText = (
    <div className="space-y-1 text-xs">
      <p className="font-bold text-amber-400">💡 Competency Table Guide</p>
      <p>• <strong>Maturity Level:</strong> Converted 5-star rating (0-5 Level) matching the Grid View.</p>
      <p>• <strong>Required Target:</strong> Benchmark percentage defined for the target grade.</p>
      <p>• <strong>Status:</strong> Color-coded assessment rating (Meets vs Below target).</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border shadow-sm" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
      <table className="w-full min-w-[980px] text-sm border-collapse">
        <thead>
          <tr className="border-b text-xs font-bold uppercase tracking-wider text-left" style={{ borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-3))' }}>
            <th className="py-3 px-4">Skill</th>
            <th className="py-3 px-3">Skill Area</th>
            <th className="py-3 px-3 text-center">Maturity Level</th>
            <th className="py-3 px-3 text-right">Achieved</th>
            <th className="py-3 px-3 text-right">Required</th>
            <th className="py-3 px-3 text-right">Gap</th>
            <th className="py-3 px-3">Analytics</th>
            <th className="py-3 px-4 text-left flex items-center gap-1.5 justify-start">
              <span>Status</span>
              <InfoTip 
                text={tableHeaderLampText} 
                icon={<IconBadge icon={<Lightbulb size={12} />} color="warning" size="sm" className="hover:scale-110 transition-transform cursor-help" />} 
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredCompetencyRows.map((row) => {
            const rowColor = row.hasRequirement ? (row.meets ? c.success : c.danger) : 'rgb(var(--text-1))';
            const gap = row.hasRequirement ? row.threshold - row.score : 0;
            const { starString, starCount } = getStars(row.score);

            const rowBgWash = row.hasRequirement
              ? row.meets
                ? 'rgba(var(--success), 0.02)'
                : 'rgba(var(--danger), 0.03)'
              : 'transparent';

            return (
              <tr
                key={row.name}
                className="border-t transition-colors hover:bg-surface/50"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: rowBgWash }}
              >
                {/* 1. Skill Name & Progress Bar */}
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: 'rgb(var(--text-1))' }}
                      title={row.name}
                    >
                      {row.name}
                    </span>
                    {row.isCritical && (
                      <span
                        className="text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 shrink-0 tracking-wider"
                        style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}
                      >
                        Critical
                      </span>
                    )}
                  </div>
                  <div
                    className="h-1.5 rounded-full mt-1.5 overflow-hidden shadow-inner w-full max-w-[220px]"
                    style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-[0_0_6px_currentColor]"
                      style={{ width: `${clampPct(row.score)}%`, backgroundColor: rowColor }}
                    />
                  </div>
                </td>

                {/* 2. Skill Area / Domain */}
                <td className="py-3 px-3 align-middle text-xs font-medium" style={{ color: 'rgb(var(--text-2))' }}>
                  {row.domain}
                </td>

                {/* 3. Maturity Level (Stars + Level Ratio) */}
                <td className="py-3 px-3 align-middle text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className="text-sm font-black tracking-widest leading-none"
                      style={{
                        color: 'rgb(var(--warning))',
                        textShadow: '0px 1px 6px rgba(var(--warning), 0.3)',
                      }}
                    >
                      {starString}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                      {starCount} / 5 Level
                    </span>
                  </div>
                </td>

                {/* 4. Achieved Score % */}
                <td className="py-3 px-3 text-right align-middle font-bold text-sm" style={{ color: rowColor }}>
                  {row.score}%
                </td>

                {/* 5. Required Threshold % */}
                <td
                  className="py-3 px-3 text-right align-middle font-semibold text-xs"
                  style={{ color: row.hasRequirement ? c.warning : 'rgb(var(--text-3))' }}
                >
                  {row.hasRequirement ? `${row.threshold}%` : 'N/A'}
                </td>

                {/* 6. Gap % */}
                <td className="py-3 px-3 text-right align-middle font-bold text-xs" style={{ color: gap > 0 ? c.danger : c.success }}>
                  {row.hasRequirement ? (gap > 0 ? `-${gap}%` : '0%') : 'N/A'}
                </td>

                {/* 7. Analytics (Momentum & Percentile) */}
                <td className="py-3 px-3 align-middle">
                  <div className="flex flex-col gap-1">
                    {row.momentum !== undefined ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: row.momentum >= 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>
                        <IconBadge icon={<TrendingUp size={10} />} color={row.momentum >= 0 ? 'success' : 'danger'} size="sm" variant="ghost" />
                        {row.momentum > 0 ? '+' : ''}{row.momentum}%
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-3 opacity-60">—</span>
                    )}
                    {row.percentile !== undefined && (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                        <IconBadge icon={<Medal size={10} />} color="info" size="sm" variant="ghost" />
                        Top {row.percentile}%
                      </div>
                    )}
                  </div>
                </td>

                {/* 8. Status Badge */}
                <td className="py-3 px-4 align-middle">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide"
                    style={{
                      backgroundColor: row.hasRequirement
                        ? row.meets
                          ? 'rgb(var(--success-soft))'
                          : 'rgb(var(--danger-soft))'
                        : 'rgb(var(--surface-3))',
                      color: rowColor,
                    }}
                  >
                    {row.hasRequirement ? (row.meets ? '✓ Meets' : '✗ Below') : 'No Target'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredCompetencyRows.length === 0 && (
        <div className="py-12 text-center text-sm font-medium" style={{ color: 'rgb(var(--text-3))' }}>
          No competencies match the selected filters.
        </div>
      )}
    </div>
  );
};
