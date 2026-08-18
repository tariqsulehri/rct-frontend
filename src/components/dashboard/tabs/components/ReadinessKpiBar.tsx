import React from 'react';
import {
  CheckCircle2,
  Cpu,
  MessageSquare,
  ShieldCheck,
  Zap,
  BarChart2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatGrade } from '@/lib/formatters';
import { type CefrLevelCode } from '@/types/communication';
import { type BehavioralLevelCode } from '@/types/behavioral';

/** Threshold above which a readiness score is considered promotion-gate "Ready". */
const READINESS_READY_THRESHOLD = 80;

export interface ReadinessKpiBarProps {
  skillsCompletionPct: number;
  currentGrade: string;
  targetGrade: string;
  // Technical
  myScore: number;
  myRequired: number;
  myMeets: number;
  myTotal: number;
  technicalReady: boolean;
  // CEFR
  commLevel: CefrLevelCode;
  commBenchmark: CefrLevelCode;
  commScorePct: number;
  commReqPct: number;
  commReady: boolean;
  // Behavioral
  behavLevel: BehavioralLevelCode;
  behavBenchmark: BehavioralLevelCode;
  behavScorePct: number;
  behavReqPct: number;
  behavReady: boolean;
}

/**
 * ReadinessKpiBar
 * ----------------
 * Renders the 5-card KPI strip: Overall Readiness, Technical Score, CEFR Lang,
 * Behavioral Level, and Skills Gate count. All hardcoded thresholds (e.g. 80%)
 * are held in this component's constants — not inlined in JSX.
 *
 * @see ResourceOverviewDashboard — parent orchestrator
 */
export const ReadinessKpiBar: React.FC<ReadinessKpiBarProps> = ({
  skillsCompletionPct,
  currentGrade,
  targetGrade,
  myScore,
  myRequired,
  myMeets,
  myTotal,
  technicalReady,
  commLevel,
  commBenchmark,
  commScorePct,
  commReady,
  behavLevel,
  behavBenchmark,
  behavScorePct,
  behavReqPct,
  behavReady,
}) => {
  const readinessReady = skillsCompletionPct >= READINESS_READY_THRESHOLD;
  const techDelta = (myScore ?? 0) - (myRequired ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">

      {/* KPI 1 — Overall Promotion Readiness */}
      <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-accent/40 transition-colors">
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-accent/10 blur-xl group-hover:bg-accent/20 transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Readiness</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            readinessReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}>
            {readinessReady ? '✓ Ready' : '⚡ In Progress'}
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-text-1 leading-none">{skillsCompletionPct}%</span>
          <span className="text-[10px] text-text-3 pb-0.5">of gate</span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${skillsCompletionPct}%` }}
          />
        </div>
        <span className="text-[9px] text-text-3">Promotion Gate: {formatGrade(currentGrade)} → {formatGrade(targetGrade)}</span>
      </div>

      {/* KPI 2 — Technical Score vs Required */}
      <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-indigo-500/40 transition-colors">
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Cpu size={13} className="text-indigo-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Technical</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            technicalReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
          }`}>
            {technicalReady ? '✓ Met' : '✗ Gap'}
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 leading-none">{myScore}%</span>
          <span className="text-[10px] text-text-3 pb-0.5">/ {myRequired}% req</span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
            style={{ width: `${Math.min(myScore ?? 0, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-[9px] text-text-3">
          {techDelta >= 0
            ? <><TrendingUp size={9} className="text-emerald-500" /><span>+{techDelta}% above target</span></>
            : <><TrendingDown size={9} className="text-red-400" /><span>{Math.abs(techDelta)}% below target</span></>
          }
        </div>
      </div>

      {/* KPI 3 — CEFR Communication */}
      <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-cyan-500/40 transition-colors">
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MessageSquare size={13} className="text-cyan-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">CEFR Lang</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            commReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}>
            {commReady ? '✓ Met' : '▲ Progressing'}
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-cyan-600 dark:text-cyan-400 leading-none">{commLevel}</span>
          <span className="text-[10px] text-text-3 pb-0.5">/ {commBenchmark} req</span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700"
            style={{ width: `${commScorePct}%` }}
          />
        </div>
        <span className="text-[9px] text-text-3">Score: {commScorePct}% · Benchmark: {commReady ? commScorePct : 0}%</span>
      </div>

      {/* KPI 4 — Behavioral Level */}
      <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-amber-500/40 transition-colors">
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Behavioral</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
            behavReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}>
            {behavReady ? '✓ Met' : '▲ Progressing'}
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 leading-none">{behavLevel}</span>
          <span className="text-[10px] text-text-3 pb-0.5">/ {behavBenchmark} req</span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
            style={{ width: `${behavScorePct}%` }}
          />
        </div>
        <span className="text-[9px] text-text-3">Proficiency: {behavScorePct}% vs {behavReqPct}% req</span>
      </div>

      {/* KPI 5 — Skills Gate Count */}
      <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-accent/40 transition-colors">
        <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-accent/10 blur-xl group-hover:bg-accent/20 transition-colors" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Zap size={13} className="text-accent shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Skills Gate</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-soft text-accent-txt">
            {myMeets}/{myTotal}
          </span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums text-text-1 leading-none">{myMeets}</span>
          <span className="text-[10px] text-text-3 pb-0.5">/ {myTotal} skills</span>
        </div>
        <div className="w-full h-1 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-purple-400 transition-all duration-700"
            style={{ width: myTotal > 0 ? `${Math.round((myMeets / myTotal) * 100)}%` : '0%' }}
          />
        </div>
        <div className="flex items-center gap-1 text-[9px] text-text-3">
          <BarChart2 size={9} className="text-accent" />
          <span>{myTotal > 0 ? Math.round((myMeets / myTotal) * 100) : skillsCompletionPct}% competencies verified</span>
        </div>
      </div>

    </div>
  );
};
