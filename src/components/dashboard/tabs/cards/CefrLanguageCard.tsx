import React from 'react';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CefrLevelBadge } from '@/components/communication/CefrLevelBadge';
import { type CefrLevelCode } from '@/types/communication';
import { BAR_PALETTE } from '../constants';

interface CefrLanguageCardProps {
  commLevel: CefrLevelCode | '-';
  commBenchmark: CefrLevelCode | '-';
  commScorePct: number;
  commReqPct: number;
  commReady: boolean;
  commChartData: { label: string; fullLabel: string; score: number; benchmark: number }[];
  isDark: boolean;
  onNavigate: (tab: any) => void;
}

export const CefrLanguageCard: React.FC<CefrLanguageCardProps> = ({
  commLevel,
  commBenchmark,
  commScorePct,
  commReqPct,
  commReady,
  commChartData,
  isDark,
  onNavigate,
}) => {
  return (
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">2. CEFR Language</h2>
        </div>
        {commLevel !== '-' && <CefrLevelBadge level={commLevel as CefrLevelCode} size="sm" />}
      </div>

      <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
        <div className="relative w-14 h-14 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ v: commScorePct }, { v: Math.max(100 - commScorePct, 0) }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                <Cell fill={commReady ? '#06b6d4' : '#f59e0b'} />
                <Cell fill={isDark ? '#27272a' : '#e5e7eb'} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black font-mono text-text-1 leading-none">{commLevel}</span>
          </div>
        </div>
        <div className="text-[10px] text-text-3 text-left leading-relaxed">
          <div><span className="font-bold text-cyan-500">{commLevel}</span> assessed ({commScorePct}%)</div>
          <div><span className="font-bold text-text-2">{commBenchmark}</span> required ({commReqPct}%)</div>
          <div className="mt-0.5 text-[9px]">6-competency framework</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {commChartData.length === 0 ? (
          <div className="text-center text-text-3 text-[10px] py-4">No CEFR data found.</div>
        ) : (
          commChartData.map((d, i) => {
            const barColor = BAR_PALETTE[(i + 6) % BAR_PALETTE.length];
            return (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-text-1 truncate max-w-[170px]" title={d.fullLabel}>
                    {d.fullLabel}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-text-2 tabular-nums shrink-0">
                    <strong className="text-text-1">{d.score}%</strong> / {d.benchmark}%
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-surface-2 border border-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(d.score, 100)}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-cyan-500 inline-block" />Assessed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-surface-2 border border-border inline-block" />Required</span>
        </div>
        <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-cyan-500 hover:underline inline-flex items-center gap-0.5">
          CEFR Rubric <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
};
