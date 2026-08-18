import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, TooltipProps } from 'recharts';
import { Award, ArrowUpRight } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { BehavioralLevelBadge } from '@/components/behavioral/BehavioralLevelBadge';
import { type BehavioralLevelCode } from '@/types/behavioral';
import { TabType } from '../../types';

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
        <p className="font-bold mb-2 text-text-1 border-b border-border pb-1.5">{data.fullName}</p>
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
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-amber-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
            3. Behavioral ({totalPillars} Pillars)
          </h2>
        </div>
        <BehavioralLevelBadge level={behavLevel} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Bars */}
        <div className="flex flex-col gap-4 md:col-span-7">
          {/* Donut summary */}
          <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
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

          {/* Horizontal bars */}
          <div className="flex flex-col gap-2">
            {chartData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    {/* Left: color dot + name — grows to fill available space */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.type === 'core' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                      <span className="font-medium text-text-1 truncate" title={d.fullName}>
                        {d.fullName}
                      </span>
                    </div>
                    {/* Right: score% / benchmark% · level — uniform text-[10px] matching Technical & CEFR cards */}
                    <div className="flex items-center gap-0.5 shrink-0 font-mono text-[10px] tabular-nums whitespace-nowrap text-text-2">
                      <strong className="text-text-1">{d.score}%</strong>
                      <span className="text-text-3 mx-0.5">/</span>
                      <span>{d.benchmark}%</span>
                      <span className="text-text-3 ml-1">{d.assessedCode}</span>
                      {d.isAssessed && (
                        <span className={`ml-0.5 font-bold ${d.score >= d.benchmark ? 'text-emerald-500' : 'text-red-400'}`}>
                          {d.score >= d.benchmark ? '✓' : '▲'}
                        </span>
                      )}
                    </div>
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
                <linearGradient id="colorBehavioral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.25}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: chartTheme.isDark ? '#71717a' : '#a1a1aa' }} />
              <PolarGrid stroke={chartTheme.isDark ? '#52525b' : '#d4d4d8'} strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="fullName"
                tick={{ fill: chartTheme.isDark ? '#d4d4d8' : '#52525b', fontSize: 10, fontWeight: 700 }}
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
                stroke="#d97706"
                fill="url(#colorBehavioral)"
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
