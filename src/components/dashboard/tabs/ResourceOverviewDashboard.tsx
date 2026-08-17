import React, { useState, useMemo } from 'react';
import {
  Award,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  written_clarity: 'Written Clarity',
  spoken_fluency: 'Spoken Fluency',
  presentation: 'Presentation',
  active_listening: 'Listening',
  stakeholder_exec: 'Stakeholder',
  cross_cultural: 'Cross-Cultural',
};

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();
  const [activeStream, setActiveStream] = useState<'technical' | 'communication' | 'behavioral'>('technical');

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
    if (!myGapRow?.domain_gaps) return [];
    return Object.entries(myGapRow.domain_gaps).map(([domain, data]) => ({
      name: domain.length > 12 ? `${domain.substring(0, 10)}…` : domain,
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
        fullName: CEFR_LABEL_MAP[key] || key,
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
      return perComp.map((p) => {
        const achievedWeight = p.level ? BEHAV_WEIGHT_MAP[p.level] || 0 : 0;
        const reqWeight = p.expectedLevel ? BEHAV_WEIGHT_MAP[p.expectedLevel] || targetWeight : targetWeight;
        const name = p.competencyKey.replace(/_/g, ' ');
        return {
          name: name.length > 12 ? `${name.substring(0, 10)}…` : name,
          fullName: name,
          achieved: achievedWeight,
          benchmark: reqWeight,
          meets: achievedWeight >= reqWeight,
        };
      });
    }

    const defaultPillars = [
      'Ownership',
      'Collaboration',
      'Problem Solving',
      'Mentorship',
      'Delivery Focus',
      'Ethical Integrity',
    ];
    return defaultPillars.map((name) => ({
      name: name.length > 12 ? `${name.substring(0, 10)}…` : name,
      fullName: name,
      achieved: behavLevel ? BEHAV_WEIGHT_MAP[behavLevel] || 0 : 0,
      benchmark: targetWeight,
      meets: behavReady,
    }));
  }, [latestBehav, behavBenchmark, behavLevel, behavReady]);

  // Active chart dataset based on selected stream
  const activeChartData =
    activeStream === 'technical'
      ? technicalChartData
      : activeStream === 'communication'
      ? commChartData
      : behavChartData;

  return (
    <div className="space-y-3 animate-slide-up pb-4">
      {/* ── 1. COMPACT HIGH-DENSITY HERO RIBBON ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-4 py-2.5 sm:py-3 border shadow-xs transition-all bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/20 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Greeting & Trajectory */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400 shrink-0" />
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Welcome back, {displayName}! 👋
              </h1>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/90 text-[11px]">
                {formatGrade(currentGrade)}
              </span>
              <span className="text-indigo-400 font-bold">→</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px]">
                Target: <strong className="font-mono text-white">{formatGrade(targetGrade)}</strong>
              </span>
            </div>
          </div>

          {/* Right: Promotion Readiness Pill & CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl border border-white/15 text-xs">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Readiness</span>
              <span className="font-black text-white font-mono text-sm">{skillsCompletionPct}%</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  isOverallReady ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-900 bg-white hover:bg-indigo-50 shadow-xs hover:shadow-sm transition-all active:scale-95"
            >
              <span>Assess Skills</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. 4-CARD 3-PILLAR COMPETENCE METRICS ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Technical Score */}
        <MetricKpiCard
          label="Technical Score"
          primaryValue={myScore !== null ? `${myScore}%` : 'N/A'}
          subtext="Target"
          subtextValue={myRequired !== null ? `${myRequired}%` : 'N/A'}
          statusType={myGap !== null && myGap >= 0 ? 'success' : 'warning'}
          statusText={myGap !== null ? (myGap >= 0 ? `+${myGap}%` : `${myGap}%`) : undefined}
          className="p-2.5!"
        />

        {/* CEFR Language Level */}
        <div className="card p-2.5 rounded-2xl flex flex-col justify-between border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              CEFR English
            </span>
            <MessageSquare size={13} className="text-cyan-500" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            {commLevel ? (
              <CefrLevelBadge level={commLevel} size="sm" showLabel />
            ) : (
              <span className="text-xs font-bold text-zinc-400">Pending Evaluation</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>Target</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{commBenchmark}</span>
          </div>
        </div>

        {/* Behavioral Mastery */}
        <div className="card p-2.5 rounded-2xl flex flex-col justify-between border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Behavioral
            </span>
            <Award size={13} className="text-amber-500" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            {behavLevel ? (
              <BehavioralLevelBadge level={behavLevel} size="sm" showLabel />
            ) : (
              <span className="text-xs font-bold text-zinc-400">Pending Evaluation</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
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
          className="p-2.5!"
        />
      </div>

      {/* ── 3. VISUAL 3-STREAM RECHARTS ANALYTICS & READINESS GAUGE ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Interactive 3-Stream Benchmark Comparison Chart (2 Cols) */}
        <div className="lg:col-span-2 card p-3.5 rounded-2xl border shadow-2xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Stream Selector Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setActiveStream('technical')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeStream === 'technical'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Cpu size={12} />
                <span>Technical</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStream('communication')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeStream === 'communication'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <MessageSquare size={12} />
                <span>CEFR Language</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStream('behavioral')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeStream === 'behavioral'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Award size={12} />
                <span>Behavioral</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Detailed Rubrics</span>
              <ChevronRight size={11} />
            </button>
          </div>

          {activeChartData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl border-zinc-200 dark:border-zinc-700">
              <Compass size={24} className="text-zinc-400 mb-1" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Assessment Data Available</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs">
                Assess skills or complete rubric evaluations to populate comparison metrics.
              </p>
            </div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis
                    dataKey="name"
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
                    formatter={(val: number) => [`${val}%`, '']}
                    labelFormatter={(label) => `Metric: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 4, fontSize: 10 }}
                  />
                  <Bar
                    dataKey="achieved"
                    name="Achieved Level"
                    fill={
                      activeStream === 'communication'
                        ? 'rgb(6, 182, 212)'
                        : activeStream === 'behavioral'
                        ? 'rgb(245, 158, 11)'
                        : 'rgb(99, 102, 241)'
                    }
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="benchmark"
                    name="Target Benchmark"
                    fill="rgb(148, 163, 184)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Milestone Progress & Gap Summary (1 Col) */}
        <div className="card p-3.5 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                Milestone Readiness
              </h2>
              <InfoTip text="Holistic summary of completion ratio, critical gaps, and prerequisites." />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">{myMeets}/{myTotal} Skills</span>
          </div>

          {/* Compact Circular Progress Display */}
          <div className="flex items-center justify-around py-1">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  strokeWidth="7"
                  className="text-zinc-200 dark:text-zinc-800"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  strokeWidth="7"
                  strokeDasharray={238.7}
                  strokeDashoffset={238.7 - (238.7 * Math.min(100, Math.max(0, skillsCompletionPct))) / 100}
                  strokeLinecap="round"
                  className={skillsCompletionPct >= 80 ? 'text-emerald-500' : 'text-indigo-500'}
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {skillsCompletionPct}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Ready
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] min-w-0">
              <div className="flex items-center gap-1.5">
                {technicalReady ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                )}
                <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate">
                  Technical: {technicalReady ? 'Met' : `${myTotal - myMeets} Gaps`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {commReady ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                )}
                <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate">
                  CEFR: {commLevel || 'Pending'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {behavReady ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                )}
                <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate">
                  Behavioral: {behavLevel || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-center text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            {myTotal > 0
              ? `${myMeets} of ${myTotal} required skills complete for ${formatGrade(targetGrade)}`
              : 'No target grade requirements set yet'}
          </div>
        </div>
      </div>

      {/* ── 4. 3 COMPACT DIRECT ASSESSMENT SHORTCUT CARDS ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Card 1: Technical Competencies */}
        <button
          type="button"
          onClick={() => onNavigate('assessments')}
          className="card-hover p-3 rounded-2xl text-left border shadow-2xs flex items-center justify-between gap-3 group transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Cpu size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                Technical Capabilities
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {myMeets} / {myTotal || 26} Met ({skillsCompletionPct}%)
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </button>

        {/* Card 2: CEFR Communication */}
        <button
          type="button"
          onClick={() => onNavigate('assessments')}
          className="card-hover p-3 rounded-2xl text-left border shadow-2xs flex items-center justify-between gap-3 group transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                CEFR Communication
              </h3>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                {commLevel ? `Band: ${commLevel}` : 'Awaiting Review'}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </button>

        {/* Card 3: Behavioral Framework */}
        <button
          type="button"
          onClick={() => onNavigate('assessments')}
          className="card-hover p-3 rounded-2xl text-left border shadow-2xs flex items-center justify-between gap-3 group transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                Behavioral Leadership
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                {behavLevel ? `Level: ${behavLevel}` : 'Awaiting Review'}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </button>
      </div>
    </div>
  );
};
