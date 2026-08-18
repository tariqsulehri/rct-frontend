import React from 'react';
import { Award, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BehavioralLevelBadge } from '@/components/behavioral/BehavioralLevelBadge';
import { type BehavioralLevelCode } from '@/types/behavioral';
import { BAR_PALETTE } from '../constants';

interface BehavioralPillarsCardProps {
  behavLevel: BehavioralLevelCode | '-';
  behavBenchmark: BehavioralLevelCode | '-';
  behavScorePct: number;
  behavReqPct: number;
  behavReady: boolean;
  behavChartData: { name: string; fullName: string; type: string; score: number; benchmark: number; assessedCode: string; reqCode: string }[];
  isDark: boolean;
  onNavigate: (tab: any) => void;
}

export const BehavioralPillarsCard: React.FC<BehavioralPillarsCardProps> = ({
  behavLevel,
  behavBenchmark,
  behavScorePct,
  behavReqPct,
  behavReady,
  behavChartData,
  isDark,
  onNavigate,
}) => {
  return (
    <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-amber-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-text-1">3. Behavioral (11 Pillars)</h2>
        </div>
        {behavLevel !== '-' && <BehavioralLevelBadge level={behavLevel as BehavioralLevelCode} size="sm" />}
      </div>

      <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
        <div className="relative w-14 h-14 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ v: behavScorePct }, { v: Math.max(100 - behavScorePct, 0) }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                <Cell fill={behavReady ? '#f59e0b' : '#f43f5e'} />
                <Cell fill={isDark ? '#27272a' : '#e5e7eb'} />
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
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Core (6)
            </span>
            <span className="text-[9px] font-bold text-purple-500 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />Leadership (5)
            </span>
          </div>
          <div><span className="font-bold text-amber-500">{behavLevel}</span> assessed ({behavScorePct}%)</div>
          <div><span className="font-bold text-text-2">{behavBenchmark}</span> required ({behavReqPct}%)</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {behavChartData.length === 0 ? (
          <div className="text-center text-text-3 text-[10px] py-4">No behavioral data found.</div>
        ) : (
          behavChartData.map((d, i) => {
            const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
            return (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.type === 'core' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                    <span className="font-semibold text-text-1 truncate" title={d.fullName}>
                      {d.fullName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] tabular-nums">
                    <span className="font-bold text-text-1">{d.assessedCode}</span>
                    <span className="text-text-3">/</span>
                    <span className="text-text-2">{d.reqCode}</span>
                    <span className={`ml-1 font-bold ${d.score >= d.benchmark ? 'text-emerald-500' : 'text-red-400'}`}>
                      {d.score >= d.benchmark ? '✓' : '▲'}
                    </span>
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
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border">
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
