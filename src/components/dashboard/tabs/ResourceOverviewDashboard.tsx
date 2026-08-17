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

  // Domain Bar Chart Data
  const domainChartData = useMemo(() => {
    if (!myGapRow?.domain_gaps) return [];
    return Object.entries(myGapRow.domain_gaps).map(([domain, data]) => ({
      domain: domain.length > 14 ? `${domain.substring(0, 12)}…` : domain,
      fullDomain: domain,
      achieved: Math.round((data.score || 0) * 100),
      benchmark: Math.round((data.threshold || 0) * 100),
      meets: data.meets,
    }));
  }, [myGapRow]);

  return (
    <div className="space-y-6 animate-slide-up pb-8">
      {/* ── 1. PRO-LEVEL HERO PROGRESS BANNER ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-lg transition-all bg-gradient-to-br from-indigo-900/90 via-slate-900 to-indigo-950 border-indigo-500/20 text-white">
        {/* Subtle glowing ambient lights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Personal Competency &amp; Progression Hub</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {displayName}! 👋
            </h1>

            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Track your real-time capability trajectory across Technical Mastery, CEFR Communication, and Behavioral Leadership.
            </p>

            {/* Career Grade Trajectory Tag */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90">
                Current: <strong className="font-mono text-white">{formatGrade(currentGrade)}</strong>
              </span>
              <span className="text-indigo-300 font-bold">→</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                Target: <strong className="font-mono text-white">{formatGrade(targetGrade)}</strong>
              </span>
            </div>
          </div>

          {/* Right Action & Readiness Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
              <div className="text-right">
                <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Promotion Readiness</div>
                <div className="text-xl font-black text-white font-mono">
                  {skillsCompletionPct}%
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  isOverallReady ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-amber-400 shadow-amber-400/50'
                } shadow-md`}
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-900 bg-white hover:bg-indigo-50 shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              <span>Manage &amp; Assess Skills</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. 4-CARD 3-PILLAR COMPETENCE METRICS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Technical Score */}
        <MetricKpiCard
          label="Technical Score"
          primaryValue={myScore !== null ? `${myScore}%` : 'N/A'}
          subtext="Target Required"
          subtextValue={myRequired !== null ? `${myRequired}%` : 'N/A'}
          statusType={myGap !== null && myGap >= 0 ? 'success' : 'warning'}
          statusText={myGap !== null ? (myGap >= 0 ? `+${myGap}%` : `${myGap}%`) : undefined}
        />

        {/* CEFR Language Level */}
        <div className="card p-3.5 rounded-2xl flex flex-col justify-between border shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              CEFR English Level
            </span>
            <MessageSquare size={15} className="text-cyan-500" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            {commLevel ? (
              <CefrLevelBadge level={commLevel} size="md" showLabel />
            ) : (
              <span className="text-sm font-bold text-zinc-400">Pending Evaluation</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>Target Benchmark</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{commBenchmark}</span>
          </div>
        </div>

        {/* Behavioral Mastery */}
        <div className="card p-3.5 rounded-2xl flex flex-col justify-between border shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Behavioral Mastery
            </span>
            <Award size={15} className="text-amber-500" />
          </div>
          <div className="my-1.5 flex items-baseline gap-2">
            {behavLevel ? (
              <BehavioralLevelBadge level={behavLevel} size="md" showLabel />
            ) : (
              <span className="text-sm font-bold text-zinc-400">Pending Evaluation</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
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
        />
      </div>

      {/* ── 3. VISUAL RECHARTS SECTION: DOMAIN GAP & RADIAL READINESS ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Domain Capability Gap Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 card p-5 rounded-2xl border shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  Technical Domain Benchmark Comparison
                </h2>
                <InfoTip text="Compares your achieved domain scores against required benchmarks for your target career grade." />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                Target Grade: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{targetGrade}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Skill Grid</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {domainChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-zinc-200 dark:border-zinc-700">
              <Compass size={32} className="text-zinc-400 mb-2" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Domain Data Available</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                Assess skills under Technical Competencies to populate your live domain gap analysis.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} vertical={false} />
                  <XAxis
                    dataKey="domain"
                    stroke={chartTheme.axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.gridColor }}
                  />
                  <YAxis
                    stroke={chartTheme.axisColor}
                    fontSize={11}
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
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                  />
                  <Bar
                    dataKey="achieved"
                    name="Achieved Score"
                    fill="rgb(99, 102, 241)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="benchmark"
                    name="Required Target"
                    fill="rgb(245, 158, 11)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Milestone Progress & Gap Summary (1 Col) */}
        <div className="card p-5 rounded-2xl border shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                Milestone Readiness
              </h2>
              <InfoTip text="Holistic summary of completion ratio, critical gaps, and prerequisites." />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              3-Pillar Prerequisite Status
            </p>
          </div>

          {/* Circular Progress Display */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  className="text-zinc-200 dark:text-zinc-800"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, skillsCompletionPct))) / 100}
                  strokeLinecap="round"
                  className={skillsCompletionPct >= 80 ? 'text-emerald-500' : 'text-indigo-500'}
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {skillsCompletionPct}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Ready
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-3 text-center">
              {myTotal > 0
                ? `${myMeets} of ${myTotal} required skills complete`
                : 'No target grade requirements set yet'}
            </p>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Technical Prerequisites</span>
              <span className="font-bold flex items-center gap-1">
                {technicalReady ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> Met
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle size={13} /> {myTotal - myMeets} Gaps
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Communication Gate</span>
              <span className="font-bold">
                {commReady ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> Evaluated ({commLevel})
                  </span>
                ) : (
                  <span className="text-zinc-400 font-normal">Pending</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Behavioral Gate</span>
              <span className="font-bold">
                {behavReady ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> Evaluated ({behavLevel})
                  </span>
                ) : (
                  <span className="text-zinc-400 font-normal">Pending</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. 3 DIRECT ASSESSMENT SHORTCUT CARDS ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Competency Assessment Streams
          </h2>
          <span className="text-xs text-zinc-400">Click any stream to assess or review rubrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Technical Competencies */}
          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="card-hover p-5 rounded-2xl text-left border shadow-2xs space-y-3 group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Cpu size={20} />
              </div>
              <ChevronRight size={16} className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Technical Capabilities
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                Evaluate tools, frameworks, and engineering competencies across Cloud, CI/CD, and SRE.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Skills Met:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{myMeets} / {myTotal || 26}</span>
            </div>
          </button>

          {/* Card 2: CEFR Communication */}
          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="card-hover p-5 rounded-2xl text-left border shadow-2xs space-y-3 group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <ChevronRight size={16} className="text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                CEFR Communication
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                6 language dimensions: Spoken, Written, Stakeholder, and Technical presentation.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">CEFR Band:</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">{commLevel || 'Awaiting Review'}</span>
            </div>
          </button>

          {/* Card 3: Behavioral Framework */}
          <button
            type="button"
            onClick={() => onNavigate('assessments')}
            className="card-hover p-5 rounded-2xl text-left border shadow-2xs space-y-3 group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Award size={20} />
              </div>
              <ChevronRight size={16} className="text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Behavioral Leadership
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                11 core behavioral dimensions from Ownership to Mentorship &amp; Ethical Integrity.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Mastery Level:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{behavLevel || 'Awaiting Review'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
