import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Send,
  ArrowUpRight,
  SlidersHorizontal,
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

const DONUT_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#ec4899'];

export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  const chartTheme = useChartTheme();
  const [activeCategory, setActiveCategory] = useState<'technical' | 'communication' | 'behavioral'>('technical');
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

  // CEFR Communication calculations
  const commLevel = latestComm?.overallCefr || 'B2';

  // Behavioral calculations
  const behavLevel = latestBehav?.result?.overallProficiency || 'L4';

  // Grade Information
  const currentGrade = myCompRow?.current_grade || user?.currentGrade || 'G14';
  const targetGrade = myCompRow?.target_grade || user?.targetGrade || 'G15';

  // Overall Readiness Score
  const skillsCompletionPct = myTotal > 0 ? Math.round((myMeets / myTotal) * 100) : myScore ?? 78;

  // 1. Top Bar Chart Data
  const barChartData = useMemo(() => {
    if (activeCategory === 'technical') {
      if (myGapRow?.domain_gaps && Object.keys(myGapRow.domain_gaps).length > 0) {
        return Object.entries(myGapRow.domain_gaps).map(([domain, data], idx) => ({
          label: domain.length > 8 ? `${domain.substring(0, 6)}…` : domain,
          fullLabel: domain,
          score: Math.round((data.score || 0) * 100),
          benchmark: Math.round((data.threshold || 0) * 100),
          highlight: idx === 1,
        }));
      }
      return [
        { label: 'Cloud', fullLabel: 'Cloud Architecture', score: 85, benchmark: 80, highlight: false },
        { label: 'CI/CD', fullLabel: 'CI/CD Automation', score: 92, benchmark: 80, highlight: true },
        { label: 'Arch', fullLabel: 'System Architecture', score: 74, benchmark: 75, highlight: false },
        { label: 'DevOps', fullLabel: 'DevOps Tooling', score: 80, benchmark: 75, highlight: false },
        { label: 'SRE', fullLabel: 'SRE & Reliability', score: 68, benchmark: 70, highlight: false },
        { label: 'Sec', fullLabel: 'DevSecOps & Policy', score: 75, benchmark: 75, highlight: false },
        { label: 'Obs', fullLabel: 'Observability & APM', score: 88, benchmark: 80, highlight: false },
      ];
    }
    if (activeCategory === 'communication') {
      return [
        { label: 'Write', fullLabel: 'Written Clarity', score: 83, benchmark: 67, highlight: false },
        { label: 'Speak', fullLabel: 'Spoken Fluency', score: 83, benchmark: 67, highlight: true },
        { label: 'Present', fullLabel: 'Technical Presentation', score: 67, benchmark: 67, highlight: false },
        { label: 'Listen', fullLabel: 'Active Listening', score: 83, benchmark: 67, highlight: false },
        { label: 'Exec', fullLabel: 'Stakeholder Alignment', score: 67, benchmark: 67, highlight: false },
        { label: 'Culture', fullLabel: 'Cross-Cultural', score: 83, benchmark: 67, highlight: false },
      ];
    }
    return [
      { label: 'Own', fullLabel: 'Ownership & Accountability', score: 80, benchmark: 60, highlight: true },
      { label: 'Collab', fullLabel: 'Collaboration', score: 80, benchmark: 60, highlight: false },
      { label: 'Problem', fullLabel: 'Problem Solving', score: 80, benchmark: 60, highlight: false },
      { label: 'Mentor', fullLabel: 'Mentorship', score: 60, benchmark: 60, highlight: false },
      { label: 'Deliver', fullLabel: 'Delivery Excellence', score: 80, benchmark: 60, highlight: false },
      { label: 'Integrity', fullLabel: 'Ethical Integrity', score: 80, benchmark: 60, highlight: false },
    ];
  }, [activeCategory, myGapRow]);

  // 2. Donut Chart Data
  const donutData = useMemo(() => [
    { name: 'Cloud & Infra', value: 30 },
    { name: 'CI/CD & DevOps', value: 25 },
    { name: 'CEFR English', value: 20 },
    { name: 'Behavioral', value: 15 },
    { name: 'SRE & Quality', value: 10 },
  ], []);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;
    setCopilotResponse(
      `Based on your ${formatGrade(currentGrade)} → ${formatGrade(targetGrade)} trajectory: You are on track with ${skillsCompletionPct}% readiness. Recommended immediate focus: Validate SRE & Reliability competency to close your remaining gap.`
    );
    setCopilotQuery('');
  };

  return (
    <div className="space-y-3 animate-slide-up pb-3 text-zinc-100 font-sans">
      {/* ── TOP SECTION (2-COLUMNS): HERO TRAJECTORY CHART (LEFT) + CALENDAR WIDGET (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* TOP LEFT: Main Capability Analytics Tile (2 Cols) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Capability Mastery
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {formatGrade(currentGrade)} → {formatGrade(targetGrade)}
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {myScore !== null ? `${myScore}%` : '78%'}
                </span>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp size={12} />
                  <span>+{myMeets} Skills Met</span>
                </div>
                <span className="text-xs text-zinc-400 font-medium">
                  vs {myRequired}% target threshold
                </span>
              </div>
            </div>

            {/* Timeframe / Category Switcher Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveCategory('technical')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === 'technical'
                      ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Technical
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('communication')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === 'communication'
                      ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  CEFR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('behavioral')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === 'behavioral'
                      ? 'bg-zinc-100 text-zinc-950 shadow-md font-extrabold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Behavioral
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('assessments')}
                className="p-1.5 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="Filter & Configure"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={getChartTooltipStyle(chartTheme)}
                  formatter={(val: number) => [`${val}%`, '']}
                  labelFormatter={(_label, payload) =>
                    payload?.[0]?.payload?.fullLabel ? `Competency: ${payload[0].payload.fullLabel}` : 'Competency'
                  }
                />
                <Bar
                  dataKey="score"
                  name="Achieved Score"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                >
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.highlight
                          ? '#3b82f6'
                          : activeCategory === 'communication'
                          ? '#06b6d4'
                          : activeCategory === 'behavioral'
                          ? '#f59e0b'
                          : '#27272a'
                      }
                      className={entry.highlight ? 'filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP RIGHT: Evaluation Period & Activity Calendar (1 Col) */}
        <div className="rounded-2xl p-4 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-zinc-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Evaluation Cycle 2026
              </h2>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <button type="button" className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft size={13} />
              </button>
              <button type="button" className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Mini Interactive Month Grid */}
          <div className="space-y-1 text-center">
            <div className="grid grid-cols-7 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[11px] font-mono">
              <span className="text-zinc-700 py-1">29</span>
              <span className="text-zinc-700 py-1">30</span>
              <span className="text-zinc-700 py-1">31</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">1</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">2</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">3</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">4</span>

              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">5</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">6</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">7</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">8</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">9</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">10</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">11</span>

              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">12</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">13</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">14</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">15</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">16</span>
              <span className="text-blue-400 font-bold bg-blue-600/30 border border-blue-500/40 rounded-md py-1 shadow-sm">17</span>
              <span className="text-zinc-400 py-1 hover:bg-zinc-800/50 rounded-md">18</span>
            </div>
          </div>

          {/* Bottom Highlight KPI Box */}
          <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Layers size={14} />
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 font-medium">Readiness Index</div>
                <div className="text-sm font-black font-mono text-white">{skillsCompletionPct}%</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp size={11} />
              <span>{formatGrade(targetGrade)} Eligible</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION (3-TILES): AI COPILOT (LEFT) + DONUT BREAKDOWN (CENTER) + MILESTONES (RIGHT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* BOTTOM LEFT: AI Career & Capability Copilot */}
        <div className="rounded-2xl p-4 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-3">
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
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div>
            <div className="text-[11px] font-bold text-zinc-300">AI Progression Summary</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5 line-clamp-3">
              {copilotResponse ||
                `Welcome ${displayName}. Your capability trajectory for ${formatGrade(currentGrade)} → ${formatGrade(
                  targetGrade
                )} remains highly active. Technical mastery is stable at ${myScore}%, CEFR is verified at ${commLevel}, and Behavioral leadership stands at ${behavLevel}.`}
            </p>
          </div>

          {/* 2 Mini Stat Blocks */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80">
              <div className="text-[10px] text-zinc-400">Skills Verified</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black font-mono text-white">{myMeets}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80">
              <div className="text-[10px] text-zinc-400">Gate Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black font-mono text-white">3/3</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
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
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 pr-8 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-2.5 text-zinc-400 hover:text-blue-400 transition-colors"
            >
              <Send size={13} />
            </button>
          </form>
        </div>

        {/* BOTTOM CENTER: Donut / Multi-Segment Competency Breakdown */}
        <div className="rounded-2xl p-4 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Competency Distribution
            </h2>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
              Cycle 2026 ▾
            </span>
          </div>

          {/* Donut Chart & Legend */}
          <div className="flex items-center justify-between gap-2 py-1">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={32}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black font-mono text-white">{myScore}%</span>
                <span className="text-[8px] uppercase tracking-wider text-zinc-400">Total</span>
              </div>
            </div>

            <div className="space-y-1 text-[10px] text-zinc-400 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="truncate">Cloud &amp; Infra</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <span className="truncate">CI/CD &amp; DevOps</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">CEFR English</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Behavioral</span>
              </div>
            </div>
          </div>

          {/* Insight Callout */}
          <div className="text-[10px] text-zinc-400 leading-normal pt-1.5 border-t border-zinc-800/80">
            💡 Most capability strength originates from Cloud &amp; CEFR {commLevel}, while CI/CD shows active growth.
          </div>
        </div>

        {/* BOTTOM RIGHT: Promotion Milestones & Gate Verification */}
        <div className="rounded-2xl p-4 border border-zinc-800/90 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Promotion Milestones
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              +
            </button>
          </div>

          {/* Segmented Yellow/Gold Progress Bar */}
          <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Gate Score</span>
            <div className="flex items-center gap-0.5">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-3 rounded-xs ${
                    i < 12 ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-black text-amber-400">{skillsCompletionPct}%</span>
          </div>

          {/* 3 Actionable Gate Items */}
          <div className="space-y-1.5 text-[11px]">
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
                <CefrLevelBadge level={commLevel as CefrLevelCode} size="sm" />
                <span className="text-[10px]">Verified</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-400">Behavioral Mastery</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <BehavioralLevelBadge level={behavLevel as BehavioralLevelCode} size="sm" />
                <span className="text-[10px]">Verified</span>
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="font-bold text-zinc-400 hover:text-white inline-flex items-center gap-1 transition-colors"
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
