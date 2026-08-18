import React from 'react';
import type { PromotionRow } from '@/hooks/useReports';

interface DeptBreakdownItem {
  department: string;
  headcount: number;
  avgTechScore: number;
  expectedTechScore: number;
  cefrReadyRate: number;
}

interface ExecutiveSummaryCardsProps {
  topPerformers: PromotionRow[];
  promotionReadyCandidates: PromotionRow[];
  cefrGatedCandidates: PromotionRow[];
  deptSummary: DeptBreakdownItem[];
}

export const ExecutiveSummaryCards: React.FC<ExecutiveSummaryCardsProps> = ({
  topPerformers,
  promotionReadyCandidates,
  cefrGatedCandidates,
  deptSummary,
}) => {
  return (
    <div className="rounded-2xl p-5 border shadow-card transition-all"
         style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Top Performers</div>
          <div className="text-xl font-extrabold text-amber-500 mt-0.5">{topPerformers.length}</div>
          <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Highest domain scores</div>
        </div>
        <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Promotion Ready</div>
          <div className="text-xl font-extrabold text-emerald-500 mt-0.5">{promotionReadyCandidates.length}</div>
          <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Tech & CEFR verified</div>
        </div>
        <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>CEFR Blocked</div>
          <div className="text-xl font-extrabold text-rose-500 mt-0.5">{cefrGatedCandidates.length}</div>
          <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Tech ready, language gated</div>
        </div>
        <div className="rounded-xl p-3 border transition-all" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-2))' }}>Top Department</div>
          <div className="text-xl font-extrabold text-sky-500 mt-0.5 truncate">{deptSummary[0]?.department ?? 'N/A'}</div>
          <div className="text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>Highest Overall Rank</div>
        </div>
      </div>
    </div>
  );
};
