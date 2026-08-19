import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Compass } from 'lucide-react';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';

export interface TriDimensionRadarProps {
  techScore?: number;
  commScore?: number;
  behavioralScore?: number;
  techTarget?: number;
  commTarget?: number;
  behavioralTarget?: number;
  chartTheme: any;
}

/** Vector-based radial tick offset for 3-Pillar Radar labels */
function RadarTick({ x, y, payload, cx, cy }: any) {
  const dx = x - cx;
  const dy = y - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Offset label outward by 24px along its radial vector for maximum readability
  const labelX = x + (dx / len) * 24;
  const labelY = y + (dy / len) * 24;

  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  if (Math.abs(dx) > 15) {
    textAnchor = dx > 0 ? 'start' : 'end';
  }

  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgb(var(--text-1))"
      fontSize={12}
      fontWeight={800}
    >
      {payload.value}
    </text>
  );
}

export const TriDimensionRadar: React.FC<TriDimensionRadarProps> = ({
  techScore = 0,
  commScore = 0,
  behavioralScore = 0,
  techTarget = 0,
  commTarget = 0,
  behavioralTarget = 0,
  chartTheme: _c,
}) => {
  const data = [
    {
      pillar: 'Technical Index',
      achieved: techScore,
      target: techTarget,
    },
    {
      pillar: 'CEFR Communication',
      achieved: commScore,
      target: commTarget,
    },
    {
      pillar: 'Behavioral Engine',
      achieved: behavioralScore,
      target: behavioralTarget,
    },
  ];

  return (
    <div
      className="card p-5 space-y-4 flex flex-col justify-between"
      style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconBadge icon={<Compass size={14} />} color="accent" size="sm" />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--text-1))' }}>
              3-Pillar Symmetry Radar
            </h3>
            <InfoTip text="Normalized multi-dimensional balance chart comparing Technical, CEFR Communication, and Behavioral pillars against target requirements." />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            Cross-dimensional balance analysis.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgb(var(--accent))' }} />
            <span style={{ color: 'rgb(var(--text-2))' }}>Achieved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 bg-transparent" />
            <span style={{ color: 'rgb(var(--text-2))' }}>Target</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%" margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
            <PolarGrid stroke="rgb(var(--border))" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="pillar" tick={<RadarTick />} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgb(var(--text-3))" fontSize={10} />

            {/* Target Area Overlay */}
            <Radar
              name="Required Target"
              dataKey="target"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="4 4"
            />

            {/* Achieved Area */}
            <Radar
              name="Candidate Score"
              dataKey="achieved"
              stroke="rgb(var(--accent))"
              fill="rgb(var(--accent))"
              fillOpacity={0.4}
              strokeWidth={2.5}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div
                    className="p-3 rounded-xl border shadow-lg text-xs space-y-1"
                    style={{
                      backgroundColor: 'rgb(var(--surface-2))',
                      borderColor: 'rgb(var(--border))',
                      color: 'rgb(var(--text-1))',
                    }}
                  >
                    <p className="font-extrabold text-sm text-indigo-400">{d.pillar}</p>
                    <p>Achieved Score: <strong className="text-emerald-400">{d.achieved}%</strong></p>
                    <p>Required Target: <strong className="text-amber-400">{d.target}%</strong></p>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
