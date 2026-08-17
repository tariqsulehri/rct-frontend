import React from 'react';
import { Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

export interface AssessmentRadarItem {
  competency: string;
  fullName?: string;
  Assessed: number;
  Target: number;
}

export interface AssessmentHeroLayoutProps {
  ladderComponent: React.ReactNode;
  metricCards: React.ReactNode;
  priorities: string[];
  radarData: AssessmentRadarItem[];
  radarTitle?: string;
  radarUnit?: string;
  className?: string;
}

/**
 * Enterprise Universal Assessment Hero Layout Component.
 * Implements a crisp, high-contrast 2-column layout (7/12 Left: Ladder + KPI Cards + Priorities; 5/12 Right: Radar Chart).
 */
export const AssessmentHeroLayout: React.FC<AssessmentHeroLayoutProps> = ({
  ladderComponent,
  metricCards,
  priorities,
  radarData,
  radarTitle = 'Competencies Radar',
  radarUnit = 'Score',
  className = '',
}) => {
  const chartTheme = useChartTheme();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${className}`}>
      {/* Left Column (Span 7/12): Ladder + 4 Metric Cards + Priorities Callout */}
      <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
        {/* Proficiency Ladder Component */}
        {ladderComponent}

        {/* 4 Metric KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{metricCards}</div>

        {/* Priorities Callout */}
        <div
          className="p-3 rounded-xl border flex items-start gap-2.5"
          style={{
            backgroundColor: 'rgb(var(--warning-soft))',
            borderColor: 'rgb(var(--warning) / 0.3)',
          }}
        >
          <Zap size={15} className="shrink-0 mt-0.5" style={{ color: 'rgb(var(--warning))' }} />
          <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--warning))' }}>
            <span className="font-bold">Priorities for promotion readiness: </span>
            {priorities.length > 0
              ? priorities.join(', ') + '.'
              : 'All competencies currently meet or exceed role target benchmarks.'}
          </div>
        </div>
      </div>

      {/* Right Column (Span 5/12): Radar Chart Container */}
      <div
        className="lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between shadow-card"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          borderColor: 'rgb(var(--border))',
        }}
      >
        <div className="flex items-center justify-between mb-1 px-1">
          <h4 className="text-xs font-bold" style={{ color: 'rgb(var(--text-1))' }}>
            {radarTitle}
          </h4>
          <span className="text-[10px] font-mono" style={{ color: 'rgb(var(--text-3))' }}>
            {radarUnit}
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="64%"
              data={radarData}
              margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
            >
              <PolarGrid stroke={chartTheme.gridColor} />
              <PolarAngleAxis
                dataKey="competency"
                tick={{ fill: chartTheme.axisColor, fontSize: 9.5, fontWeight: 700 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTheme.tooltipBg,
                  borderColor: chartTheme.tooltipBorder,
                  color: chartTheme.tooltipText,
                  borderRadius: '0.75rem',
                  boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)',
                }}
                formatter={(val: any, name: any) => [`${val}`, name]}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: '4px', color: chartTheme.legendColor }}
              />
              <Radar
                name="Assessed Level"
                dataKey="Assessed"
                stroke={chartTheme.accent}
                fill={chartTheme.accent}
                fillOpacity={0.35}
              />
              <Radar
                name="Role Benchmark"
                dataKey="Target"
                stroke={chartTheme.warning}
                fill={chartTheme.warning}
                fillOpacity={0.15}
                strokeDasharray="4 4"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
