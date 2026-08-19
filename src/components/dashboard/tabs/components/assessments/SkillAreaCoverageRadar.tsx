import React from 'react';
import { Award } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';
import { getChartTooltipStyle } from '@/hooks/useChartTheme';

export interface SkillAreaCoverageRadarProps {
  radarData: Array<{
    domain: string;
    fullDomain: string;
    score: number;
    threshold: number;
    meets: boolean;
  }>;
  avgThreshold: number;
  chartTheme: any;
}

/* ── Radar label tick: full text, position-aware alignment ─────────────── */
function RadarTick({
  payload,
  x = 0,
  y = 0,
  cx = 0,
  cy = 0,
}: {
  payload?: { value: string };
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
}) {
  if (!payload) return null;
  const dx = x - (cx as number);
  const dy = y - (cy as number);
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const labelOffset = 14;
  const labelX = x + (dx / distance) * labelOffset;
  const labelY = y + (dy / distance) * labelOffset;
  const textAnchor = Math.abs(dx) < 12 ? 'middle' : dx > 0 ? 'start' : 'end';
  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgb(var(--text-2))"
      fontSize={11}
    >
      {payload.value}
    </text>
  );
}

export const SkillAreaCoverageRadar: React.FC<SkillAreaCoverageRadarProps> = ({
  radarData,
  avgThreshold,
  chartTheme: c,
}) => {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <IconBadge icon={<Award size={13} />} color="accent" size="sm" />
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
            Skill Area Coverage
          </p>
          <InfoTip text="Shows how strong this person is in each skill area." />
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
          How strong this person is in each skill area.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={640}>
        <RadarChart data={radarData} outerRadius="82%" margin={{ top: 76, right: 126, bottom: 76, left: 126 }}>
          <PolarGrid stroke={c.gridColor} />
          <PolarAngleAxis dataKey="fullDomain" tick={<RadarTick />} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: c.axisColor }}
            tickFormatter={(v) => `${v}%`}
            angle={30}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={c.accent}
            fill={c.accent}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          {avgThreshold > 0 && (
            <Radar
              name={`Required (${avgThreshold}%)`}
              dataKey="threshold"
              stroke={c.warning}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
          )}
          <Tooltip
            wrapperStyle={{ zIndex: 1000 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={getChartTooltipStyle(c)}>
                  <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>
                    {d.fullDomain ?? d.domain}
                  </p>
                  <p style={{ color: c.tooltipText }}>Score: {d.score}%</p>
                  {d.threshold > 0 && (
                    <p style={{ color: d.meets ? c.success : c.danger }}>
                      Required: {d.threshold}% ({d.meets ? '✓ Meets' : '✗ Below'})
                    </p>
                  )}
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
