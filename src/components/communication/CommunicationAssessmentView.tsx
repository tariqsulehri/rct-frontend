import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Save,
  History,
  Zap,
  Star,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
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
import { CefrLevelBadge } from './CefrLevelBadge';

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

const COMPETENCY_RUBRICS: Record<string, Record<CefrLevelCode, string>> = {
  written_clarity: {
    A1: 'Can write simple Slack status updates and brief Jira comment notes with assistance.',
    A2: 'Can draft routine PR descriptions, basic ticket summaries, and simple setup notes.',
    B1: 'Can write clear PR notes, standard design documents, and structured bug reports.',
    B2: 'Can write clear, detailed technical design specs, RFCs, PR descriptions, and incident postmortems with minimal ambiguity.',
    C1: 'Can author comprehensive RFCs, multi-team architectural specs, and structured executive postmortems.',
    C2: 'Can define organization-wide technical writing standards, vision docs, and high-impact strategy papers.',
  },
  spoken_fluency: {
    A1: 'Can answer simple yes/no questions in daily standups and introduce themselves.',
    A2: 'Can state current task progress and basic blockers during synchronous standups.',
    B1: 'Can explain technical issues in team meetings and participate in standard technical clarifications.',
    B2: 'Can interact with spontaneity, lead daily standups, incident bridges, and clarify architecture synchronously.',
    C1: 'Can lead high-stakes technical debates, facilitate cross-functional architectural syncs, and resolve conflicts fluently.',
    C2: 'Can lead executive alignment calls, formulate spontaneous high-stakes consensus, and articulate complex trade-offs effortlessly.',
  },
  presentation: {
    A1: 'Can demonstrate simple completed UI/code tasks with guided prompts.',
    A2: 'Can present completed user stories to direct teammates during internal demo sessions.',
    B1: 'Can walk through sprint deliverables and present straightforward features to internal stakeholders.',
    B2: 'Can deliver structured sprint reviews, client architecture walkthroughs, and technical brownbags with compelling storytelling.',
    C1: 'Can present complex system architectures, multi-million dollar tech initiatives, and keynotes to clients and leadership.',
    C2: 'Can deliver keynotes at major conferences, pitch strategic tech roadmap bets to C-level executives, and inspire global audiences.',
  },
  active_listening: {
    A1: 'Can follow basic single-step direct technical instructions from a mentor.',
    A2: 'Can understand direct code review feedback and simple task clarification requests.',
    B1: 'Can grasp core requirement details, ask clarifying questions in 1-on-1s, and incorporate code review suggestions.',
    B2: 'Can active-listen during code reviews, 1-on-1s, and requirement discovery calls; synthesizes feedback accurately.',
    C1: 'Can uncover subtle unstated requirements in stakeholder discovery interviews and mentor engineers constructively.',
    C2: 'Can navigate high-tension negotiations, decode unspoken organizational dynamics, and foster deep empathetic trust.',
  },
  stakeholder_exec: {
    A1: 'Can share basic technical status when explicitly asked by team lead.',
    A2: 'Can summarize feature status for direct engineering leads and product managers.',
    B1: 'Can communicate timeline risks and basic dependency trade-offs to product managers.',
    B2: 'Can translate technical debt, infrastructure risks, and architectural trade-offs into clear business impact for stakeholders.',
    C1: 'Can negotiate multi-quarter product roadmaps, balance engineering velocity vs tech debt with executive leaders.',
    C2: 'Can align executive VPs and C-suite stakeholders on high-stakes platform bets and ROI strategies.',
  },
  cross_cultural: {
    A1: 'Can participate respectfully in international team Slack channels using translation tools.',
    A2: 'Can exchange basic async messages across timezones with standard English phrasing.',
    B1: 'Can collaborate smoothly in multi-region Slack channels and provide clear async handover notes.',
    B2: 'Can manage asynchronous handoffs across timezones seamlessly using inclusive, culturally aware technical language.',
    C1: 'Can champion inclusive documentation practices and lead global distributed engineering teams across multiple continents.',
    C2: 'Can build and lead high-performing global engineering cultures across diverse geographies, timezones, and backgrounds.',
  },
};

