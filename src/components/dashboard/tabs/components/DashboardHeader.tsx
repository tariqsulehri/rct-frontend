import React from 'react';
import { Sparkles, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react';
import { formatGrade } from '@/lib/formatters';
import { TabType } from '../../types';

export interface DashboardHeaderProps {
  displayName: string;
  currentGrade: string;
  targetGrade: string;
  activeCycleName: string;
  skillsCompletionPct: number;
  onNavigate: (t: TabType) => void;
}

/**
 * DashboardHeader
 * ----------------
 * Renders the top banner for the Resource Overview: welcome message, grade trajectory
 * pill, active appraisal cycle badge, overall readiness score, and "Assess Skills" CTA.
 *
 * @see ResourceOverviewDashboard — parent orchestrator that feeds all props
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  displayName,
  currentGrade,
  targetGrade,
  activeCycleName,
  skillsCompletionPct,
  onNavigate,
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-accent-soft text-accent shrink-0">
          <Sparkles size={18} />
        </div>
        <h1 className="text-base font-extrabold tracking-tight text-text-1">
          Welcome back, {displayName}! 👋
        </h1>
      </div>

      {/* Grade Trajectory Tag */}
      <div className="flex items-center gap-1 text-xs font-semibold">
        <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text-2 text-[10px]">
          {formatGrade(currentGrade)}
        </span>
        <span className="text-accent font-bold">→</span>
        <span className="px-2 py-0.5 rounded-md bg-accent-soft border border-accent/30 text-accent-txt text-[10px]">
          Target: <strong className="font-mono text-text-1">{formatGrade(targetGrade)}</strong>
        </span>
      </div>

      {/* Evaluation Cycle Title Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-soft text-accent-txt border border-accent/30">
        <CalendarIcon size={12} className="text-accent" />
        <span>{activeCycleName}</span>
      </div>
    </div>

    {/* Right: Promotion Readiness Pill & CTA */}
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1 rounded-xl border border-border text-xs">
        <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Readiness</span>
        <span className="font-black text-text-1 font-mono tabular-nums text-xs">{skillsCompletionPct}%</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
      </div>

      <button
        type="button"
        onClick={() => onNavigate('assessments')}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-accent text-white hover:bg-accent-hover shadow-sm transition-all active:scale-95"
      >
        <span>Assess Skills</span>
        <ArrowUpRight size={12} />
      </button>
    </div>
  </div>
);
