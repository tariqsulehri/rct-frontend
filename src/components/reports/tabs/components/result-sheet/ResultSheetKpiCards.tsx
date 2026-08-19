import React from 'react';
import { InfoTip } from '@/components/reports/shared';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';

interface ResultSheetKpiCardsProps {
  gapResult: any;
  promoRow: any;
  overallScorePct: number;
  thresholdPct: number | null;
  isCommReady: boolean;
  commLevel: string;
  commExpected: string;
  topGaps: any[];
}

export const ResultSheetKpiCards: React.FC<ResultSheetKpiCardsProps> = ({
  gapResult,
  promoRow,
  overallScorePct,
  thresholdPct,
  isCommReady,
  commLevel,
  commExpected,
  topGaps,
}) => {
  const starsText = (n: number) => `${'★'.repeat(Math.max(0, Math.min(5, n)))}${'☆'.repeat(Math.max(0, 5 - Math.min(5, n)))}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
        <div className="flex items-center gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Overall Score</p>
          <InfoTip text="Current achieved score compared with the required score." />
        </div>
        <div className="mt-1">
          <ScoreDisplay 
            score={overallScorePct} 
            threshold={thresholdPct !== null ? thresholdPct : undefined} 
            size="sm" 
            align="start" 
            layout="horizontal" 
            showLabel={false} 
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>{thresholdPct !== null ? 'Achieved / Required' : 'Needed score: N/A'}</p>
      </div>
      
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Skills Met</p>
        <p className="text-2xl font-bold mt-1" style={{ color: gapResult.total_competencies > 0 && gapResult.meets_count === gapResult.total_competencies ? 'rgb(var(--success))' : 'rgb(var(--text-1))' }}>
          {gapResult.total_competencies === 0 ? 'N/A' : `${gapResult.meets_count}/${gapResult.total_competencies}`}
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>skills met</p>
      </div>
      
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>CEFR Proficiency</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold leading-none" style={{ color: isCommReady ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
            {commLevel}
          </span>
          <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-3))' }}>/ {commExpected} Target</span>
        </div>
        <p className="text-xs mt-1 font-medium" style={{ color: isCommReady ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
          {isCommReady ? '✓ Certified' : '⚠ Benchmark Deficit'}
        </p>
      </div>
      
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Rating</p>
        <p className="text-xl font-bold mt-1" style={{ color: '#f59e0b' }}>{promoRow ? starsText(promoRow.star_rating) : 'N/A'}</p>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>performance rating</p>
      </div>
      
      <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Skills Below Target</p>
        <p className="text-2xl font-bold mt-1" style={{ color: topGaps.length === 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>{topGaps.length}</p>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>skills below target</p>
      </div>
    </div>
  );
};
