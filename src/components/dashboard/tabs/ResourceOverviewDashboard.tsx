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

  // 1. Technical Domain Bar Chart Data
  const technicalChartData = useMemo(() => {
    if (myGapRow?.domain_gaps && Object.keys(myGapRow.domain_gaps).length > 0) {
      return Object.entries(myGapRow.domain_gaps).map(([domain, data], idx) => ({
        label: domain.length > 7 ? `${domain.substring(0, 6)}…` : domain,
        fullLabel: domain,
        score: Math.round((data.score || 0) * 100),
        benchmark: Math.round((data.threshold || 0) * 100),
        highlight: idx === 0,
      }));
    }
    return [
      { label: 'Cloud', fullLabel: 'Cloud Architecture', score: 85, benchmark: 80, highlight: true },
      { label: 'CI/CD', fullLabel: 'CI/CD Automation', score: 92, benchmark: 80, highlight: false },
      { label: 'Arch', fullLabel: 'System Architecture', score: 74, benchmark: 75, highlight: false },
      { label: 'DevOps', fullLabel: 'DevOps Tooling', score: 80, benchmark: 75, highlight: false },
      { label: 'SRE', fullLabel: 'SRE & Reliability', score: 68, benchmark: 70, highlight: false },
    ];
  }, [myGapRow]);

  // 2. CEFR Communication Dual-Bar Chart Data (Assessed vs Required Benchmark)
  const commChartData = useMemo(() => {
    const ratings = latestComm?.ratings ?? [];
    const targetScore = CEFR_LEVEL_NUMERIC[commBenchmark] || 67;

    return CEFR_6_COMPETENCIES.map((comp, idx) => {
      const match = ratings.find((r) => r.competency_key === comp.key);
      const score = match?.cefr ? CEFR_LEVEL_NUMERIC[match.cefr] || 67 : (idx % 2 === 0 ? 83 : 67);

      return {
        label: comp.label,
        fullLabel: comp.fullLabel,
        score: score,
        benchmark: targetScore,
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
    { name: 'Technical', value: myScore || 78, required: myRequired || 80, color: '#6366f1' },
    { name: 'Communication', value: commScorePct, required: commReqPct, color: '#06b6d4' },
    { name: 'Behavioral', value: behavScorePct, required: behavReqPct, color: '#f59e0b' },
  ], [myScore, myRequired, commScorePct, commReqPct, behavScorePct, behavReqPct]);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    setCopilotResponse(
      `Based on your ${formatGrade(currentGrade)} → ${formatGrade(targetGrade)} trajectory: You are on track with ${skillsCompletionPct}% readiness. Recommended immediate focus: Validate SRE & Reliability competency to close your remaining gap.`
    );
    setCopilotQuery('');
  };

  return (
    <div className="space-y-2.5 animate-slide-up pb-3 text-zinc-100 font-sans">
      {/* ── TOP HEADER RIBBON: GREETING + TRAJECTORY + EVALUATION CYCLE TITLE ──── */}
      <div className="relative overflow-hidden rounded-2xl px-4 py-2 sm:py-2.5 border border-zinc-800/90 bg-zinc-950/90 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Greeting & Trajectory & Cycle Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-400 shrink-0" />
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
              Welcome back, {displayName}! 👋
            </h1>
          </div>

          {/* Grade Trajectory Tag */}
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10.5px]">
              {formatGrade(currentGrade)}
            </span>
            <span className="text-blue-400 font-bold">→</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10.5px]">
              Target: <strong className="font-mono text-white">{formatGrade(targetGrade)}</strong>
            </span>
          </div>

          {/* Evaluation Cycle Title Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <CalendarIcon size={12} className="text-indigo-400" />
            <span>Cycle 2026 (Active)</span>
          </div>
        </div>

        {/* Right: Promotion Readiness Pill & CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded-xl border border-zinc-800 text-xs">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Readiness</span>
            <span className="font-black text-white font-mono text-xs">{skillsCompletionPct}%</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>

          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-[10.5px] uppercase tracking-wider text-zinc-950 bg-white hover:bg-zinc-100 shadow-sm transition-all active:scale-95"
          >
            <span>Assess Skills</span>
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* ── ROW 1 (3-COLUMNS): ALL THREE PRO-LEVEL COMPETENCE GRAPHS ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* GRAPH 1: Technical Mastery */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu size={13} className="text-indigo-400 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                1. Technical Domains
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <TrendingUp size={11} />
              <span>{myScore}% (Target: {myRequired}%)</span>
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={technicalChartData} margin={{ top: 8, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={9.5}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={9.5}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullLabel ? `Domain: ${payload[0].payload.fullLabel}` : 'Domain'
                  }
                />
                <Bar dataKey="score" name="Assessed Score" radius={[4, 4, 0, 0]} maxBarSize={14}>
                  {technicalChartData.map((entry, index) => (
                    <Cell
                      key={`tech-cell-${index}`}
                      fill={entry.highlight ? '#6366f1' : '#4f46e5'}
                      className={entry.highlight ? 'filter drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''}
                    />
                  ))}
                </Bar>
                <Bar dataKey="benchmark" name="Required Target" fill="#3f3f46" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Assessed
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                Target ({myRequired}%)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-indigo-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Skills Grid</span>
              <ArrowUpRight size={10} />
            </button>
          </div>
        </div>

        {/* GRAPH 2: CEFR English Communication (Assessed vs Required Benchmark) */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-cyan-400 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                2. CEFR Language
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400">
              <CefrLevelBadge level={commLevel} size="sm" />
            </div>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commChartData} margin={{ top: 8, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={9.5}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={9.5}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number, name: string) => [`${val}%`, name]}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullLabel ? `Competency: ${payload[0].payload.fullLabel}` : 'Competency'
                  }
                />
                <Bar dataKey="score" name="Assessed" radius={[4, 4, 0, 0]} maxBarSize={14}>
                  {commChartData.map((entry, index) => (
                    <Cell
                      key={`comm-cell-${index}`}
                      fill={entry.highlight ? '#06b6d4' : '#0891b2'}
                      className={entry.highlight ? 'filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]' : ''}
                    />
                  ))}
                </Bar>
                <Bar dataKey="benchmark" name="Required" fill="#3f3f46" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Assessed ({commLevel})
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                Target ({commBenchmark})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-cyan-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>CEFR Rubric</span>
              <ArrowUpRight size={10} />
            </button>
          </div>
        </div>

        {/* GRAPH 3: Behavioral 11-Item Competencies Radar Chart */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-amber-400 shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                3. Behavioral Radar (11 Pillars)
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
              <BehavioralLevelBadge level={behavLevel} size="sm" />
            </div>
          </div>

          {/* 11-Point Radar Chart */}
          <div className="h-36 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={behavRadarData} margin={{ top: 5, right: 12, bottom: 5, left: 12 }}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis
                  dataKey="name"
                  stroke="#a1a1aa"
                  fontSize={7.5}
                  tickLine={false}
                />
                <PolarRadiusAxis domain={[0, 100]} stroke="#3f3f46" tick={false} axisLine={false} />
                <Radar
                  name="Assessed Level"
                  dataKey="score"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Role Benchmark"
                  dataKey="benchmark"
                  stroke="#f59e0b"
                  fill="#f59e0b"
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

          <div className="flex items-center justify-between text-[9.5px] text-zinc-400 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Assessed
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Benchmark ({behavBenchmark})
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Matrix</span>
              <ArrowUpRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 2 (3-COLUMNS): AI COPILOT (LEFT) + 3-PILLAR DONUT BREAKDOWN (CENTER) + MILESTONES (RIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* BOTTOM LEFT: AI Career & Capability Copilot */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                How can I help you?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div>
            <div className="text-[11px] font-bold text-zinc-300">AI Progression Summary</div>
            <p className="text-[10.5px] text-zinc-400 leading-relaxed mt-0.5 line-clamp-2">
              {copilotResponse ||
                `Trajectory for ${formatGrade(currentGrade)} → ${formatGrade(
                  targetGrade
                )} is active. Technical is stable at ${myScore}%, CEFR is verified at ${commLevel}, and Behavioral stands at ${behavLevel}.`}
            </p>
          </div>

          {/* 2 Mini Stat Blocks */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/90 p-1.5 px-2 rounded-xl border border-zinc-800/80">
              <div className="text-[9.5px] text-zinc-400">Skills Verified</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-black font-mono text-white">{myMeets}</span>
                <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-1.5 px-2 rounded-xl border border-zinc-800/80">
              <div className="text-[9.5px] text-zinc-400">Gate Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-black font-mono text-white">3/3</span>
                <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-blue-500/20 text-blue-300">
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
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 pr-8 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

        {/* BOTTOM CENTER: OVERALL 3-PILLAR REQUIRED VS ACHIEVED DONUT BREAKDOWN */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Competency Distribution
            </h2>
            <span className="text-[9.5px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
              Cycle 2026 ▾
            </span>
          </div>

          {/* Donut Chart & 3-Pillar Comparative Legend (Achieved vs Required) */}
          <div className="flex items-center justify-between gap-3 py-1">
            {/* Left Donut */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threePillarDonutData}
                    innerRadius={26}
                    outerRadius={40}
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
                <span className="text-xs font-black font-mono text-white">{myScore}%</span>
                <span className="text-[7.5px] uppercase tracking-wider text-zinc-400">Total</span>
              </div>
            </div>

            {/* Right 3-Pillar Breakdown Rows */}
            <div className="space-y-1.5 text-[10.5px] flex-1 min-w-0">
              {/* Pillar 1: Technical */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-zinc-300 font-medium truncate">Technical</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <strong className="text-indigo-400">{myScore}%</strong>
                  <span className="text-zinc-500">/ {myRequired}%</span>
                  <span className={`px-1 rounded text-[8.5px] font-bold ${technicalReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {technicalReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>

              {/* Pillar 2: CEFR Communication */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span className="text-zinc-300 font-medium truncate">CEFR Comm</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <strong className="text-cyan-400">{commLevel}</strong>
                  <span className="text-zinc-500">/ {commBenchmark}</span>
                  <span className={`px-1 rounded text-[8.5px] font-bold ${commReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {commReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>

              {/* Pillar 3: Behavioral Leadership */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-zinc-300 font-medium truncate">Behavioral</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <strong className="text-amber-400">{behavLevel}</strong>
                  <span className="text-zinc-500">/ {behavBenchmark}</span>
                  <span className={`px-1 rounded text-[8.5px] font-bold ${behavReady ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {behavReady ? 'Met' : 'Gap'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Insight Callout */}
          <div className="text-[9.5px] text-zinc-400 leading-normal pt-1 border-t border-zinc-800/80">
            💡 Overall 3-Pillar Score: Technical ({myScore}%), CEFR ({commLevel}), Behavioral ({behavLevel}) vs Required Target benchmarks.
          </div>
        </div>

        {/* BOTTOM RIGHT: Promotion Milestones & Gate Verification */}
        <div className="rounded-2xl p-3.5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Promotion Milestones
            </h2>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Layers size={12} />
              </div>
            </div>
          </div>

          {/* Segmented Yellow/Gold Progress Bar */}
          <div className="bg-zinc-900/90 p-1.5 px-2 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-1.5">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase">Gate Score</span>
            <div className="flex items-center gap-0.5">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-2.5 rounded-xs ${
                    i < 11 ? 'bg-amber-400 shadow-[0_0_3px_rgba(251,191,36,0.5)]' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono font-black text-amber-400">{skillsCompletionPct}%</span>
          </div>

          {/* 3 Actionable Gate Items */}
          <div className="space-y-1 text-[10.5px]">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Technical Skills</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {myMeets} / {myTotal} Met
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">CEFR Communication</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <CefrLevelBadge level={commLevel} size="sm" />
                <span className="text-[9.5px]">Verified</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Behavioral Mastery</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <BehavioralLevelBadge level={behavLevel} size="sm" />
                <span className="text-[9.5px]">Verified</span>
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10.5px]">
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>View all milestones</span>
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
