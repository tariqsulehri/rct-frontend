import React, { useMemo } from 'react';
import {
  Award,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { type User } from '@/store/authStore';
import { useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { useLatestCommAssessment } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment } from '@/hooks/useBehavioral';
import { useChartTheme, getChartTooltipStyle } from '@/hooks/useChartTheme';
import { toPctNullable, formatGrade } from '@/lib/formatters';
import { CefrLevelBadge } from '@/components/communication/CefrLevelBadge';
import { BehavioralLevelBadge } from '@/components/behavioral/BehavioralLevelBadge';
import { MetricKpiCard } from '@/components/ui/assessment/MetricKpiCard';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';

export interface ResourceOverviewDashboardProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

const CEFR_WEIGHT_MAP: Record<string, number> = {
  A1: 17,
  A2: 33,
  B1: 50,
  B2: 67,
  C1: 83,
  C2: 100,
};

const BEHAV_WEIGHT_MAP: Record<string, number> = {
  L1: 20,
  L2: 40,
  L3: 60,
  L4: 80,
  L5: 100,
};

const CEFR_LABEL_MAP: Record<string, string> = {
  written_clarity: 'Written',
  spoken_fluency: 'Spoken',
  presentation: 'Present',
  active_listening: 'Listen',
  stakeholder_exec: 'Exec',
  cross_cultural: 'Culture',
};

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();

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
  const myScore = myCompRow ? toPctNullable(myCompRow.overall_score) : null;
  const myRequired = myGapRow && myGapRow.overall_threshold > 0 ? toPctNullable(myGapRow.overall_threshold) : null;
  const myTotal = myGapRow?.total_with_threshold ?? 0;
  const myMeets = myGapRow?.meets_count ?? 0;
  const myGap = myScore !== null && myRequired !== null ? myScore - myRequired : null;
  const technicalReady = myGapRow?.promotion_ready ?? (myScore !== null && myRequired !== null && myScore >= myRequired);

  // CEFR Communication calculations
  const commLevel = latestComm?.overallCefr || null;
  const commBenchmark = latestComm?.org_level_key || 'B2';
  const commReady = latestComm?.communicationReady ?? Boolean(commLevel);

  // Behavioral calculations
  const behavLevel = latestBehav?.result?.overallProficiency || null;
  const behavBenchmark = latestBehav?.gradeKey || 'L3';
  const behavReady = latestBehav?.result?.behavioralReady ?? Boolean(behavLevel);

  // Grade Information
  const currentGrade = myCompRow?.current_grade || user?.currentGrade || 'G14';
  const targetGrade = myCompRow?.target_grade || user?.targetGrade || 'G15';

  // Overall Readiness Score
  const skillsCompletionPct = myTotal > 0 ? Math.round((myMeets / myTotal) * 100) : myScore ?? 0;
  const isOverallReady = technicalReady && commReady && behavReady;

  // 1. Technical Domain Bar Chart Data
  const technicalChartData = useMemo(() => {
    if (!myGapRow?.domain_gaps) {
      return [
        { name: 'Cloud', fullName: 'Cloud Architecture', achieved: 75, benchmark: 80 },
        { name: 'CI/CD', fullName: 'CI/CD Automation', achieved: 80, benchmark: 80 },
        { name: 'DevOps', fullName: 'DevOps Tooling', achieved: 70, benchmark: 75 },
        { name: 'SRE', fullName: 'SRE & Reliability', achieved: 65, benchmark: 70 },
      ];
    }
    return Object.entries(myGapRow.domain_gaps).map(([domain, data]) => ({
      name: domain.length > 8 ? `${domain.substring(0, 7)}…` : domain,
      fullName: domain,
      achieved: Math.round((data.score || 0) * 100),
      benchmark: Math.round((data.threshold || 0) * 100),
      meets: data.meets,
    }));
  }, [myGapRow]);

  // 2. CEFR Communication Chart Data
  const commChartData = useMemo(() => {
    const defaultCompetencies = [
      'written_clarity',
      'spoken_fluency',
      'presentation',
      'active_listening',
      'stakeholder_exec',
      'cross_cultural',
    ];
    const targetWeight = CEFR_WEIGHT_MAP[commBenchmark] || 67;

    return defaultCompetencies.map((key) => {
      const rating = latestComm?.ratings?.find((r) => r.competency_key === key);
      const achievedWeight = rating?.cefr ? CEFR_WEIGHT_MAP[rating.cefr] || 0 : 0;
      return {
        name: CEFR_LABEL_MAP[key] || key,
        fullName: key.replace(/_/g, ' '),
        achieved: achievedWeight,
        benchmark: targetWeight,
        meets: achievedWeight >= targetWeight,
      };
    });
  }, [latestComm, commBenchmark]);

  // 3. Behavioral Framework Chart Data
  const behavChartData = useMemo(() => {
    const targetWeight = BEHAV_WEIGHT_MAP[behavBenchmark] || 60;
    const perComp = latestBehav?.result?.perCompetency ?? [];

    if (perComp.length > 0) {
      return perComp.slice(0, 6).map((p) => {
        const achievedWeight = p.level ? BEHAV_WEIGHT_MAP[p.level] || 0 : 0;
        const reqWeight = p.expectedLevel ? BEHAV_WEIGHT_MAP[p.expectedLevel] || targetWeight : targetWeight;
        const shortName = p.competencyKey.split('_')[0] || p.competencyKey;
        return {
          name: shortName.length > 8 ? `${shortName.substring(0, 7)}…` : shortName,
          fullName: p.competencyKey.replace(/_/g, ' '),
          achieved: achievedWeight,
          benchmark: reqWeight,
          meets: achievedWeight >= reqWeight,
        };
      });
    }

    const defaultPillars = [
      { name: 'Own', fullName: 'Ownership' },
      { name: 'Collab', fullName: 'Collaboration' },
      { name: 'Problem', fullName: 'Problem Solving' },
      { name: 'Mentor', fullName: 'Mentorship' },
      { name: 'Deliver', fullName: 'Delivery Focus' },
      { name: 'Integrity', fullName: 'Ethical Integrity' },
    ];
    return defaultPillars.map((p) => ({
      name: p.name,
      fullName: p.fullName,
      achieved: behavLevel ? BEHAV_WEIGHT_MAP[behavLevel] || 0 : 0,
      benchmark: targetWeight,
      meets: behavReady,
    }));
  }, [latestBehav, behavBenchmark, behavLevel, behavReady]);

  return (
    <div className="space-y-2.5 animate-slide-up pb-3">
      {/* ── 1. COMPACT HIGH-DENSITY HERO RIBBON ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-4 py-2 sm:py-2.5 border shadow-xs transition-all bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/20 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Greeting & Trajectory */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400 shrink-0" />
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                Welcome back, {displayName}! 👋
              </h1>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/90 text-[10.5px]">
                {formatGrade(currentGrade)}
              </span>
              <span className="text-indigo-400 font-bold">→</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10.5px]">
                Target: <strong className="font-mono text-white">{formatGrade(targetGrade)}</strong>
              </span>
            </div>
          </div>

          {/* Right: Promotion Readiness Pill & CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-xl border border-white/15 text-xs">
              <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Readiness</span>
              <span className="font-black text-white font-mono text-xs">{skillsCompletionPct}%</span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isOverallReady ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-[10.5px] uppercase tracking-wider text-slate-900 bg-white hover:bg-indigo-50 shadow-xs hover:shadow-sm transition-all active:scale-95"
            >
              <span>Assess Skills</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. 4-CARD 3-PILLAR COMPETENCE METRICS ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Technical Score */}
        <MetricKpiCard
          label="Technical Score"
          primaryValue={myScore !== null ? `${myScore}%` : 'N/A'}
          subtext="Target"
          subtextValue={myRequired !== null ? `${myRequired}%` : 'N/A'}
          statusType={myGap !== null && myGap >= 0 ? 'success' : 'warning'}
          statusText={myGap !== null ? (myGap >= 0 ? `+${myGap}%` : `${myGap}%`) : undefined}
          className="p-2!"
        />

        {/* CEFR Language Level */}
        <div className="card p-2 rounded-xl flex flex-col justify-between border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              CEFR English
            </span>
            <MessageSquare size={12} className="text-cyan-500" />
          </div>
          <div className="my-0.5 flex items-baseline gap-1">
            {commLevel ? (
              <CefrLevelBadge level={commLevel} size="sm" showLabel />
            ) : (
              <span className="text-xs font-bold text-zinc-400">Pending</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 pt-0.5 border-t border-zinc-100 dark:border-zinc-800">
            <span>Target</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{commBenchmark}</span>
          </div>
        </div>

        {/* Behavioral Mastery */}
        <div className="card p-2 rounded-xl flex flex-col justify-between border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Behavioral
            </span>
            <Award size={12} className="text-amber-500" />
          </div>
          <div className="my-0.5 flex items-baseline gap-1">
            {behavLevel ? (
              <BehavioralLevelBadge level={behavLevel} size="sm" showLabel />
            ) : (
              <span className="text-xs font-bold text-zinc-400">Pending</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-500 dark:text-zinc-400 pt-0.5 border-t border-zinc-100 dark:border-zinc-800">
            <span>Target Band</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{behavBenchmark}</span>
          </div>
        </div>

        {/* Holistic Promotion Gate */}
        <MetricKpiCard
          label="Promotion Gate"
          primaryValue={isOverallReady ? 'Ready' : 'In Progress'}
          subtext="Skills Met"
          subtextValue={myTotal > 0 ? `${myMeets} / ${myTotal}` : 'N/A'}
          statusType={isOverallReady ? 'success' : 'neutral'}
          statusText={isOverallReady ? '3/3 Streams' : 'Gated'}
          className="p-2!"
        />
      </div>

      {/* ── 3. 3-GRAPH SIDE-BY-SIDE ANALYTICS GRID (TECHNICAL, CEFR, BEHAVIORAL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* GRAPH 1: Technical Capability Domains */}
        <div className="card p-2.5 rounded-xl border shadow-2xs space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu size={13} className="text-indigo-500 shrink-0" />
              <h2 className="text-[11px] font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                1. Technical Domains
              </h2>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {myScore !== null ? `${myScore}%` : 'N/A'}
            </span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={technicalChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.gridColor }}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(label) => `Domain: ${label}`}
                />
                <Bar
                  dataKey="achieved"
                  name="Achieved"
                  fill="rgb(99, 102, 241)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
                <Bar
                  dataKey="benchmark"
                  name="Target"
                  fill="rgb(148, 163, 184)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>{myMeets} / {myTotal || 26} Met</span>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Skills Grid</span>
              <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* GRAPH 2: CEFR Communication Dimensions */}
        <div className="card p-2.5 rounded-xl border shadow-2xs space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-cyan-500 shrink-0" />
              <h2 className="text-[11px] font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                2. CEFR Language
              </h2>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {commLevel || 'Pending'}
            </span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.gridColor }}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(label) => `Competency: ${label}`}
                />
                <Bar
                  dataKey="achieved"
                  name="Achieved"
                  fill="rgb(6, 182, 212)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
                <Bar
                  dataKey="benchmark"
                  name="Target"
                  fill="rgb(148, 163, 184)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>6 Competencies</span>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>CEFR Rubric</span>
              <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* GRAPH 3: Behavioral Leadership Pillars */}
        <div className="card p-2.5 rounded-xl border shadow-2xs space-y-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-amber-500 shrink-0" />
              <h2 className="text-[11px] font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                3. Behavioral Pillars
              </h2>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {behavLevel || 'Pending'}
            </span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={behavChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.gridColor }}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(label) => `Pillar: ${label}`}
                />
                <Bar
                  dataKey="achieved"
                  name="Achieved"
                  fill="rgb(245, 158, 11)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
                <Bar
                  dataKey="benchmark"
                  name="Target"
                  fill="rgb(148, 163, 184)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>11 Dimensions</span>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Behavior Matrix</span>
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BOTTOM ROW: MILESTONE READINESS STATUS ───────────────────────── */}
      <div className="card p-2.5 rounded-xl border shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                strokeWidth="8"
                className="text-zinc-200 dark:text-zinc-800"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                strokeWidth="8"
                strokeDasharray={238.7}
                strokeDashoffset={238.7 - (238.7 * Math.min(100, Math.max(0, skillsCompletionPct))) / 100}
                strokeLinecap="round"
                className={skillsCompletionPct >= 80 ? 'text-emerald-500' : 'text-indigo-500'}
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
              {skillsCompletionPct}%
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                Overall Promotion Gate &amp; Readiness
              </h3>
              <InfoTip text="Requires all 3 streams to meet or exceed target career grade benchmarks." />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {myTotal > 0
                ? `${myMeets} of ${myTotal} technical skills complete for target grade ${formatGrade(targetGrade)}`
                : 'No target grade requirements set yet'}
            </p>
          </div>
        </div>

        {/* 3 Prerequisite Pills */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10.5px]">
            {technicalReady ? (
              <CheckCircle2 size={11} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={11} className="text-amber-500" />
            )}
            <span className="font-semibold">Technical: {technicalReady ? 'Ready' : `${myTotal - myMeets} Gaps`}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10.5px]">
            {commReady ? (
              <CheckCircle2 size={11} className="text-emerald-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            )}
            <span className="font-semibold">CEFR: {commLevel || 'Pending'}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10.5px]">
            {behavReady ? (
              <CheckCircle2 size={11} className="text-emerald-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            )}
            <span className="font-semibold">Behavioral: {behavLevel || 'Pending'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
