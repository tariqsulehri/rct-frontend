import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Cpu,
  MessageSquare,
  Award,
  Send,
  ArrowUpRight,
  Layers,
  Calendar as CalendarIcon,
  CheckCircle2,
  BarChart2,
  ShieldCheck,
  Zap,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { type User } from '@/store/authStore';
import { useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { useLatestCommAssessment } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment } from '@/hooks/useBehavioral';
import { useChartTheme, getChartTooltipStyle } from '@/hooks/useChartTheme';
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

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);

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

  // 4. Overall 3-Pillar Competency Donut Data (Technical, Communication, Behavioral)
  const threePillarDonutData = useMemo(() => [
    { name: 'Technical', value: myScore || 78, required: myRequired || 80, color: chartTheme.primary },
    { name: 'Communication', value: commScorePct, required: commReqPct, color: chartTheme.secondary },
    { name: 'Behavioral', value: behavScorePct, required: behavReqPct, color: chartTheme.warning },
  ], [myScore, myRequired, commScorePct, commReqPct, behavScorePct, behavReqPct, chartTheme]);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    setCopilotResponse(
      `Based on your ${formatGrade(currentGrade)} → ${formatGrade(targetGrade)} trajectory: You are on track with ${skillsCompletionPct}% readiness. Recommended immediate focus: Validate SRE & Reliability competency to close your remaining gap.`
    );
    setCopilotQuery('');
  };

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
        {/* GRAPH 1: Technical Mastery (Dual-Tone Composite Bars) */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
                1. Technical Domains
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={12} />
              <span>{myScore}% (Target: {myRequired}%)</span>
            </div>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={technicalChartData} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.gridColor }}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number, name: string) => [`${val}%`, name === 'baseScore' ? 'Target Met' : name === 'excessScore' ? 'Exceeds Target' : name]}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullLabel ? `Domain: ${payload[0].payload.fullLabel}` : 'Domain'
                  }
                />
                {/* Composite Single Stacked Bar */}
                <Bar dataKey="baseScore" stackId="tech" name="Required Target" fill={chartTheme.isDark ? '#4f46e5' : '#6366f1'} radius={[0, 0, 4, 4]} maxBarSize={24} />
                <Bar dataKey="excessScore" stackId="tech" name="Exceeds Benchmark" fill={chartTheme.isDark ? '#818cf8' : '#4338ca'} radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {technicalChartData.map((entry, index) => (
                    <Cell
                      key={`tech-cell-${index}`}
                      fill={entry.highlight ? (chartTheme.isDark ? '#6366f1' : '#4f46e5') : (chartTheme.isDark ? '#818cf8' : '#818cf8')}
                      className={entry.highlight ? 'filter drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-text-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Score ({myScore}%)
              </span>
              <span className="flex items-center gap-1 text-text-3">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
                Target ({myRequired}%)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Skills Grid</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        {/* GRAPH 2: CEFR English Communication (Single Dual-Tone Composite Stacked Bar) */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-cyan-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
                2. CEFR Language
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <CefrLevelBadge level={commLevel} size="sm" />
            </div>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commChartData} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.gridColor }}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number, name: string) => [
                    `${val}%`,
                    name === 'baseRequirement' ? 'Required Benchmark' : name === 'excessLevel' ? 'Exceeds Target' : name,
                  ]}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullLabel ? `Competency: ${payload[0].payload.fullLabel}` : 'Competency'
                  }
                />
                {/* Single Composite Stacked Bar with Two-Tone Colors */}
                <Bar
                  dataKey="baseRequirement"
                  stackId="cefr"
                  name="Required Benchmark"
                  fill={chartTheme.isDark ? '#0e7490' : '#0891b2'}
                  radius={[0, 0, 4, 4]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="excessLevel"
                  stackId="cefr"
                  name="Exceeds Level"
                  fill={chartTheme.isDark ? '#06b6d4' : '#22d3ee'}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                >
                  {commChartData.map((entry, index) => (
                    <Cell
                      key={`comm-cell-${index}`}
                      fill={entry.highlight ? (chartTheme.isDark ? '#22d3ee' : '#06b6d4') : (chartTheme.isDark ? '#06b6d4' : '#0891b2')}
                      className={entry.highlight ? 'filter drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]' : ''}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-text-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Assessed ({commLevel})
              </span>
              <span className="flex items-center gap-1 text-text-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-800 dark:bg-cyan-700" />
                Required ({commBenchmark})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>CEFR Rubric</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>

        {/* GRAPH 3: Behavioral 11-Item Competencies Radar Chart */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-amber-500 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
                3. Behavioral Radar (11 Pillars)
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <BehavioralLevelBadge level={behavLevel} size="sm" />
            </div>
          </div>

          {/* 11-Point Radar Chart */}
          <div className="h-[185px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={behavRadarData} margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
                <PolarGrid stroke={chartTheme.gridColor} />
                <PolarAngleAxis
                  dataKey="name"
                  stroke={chartTheme.axisColor}
                  fontSize={8}
                  tickLine={false}
                />
                <PolarRadiusAxis domain={[0, 100]} stroke={chartTheme.gridColor} tick={false} axisLine={false} />
                <Radar
                  name="Assessed Level"
                  dataKey="score"
                  stroke={chartTheme.primary}
                  fill={chartTheme.primary}
                  fillOpacity={0.4}
                />
                <Radar
                  name="Role Benchmark"
                  dataKey="benchmark"
                  stroke={chartTheme.warning}
                  fill={chartTheme.warning}
                  fillOpacity={0.15}
                  strokeDasharray="2 2"
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullName ? `Pillar: ${payload[0].payload.fullName}` : 'Pillar'
                  }
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-text-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Assessed
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Benchmark ({behavBenchmark})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Matrix</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 2 (3-COLUMNS): AI COPILOT (LEFT) + 3-PILLAR DONUT BREAKDOWN (CENTER) + MILESTONES (RIGHT) (UNIFORM HEIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* BOTTOM LEFT: AI Career & Capability Copilot */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-accent" />
              <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
                How can I help you?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="p-1 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div>
            <div className="text-xs font-bold text-text-2">AI Progression Summary</div>
            <p className="text-xs text-text-3 leading-relaxed mt-1 line-clamp-3">
              {copilotResponse ||
                `Trajectory for ${formatGrade(currentGrade)} → ${formatGrade(
                  targetGrade
                )} is active. Technical is stable at ${myScore}%, CEFR is verified at ${commLevel}, and Behavioral stands at ${behavLevel}.`}
            </p>
          </div>

          {/* 2 Mini Stat Blocks */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-2 p-2 rounded-xl border border-border">
              <div className="text-[10px] text-text-3">Skills Verified</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black font-mono tabular-nums text-text-1">{myMeets}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-surface-2 p-2 rounded-xl border border-border">
              <div className="text-[10px] text-text-3">Gate Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black font-mono tabular-nums text-text-1">3/3</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent-txt">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Copilot Input Prompt */}
          <form onSubmit={handleCopilotSubmit} className="relative">
            <input
              type="text"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              placeholder="Ask Career AI anything..."
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent pr-9 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 text-text-3 hover:text-accent transition-colors"
            >
              <Send size={13} />
            </button>
          </form>
        </div>

        {/* BOTTOM CENTER: OVERALL 3-PILLAR REQUIRED VS ACHIEVED DONUT BREAKDOWN */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
              Competency Distribution
            </h2>
            <span className="text-[10px] font-bold text-text-3 bg-surface-2 px-2.5 py-0.5 rounded-md border border-border">
              Cycle 2026 ▾
            </span>
          </div>

          {/* Donut Chart & 3-Pillar Comparative Legend (Achieved vs Required) */}
          <div className="flex items-center justify-between gap-3 py-1">
            {/* Left Donut */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threePillarDonutData}
                    innerRadius={30}
                    outerRadius={46}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {threePillarDonutData.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black font-mono tabular-nums text-text-1">{myScore}%</span>
                <span className="text-[8px] uppercase tracking-wider text-text-3">Total</span>
              </div>
            </div>

            {/* Right 3-Pillar Breakdown Rows */}
            <div className="space-y-2 text-xs flex-1 min-w-0">
              {/* Pillar 1: Technical */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-text-2 font-medium truncate text-[11px]">Technical</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono tabular-nums text-[11px]">
                  <strong className="text-indigo-600 dark:text-indigo-400">{myScore}%</strong>
                  <span className="text-text-3 text-[10px]">/ {myRequired}%</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${technicalReady ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'}`}>
                    {technicalReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>

              {/* Pillar 2: CEFR Communication */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span className="text-text-2 font-medium truncate text-[11px]">CEFR Comm</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono tabular-nums text-[11px]">
                  <strong className="text-cyan-600 dark:text-cyan-400">{commLevel}</strong>
                  <span className="text-text-3 text-[10px]">/ {commBenchmark}</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${commReady ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'}`}>
                    {commReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>

              {/* Pillar 3: Behavioral Leadership */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-text-2 font-medium truncate text-[11px]">Behavioral</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono tabular-nums text-[11px]">
                  <strong className="text-amber-600 dark:text-amber-400">{behavLevel}</strong>
                  <span className="text-text-3 text-[10px]">/ {behavBenchmark}</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${behavReady ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'}`}>
                    {behavReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Insight Callout */}
          <div className="text-[10.5px] text-text-3 leading-normal pt-2 border-t border-border">
            💡 Overall 3-Pillar Score: Technical ({myScore}%), CEFR ({commLevel}), Behavioral ({behavLevel}) vs Required Target benchmarks.
          </div>
        </div>

        {/* BOTTOM RIGHT: Promotion Milestones & Gate Verification */}
        <div className="h-[285px] sm:h-[295px] rounded-2xl p-4 border border-border bg-surface shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-text-1">
              Promotion Milestones
            </h2>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-lg bg-accent-soft text-accent flex items-center justify-center border border-accent/30">
                <Layers size={13} />
              </div>
            </div>
          </div>

          {/* Segmented Yellow/Gold Progress Bar */}
          <div className="bg-surface-2 p-2 px-2.5 rounded-xl border border-border flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Gate Score</span>
            <div className="flex items-center gap-0.5">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-xs ${
                    i < 11 ? 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_3px_rgba(251,191,36,0.5)]' : 'bg-surface border border-border'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono tabular-nums font-black text-amber-600 dark:text-amber-400">{skillsCompletionPct}%</span>
          </div>

          {/* 3 Actionable Gate Items */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-text-2">
              <span className="text-text-3 text-[11px]">Technical Skills</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {myMeets} / {myTotal} Met
              </span>
            </div>

            <div className="flex items-center justify-between text-text-2">
              <span className="text-text-3 text-[11px]">CEFR Communication</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CefrLevelBadge level={commLevel} size="sm" />
                <span className="text-[10px]">Verified</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-text-2">
              <span className="text-text-3 text-[11px]">Behavioral Mastery</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <BehavioralLevelBadge level={behavLevel} size="sm" />
                <span className="text-[10px]">Verified</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-text-3 hover:text-text-1 inline-flex items-center gap-1 transition-colors"
            >
              <span>View all milestones</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
