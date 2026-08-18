import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, TooltipProps } from 'recharts';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { CefrLevelBadge } from '@/components/communication/CefrLevelBadge';
import { type CefrLevelCode } from '@/types/communication';
import { TabType } from '../../types';

const BAR_PALETTE = [
  'linear-gradient(180deg,#818cf8 0%,#6366f1 40%,#4f46e5 100%)',
  'linear-gradient(180deg,#22d3ee 0%,#06b6d4 40%,#0891b2 100%)',
  'linear-gradient(180deg,#fbbf24 0%,#f59e0b 40%,#d97706 100%)',
  'linear-gradient(180deg,#34d399 0%,#10b981 40%,#059669 100%)',
  'linear-gradient(180deg,#f472b6 0%,#ec4899 40%,#db2777 100%)',
  'linear-gradient(180deg,#a78bfa 0%,#8b5cf6 40%,#7c3aed 100%)',
  'linear-gradient(180deg,#fb923c 0%,#f97316 40%,#ea580c 100%)',
  'linear-gradient(180deg,#2dd4bf 0%,#14b8a6 40%,#0d9488 100%)',
  'linear-gradient(180deg,#60a5fa 0%,#3b82f6 40%,#2563eb 100%)',
  'linear-gradient(180deg,#a3e635 0%,#84cc16 40%,#65a30d 100%)',
  'linear-gradient(180deg,#e879f9 0%,#d946ef 40%,#c026d3 100%)',
  'linear-gradient(180deg,#fb7185 0%,#f43f5e 40%,#e11d48 100%)',
] as const;

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const gap = data.score - data.benchmark;
    const isMet = gap >= 0;
    return (
      <div className="bg-gradient-to-br from-cyan-50/95 to-white/95 dark:from-cyan-950/90 dark:to-zinc-900/95 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-800/50 p-3 rounded-lg shadow-xl text-xs min-w-[140px] z-50">
        <p className="font-bold mb-2 text-cyan-950 dark:text-cyan-100 border-b border-cyan-200/50 dark:border-cyan-800/50 pb-1.5">{data.fullLabel}</p>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className="text-text-2">Assessed:</span>
          <span className="font-bold text-cyan-500 text-[13px]">{data.score}%</span>
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

export interface CefrCompetencyBar {
  fullLabel: string;
  score: number;
  benchmark: number;
}

export interface CefrLanguageCardProps {
  chartData: CefrCompetencyBar[];
  commLevel: CefrLevelCode;
  commBenchmark: CefrLevelCode;
  commScorePct: number;
  commReqPct: number;
  commReady: boolean;
  /** Config-driven total competency count — eliminates "6-competency" hardcoding. */
  competencyCount: number;
  onNavigate: (t: TabType) => void;
}

/**
 * CefrLanguageCard
 * -----------------
 * Renders the "CEFR Language" assessment card: donut summary, per-competency
 * horizontal bars, and footer navigation.
 *
 * @see ResourceOverviewDashboard — parent orchestrator
 */
export const CefrLanguageCard: React.FC<CefrLanguageCardProps> = ({
  chartData,
  commLevel,
  commBenchmark,
  commScorePct,
  commReqPct,
  commReady,
  competencyCount,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();

  return (
    <div className="relative rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3 overflow-hidden">
      {/* Subtle ambient corner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-500 shrink-0 drop-shadow-sm" />
          <h2 className="text-xs font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-b from-cyan-400 to-cyan-700 dark:from-cyan-300 dark:to-cyan-500 drop-shadow-sm">2. CEFR Language</h2>
        </div>
        <CefrLevelBadge level={commLevel} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Bars */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Donut summary */}
          <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
            <div className="relative w-14 h-14 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: commScorePct }, { v: 100 - commScorePct }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={commReady ? '#06b6d4' : '#f59e0b'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
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
              <div className="mt-0.5 text-[9px]">{competencyCount}-competency framework</div>
            </div>
          </div>

          {/* Horizontal bars */}
          <div className="flex flex-col gap-2">
            {chartData.map((d, i) => {
              const barColor = BAR_PALETTE[(i + 6) % BAR_PALETTE.length];
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
                  <div className="relative h-3 rounded-full bg-surface-2 border border-border shadow-inner overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ 
                        width: `${Math.min(d.score, 100)}%`, 
                        background: barColor,
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.25)'
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Radar */}
        <div className="flex flex-col items-center justify-center w-full h-[320px] md:col-span-5">
          <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
              <defs>
                <linearGradient id="colorCefr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.25}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: chartTheme.isDark ? '#71717a' : '#a1a1aa' }} />
              <PolarGrid stroke={chartTheme.isDark ? '#52525b' : '#d4d4d8'} strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="fullLabel"
                tick={(props: any) => {
                  const { payload, x, y, cx, cy, textAnchor } = props;
                  
                  // Push text outward by 15% from the center to increase gap from the graph
                  const dx = (x - cx) * 0.15;
                  const dy = (y - cy) * 0.15;
                  const adjustedX = x + dx;
                  const adjustedY = y + dy;

                  const words = payload.value.split(' ');
                  let lines = [];
                  if (words.length > 2) {
                    const mid = Math.ceil(words.length / 2);
                    lines.push(words.slice(0, mid).join(' '));
                    lines.push(words.slice(mid).join(' '));
                  } else {
                    lines.push(payload.value);
                  }
                  
                  return (
                    <text 
                      x={adjustedX} 
                      y={adjustedY} 
                      textAnchor={textAnchor} 
                      fill={chartTheme.isDark ? '#22d3ee' : '#0891b2'} 
                      fontSize={9} 
                      fontWeight={800}
                    >
                      {lines.map((line, i) => (
                        <tspan key={i} x={adjustedX} dy={i === 0 ? (lines.length === 1 ? 3 : -4) : 12}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Radar
                name="Required"
                dataKey="benchmark"
                stroke={chartTheme.isDark ? '#a1a1aa' : '#71717a'}
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fill="none"
              />
              <Radar
                name="Assessed"
                dataKey="score"
                stroke="#0891b2"
                fill="url(#colorCefr)"
                fillOpacity={1}
                strokeWidth={3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border mt-auto">
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