const COMPETENCY_TITLES: Record<string, string> = {
  written_clarity: 'Written Clarity & Documentation',
  spoken_fluency: 'Spoken Fluency & Meeting Presence',
  active_listening: 'Active Listening & Feedback Reception',
  presentation: 'Technical Presentation & Demos',
  stakeholder_exec: 'Stakeholder & Executive Alignment',
  cross_cultural: 'Cross-Cultural & Global Collaboration',
};

const EVIDENCE_TAGS: Record<CompetencyKey, string[]> = {
  written_clarity: ['+ RFC / Technical Spec', '+ Postmortem Report', '+ Architecture ADR', '+ PR Descriptions'],
  spoken_fluency: ['+ Standup Cadence', '+ Architecture Sync', '+ Incident Bridge', '+ Cross-team Discussion'],
  presentation: ['+ Sprint Demo', '+ Tech Talk / Brownbag', '+ Client Walkthrough', '+ Executive Demo'],
  active_listening: ['+ Code Review Feedback', '+ 1-on-1 Mentoring', '+ Discovery Interview', '+ Peer Collaboration'],
  stakeholder_exec: ['+ Executive Briefing', '+ Product Roadmapping', '+ Tradeoff Negotiation', '+ ROI Justification'],
  cross_cultural: ['+ Async Timezone Handoff', '+ Inclusive Documentation', '+ Global Team Sync', '+ Distributed Pairing'],
};

