import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, TooltipProps } from 'recharts';
import { Award, ArrowUpRight } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { BehavioralLevelBadge } from '@/components/behavioral/BehavioralLevelBadge';
import { type BehavioralLevelCode } from '@/types/behavioral';
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
      <div className="bg-gradient-to-br from-amber-50/95 to-white/95 dark:from-amber-950/90 dark:to-zinc-900/95 backdrop-blur-md border border-amber-200/50 dark:border-amber-800/50 p-3 rounded-lg shadow-xl text-xs min-w-[140px] z-50">
        <p className="font-bold mb-2 text-amber-950 dark:text-amber-100 border-b border-amber-200/50 dark:border-amber-800/50 pb-1.5">{data.fullName}</p>
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span className="text-text-2">Assessed:</span>
          <span className="font-bold text-amber-500 text-[13px]">{data.score}%</span>
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

export interface BehavioralPillarBar {
  fullName: string;
  type: 'core' | 'leadership' | string;
  score: number;
  benchmark: number;
  assessedCode: string;
  reqCode: string;
  /** True only when the backend returned a real rating — prevents a false ✓ in unassessed state. */
  isAssessed: boolean;
}

export interface BehavioralPillarsCardProps {
  chartData: BehavioralPillarBar[];
  behavLevel: BehavioralLevelCode;
  behavBenchmark: BehavioralLevelCode;
  behavScorePct: number;
  behavReqPct: number;
  behavReady: boolean;
  /** Config-driven counts — eliminates "Core (6)" / "Leadership (5)" hardcoding. */
  coreCount: number;
  leadershipCount: number;
  onNavigate: (t: TabType) => void;
}

/**
 * BehavioralPillarsCard
 * ----------------------
 * Renders the "Behavioral Pillars" assessment card: donut summary, per-pillar
 * horizontal bars with core/leadership colour coding, and footer navigation.
 * Competency counts are derived from config, not hardcoded.
 *
 * @see ResourceOverviewDashboard — parent orchestrator
 */
