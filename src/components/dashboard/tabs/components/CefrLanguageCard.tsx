import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { CefrLevelBadge } from '@/components/communication/CefrLevelBadge';
import { type CefrLevelCode } from '@/types/communication';
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
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">2. CEFR Language</h2>
        </div>
        <CefrLevelBadge level={commLevel} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Bars */}
        <div className="flex flex-col gap-4">
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
        <div className="flex flex-col items-center justify-center w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="70%">
              <PolarGrid stroke={chartTheme.isDark ? '#3f3f46' : '#e5e7eb'} />
              <PolarAngleAxis
                dataKey="fullLabel"
                tick={{ fill: chartTheme.isDark ? '#a1a1aa' : '#71717a', fontSize: 10, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              
              <Radar
                name="Required"
                dataKey="benchmark"
                stroke={chartTheme.isDark ? '#52525b' : '#d4d4d8'}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
              <Radar
                name="Assessed"
                dataKey="score"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.3}
                strokeWidth={2}
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
