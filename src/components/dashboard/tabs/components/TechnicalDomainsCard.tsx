import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, TooltipProps } from 'recharts';
import { Cpu, ArrowUpRight } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { TabType } from '../../types';

/** 12 visually distinct gradient fills for per-bar nominal color encoding. */
const BAR_PALETTE = [
  'linear-gradient(90deg,#6366f1,#818cf8)',
  'linear-gradient(90deg,#06b6d4,#22d3ee)',
  'linear-gradient(90deg,#f59e0b,#fbbf24)',
  'linear-gradient(90deg,#10b981,#34d399)',
  'linear-gradient(90deg,#ec4899,#f472b6)',
  'linear-gradient(90deg,#8b5cf6,#a78bfa)',
  'linear-gradient(90deg,#f97316,#fb923c)',
  'linear-gradient(90deg,#14b8a6,#2dd4bf)',
  'linear-gradient(90deg,#3b82f6,#60a5fa)',
  'linear-gradient(90deg,#84cc16,#a3e635)',
  'linear-gradient(90deg,#d946ef,#e879f9)',
  'linear-gradient(90deg,#f43f5e,#fb7185)',
] as const;

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const gap = data.score - data.benchmark;
    const isMet = gap >= 0;
    return (
      <div className="bg-surface/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs min-w-[140px] z-50">
        <p className="font-bold mb-2 text-text-1 border-b border-border pb-1.5">{data.fullLabel}</p>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className="text-text-2">Achieved:</span>
          <span className="font-bold text-indigo-500 text-[13px]">{data.score}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-text-2">Target:</span>
          <span className="font-bold text-text-1 text-[13px]">{data.benchmark}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/60">
          <span className="text-text-3 font-medium">Gap:</span>
          <span className={`font-black text-[13px] ${isMet ? 'text-emerald-500' : 'text-red-500'}`}>
            {gap > 0 ? `+${gap}` : gap}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export interface TechnicalDomainBar {
  fullLabel: string;
  score: number;
  benchmark: number;
}

export interface TechnicalDomainsCardProps {
  chartData: TechnicalDomainBar[];
  myScore: number;
  myRequired: number;
  myMeets: number;
  myTotal: number;
  technicalReady: boolean;
  onNavigate: (t: TabType) => void;
}

/**
 * TechnicalDomainsCard
 * ---------------------
 * Renders the "Technical Domains" assessment card containing a donut summary,
 * per-domain horizontal bar chart, and footer navigation.
 *
 * @see ResourceOverviewDashboard — parent orchestrator
 */
export const TechnicalDomainsCard: React.FC<TechnicalDomainsCardProps> = ({
  chartData,
  myScore,
  myRequired,
  myMeets,
  myTotal,
  technicalReady,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();

  return (
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-indigo-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">1. Technical Domains</h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${technicalReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
          {technicalReady ? '✓ Met' : '✗ Gap'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Bars */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Donut summary */}
          <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
            <div className="relative w-14 h-14 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: myScore ?? 0 }, { v: 100 - (myScore ?? 0) }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={technicalReady ? '#6366f1' : '#f43f5e'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
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

          {/* Horizontal bars */}
          <div className="flex flex-col gap-2">
            {chartData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-medium text-text-1 truncate flex-1 min-w-0" title={d.fullLabel}>
                      {d.fullLabel}
                    </span>
                    <span className="font-mono text-[10px] text-text-2 tabular-nums shrink-0 whitespace-nowrap">
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
            })}
          </div>
        </div>

        {/* Right Column: Radar */}
        <div className="flex flex-col items-center justify-center w-full h-[320px] md:col-span-5">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
              <defs>
                <linearGradient id="colorTechnical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: chartTheme.isDark ? '#52525b' : '#d4d4d8' }} />
              <PolarGrid stroke={chartTheme.isDark ? '#3f3f46' : '#e5e7eb'} strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="fullLabel"
                tick={{ fill: chartTheme.isDark ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Radar
                name="Required"
                dataKey="benchmark"
                stroke={chartTheme.isDark ? '#71717a' : '#a1a1aa'}
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
              />
              <Radar
                name="Achieved"
                dataKey="score"
                stroke="#6366f1"
                fill="url(#colorTechnical)"
                fillOpacity={1}
                strokeWidth={2.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border mt-auto">
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