const getReviewerRoleLabel = (role?: string) => {
  switch (role) {
    case 'COMMUNICATION_EXPERT':
    case 'LANGUAGE_EXPERT':
      return 'Language Communication Expert';
    case 'LINE_MANAGER':
      return 'Line Manager';
    case 'MANAGER':
      return 'Engineering Line Manager';
    case 'ADMIN':
      return 'System Administrator / Evaluator';
    default:
      return role ? role.replace(/_/g, ' ') : 'Authorized Reviewer';
  }
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

  const isManagerOrAdmin =
    user?.role === 'MANAGER' ||
    user?.role === 'LINE_MANAGER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'TOP_MANAGEMENT' ||
    user?.role === 'COMMUNICATION_EXPERT' ||
    user?.role === 'LANGUAGE_EXPERT';

  const canEdit = isManagerOrAdmin;
  const reviewerTitle = getReviewerRoleLabel(user?.role);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [initialRatingsString, setInitialRatingsString] = useState<string>('');

  const orgLevelKey: OrgLevelKey = useMemo(() => {
    switch (currentGradeLevel) {
      case 1: return 'associate';
      case 2: return 'engineer';
      case 3: return 'senior';
      case 4: return 'lead';
      case 5: return 'manager';
      case 6: return 'senior_mgr';
      case 7: return 'director';
      case 8: return 'vp';
      default: return currentGradeLevel >= 9 ? 'c_level' : 'senior';
    }
  }, [currentGradeLevel]);

  const [ratings, setRatings] = useState<
    Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }>
  >({} as any);

  useEffect(() => {
    const competencies: CompetencyKey[] = [
      'written_clarity', 'spoken_fluency', 'presentation', 'active_listening', 'stakeholder_exec', 'cross_cultural',
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

  const hasUnsavedChanges = useMemo(() => {
    if (!initialRatingsString) return false;
    return JSON.stringify(ratings) !== initialRatingsString;
  }, [ratings, initialRatingsString]);

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

      return { key, givenCefr, givenWeight, expectedCefr, expectedWeight, gap, status, evidence: ratings[key]?.evidence || '' };
    });

    const averageWeight = Number((totalWeight / compKeys.length).toFixed(2));
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

    return { averageWeight, band, orgBenchmark, orgExpectedScore, overallGap, overallStatus, isGated, isReady, priorities, breakdown };
  }, [ratings, config, orgLevelKey, currentGradeLevel]);

  const radarChartData = useMemo(() => {
    if (!liveEvaluation) return [];
    const shortNames: Record<CompetencyKey, string> = {
      written_clarity: 'Written Clarity',
      spoken_fluency: 'Spoken Fluency',
      presentation: 'Presentation',
      active_listening: 'Active Listening',
      stakeholder_exec: 'Stakeholders',
      cross_cultural: 'Global Collab',
    };
    return liveEvaluation.breakdown.map((item) => ({
      subject: shortNames[item.key] || item.key,
      assessed: Math.round(item.givenWeight * 100),
      benchmark: Math.round(item.expectedWeight * 100),
    }));
  }, [liveEvaluation]);

  const handleRatingChange = (key: CompetencyKey, cefr: CefrLevelCode) => {
    if (!canEdit) return;
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], cefr } }));
  };

  const handleEvidenceChange = (key: CompetencyKey, evidence: string) => {
    if (!canEdit) return;
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], evidence } }));
  };

  const handleAddEvidenceTag = (key: CompetencyKey, tag: string) => {
    if (!canEdit) return;
    const cleanTag = tag.replace(/^\+\s*/, '');
    const current = ratings[key]?.evidence || '';

    if (current.includes(cleanTag)) {
      const updated = current
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== cleanTag)
        .join(', ');
      handleEvidenceChange(key, updated);
    } else {
      const updated = current ? `${current}, ${cleanTag}` : cleanTag;
      handleEvidenceChange(key, updated);
    }
    setExpandedEvidence((prev) => ({ ...prev, [key]: true }));
  };

  const toggleEvidence = (key: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetToBenchmark = () => {
    if (!canEdit) return;
    const competencies: CompetencyKey[] = ['written_clarity', 'spoken_fluency', 'presentation', 'active_listening', 'stakeholder_exec', 'cross_cultural'];
    const benchmarkDefault: Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }> = {} as any;
    competencies.forEach((key) => {
      const benchmark = config?.targetOverrides?.[orgLevelKey]?.[key] ?? config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ?? 'B2';
      benchmarkDefault[key] = { cefr: benchmark as CefrLevelCode, evidence: ratings[key]?.evidence || '' };
    });
    setRatings(benchmarkDefault);
    toast.info('Ratings aligned to role benchmark baseline.', 'Benchmark Baseline');
  };

  const handleSubmit = async (targetStatus: 'draft' | 'pending' | 'approved') => {
    if (!canEdit) return;
    try {
      const formattedRatings: RatingInput[] = Object.entries(ratings).map(([key, val]) => ({
        competency_key: key as CompetencyKey,
        cefr: val.cefr,
        evidence: val.evidence?.trim() || null,
      }));
      await createMutation.mutateAsync({ employee_id: employeeId, org_level_key: orgLevelKey, status: targetStatus, ratings: formattedRatings });
      await refetchLatest();
      setInitialRatingsString(JSON.stringify(ratings));
      toast.success(targetStatus === 'approved' ? `Evaluation saved by ${reviewerTitle}!` : 'Assessment saved as draft.', 'Saved');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Save Failed');
    }
  };

  const allCompetencies = [
    { key: 'written_clarity' as CompetencyKey, name: 'Written Clarity & Documentation', categoryName: 'CORE LANGUAGE', description: 'Technical design specs, RFCs, PR descriptions, and incident postmortems.' },
    { key: 'spoken_fluency' as CompetencyKey, name: 'Spoken Fluency & Meeting Presence', categoryName: 'CORE LANGUAGE', description: 'Standup cadence, synchronous debate, and technical clarification.' },
    { key: 'active_listening' as CompetencyKey, name: 'Active Listening & Feedback Reception', categoryName: 'CORE LANGUAGE', description: 'Code review discussions, 1-on-1s, and requirement discovery.' },
    { key: 'presentation' as CompetencyKey, name: 'Technical Presentation & Demos', categoryName: 'PROFESSIONAL IMPACT', description: 'Sprint reviews, architecture walkthroughs, and client demonstrations.' },
    { key: 'stakeholder_exec' as CompetencyKey, name: 'Stakeholder & Executive Alignment', categoryName: 'PROFESSIONAL IMPACT', description: 'Translating engineering concerns into business impact and trade-offs.' },
    { key: 'cross_cultural' as CompetencyKey, name: 'Cross-Cultural & Global Collaboration', categoryName: 'PROFESSIONAL IMPACT', description: 'Asynchronous handoffs across timezones and inclusive language.' },
  ];

  if (isConfigLoading || isAssessmentLoading) {
    return <div className="card p-8 text-center animate-pulse space-y-4"><div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto"></div><div className="h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div></div>;
  }

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="card p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-3 shadow-2xs">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span>🔒 Read-only view. CEFR communication assessments are evaluated by your {reviewerTitle}.</span>
        </div>
      )}

      {/* Main Score Summary Header */}
      <div className="card p-6 space-y-6 bg-gradient-to-br from-white via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{employeeName}</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">ID: {employeeId}</span>
              {currentGradeCode && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Grade: {currentGradeCode} {currentGradeTitle ? `(${currentGradeTitle})` : ''}</span>}
              {latestAssessment?.status && (
                <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${latestAssessment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'}`}>Status: {latestAssessment.status}</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Target Level: <span className="font-bold text-zinc-800 dark:text-zinc-200">{orgLevelKey.toUpperCase()}</span> — Role Benchmark: <span className="font-bold text-amber-600 dark:text-amber-400">{liveEvaluation?.orgBenchmark}</span> • <span className="text-zinc-500 italic">Reviewer Mode: {reviewerTitle}</span></p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-300/50 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutGrid size={13} /> 3-Col Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <List size={13} /> Stacked
              </button>
            </div>

            {history.length > 0 && <button type="button" onClick={() => setShowHistory(!showHistory)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-colors"><History size={14} />{showHistory ? 'Hide History' : `History (${history.length})`}</button>}
            {canEdit && <button type="button" onClick={handleResetToBenchmark} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"><Sparkles size={14} /> Match Baseline</button>}
          </div>
        </div>

        {liveEvaluation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">
                  <span className="flex items-center gap-1.5"><Target size={14} className="text-indigo-600 dark:text-indigo-400" /> CEFR Proficiency Ladder</span>
                  <span className="text-[11px] font-normal text-zinc-500">Benchmark: <strong className="text-amber-600 dark:text-amber-400">{liveEvaluation.orgBenchmark}</strong></span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {CEFR_LEVELS.map((lvl) => {
                    const isEvaluated = liveEvaluation.band === lvl;
                    const isBenchmark = liveEvaluation.orgBenchmark === lvl;
                    return (
                      <div key={lvl} className={`relative text-center p-2.5 rounded-xl border transition-all ${isEvaluated ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/50 shadow-md transform scale-[1.03]' : isBenchmark ? 'bg-amber-500/10 border-amber-400 text-amber-900 dark:text-amber-200' : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 opacity-80'}`}>
                        {isBenchmark && <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow-sm" title="Role Required Benchmark"><Star size={10} fill="currentColor" /></div>}
                        <div className="text-sm font-black">{lvl}</div>
                        <div className="text-[9px] font-bold opacity-80 uppercase mt-0.5">{LEVEL_WEIGHTS[lvl].toFixed(2)}</div>
                        {isEvaluated && <div className="text-[9px] font-bold text-white uppercase mt-1">Evaluated</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Evaluated Band</div>
                  <div className="flex items-center gap-1.5 mt-1"><CefrLevelBadge level={liveEvaluation.band} size="md" /></div>
                  <div className="text-[11px] text-zinc-500 mt-1">Weight: <strong className="text-zinc-800 dark:text-zinc-200">{liveEvaluation.averageWeight.toFixed(2)}</strong></div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Role Benchmark</div>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">{liveEvaluation.orgBenchmark}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">Target: <strong className="text-zinc-800 dark:text-zinc-200">{liveEvaluation.orgExpectedScore.toFixed(2)}</strong></div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Benchmark Gap</div>
                  <div className={`text-base font-black mt-1 ${liveEvaluation.overallGap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {liveEvaluation.overallGap >= 0 ? `+${liveEvaluation.overallGap.toFixed(2)}` : liveEvaluation.overallGap.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-semibold uppercase text-zinc-500 mt-1">{liveEvaluation.overallStatus}</div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Readiness</div>
                  <div className="mt-1">
                    {liveEvaluation.isReady ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"><CheckCircle2 size={12} /> READY</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"><AlertTriangle size={12} /> GATED</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 truncate">{liveEvaluation.isGated ? 'Active Gating' : 'Dev Tracking'}</div>
                </div>
              </div>

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

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 min-h-[280px]">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 self-start px-2 mb-1">Communication Competencies Radar</div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.text, fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle(chartColors)} formatter={(val: any, name: any) => [`${val}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Radar name="Assessed Level" dataKey="assessed" stroke="rgb(99, 102, 241)" fill="rgb(99, 102, 241)" fillOpacity={0.4} />
                    <Radar name="Role Benchmark" dataKey="benchmark" stroke="rgb(245, 158, 11)" fill="rgb(245, 158, 11)" fillOpacity={0.15} strokeDasharray="4 4" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assessment History Drawer */}
      {showHistory && (
        <div className="card p-5 space-y-3 bg-zinc-50/80 dark:bg-zinc-900/80 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <History size={15} /> Assessment History Timeline ({history.length})
            </h4>
            <button type="button" onClick={() => setShowHistory(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Close</button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
                <div className="flex items-center gap-3">
                  <CefrLevelBadge level={h.evaluation.overallCefr} size="sm" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{new Date(h.assessed_at).toLocaleDateString()}</span>
                    <span className="text-zinc-400 ml-2">by {h.assessor_name || reviewerTitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">Score: {h.evaluation.overallScore.toFixed(2)}</span>
                  <span className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[10px] border ${h.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competencies Section: Responsive Grid View vs Stacked View */}
      <div className="space-y-4">
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start w-full overflow-x-hidden'
              : 'space-y-4.5'
          }
        >
          {allCompetencies.map((comp) => {
            const currentRating = ratings[comp.key]?.cefr || 'B1';
            const expected = config?.targetOverrides?.[orgLevelKey]?.[comp.key] ?? config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ?? 'B2';
            const givenWeight = LEVEL_WEIGHTS[currentRating] || 0.5;
            const expectedWeight = LEVEL_WEIGHTS[expected as CefrLevelCode] || 0.67;
            const gap = Number((givenWeight - expectedWeight).toFixed(2));
            const status = gap >= 0.001 ? 'ABOVE' : gap <= -0.001 ? 'BELOW' : 'MEETS';
            const isExpanded = expandedEvidence[comp.key];
            const specificRubric = COMPETENCY_RUBRICS[comp.key]?.[currentRating] || CEFR_DESCRIPTORS[currentRating];

            return (
              <div key={comp.key} className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs space-y-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all h-full flex flex-col justify-between min-w-0">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-950 dark:text-zinc-50 leading-tight">{COMPETENCY_TITLES[comp.key] || comp.name}</h4>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                        {comp.categoryName}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug font-medium">{comp.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star size={9} className="fill-amber-500 text-amber-500" /> Req: {expected} ({expectedWeight.toFixed(2)})
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${status === 'MEETS' ? 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30' : status === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 border-rose-500/30'}`}>
                      {status === 'ABOVE' ? <TrendingUp size={10} /> : status === 'BELOW' ? <TrendingDown size={10} /> : <Check size={10} />}
                      {status} ({gap >= 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2)})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-1">
                      {CEFR_LEVELS.map((lvl) => {
                        const isSelected = currentRating === lvl;
                        const isTarget = expected === lvl;
                        const lvlWeight = LEVEL_WEIGHTS[lvl];

                        let btnStyle = 'bg-zinc-100/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200';

                        if (isSelected) {
                          if (status === 'ABOVE') {
                            btnStyle = 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/60 shadow-md font-black';
                          } else if (status === 'BELOW') {
                            btnStyle = 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/60 shadow-md font-black';
                          } else {
                            btnStyle = 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/60 shadow-md font-black';
                          }
                        } else if (isTarget) {
                          btnStyle = 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/80 text-amber-900 dark:text-amber-200 font-bold hover:bg-amber-100';
                        }

                        return (
                          <button key={lvl} type="button" disabled={!canEdit} onClick={() => handleRatingChange(comp.key, lvl)} className={`py-1.5 px-0.5 text-center rounded-xl border transition-all text-[11px] ${btnStyle} ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}>
                            <div className="font-black">{lvl}</div>
                            <div className="text-[8px] opacity-75 font-mono">{lvlWeight.toFixed(2)}</div>
                            {isSelected ? (
                              <div className="text-[7px] font-black uppercase tracking-tighter mt-0.5 text-white/90 truncate">✓ Set</div>
                            ) : isTarget ? (
                              <div className="text-[7px] font-black text-amber-600 dark:text-amber-400 mt-0.5 truncate">★ Req</div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1 border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5 text-[9px] font-bold">
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5"><Star size={9} className="fill-amber-500" /> Req: {expected} ({expectedWeight.toFixed(2)})</span>
                        <span className={status === 'ABOVE' ? 'text-emerald-700 dark:text-emerald-400' : status === 'BELOW' ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-700 dark:text-indigo-400'}>Set: {currentRating} ({givenWeight.toFixed(2)})</span>
                      </div>
                      <div className="flex items-start gap-2 pt-0.5">
                        <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-indigo-600 text-white shrink-0">{currentRating}</span>
                        <p className="text-[10.5px] text-zinc-800 dark:text-zinc-200 italic leading-snug font-medium">{specificRubric}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Evidence Notes</span>
                    {canEdit && (
                      <button type="button" onClick={() => toggleEvidence(comp.key)} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isExpanded ? 'Hide Notes' : '+ Notes'}
                      </button>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex flex-wrap gap-1">
                      {EVIDENCE_TAGS[comp.key]?.map((tag) => {
                        const cleanTag = tag.replace(/^\+\s*/, '');
                        const isTagSelected = (ratings[comp.key]?.evidence || '').includes(cleanTag);
                        return (
                          <button key={tag} type="button" onClick={() => handleAddEvidenceTag(comp.key, tag)} className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${isTagSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50'}`}>
                            {isTagSelected ? <Check size={10} /> : null}
                            {isTagSelected ? cleanTag : tag}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {canEdit && isExpanded && (
                    <textarea value={ratings[comp.key]?.evidence || ''} onChange={(e) => handleEvidenceChange(comp.key, e.target.value)} placeholder="Add specific RFCs, meeting examples, demos..." rows={2} className="w-full mt-1.5 text-xs p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                  )}

                  {!canEdit && (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 font-medium">
                      {ratings[comp.key]?.evidence ? <span>{ratings[comp.key].evidence}</span> : <span className="text-zinc-400 italic">No {reviewerTitle} evidence notes recorded.</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Action Bar (Reviewers only) */}
      {canEdit && (
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 shadow-2xl z-30 border-indigo-500/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div>Overall Level: <strong className="text-zinc-900 dark:text-zinc-100">{liveEvaluation?.band} ({liveEvaluation?.averageWeight.toFixed(2)})</strong></div>
            <span className="text-zinc-300">•</span>
            <div>Role Req: <strong className="text-indigo-600 dark:text-indigo-400">{liveEvaluation?.orgBenchmark}</strong></div>
            {hasUnsavedChanges && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Unsaved Changes</span>}
          </div>

          <div className="flex items-center gap-2.5">
            <button type="button" disabled={createMutation.isPending} onClick={() => handleSubmit('draft')} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50"><Save size={14} /> Save Draft</button>
            <button type="button" disabled={createMutation.isPending} onClick={() => handleSubmit('approved')} className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all disabled:opacity-50"><CheckCircle2 size={14} /> {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
