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
import { formatGrade } from '@/lib/formatters';
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

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();

  // API Data hooks
  const { data: userScores = [] } = useCompetencyScores();
  const { data: gapMatrixData } = useGapMatrix();

  const activeUserId = user?.empCode ? String(user.empCode) : undefined;
  const { data: commAss } = useLatestCommAssessment(activeUserId);
  const { data: behavAss } = useLatestBehavioralAssessment(activeUserId);

  // Grade targets
  const currentGrade = user?.currentGrade || 'G15';
  const targetGrade = useMemo(() => {
    const num = parseInt(currentGrade.replace(/\D/g, ''), 10);
    return !isNaN(num) ? `G${num + 1}` : 'G16';
  }, [currentGrade]);

  const displayName = user?.employeeName || user?.username || 'Engineer';

  // 1. Technical Domain Scores
  const technicalChartData = useMemo(() => {
    const employees = gapMatrixData?.employees || [];
    const myEmp = employees.find(e => e.emp_code === user?.empCode) || employees[0];
    const domainGaps = myEmp?.domain_gaps;

    if (!domainGaps && !userScores.length) {
      return [
        { label: 'AI DevOps', fullLabel: 'AI-Augmented DevOps', score: 0, benchmark: 100 },
        { label: 'AIOps', fullLabel: 'AIOps', score: 0, benchmark: 100 },
        { label: 'Cloud', fullLabel: 'Cloud', score: 0, benchmark: 100 },
        { label: 'Core DevOps', fullLabel: 'Core DevOps', score: 0, benchmark: 100 },
        { label: 'DataOps', fullLabel: 'DataOps', score: 0, benchmark: 100 },
        { label: 'DevSecOps', fullLabel: 'DevSecOps', score: 0, benchmark: 95 },
        { label: 'FinOps', fullLabel: 'FinOps', score: 0, benchmark: 100 },
        { label: 'MLOps', fullLabel: 'MLOps', score: 0, benchmark: 100 },
        { label: 'Networking', fullLabel: 'Networking', score: 10, benchmark: 100 },
        { label: 'Platform Eng', fullLabel: 'Platform Engineering', score: 0, benchmark: 100 },
        { label: 'SRE', fullLabel: 'SRE', score: 2, benchmark: 100 },
        { label: 'SysOps', fullLabel: 'SysOps', score: 0, benchmark: 100 },
      ];
    }

    if (domainGaps) {
      return Object.entries(domainGaps).map(([domain, val]) => ({
        label: domain.length > 13 ? `${domain.slice(0, 11)}..` : domain,
        fullLabel: domain,
        score: Math.round(val.score),
        benchmark: Math.round(val.threshold || 100),
      }));
    }

    return userScores.map((item) => ({
      label: item.department.length > 13 ? `${item.department.slice(0, 11)}..` : item.department,
      fullLabel: item.department,
      score: Math.round(item.overall_score),
      benchmark: 100,
    }));
  }, [userScores, gapMatrixData, user?.empCode]);

  // Overall Technical stats
  const { myScore, myRequired, myMeets, myTotal, technicalReady } = useMemo(() => {
    if (!technicalChartData.length) {
      return { myScore: 12, myRequired: 100, myMeets: 0, myTotal: 26, technicalReady: false };
    }
    const sumScore = technicalChartData.reduce((acc, d) => acc + d.score, 0);
    const sumReq = technicalChartData.reduce((acc, d) => acc + d.benchmark, 0);
    const avgScore = Math.round(sumScore / technicalChartData.length);
    const avgReq = Math.round(sumReq / technicalChartData.length);

    const employees = gapMatrixData?.employees || [];
    const myEmp = employees.find(e => e.emp_code === user?.empCode) || employees[0];
    const meets = myEmp?.meets_count || 0;
    const total = myEmp?.total_with_threshold || 26;

    return {
      myScore: avgScore,
      myRequired: avgReq,
      myMeets: meets,
      myTotal: total,
      technicalReady: avgScore >= avgReq,
    };
  }, [technicalChartData, gapMatrixData, user?.empCode]);

  // 2. CEFR Language stats
  const commLevel: CefrLevelCode = (commAss?.evaluation?.overallCefr as CefrLevelCode) || (commAss?.overallCefr as CefrLevelCode) || 'B2';
  const commBenchmark: CefrLevelCode = (commAss?.evaluation?.expectedCefr as CefrLevelCode) || 'B2';
  const commScorePct = commAss?.evaluation?.overallScore ? Math.round(commAss.evaluation.overallScore * 100) : (CEFR_LEVEL_NUMERIC[commLevel] || 67);
  const commReqPct = commAss?.evaluation?.expectedScore ? Math.round(commAss.evaluation.expectedScore * 100) : (CEFR_LEVEL_NUMERIC[commBenchmark] || 67);
  const commReady = commScorePct >= commReqPct;

  const commChartData = useMemo(() => {
    const breakdown = commAss?.evaluation?.competencyBreakdown || [];
    const defaultBenchmark = CEFR_LEVEL_NUMERIC[commBenchmark] || 67;
    const defaultAssessed = CEFR_LEVEL_NUMERIC[commLevel] || 67;

    return CEFR_6_COMPETENCIES.map((comp) => {
      const match = breakdown.find(b => b.competencyKey === comp.key);
      const score = match ? (CEFR_LEVEL_NUMERIC[match.cefr] || defaultAssessed) : defaultAssessed;
      return {
        label: comp.label,
        fullLabel: comp.fullLabel,
        score,
        benchmark: defaultBenchmark,
      };
    });
  }, [commAss, commLevel, commBenchmark]);

  // 3. Behavioral stats
  const behavLevel: BehavioralLevelCode = (behavAss?.result?.overallProficiency as BehavioralLevelCode) || 'L4';
  const behavBenchmark: BehavioralLevelCode = 'L3';
  const behavScorePct = behavAss?.result?.overallCw ? Math.round(behavAss.result.overallCw * 100) : (BEHAVIORAL_LEVEL_NUMERIC[behavLevel] || 80);
  const behavReqPct = behavAss?.result?.overallExpectedCw ? Math.round(behavAss.result.overallExpectedCw * 100) : (BEHAVIORAL_LEVEL_NUMERIC[behavBenchmark] || 60);
  const behavReady = behavScorePct >= behavReqPct;

  const behavChartData = useMemo(() => {
    const breakdown = behavAss?.result?.perCompetency || [];
    const defaultBenchmark = BEHAVIORAL_LEVEL_NUMERIC[behavBenchmark] || 60;
    const defaultAssessed = BEHAVIORAL_LEVEL_NUMERIC[behavLevel] || 80;

    return BEHAVIORAL_11_COMPETENCIES.map((comp) => {
      const match = breakdown.find(
        (c) => c.competencyKey?.toLowerCase() === comp.key.toLowerCase()
      );
      const score = match?.level ? BEHAVIORAL_LEVEL_NUMERIC[match.level] || defaultAssessed : defaultAssessed;
      const benchmark = match?.expectedLevel ? BEHAVIORAL_LEVEL_NUMERIC[match.expectedLevel] || defaultBenchmark : defaultBenchmark;
      const assessedCode = match?.level || (score >= 80 ? 'L4' : score >= 60 ? 'L3' : 'L2');
      const reqCode = match?.expectedLevel || (benchmark >= 80 ? 'L4' : benchmark >= 60 ? 'L3' : 'L2');
      return {
        name: comp.name,
        fullName: comp.fullName,
        type: comp.type,
        score,
        benchmark,
        assessedCode,
        reqCode,
      };
    });
  }, [behavAss, behavLevel, behavBenchmark]);

  // Overall readiness score
  const skillsCompletionPct = useMemo(() => {
    const techFactor = (myScore / (myRequired || 100)) * 40;
    const commFactor = (commScorePct / (commReqPct || 100)) * 30;
    const behavFactor = (behavScorePct / (behavReqPct || 100)) * 30;
    return Math.min(100, Math.round(techFactor + commFactor + behavFactor));
  }, [myScore, myRequired, commScorePct, commReqPct, behavScorePct, behavReqPct]);

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-4 px-4 sm:px-6 py-2">

      {/* ── HEADER BANNER ───────────────────────────────────────────────────────────── */}
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

      {/* ── KPI STATISTICS BAR ──────────────────────────────────────── */}
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
              skillsCompletionPct >= 80 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}>
              {skillsCompletionPct >= 80 ? '✓ Ready' : '⚡ In Progress'}
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
          <span className="text-[9px] text-text-3">Score: {commScorePct}% · Benchmark: {commReqPct}%</span>
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
          <span className="text-[9px] text-text-3">11-pillar framework · {behavScorePct}% vs {behavReqPct}% req</span>
        </div>

        {/* KPI 5 — Skills Verified */}
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

      {/* ── ROW 2 (3-COLUMNS): HIGH-CONTRAST STANDARDIZED ASSESSMENT CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

        {/* ── GRAPH 1: Technical Domains ──────── */}
        <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-indigo-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">1. Technical Domains</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${technicalReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
              {technicalReady ? '✓ Met' : '✗ Gap'}
            </span>
          </div>

          {/* Donut summary + overall score */}
          <div className="flex items-center gap-3 bg-surface-2 p-2.5 rounded-xl border border-border">
            <div className="relative w-14 h-14 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: myScore ?? 0 }, { v: 100 - (myScore ?? 0) }]} dataKey="v" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} paddingAngle={2}>
                    <Cell fill={technicalReady ? '#6366f1' : '#f43f5e'} />
                    <Cell fill={chartTheme.isDark ? '#27272a' : '#e5e7eb'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black font-mono text-text-1 leading-none">{myScore}%</span>
              </div>
            </div>
            <div className="text-[10px] text-text-3 leading-relaxed">
              <div><span className="font-bold text-indigo-500">{myScore}%</span> achieved</div>
              <div><span className="font-bold text-text-2">{myRequired}%</span> required</div>
              <div className="mt-0.5 text-[9px]">{myMeets}/{myTotal} skills verified</div>
            </div>
          </div>

          {/* Horizontal bars — DECOUPLED HIGH-CONTRAST LABELS (STANDARDIZED) */}
          <div className="flex flex-col gap-2 flex-1">
            {technicalChartData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {/* Label Row: Left High-Contrast Title | Right Score Badge */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-text-1 truncate max-w-[170px]" title={d.fullLabel}>
                      {d.fullLabel}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-text-2 tabular-nums shrink-0">
                      <strong className="text-text-1">{d.score}%</strong> / {d.benchmark}%
                    </span>
                  </div>
                  {/* Progress Bar Track */}
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

          {/* Footer legend */}
          <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-500 inline-block" />Achieved</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-surface-2 border border-border inline-block" />Target</span>
            </div>
            <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-indigo-500 hover:underline inline-flex items-center gap-0.5">
              Skills Grid <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* ── GRAPH 2: CEFR Language ────────── */}
        <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-cyan-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">2. CEFR Language</h2>
            </div>
            <CefrLevelBadge level={commLevel} size="sm" />
          </div>

          {/* Donut summary + level */}
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
              <div className="mt-0.5 text-[9px]">6-competency framework</div>
            </div>
          </div>

          {/* Horizontal bars — DECOUPLED HIGH-CONTRAST LABELS (STANDARDIZED) */}
          <div className="flex flex-col gap-2 flex-1">
            {commChartData.map((d, i) => {
              const barColor = BAR_PALETTE[(i + 6) % BAR_PALETTE.length];
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {/* Label Row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-text-1 truncate max-w-[170px]" title={d.fullLabel}>
                      {d.fullLabel}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-text-2 tabular-nums shrink-0">
                      <strong className="text-text-1">{d.score}%</strong> / {d.benchmark}%
                    </span>
                  </div>
                  {/* Progress Bar Track */}
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

          {/* Footer legend */}
          <div className="flex items-center justify-between text-[10px] text-text-3 pt-2 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-cyan-500 inline-block" />Assessed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-surface-2 border border-border inline-block" />Required</span>
            </div>
            <button type="button" onClick={() => onNavigate('assessments')} className="font-bold text-cyan-500 hover:underline inline-flex items-center gap-0.5">
              CEFR Rubric <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* ── GRAPH 3: Behavioral 11-Pillar ───── */}
        <div className="rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-amber-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">3. Behavioral (11 Pillars)</h2>
            </div>
            <BehavioralLevelBadge level={behavLevel} size="sm" />
          </div>

          {/* Donut summary + level */}
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

          {/* Horizontal bars — DECOUPLED HIGH-CONTRAST LABELS WITH DUAL-STATS */}
          <div className="flex flex-col gap-2 flex-1">
            {behavChartData.map((d, i) => {
              const barColor = BAR_PALETTE[i % BAR_PALETTE.length];
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {/* Label Row */}
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
                  {/* Progress Bar Track */}
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

          {/* Footer legend */}
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

      </div>

    </div>
  );
};
