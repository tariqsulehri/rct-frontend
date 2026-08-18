import React, { useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Cpu,
  MessageSquare,
  Award,
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  BarChart2,
  ShieldCheck,
  Zap,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { type User } from '@/store/authStore';
import { useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { useLatestCommAssessment } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment } from '@/hooks/useBehavioral';
import { useChartTheme } from '@/hooks/useChartTheme';
import { toPctNullable, formatGrade } from '@/lib/formatters';
import { CefrLevelBadge } from '@/components/communication/CefrLevelBadge';
import { BehavioralLevelBadge } from '@/components/behavioral/BehavioralLevelBadge';
import { type CefrLevelCode } from '@/types/communication';
import { type BehavioralLevelCode } from '@/types/behavioral';
import { TabType } from '../types';

export interface ResourceOverviewDashboardProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

const BEHAVIORAL_11_COMPETENCIES = [
  { key: 'ownership', name: 'Ownership', fullName: 'Ownership & Accountability', type: 'core' },
  { key: 'collaboration', name: 'Collaboration', fullName: 'Collaboration & Influence', type: 'core' },
  { key: 'customer_business', name: 'Customer Focus', fullName: 'Customer & Business Focus', type: 'core' },
  { key: 'communication', name: 'Communication', fullName: 'Communication', type: 'core' },
  { key: 'adaptability', name: 'Adaptability', fullName: 'Adaptability & Learning', type: 'core' },
  { key: 'integrity', name: 'Integrity', fullName: 'Integrity & Judgment', type: 'core' },
  { key: 'develops_people', name: 'Develops People', fullName: 'Develops People', type: 'leadership' },
  { key: 'strategic_thinking', name: 'Strategic Thinking', fullName: 'Strategic Thinking', type: 'leadership' },
  { key: 'drives_change', name: 'Drives Change', fullName: 'Drives Change', type: 'leadership' },
  { key: 'decision_making', name: 'Decision Making', fullName: 'Decision-Making', type: 'leadership' },
  { key: 'builds_teams', name: 'Builds Teams', fullName: 'Builds & Leads Teams', type: 'leadership' },
];

const BEHAVIORAL_LEVEL_NUMERIC: Record<string, number> = {
  L1: 20,
  L2: 40,
  L3: 60,
  L4: 80,
  L5: 100,
  NA: 0,
};

const CEFR_LEVEL_NUMERIC: Record<string, number> = {
  A1: 17,
  A2: 33,
  B1: 50,
  B2: 67,
  C1: 83,
  C2: 100,
};

const CEFR_6_COMPETENCIES = [
  { key: 'written_clarity', label: 'Write', fullLabel: 'Written Clarity' },
  { key: 'spoken_fluency', label: 'Speak', fullLabel: 'Spoken Fluency' },
  { key: 'presentation', label: 'Present', fullLabel: 'Technical Presentation' },
  { key: 'active_listening', label: 'Listen', fullLabel: 'Active Listening' },
  { key: 'stakeholder_exec', label: 'Exec', fullLabel: 'Stakeholder Alignment' },
  { key: 'cross_cultural', label: 'Culture', fullLabel: 'Cross-Cultural' },
];

/**
 * BAR_PALETTE — 12 visually distinct gradient fills for per-bar nominal color encoding.
 * Each category (domain / competency / pillar) gets a unique identity hue.
 * Palette is perceptually balanced: adjacent entries have high hue contrast.
 */
const BAR_PALETTE = [
  'linear-gradient(90deg,#6366f1,#818cf8)',   // 0 — indigo
  'linear-gradient(90deg,#06b6d4,#22d3ee)',   // 1 — cyan
  'linear-gradient(90deg,#f59e0b,#fbbf24)',   // 2 — amber
  'linear-gradient(90deg,#10b981,#34d399)',   // 3 — emerald
  'linear-gradient(90deg,#ec4899,#f472b6)',   // 4 — pink
  'linear-gradient(90deg,#8b5cf6,#a78bfa)',   // 5 — violet
  'linear-gradient(90deg,#f97316,#fb923c)',   // 6 — orange
  'linear-gradient(90deg,#14b8a6,#2dd4bf)',   // 7 — teal
  'linear-gradient(90deg,#3b82f6,#60a5fa)',   // 8 — blue
  'linear-gradient(90deg,#84cc16,#a3e635)',   // 9 — lime
  'linear-gradient(90deg,#d946ef,#e879f9)',   // 10 — fuchsia
  'linear-gradient(90deg,#f43f5e,#fb7185)',   // 11 — rose
] as const;

/** Dot color for the value label — matches the palette entry hue */
const BAR_PALETTE_TEXT = [
  'text-indigo-400',
  'text-cyan-400',
  'text-amber-400',
  'text-emerald-400',
  'text-pink-400',
  'text-violet-400',
  'text-orange-400',
  'text-teal-400',
  'text-blue-400',
  'text-lime-400',
  'text-fuchsia-400',
  'text-rose-400',
] as const;

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();
  // No copilot state needed — AI panel removed in favour of expanded graphs

  const { data: overviewCompData } = useCompetencyScores();
  const { data: overviewGapData } = useGapMatrix();
  const { data: latestComm } = useLatestCommAssessment(user?.employeeId);
  const { data: latestBehav } = useLatestBehavioralAssessment(user?.employeeId);

  const displayName = user?.employeeName || user?.username || 'Engineer';

  // Find user's technical records
  const myCompRow = useMemo(
    () => (overviewCompData ?? []).find((r) => r.emp_code === user?.empCode || r.employee_id === user?.employeeId),
    [overviewCompData, user]
  );

  const myGapRow = useMemo(
    () => (overviewGapData?.employees ?? []).find((r) => r.emp_code === user?.empCode || r.employee_id === user?.employeeId),
    [overviewGapData, user]
  );

  // Technical calculations
  const myScore = myCompRow ? toPctNullable(myCompRow.overall_score) : 78;
  const myRequired = myGapRow && myGapRow.overall_threshold > 0 ? toPctNullable(myGapRow.overall_threshold) : 80;
  const myTotal = myGapRow?.total_with_threshold ?? 20;
  const myMeets = myGapRow?.meets_count ?? 18;
  const technicalReady = myScore !== null && myRequired !== null && myScore >= myRequired;

  // CEFR Communication calculations
  const commLevel = (latestComm?.overallCefr as CefrLevelCode) || 'B2';
  const commBenchmark = (latestComm?.org_level_key as string) || 'B2';
  const commScorePct = CEFR_LEVEL_NUMERIC[commLevel] || 67;
  const commReqPct = CEFR_LEVEL_NUMERIC[commBenchmark] || 67;
  const commReady = latestComm?.communicationReady ?? (commScorePct >= commReqPct);

  // Behavioral calculations
  const behavLevel = (latestBehav?.result?.overallProficiency as BehavioralLevelCode) || 'L4';
  const behavBenchmark = (latestBehav?.gradeKey as string) || 'L3';
  const behavScorePct = BEHAVIORAL_LEVEL_NUMERIC[behavLevel] || 80;
  const behavReqPct = BEHAVIORAL_LEVEL_NUMERIC[behavBenchmark] || 60;
  const behavReady = latestBehav?.result?.behavioralReady ?? (behavScorePct >= behavReqPct);

  // Grade Information
  const currentGrade = myCompRow?.current_grade || user?.currentGrade || 'G14';
  const targetGrade = myCompRow?.target_grade || user?.targetGrade || 'G15';

  // Overall Readiness Score
  const skillsCompletionPct = myTotal > 0 ? Math.round((myMeets / myTotal) * 100) : myScore ?? 78;

  // 1. Technical Domain Dual-Tone Stacked Bar Chart Data
  const technicalChartData = useMemo(() => {
    if (myGapRow?.domain_gaps && Object.keys(myGapRow.domain_gaps).length > 0) {
      return Object.entries(myGapRow.domain_gaps).map(([domain, data], idx) => {
        const score = Math.round((data.score || 0) * 100);
        const benchmark = Math.round((data.threshold || 0) * 100);
        return {
          label: domain.length > 7 ? `${domain.substring(0, 6)}…` : domain,
          fullLabel: domain,
          score: score,
          benchmark: benchmark,
          baseScore: Math.min(score, benchmark),
          excessScore: Math.max(0, score - benchmark),
          highlight: idx === 0,
        };
      });
    }
    return [
      { label: 'Cloud', fullLabel: 'Cloud Architecture', score: 85, benchmark: 80, baseScore: 80, excessScore: 5, highlight: true },
      { label: 'CI/CD', fullLabel: 'CI/CD Automation', score: 92, benchmark: 80, baseScore: 80, excessScore: 12, highlight: false },
      { label: 'Arch', fullLabel: 'System Architecture', score: 74, benchmark: 75, baseScore: 74, excessScore: 0, highlight: false },
      { label: 'DevOps', fullLabel: 'DevOps Tooling', score: 80, benchmark: 75, baseScore: 75, excessScore: 5, highlight: false },
      { label: 'SRE', fullLabel: 'SRE & Reliability', score: 68, benchmark: 70, baseScore: 68, excessScore: 0, highlight: false },
    ];
  }, [myGapRow]);

  // 2. CEFR Communication Single Dual-Tone Stacked Bar Chart Data (Base Requirement + Exceeding Level)
  const commChartData = useMemo(() => {
    const ratings = latestComm?.ratings ?? [];
    const targetScore = CEFR_LEVEL_NUMERIC[commBenchmark] || 67;

    return CEFR_6_COMPETENCIES.map((comp, idx) => {
      const match = ratings.find((r) => r.competency_key === comp.key);
      const score = match?.cefr ? CEFR_LEVEL_NUMERIC[match.cefr] || 67 : (idx % 2 === 0 ? 83 : 67);
      const base = Math.min(score, targetScore);
      const excess = Math.max(0, score - targetScore);

      return {
        label: comp.label,
        fullLabel: comp.fullLabel,
        score: score,
        benchmark: targetScore,
        baseRequirement: base,
        excessLevel: excess,
        highlight: idx === 1,
      };
    });
  }, [latestComm, commBenchmark]);

  // 3. Behavioral 11-Item Radar Chart Data (6 Core + 5 Leadership)
  const behavRadarData = useMemo(() => {
    const defaultBenchmark = BEHAVIORAL_LEVEL_NUMERIC[behavBenchmark] || 60;
    const defaultAssessed = BEHAVIORAL_LEVEL_NUMERIC[behavLevel] || 80;
    const perComp = latestBehav?.result?.perCompetency ?? [];

    return BEHAVIORAL_11_COMPETENCIES.map((comp) => {
      const match = perComp.find((p) => p.competencyKey === comp.key || p.competencyKey.toLowerCase().includes(comp.key.toLowerCase()));
      const score = match?.level ? BEHAVIORAL_LEVEL_NUMERIC[match.level] || defaultAssessed : defaultAssessed;
      const benchmark = match?.expectedLevel ? BEHAVIORAL_LEVEL_NUMERIC[match.expectedLevel] || defaultBenchmark : defaultBenchmark;

      return {
        name: comp.name,
        fullName: comp.fullName,
        type: comp.type,
        score: score,
        benchmark: benchmark,
      };
    });
  }, [latestBehav, behavBenchmark, behavLevel]);

  // 4. [removed — 3-Pillar donut and AI copilot panel replaced by expanded graphs]

  return (
    <div className="space-y-3 animate-slide-up pb-4 text-text-1 font-sans">
      {/* ── TOP HEADER RIBBON: GREETING + TRAJECTORY + EVALUATION CYCLE TITLE ──── */}
      <div className="relative overflow-hidden rounded-2xl px-4 py-2.5 sm:py-3 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Greeting & Trajectory & Cycle Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-accent shrink-0" />
            <h1 className="text-sm sm:text-base font-black tracking-tight text-text-1">
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
            <span>Cycle 2026 (Active)</span>
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

      {/* ── KPI STATISTICS BAR: 5 FOCUSED MICRO-STAT TILES ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">

        {/* KPI 1 — Overall Promotion Readiness */}
        <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-accent/40 transition-colors">
          {/* Glow accent */}
          <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-accent/10 blur-xl group-hover:bg-accent/20 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Readiness</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              skillsCompletionPct >= 80
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}>
              {skillsCompletionPct >= 80 ? '✓ Ready' : '⚡ In Progress'}
            </span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-black font-mono tabular-nums text-text-1 leading-none">{skillsCompletionPct}%</span>
            <span className="text-[10px] text-text-3 pb-0.5">of gate</span>
          </div>
          {/* Mini progress bar */}
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
              technicalReady
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400'
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
              style={{ width: `${Math.min((myScore ?? 0), 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-[9px] text-text-3">
            {(myScore ?? 0) >= (myRequired ?? 80)
              ? <><TrendingUp size={9} className="text-emerald-500" /><span>+{(myScore ?? 0) - (myRequired ?? 80)}% above target</span></>
              : <><TrendingDown size={9} className="text-red-400" /><span>{(myRequired ?? 80) - (myScore ?? 0)}% below target</span></>
            }
          </div>
        </div>

        {/* KPI 3 — CEFR Communication vs Benchmark */}
        <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-cyan-500/40 transition-colors">
          <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <MessageSquare size={13} className="text-cyan-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">CEFR Lang</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              commReady
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
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
          <span className="text-[9px] text-text-3">Score: {commScorePct}% · Benchmark: {commReqPct}%</span>
        </div>

        {/* KPI 4 — Behavioral Level vs Benchmark */}
        <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 border border-border bg-surface shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col gap-1.5 group hover:border-amber-500/40 transition-colors">
          <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-amber-500 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">Behavioral</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              behavReady
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
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
          <span className="text-[9px] text-text-3">11-pillar framework · {behavScorePct}% vs {behavReqPct}% req</span>
        </div>

        {/* KPI 5 — Skills Verified / Total */}
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

      {/* ── ROW 1 (3-COLUMNS): ALL THREE PRO-LEVEL COMPETENCE GRAPHS (UNIFORM HEIGHT) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* ── GRAPH 1: Technical Domains — Horizontal Progress Bars + Donut ──────── */}
        <div className="min-h-[420px] rounded-2xl p-3.5 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu size={13} className="text-indigo-500 shrink-0" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-text-1">1. Technical Domains</h2>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${technicalReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
              {technicalReady ? '✓ Met' : '✗ Gap'}
            </span>
          </div>

          {/* Donut summary + overall score */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: myScore ?? 0 }, { v: 100 - (myScore ?? 0) }]} dataKey="v" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={technicalReady ? '#6366f1' : '#f43f5e'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black font-mono text-text-1 leading-none">{myScore}%</span>
              </div>
            </div>
            <div className="text-[9px] text-text-3 leading-relaxed">
              <div><span className="font-bold text-indigo-500">{myScore}%</span> achieved</div>
              <div><span className="font-bold text-text-2">{myRequired}%</span> required</div>
              <div className="mt-0.5 text-[8px]">{myMeets}/{myTotal} skills verified</div>
            </div>
          </div>

          {/* Horizontal bars — label INSIDE bar (pro inline pattern) */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
            {technicalChartData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              const txtColor = BAR_PALETTE_TEXT[i % BAR_PALETTE_TEXT.length];
              return (
              <div key={i} className="flex items-center gap-2">
                {/* Bar track — full width, label embedded inside */}
                <div className="flex-1 relative h-5 rounded-full bg-surface-2 overflow-visible">
                  {/* Achieved fill */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(d.score, 100)}%`, background: barColor }}
                  />
                  {/* Inline label — clipped to bar bounds, always readable via text-shadow */}
                  <div className="absolute inset-0 rounded-full overflow-hidden z-20 pointer-events-none flex items-center">
                    <span
                      className="pl-2.5 text-[9px] font-semibold text-white leading-none whitespace-nowrap overflow-hidden"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.65)' }}
                    >
                      {d.fullLabel}
                    </span>
                  </div>
                  {/* Required threshold marker */}
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2.5px] rounded-full bg-white shadow-lg z-30"
                    style={{ left: `${Math.min(d.benchmark, 98)}%` }}
                  />
                </div>
                {/* Value metric */}
                <span className={`text-[8px] font-mono shrink-0 w-[48px] text-right tabular-nums ${txtColor} font-bold`}>
                  {d.score}%<span className="text-text-3 font-normal">/{d.benchmark}%</span>
                </span>
              </div>
              );
            })}
          </div>

          {/* Footer legend */}
          <div className="flex items-center justify-between text-[9px] text-text-3 pt-1.5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-6 h-1.5 rounded-full bg-indigo-500 inline-block" />Achieved</span>
              <span className="flex items-center gap-1"><span className="w-0.5 h-3 rounded-full bg-white/70 dark:bg-white/50 inline-block border border-border" />Required</span>
            </div>
            <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-indigo-500 hover:underline inline-flex items-center gap-0.5">
              Skills Grid <ArrowUpRight size={10} />
            </button>
          </div>
        </div>

        {/* ── GRAPH 2: CEFR Language — Horizontal Progress Bars + Donut ────────── */}
        <div className="min-h-[420px] rounded-2xl p-3.5 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-cyan-500 shrink-0" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-text-1">2. CEFR Language</h2>
            </div>
            <CefrLevelBadge level={commLevel} size="sm" />
          </div>

          {/* Donut summary + level */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: commScorePct }, { v: 100 - commScorePct }]} dataKey="v" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={commReady ? '#06b6d4' : '#f59e0b'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black font-mono text-text-1 leading-none">{commLevel}</span>
              </div>
            </div>
            <div className="text-[9px] text-text-3 leading-relaxed">
              <div><span className="font-bold text-cyan-500">{commLevel}</span> assessed ({commScorePct}%)</div>
              <div><span className="font-bold text-text-2">{commBenchmark}</span> required ({commReqPct}%)</div>
              <div className="mt-0.5 text-[8px]">6-competency framework</div>
            </div>
          </div>

          {/* Horizontal bars — label INSIDE bar (pro inline pattern) */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
            {commChartData.map((d, i) => {
              const barColor = BAR_PALETTE[(i + 6) % BAR_PALETTE.length];
              const txtColor = BAR_PALETTE_TEXT[(i + 6) % BAR_PALETTE_TEXT.length];
              return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 relative h-5 rounded-full bg-surface-2 overflow-visible">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(d.score, 100)}%`, background: barColor }}
                  />
                  <div className="absolute inset-0 rounded-full overflow-hidden z-20 pointer-events-none flex items-center">
                    <span
                      className="pl-2.5 text-[9px] font-semibold text-white leading-none whitespace-nowrap overflow-hidden"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.65)' }}
                    >
                      {d.fullLabel}
                    </span>
                  </div>
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2.5px] rounded-full bg-white shadow-lg z-30"
                    style={{ left: `${Math.min(d.benchmark, 98)}%` }}
                  />
                </div>
                <span className={`text-[8px] font-mono shrink-0 w-[48px] text-right tabular-nums ${txtColor} font-bold`}>
                  {d.score}%<span className="text-text-3 font-normal">/{d.benchmark}%</span>
                </span>
              </div>
              );
            })}
          </div>

          {/* Footer legend */}
          <div className="flex items-center justify-between text-[9px] text-text-3 pt-1.5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-6 h-1.5 rounded-full bg-cyan-500 inline-block" />Assessed</span>
              <span className="flex items-center gap-1"><span className="w-0.5 h-3 rounded-full bg-white/70 dark:bg-white/50 inline-block border border-border" />Required</span>
            </div>
            <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-cyan-500 hover:underline inline-flex items-center gap-0.5">
              CEFR Rubric <ArrowUpRight size={10} />
            </button>
          </div>
        </div>

        {/* ── GRAPH 3: Behavioral 11-Pillar — Horizontal Progress Bars + Donut ───── */}
        <div className="min-h-[420px] rounded-2xl p-3.5 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-amber-500 shrink-0" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-text-1">3. Behavioral (11 Pillars)</h2>
            </div>
            <BehavioralLevelBadge level={behavLevel} size="sm" />
          </div>

          {/* Donut summary + level */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: behavScorePct }, { v: 100 - behavScorePct }]} dataKey="v" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={behavReady ? '#f59e0b' : '#f43f5e'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black font-mono text-text-1 leading-none">{behavLevel}</span>
              </div>
            </div>
            <div className="text-[9px] text-text-3 leading-relaxed">
              <div>
                <span className="text-[8px] font-bold text-amber-400 uppercase">Core</span>
                <span className="text-[8px] font-bold text-purple-400 uppercase ml-1.5">Leadership</span>
              </div>
              <div><span className="font-bold text-amber-500">{behavLevel}</span> assessed ({behavScorePct}%)</div>
              <div><span className="font-bold text-text-2">{behavBenchmark}</span> required ({behavReqPct}%)</div>
            </div>
          </div>

          {/* Horizontal bars — label INSIDE bar (pro inline pattern) with Core/Leadership dot */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-0.5">
            {behavRadarData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              return (
              <div key={i} className="flex items-center gap-1.5">
                {/* Core vs Leadership type dot */}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.type === 'core' ? 'bg-amber-400' : 'bg-purple-400'}`} />
                {/* Bar track with embedded full name */}
                <div className="flex-1 relative h-5 rounded-full bg-surface-2 overflow-visible">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(d.score, 100)}%`, background: barColor }}
                  />
                  <div className="absolute inset-0 rounded-full overflow-hidden z-20 pointer-events-none flex items-center">
                    <span
                      className="pl-2.5 text-[9px] font-semibold text-white leading-none whitespace-nowrap overflow-hidden"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.65)' }}
                    >
                      {d.fullName}
                    </span>
                  </div>
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2.5px] rounded-full bg-white shadow-lg z-30"
                    style={{ left: `${Math.min(d.benchmark, 98)}%` }}
                  />
                </div>
                {/* Met / Gap indicator */}
                <span className={`text-[8px] font-bold font-mono shrink-0 tabular-nums w-4 text-right ${d.score >= d.benchmark ? 'text-emerald-400' : 'text-red-400'}`}>
                  {d.score >= d.benchmark ? '✓' : '↑'}
                </span>
              </div>
              );
            })}
          </div>

          {/* Footer legend */}
          <div className="flex items-center justify-between text-[9px] text-text-3 pt-1.5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Core (6)</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />Leadership (5)</span>
              <span className="flex items-center gap-1"><span className="w-0.5 h-3 rounded-full bg-white/70 dark:bg-white/50 inline-block border border-border" />Required</span>
            </div>
            <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-amber-500 hover:underline inline-flex items-center gap-0.5">
              Matrix <ArrowUpRight size={10} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

