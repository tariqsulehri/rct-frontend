import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Save,
  Send,
  History,
  Zap,
  Star,
  Target,
  Sparkles,
  MessageSquare,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CefrLevelCode,
  CompetencyKey,
  OrgLevelKey,
  RatingInput,
} from '@/types/communication';
import {
  useCommConfig,
  useLatestCommAssessment,
  useCommAssessmentHistory,
  useCreateCommAssessment,
} from '@/hooks/useCommunication';
import { useAuthStore } from '@/store/authStore';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { toast } from '@/lib/toast';
import { CefrLevelBadge, CEFR_COLORS } from './CefrLevelBadge';

const CEFR_LEVELS: CefrLevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_WEIGHTS: Record<CefrLevelCode, number> = {
  A1: 0.17,
  A2: 0.33,
  B1: 0.5,
  B2: 0.67,
  C1: 0.83,
  C2: 1.0,
};

const CEFR_DESCRIPTORS: Record<CefrLevelCode, string> = {
  A1: 'Can understand basic everyday phrases and introduce themselves in simple terms.',
  A2: 'Can communicate in routine tasks and describe immediate technical context in simple terms.',
  B1: 'Can understand main points of standard discussions and produce simple connected technical text.',
  B2: 'Can interact with spontaneity, explain complex viewpoints, and write clear, detailed technical documentation.',
  C1: 'Can express ideas fluently, use language flexibly for complex professional negotiations, and write structured RFCs.',
  C2: 'Can understand virtually everything with ease, lead strategic executive discourse, and formulate high-stakes consensus.',
};

const EVIDENCE_TAGS: Record<CompetencyKey, string[]> = {
  written_clarity: ['+ RFC / Technical Spec', '+ Postmortem Report', '+ Architecture ADR', '+ PR Descriptions'],
  spoken_fluency: ['+ Standup Cadence', '+ Architecture Sync', '+ Incident Bridge', '+ Cross-team Discussion'],
  presentation: ['+ Sprint Demo', '+ Tech Talk / Brownbag', '+ Client Walkthrough', '+ Executive Demo'],
  active_listening: ['+ Code Review Feedback', '+ 1-on-1 Mentoring', '+ Discovery Interview', '+ Peer Collaboration'],
  stakeholder_exec: ['+ Executive Briefing', '+ Product Roadmapping', '+ Tradeoff Negotiation', '+ ROI Justification'],
  cross_cultural: ['+ Async Timezone Handoff', '+ Inclusive Documentation', '+ Global Team Sync', '+ Distributed Pairing'],
};

export interface CommunicationAssessmentViewProps {
  employeeId: string;
  employeeName: string;
  currentGradeLevel?: number;
  currentGradeCode?: string;
  currentGradeTitle?: string;
}