export const BehavioralPillarsCard: React.FC<BehavioralPillarsCardProps> = ({
  chartData,
  behavLevel,
  behavBenchmark,
  behavScorePct,
  behavReqPct,
  behavReady,
  coreCount,
  leadershipCount,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();
  const totalPillars = coreCount + leadershipCount;

  return (
    <div className="relative rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3 overflow-hidden">
      {/* Subtle ambient corner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-blue-400 shrink-0 drop-shadow-sm" />
          <h2 className="text-xs font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-b from-blue-300 to-blue-500 dark:from-blue-200 dark:to-blue-400 drop-shadow-sm">
            3. Behavioral ({totalPillars} Pillars)
          </h2>
        </div>
        <BehavioralLevelBadge level={behavLevel} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Bars */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Donut summary */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-900/10 dark:to-slate-800/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
            <div className="relative w-14 h-14 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: behavScorePct }, { v: 100 - behavScorePct }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={behavReady ? '#f59e0b' : '#f43f5e'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black font-mono text-text-1 leading-none">{behavLevel}</span>
              </div>
            </div>
            <div className="text-[10px] text-text-3 text-left leading-relaxed">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Core ({coreCount})
                </span>
                <span className="text-[9px] font-bold text-purple-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />Leadership ({leadershipCount})
                </span>
              </div>
              <div><span className="font-bold text-amber-500">{behavLevel}</span> assessed ({behavScorePct}%)</div>
              <div><span className="font-bold text-text-2">{behavBenchmark}</span> required ({behavReqPct}%)</div>
            </div>
          </div>

          {/* Bullet Chart Horizontal layout */}
          <div className="flex flex-col mt-2">
            {/* Table Header */}
            <div className="flex items-center justify-between text-[10px] font-bold text-text-3 border-b border-border/50 pb-1.5 mb-3 px-1">
              <span className="w-[28%] uppercase tracking-wide">Skill Area</span>
              <div className="flex-1 flex justify-between relative px-2">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
              <span className="w-12 text-right uppercase">Gap</span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-3">
              {chartData.map((d, i) => {
                const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
                const gap = d.score - d.benchmark;
                return (
                  <div key={i} className="flex items-center justify-between gap-2 group">
                    {/* Left: Domain Name & Subtitle */}
                    <div className="w-[28%] flex flex-col justify-center min-w-0 pr-1">
                      <span className="font-semibold text-text-1 text-xs truncate group-hover:text-amber-500 transition-colors" title={d.fullName}>
                        {d.fullName}
                      </span>
                      <span className="text-[10px] text-text-3 truncate mt-0.5">
                        {d.score}% achieved / {d.benchmark}% required
                      </span>
                    </div>

                    {/* Middle: Bullet Chart Track */}
                    <div className="flex-1 relative h-6 flex items-center">
                      {/* Background horizontal line */}
                      <div className="absolute left-2 right-2 h-[1px] bg-border z-0"></div>
                      
                      {/* Vertical Grid Ticks */}
                      <div className="absolute inset-0 flex justify-between items-center px-2 z-0 pointer-events-none">
                        <div className="h-2.5 w-px bg-border"></div>
                        <div className="h-2.5 w-px bg-border"></div>
                        <div className="h-2.5 w-px bg-border"></div>
                        <div className="h-2.5 w-px bg-border"></div>
                        <div className="h-2.5 w-px bg-border"></div>
                      </div>
                      
                      {/* Padding wrapper to ensure fill/markers align with the 0-100 ticks */}
                      <div className="absolute inset-0 px-2 flex items-center z-10">
                        <div className="w-full relative h-full flex items-center">
                          {/* Achieved Fill */}
                          <div 
                            className="absolute left-0 h-3.5 rounded-full shadow-sm transition-all duration-700"
                            style={{ width: `${Math.min(d.score, 100)}%`, background: barColor }}
                          ></div>

                          {/* Required Marker (thick vertical line) */}
                          <div 
                            className="absolute w-[3px] h-6 bg-text-1 rounded-sm -translate-x-1/2 shadow-sm z-20"
                            style={{ left: `${d.benchmark}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Gap Badge */}
                    <div className="w-12 flex justify-end shrink-0 pl-2">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${gap >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                        {gap > 0 ? `+${gap}%` : `${gap}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Radar */}
        <div className="flex flex-col items-center justify-center w-full h-[320px] md:col-span-5">
          <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
              <defs>
                <linearGradient id="colorBehavioral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.25}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: chartTheme.isDark ? '#71717a' : '#a1a1aa' }} />
              <PolarGrid stroke={chartTheme.isDark ? '#52525b' : '#d4d4d8'} strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="fullName"
                tick={(props: any) => {
                  const { payload, x, y, cx, cy, textAnchor } = props;
                  
                  // Push text outward by 15% from the center to increase gap from the graph
                  const dx = (x - cx) * 0.15;
                  const dy = (y - cy) * 0.15;
                  const adjustedX = x + dx;
                  const adjustedY = y + dy;

                  const words = payload.value.split(' ');
                  const lines = [];
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
                      fill={chartTheme.isDark ? '#fbbf24' : '#b45309'} 
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
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tickCount={5}
                tick={({ payload, x, y }: any) => (
                  <text 
                    x={x} 
                    y={y} 
                    dy={-4}
                    textAnchor="middle" 
                    fill={chartTheme.isDark ? '#a1a1aa' : '#71717a'} 
                    fontSize={9} 
                    fontWeight={700}
                  >
                    {payload.value}%
                  </text>
                )}
                axisLine={false} 
              />
              
              <Radar
                name="Required"
                dataKey="benchmark"
                stroke={chartTheme.isDark ? '#a1a1aa' : '#71717a'}
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fill="none"
                dot={{ r: 3, fill: chartTheme.isDark ? '#a1a1aa' : '#71717a' }}
              />
              <Radar
                name="Assessed"
                dataKey="score"
                stroke="#d97706"
                fill="url(#colorBehavioral)"
                fillOpacity={1}
                strokeWidth={3}
                dot={{ r: 4, fill: '#d97706', strokeWidth: 1.5, stroke: chartTheme.isDark ? '#18181b' : '#ffffff' }}
                activeDot={{ r: 6, fill: '#d97706', strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Core</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />Leadership</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-surface-2 border border-border inline-block" />Target</span>
        </div>
        <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-amber-500 hover:underline inline-flex items-center gap-0.5">
          Matrix <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
};
