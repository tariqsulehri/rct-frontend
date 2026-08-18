import React from 'react';
import { Cpu, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BAR_PALETTE } from '../constants';

interface TechnicalDomainsCardProps {
  myScore: number;
  myRequired: number;
  myMeets: number;
  myTotal: number;
  technicalReady: boolean;
  technicalChartData: { label: string; fullLabel: string; score: number; benchmark: number }[];
  isDark: boolean;
  onNavigate: (tab: any) => void;
}

export const TechnicalDomainsCard: React.FC<TechnicalDomainsCardProps> = ({
  myScore,
  myRequired,
  myMeets,
  myTotal,
  technicalReady,
  technicalChartData,
  isDark,
  onNavigate,
}) => {
  return (
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-indigo-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">1. Technical Domains</h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${technicalReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
          {technicalReady ? '✓ Met' : '✗ Gap'}
        </span>
      </div>

      <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
        <div className="relative w-14 h-14 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ v: myScore }, { v: Math.max(100 - myScore, 0) }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                <Cell fill={technicalReady ? '#6366f1' : '#f43f5e'} />
                <Cell fill={isDark ? '#27272a' : '#e5e7eb'} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black font-mono text-text-1 leading-none">{myScore}%</span>
          </div>
        </div>
        <div className="text-[10px] text-text-3 leading-relaxed">
          <div><span className="font-bold text-indigo-500">{myScore}%</span> achieved</div>
          <div><span className="font-bold text-text-2">{myRequired}%</span> required</div>
          <div className="mt-0.5 text-[9px]">{myMeets}/{myTotal} skills verified</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {technicalChartData.length === 0 ? (
          <div className="text-center text-text-3 text-[10px] py-4">No technical domains found.</div>
        ) : (
          technicalChartData.map((d, i) => {
            const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
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
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-500 inline-block" />Achieved</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-surface-2 border border-border inline-block" />Target</span>
        </div>
        <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-indigo-500 hover:underline inline-flex items-center gap-0.5">
          Skills Grid <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
};