export const CommunicationAssessmentView: React.FC<CommunicationAssessmentViewProps> = ({
  employeeId,
  employeeName,
  currentGradeLevel = 3,
  currentGradeCode,
  currentGradeTitle,
}) => {
  const { user } = useAuthStore();
  const chartColors = useChartColors();
  const { data: config, isLoading: isConfigLoading } = useCommConfig();
  const { data: latestAssessment, isLoading: isAssessmentLoading, refetch: refetchLatest } =
    useLatestCommAssessment(employeeId);
  const { data: history = [] } = useCommAssessmentHistory(employeeId);
  const createMutation = useCreateCommAssessment();

  const isEngineer = user?.role === 'ENGINEER';
  const [showHistory, setShowHistory] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [initialRatingsString, setInitialRatingsString] = useState<string>('');

  // Determine org level key
  const orgLevelKey: OrgLevelKey = useMemo(() => {
    switch (currentGradeLevel) {
      case 1:
        return 'associate';
      case 2:
        return 'engineer';
      case 3:
        return 'senior';
      case 4:
        return 'lead';
      case 5:
        return 'manager';
      case 6:
        return 'senior_mgr';
      case 7:
        return 'director';
      case 8:
        return 'vp';
      default:
        return currentGradeLevel >= 9 ? 'c_level' : 'senior';
    }
  }, [currentGradeLevel]);

  // Form ratings state
  const [ratings, setRatings] = useState<
    Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }>
  >({} as any);

  // Sync state when latestAssessment or config changes
  useEffect(() => {
    const competencies: CompetencyKey[] = [
      'written_clarity',
      'spoken_fluency',
      'presentation',
      'active_listening',
      'stakeholder_exec',
      'cross_cultural',
    ];

    const initial: Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }> = {} as any;

    competencies.forEach((key) => {
      const existingRating = latestAssessment?.ratings?.find((r) => r.competency_key === key);
      const benchmark =
        config?.targetOverrides?.[orgLevelKey]?.[key] ??
        config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
        'B2';

      initial[key] = {
        cefr: (existingRating?.cefr as CefrLevelCode) || (benchmark as CefrLevelCode) || 'B2',
        evidence: existingRating?.evidence || '',
      };
    });

    setRatings(initial);
    setInitialRatingsString(JSON.stringify(initial));
  }, [latestAssessment, config, orgLevelKey]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialRatingsString) return false;
    return JSON.stringify(ratings) !== initialRatingsString;
  }, [ratings, initialRatingsString]);

  // Dynamic Live Score Calculation Engine
  const liveEvaluation = useMemo(() => {
    const compKeys = Object.keys(ratings) as CompetencyKey[];
    if (compKeys.length === 0) return null;

    let totalWeight = 0;
    const breakdown = compKeys.map((key) => {
      const givenCefr = ratings[key]?.cefr || 'B1';
      const givenWeight = LEVEL_WEIGHTS[givenCefr] || 0.5;
      totalWeight += givenWeight;

      const expectedCefr: CefrLevelCode =
        config?.targetOverrides?.[orgLevelKey]?.[key] ??
        config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
        'B2';
      const expectedWeight = LEVEL_WEIGHTS[expectedCefr] || 0.67;
      const gap = Number((givenWeight - expectedWeight).toFixed(2));
      const status = gap >= 0.001 ? 'ABOVE' : gap <= -0.001 ? 'BELOW' : 'MEETS';

      return {
        key,
        givenCefr,
        givenWeight,
        expectedCefr,
        expectedWeight,
        gap,
        status,
        evidence: ratings[key]?.evidence || '',
      };
    });

    const averageWeight = Number((totalWeight / compKeys.length).toFixed(2));

    // Band threshold calculation
    let band: CefrLevelCode = 'B1';
    if (averageWeight >= 0.92) band = 'C2';
    else if (averageWeight >= 0.75) band = 'C1';
    else if (averageWeight >= 0.58) band = 'B2';
    else if (averageWeight >= 0.42) band = 'B1';
    else if (averageWeight >= 0.25) band = 'A2';
    else band = 'A1';

    const orgBenchmark: CefrLevelCode = config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ?? 'B2';
    const orgExpectedScore = LEVEL_WEIGHTS[orgBenchmark] || 0.67;
    const overallGap = Number((averageWeight - orgExpectedScore).toFixed(2));
    const overallStatus = overallGap >= 0.001 ? 'ABOVE' : overallGap <= -0.001 ? 'BELOW' : 'MEETS';

    const isGated = currentGradeLevel >= 3;
    const isReady = isGated ? overallStatus !== 'BELOW' : true;

    const priorities = breakdown.filter((b) => b.status === 'BELOW').map((b) => b.key);

    return {
      averageWeight,
      band,
      orgBenchmark,
      orgExpectedScore,
      overallGap,
      overallStatus,
      isGated,
      isReady,
      priorities,
      breakdown,
    };
  }, [ratings, config, orgLevelKey, currentGradeLevel]);

  // Radar Chart Data Preparation
  const radarChartData = useMemo(() => {
    if (!liveEvaluation) return [];
    const shortNames: Record<CompetencyKey, string> = {
      written_clarity: 'Written Clarity',
      spoken_fluency: 'Spoken Fluency',
      presentation: 'Presentations',
      active_listening: 'Active Listening',
      stakeholder_exec: 'Stakeholders',
      cross_cultural: 'Global Collab',
    };

    return liveEvaluation.breakdown.map((item) => ({
      subject: shortNames[item.key] || item.key,
      assessed: Math.round(item.givenWeight * 100),
      benchmark: Math.round(item.expectedWeight * 100),
      fullMark: 100,
    }));
  }, [liveEvaluation]);

  const handleRatingChange = (key: CompetencyKey, cefr: CefrLevelCode) => {
    setRatings((prev) => ({
      ...prev,
      [key]: { ...prev[key], cefr },
    }));
  };

  const handleEvidenceChange = (key: CompetencyKey, evidence: string) => {
    setRatings((prev) => ({
      ...prev,
      [key]: { ...prev[key], evidence },
    }));
  };

  const handleAddEvidenceTag = (key: CompetencyKey, tag: string) => {
    const cleanTag = tag.replace(/^\+\s*/, '');
    const current = ratings[key]?.evidence || '';
    const updated = current ? `${current}, ${cleanTag}` : cleanTag;
    handleEvidenceChange(key, updated);
    setExpandedEvidence((prev) => ({ ...prev, [key]: true }));
  };

  const toggleEvidence = (key: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetToBenchmark = () => {
    const competencies: CompetencyKey[] = [
      'written_clarity',
      'spoken_fluency',
      'presentation',
      'active_listening',
      'stakeholder_exec',
      'cross_cultural',
    ];

    const benchmarkDefault: Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }> = {} as any;
    competencies.forEach((key) => {
      const benchmark =
        config?.targetOverrides?.[orgLevelKey]?.[key] ??
        config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
        'B2';
      benchmarkDefault[key] = {
        cefr: benchmark as CefrLevelCode,
        evidence: ratings[key]?.evidence || '',
      };
    });

    setRatings(benchmarkDefault);
    toast.info('Ratings aligned to role benchmark baseline.', 'Benchmark Baseline');
  };

  const handleSubmit = async (targetStatus: 'draft' | 'pending' | 'approved') => {
    try {
      const formattedRatings: RatingInput[] = Object.entries(ratings).map(([key, val]) => ({
        competency_key: key as CompetencyKey,
        cefr: val.cefr,
        evidence: val.evidence?.trim() || null,
      }));

      await createMutation.mutateAsync({
        employee_id: employeeId,
        org_level_key: orgLevelKey,
        status: targetStatus,
        ratings: formattedRatings,
      });

      await refetchLatest();
      setInitialRatingsString(JSON.stringify(ratings));

      toast.success(
        targetStatus === 'approved'
          ? 'Communication evaluation approved and saved successfully!'
          : targetStatus === 'pending'
          ? 'Self-assessment submitted for manager approval.'
          : 'Assessment saved as draft.',
        'Saved'
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Save Failed');
    }
  };

  const coreLanguageCompetencies = [
    { key: 'written_clarity' as CompetencyKey, name: 'Written Clarity & Documentation', description: 'Technical design specs, RFCs, PR descriptions, and incident postmortems.' },
    { key: 'spoken_fluency' as CompetencyKey, name: 'Spoken Fluency & Meeting Presence', description: 'Standup cadence, synchronous debate, and technical clarification.' },
    { key: 'active_listening' as CompetencyKey, name: 'Active Listening & Feedback Reception', description: 'Code review discussions, 1-on-1s, and requirement discovery.' },
  ];

  const professionalImpactCompetencies = [
    { key: 'presentation' as CompetencyKey, name: 'Technical Presentation & Demos', description: 'Sprint reviews, architecture walkthroughs, and client demonstrations.' },
    { key: 'stakeholder_exec' as CompetencyKey, name: 'Stakeholder & Executive Alignment', description: 'Translating engineering concerns into business impact and trade-offs.' },
    { key: 'cross_cultural' as CompetencyKey, name: 'Cross-Cultural & Global Collaboration', description: 'Asynchronous handoffs across timezones and inclusive language.' },
  ];

  if (isConfigLoading || isAssessmentLoading) {
    return (
      <div className="card p-8 text-center animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto"></div>
        <div className="h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-12">
      {/* ── Top Hero Card: Stepper Ladder & Interactive Radar ───────────────── */}
      <div className="card p-6 space-y-6 bg-gradient-to-br from-white via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                {employeeName}
              </span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                ID: {employeeId}
              </span>
              {currentGradeCode && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Grade: {currentGradeCode} {currentGradeTitle ? `(${currentGradeTitle})` : ''}
                </span>
              )}
              {latestAssessment?.status && (
                <span
                  className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    latestAssessment.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : latestAssessment.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  Status: {latestAssessment.status}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Target Level: <span className="font-bold text-zinc-800 dark:text-zinc-200">{orgLevelKey.toUpperCase()}</span> — Role Benchmark:{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{liveEvaluation?.orgBenchmark}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors"
              >
                <History size={14} />
                {showHistory ? 'Hide History' : `History (${history.length})`}
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToBenchmark}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              title="Align all 6 competencies to role benchmark baseline"
            >
              <Sparkles size={14} />
              Match Benchmark Baseline
            </button>
          </div>
        </div>

        {/* Hero Grid: Ladder & Live Metrics (Left) + Radar Chart (Right) */}
        {liveEvaluation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Ladder & Metrics Cards (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* CEFR Step Progression Ladder */}
              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                    CEFR Proficiency Ladder
                  </span>
                  <span className="text-[11px] font-normal text-zinc-500">
                    Target: <strong className="text-indigo-600 dark:text-indigo-400">{liveEvaluation.orgBenchmark}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {CEFR_LEVELS.map((lvl) => {
                    const isEvaluated = liveEvaluation.band === lvl;
                    const isBenchmark = liveEvaluation.orgBenchmark === lvl;
                    const color = CEFR_COLORS[lvl];

                    return (
                      <div
                        key={lvl}
                        className={`relative text-center p-2.5 rounded-xl border transition-all ${
                          isEvaluated
                            ? `${color.bg} ${color.border} ring-2 ring-indigo-500/50 shadow-md transform scale-[1.03]`
                            : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 opacity-80'
                        }`}
                      >
                        {isBenchmark && (
                          <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow-sm" title="Target Benchmark">
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                        <div className={`text-sm font-black ${isEvaluated ? color.text : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {lvl}
                        </div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">
                          {LEVEL_WEIGHTS[lvl].toFixed(2)}
                        </div>
                        {isEvaluated && (
                          <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-1">
                            Current
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4 Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Evaluated Band
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CefrLevelBadge level={liveEvaluation.band} size="md" />
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Weight: <strong className="text-zinc-800 dark:text-zinc-200">{liveEvaluation.averageWeight.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Role Benchmark
                  </div>
                  <div className="text-base font-black text-zinc-800 dark:text-zinc-200 mt-1">
                    {liveEvaluation.orgBenchmark}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Target: <strong className="text-zinc-800 dark:text-zinc-200">{liveEvaluation.orgExpectedScore.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Benchmark Gap
                  </div>
                  <div
                    className={`text-base font-black mt-1 ${
                      liveEvaluation.overallGap >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {liveEvaluation.overallGap >= 0
                      ? `+${liveEvaluation.overallGap.toFixed(2)}`
                      : liveEvaluation.overallGap.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-semibold uppercase text-zinc-500 mt-1">
                    {liveEvaluation.overallStatus}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Readiness
                  </div>
                  <div className="mt-1">
                    {liveEvaluation.isReady ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={12} /> READY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertTriangle size={12} /> GATED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 truncate">
                    {liveEvaluation.isGated ? 'Active Gating' : 'Dev Tracking'}
                  </div>
                </div>
              </div>

              {/* Priority Alert if below benchmark */}
              {liveEvaluation.priorities.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-2.5">
                  <Zap size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-300 leading-tight">
                    <span className="font-bold">Priorities for promotion readiness: </span>
                    {liveEvaluation.priorities.map((p) => p.replace(/_/g, ' ')).join(', ')}.
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 6-Axis Communication Radar Chart (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 min-h-[280px]">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 self-start px-2 mb-1">
                Communication Competencies Radar
              </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: chartColors.text, fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle(chartColors)}
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Radar
                      name="Assessed Level"
                      dataKey="assessed"
                      stroke="rgb(99, 102, 241)"
                      fill="rgb(99, 102, 241)"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Role Benchmark"
                      dataKey="benchmark"
                      stroke="rgb(245, 158, 11)"
                      fill="rgb(245, 158, 11)"
                      fillOpacity={0.15}
                      strokeDasharray="4 4"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsible History Timeline Drawer ─────────────────────────────── */}
      {showHistory && (
        <div className="card p-5 space-y-3 bg-zinc-50/80 dark:bg-zinc-900/80 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <History size={15} /> Assessment History Timeline ({history.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <div className="flex items-center gap-3">
                  <CefrLevelBadge level={h.evaluation.overallCefr} size="sm" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(h.assessed_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-zinc-400 ml-2">
                      by {h.assessor_name || 'Self-Assessed'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    Score: {h.evaluation.overallScore.toFixed(2)}
                  </span>
                  <span
                    className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[10px] border ${
                      h.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : h.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category 1: Core Language & Interaction ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              Core Language & Interaction
            </h3>
            <p className="text-xs text-zinc-500">
              Foundational clarity, fluency, and synchronous collaboration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coreLanguageCompetencies.map((comp) => {
            const currentRating = ratings[comp.key]?.cefr || 'B1';
            const expected =
              config?.targetOverrides?.[orgLevelKey]?.[comp.key] ??
              config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
              'B2';
            const givenWeight = LEVEL_WEIGHTS[currentRating] || 0.5;
            const expectedWeight = LEVEL_WEIGHTS[expected as CefrLevelCode] || 0.67;
            const gap = Number((givenWeight - expectedWeight).toFixed(2));
            const status = gap >= 0.001 ? 'ABOVE' : gap <= -0.001 ? 'BELOW' : 'MEETS';
            const isExpanded = expandedEvidence[comp.key];

            return (
              <div
                key={comp.key}
                className="card p-4 flex flex-col justify-between space-y-3 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {comp.name}
                    </h4>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        status === 'MEETS'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : status === 'ABOVE'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    {comp.description}
                  </p>
                </div>

                {/* Level Selectors */}
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1">
                    {CEFR_LEVELS.map((lvl) => {
                      const isSelected = currentRating === lvl;
                      const isTarget = expected === lvl;
                      const color = CEFR_COLORS[lvl];

                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleRatingChange(comp.key, lvl)}
                          className={`py-1.5 px-0.5 text-center rounded-lg border transition-all text-[11px] font-black ${
                            isSelected
                              ? `${color.bg} ${color.text} ${color.border} ring-2 ring-indigo-500/40 shadow-sm`
                              : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                          }`}
                        >
                          <div>{lvl}</div>
                          {isTarget && (
                            <div className="text-[8px] font-bold text-amber-500 opacity-90 mt-0.5">
                              ★ Req
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Level Descriptor Hint */}
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-50/80 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/80 leading-snug">
                    <strong className="text-zinc-700 dark:text-zinc-300 not-italic font-bold">
                      {currentRating}:
                    </strong>{' '}
                    {CEFR_DESCRIPTORS[currentRating]}
                  </div>
                </div>

                {/* Quick Evidence Tags & Notes */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Evidence Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleEvidence(comp.key)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? 'Hide Notes' : 'Notes'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {EVIDENCE_TAGS[comp.key]?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddEvidenceTag(comp.key, tag)}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {isExpanded && (
                    <textarea
                      value={ratings[comp.key]?.evidence || ''}
                      onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                      placeholder="Add specific RFCs, meeting examples, demos, or feedback notes..."
                      rows={2}
                      className="w-full mt-2 text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Category 2: Professional Impact & Leadership ────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Briefcase size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              Professional Impact & Leadership
            </h3>
            <p className="text-xs text-zinc-500">
              Demonstrations, executive consensus, and cross-cultural alignment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {professionalImpactCompetencies.map((comp) => {
            const currentRating = ratings[comp.key]?.cefr || 'B1';
            const expected =
              config?.targetOverrides?.[orgLevelKey]?.[comp.key] ??
              config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
              'B2';
            const givenWeight = LEVEL_WEIGHTS[currentRating] || 0.5;
            const expectedWeight = LEVEL_WEIGHTS[expected as CefrLevelCode] || 0.67;
            const gap = Number((givenWeight - expectedWeight).toFixed(2));
            const status = gap >= 0.001 ? 'ABOVE' : gap <= -0.001 ? 'BELOW' : 'MEETS';
            const isExpanded = expandedEvidence[comp.key];

            return (
              <div
                key={comp.key}
                className="card p-4 flex flex-col justify-between space-y-3 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {comp.name}
                    </h4>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        status === 'MEETS'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : status === 'ABOVE'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    {comp.description}
                  </p>
                </div>

                {/* Level Selectors */}
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-1">
                    {CEFR_LEVELS.map((lvl) => {
                      const isSelected = currentRating === lvl;
                      const isTarget = expected === lvl;
                      const color = CEFR_COLORS[lvl];

                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleRatingChange(comp.key, lvl)}
                          className={`py-1.5 px-0.5 text-center rounded-lg border transition-all text-[11px] font-black ${
                            isSelected
                              ? `${color.bg} ${color.text} ${color.border} ring-2 ring-indigo-500/40 shadow-sm`
                              : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                          }`}
                        >
                          <div>{lvl}</div>
                          {isTarget && (
                            <div className="text-[8px] font-bold text-amber-500 opacity-90 mt-0.5">
                              ★ Req
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Level Descriptor Hint */}
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-50/80 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/80 leading-snug">
                    <strong className="text-zinc-700 dark:text-zinc-300 not-italic font-bold">
                      {currentRating}:
                    </strong>{' '}
                    {CEFR_DESCRIPTORS[currentRating]}
                  </div>
                </div>

                {/* Quick Evidence Tags & Notes */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Evidence Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleEvidence(comp.key)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? 'Hide Notes' : 'Notes'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {EVIDENCE_TAGS[comp.key]?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddEvidenceTag(comp.key, tag)}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {isExpanded && (
                    <textarea
                      value={ratings[comp.key]?.evidence || ''}
                      onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                      placeholder="Add specific RFCs, meeting examples, demos, or feedback notes..."
                      rows={2}
                      className="w-full mt-2 text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar ────────────────────────────────────────── */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 shadow-2xl z-30 border-indigo-500/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
        <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div>
            Overall Level:{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {liveEvaluation?.band} ({liveEvaluation?.averageWeight.toFixed(2)})
            </strong>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div>
            Role Req:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {liveEvaluation?.orgBenchmark}
            </strong>
          </div>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit('draft')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Save Draft
          </button>

          {isEngineer ? (
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('pending')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all hover:shadow-indigo-500/20 disabled:opacity-50"
            >
              <Send size={14} />
              {createMutation.isPending ? 'Submitting...' : 'Submit Self-Assessment'}
            </button>
          ) : (
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('approved')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
