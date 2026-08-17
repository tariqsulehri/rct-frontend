import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Save,
  History,
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
import { toast } from '@/lib/toast';
import { CefrLevelBadge } from './CefrLevelBadge';
import { ProficiencyLadder, LadderStep } from '@/components/ui/assessment/ProficiencyLadder';
import { MetricKpiCard } from '@/components/ui/assessment/MetricKpiCard';
import { LevelSelectorBar, LevelOption } from '@/components/ui/assessment/LevelSelectorBar';
import { AssessmentHeroLayout, AssessmentRadarItem } from '@/components/ui/assessment/AssessmentHeroLayout';

const CEFR_STEPS: LadderStep[] = [
  { code: 'A1', weightDec: '0.17', weightNum: 17 },
  { code: 'A2', weightDec: '0.33', weightNum: 33 },
  { code: 'B1', weightDec: '0.50', weightNum: 50 },
  { code: 'B2', weightDec: '0.67', weightNum: 67 },
  { code: 'C1', weightDec: '0.83', weightNum: 83 },
  { code: 'C2', weightDec: '1.00', weightNum: 100 },
];

const CEFR_LEVEL_OPTIONS: LevelOption[] = [
  { code: 'A1', weightDec: '0.17', weightNum: 17 },
  { code: 'A2', weightDec: '0.33', weightNum: 33 },
  { code: 'B1', weightDec: '0.50', weightNum: 50 },
  { code: 'B2', weightDec: '0.67', weightNum: 67 },
  { code: 'C1', weightDec: '0.83', weightNum: 83 },
  { code: 'C2', weightDec: '1.00', weightNum: 100 },
];

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

  const radarChartData: AssessmentRadarItem[] = useMemo(() => {
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
      competency: shortNames[item.key] || item.key,
      fullName: COMPETENCY_TITLES[item.key] || item.key,
      Assessed: Math.round(item.givenWeight * 100),
      Target: Math.round(item.expectedWeight * 100),
    }));
  }, [liveEvaluation]);

  const handleRatingChange = (key: CompetencyKey, cefr: string) => {
    if (!canEdit) return;
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], cefr: cefr as CefrLevelCode } }));
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
    return (
      <div className="p-8 text-center rounded-2xl border shadow-card space-y-4"
           style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
        <div className="w-8 h-8 mx-auto border-3 border-t-transparent rounded-full animate-spin mb-3"
             style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
        <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-2))' }}>Loading CEFR Communication Framework...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="p-4 rounded-2xl border flex items-center gap-3 shadow-card"
             style={{
               backgroundColor: 'rgb(var(--warning-soft))',
               borderColor: 'rgb(var(--warning) / 0.3)',
               color: 'rgb(var(--warning))',
             }}>
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-xs font-semibold">🔒 Read-only view. CEFR communication assessments are evaluated by your Line Manager or Authorized Evaluator.</span>
        </div>
      )}

      {/* Main Score Summary Header */}
      <div className="p-6 space-y-6 rounded-2xl border shadow-card transition-all"
           style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4"
             style={{ borderColor: 'rgb(var(--border))' }}>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-black" style={{ color: 'rgb(var(--text-1))' }}>{employeeName}</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'rgb(var(--accent-soft))',
                      color: 'rgb(var(--accent-txt))',
                      borderColor: 'rgb(var(--accent) / 0.3)',
                    }}>
                ID: {employeeId}
              </span>
              {currentGradeCode && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--surface-2))',
                        borderColor: 'rgb(var(--border))',
                        color: 'rgb(var(--text-2))',
                      }}>
                  Grade: {currentGradeCode} {currentGradeTitle ? `(${currentGradeTitle})` : ''}
                </span>
              )}
              {latestAssessment?.status && (
                <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  latestAssessment.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                }`}>
                  Status: {latestAssessment.status}
                </span>
              )}
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-2))' }}>
              Target Level: <span className="font-bold" style={{ color: 'rgb(var(--text-1))' }}>{orgLevelKey.toUpperCase()}</span> — Role Benchmark:{' '}
              <span className="font-bold font-mono" style={{ color: 'rgb(var(--warning))' }}>{liveEvaluation?.orgBenchmark}</span> •{' '}
              <span className="italic" style={{ color: 'rgb(var(--text-3))' }}>{canEdit ? `Reviewer Mode: ${reviewerTitle}` : `Evaluated by: ${latestAssessment?.assessor_name || 'Line Manager / Authorized Evaluator'}`}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl border"
                 style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? 'rgb(var(--surface))' : 'transparent',
                  color: viewMode === 'grid' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                }}
              >
                <LayoutGrid size={13} /> 3-Col Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'rgb(var(--surface))' : 'transparent',
                  color: viewMode === 'list' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                }}
              >
                <List size={13} /> Stacked
              </button>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'rgb(var(--surface))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-2))',
                }}
              >
                <History size={14} />
                {showHistory ? 'Hide History' : `History (${history.length})`}
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={handleResetToBenchmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer hover:brightness-105"
                style={{
                  backgroundColor: 'rgb(var(--accent-soft))',
                  color: 'rgb(var(--accent-txt))',
                  borderColor: 'rgb(var(--accent) / 0.3)',
                }}
              >
                <Sparkles size={14} /> Match Baseline
              </button>
            )}
          </div>
        </div>

        {/* Top Action Bar (Reviewers only) */}
        {canEdit && (
          <div className="p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border rounded-2xl shadow-card transition-all"
               style={{
                 backgroundColor: 'rgb(var(--accent-soft) / 0.25)',
                 borderColor: 'rgb(var(--accent) / 0.3)',
               }}>
            <div className="flex items-center gap-3 text-xs flex-wrap font-medium"
                 style={{ color: 'rgb(var(--text-2))' }}>
              <div>
                Overall Level: <strong className="font-extrabold font-mono" style={{ color: 'rgb(var(--text-1))' }}>
                  {liveEvaluation?.band} ({liveEvaluation?.averageWeight.toFixed(2)})
                </strong>
              </div>
              <span style={{ color: 'rgb(var(--border-2))' }}>•</span>
              <div>
                Role Benchmark Req: <strong className="font-extrabold font-mono" style={{ color: 'rgb(var(--warning))' }}>
                  {liveEvaluation?.orgBenchmark}
                </strong>
              </div>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--warning-soft))',
                        color: 'rgb(var(--warning))',
                        borderColor: 'rgb(var(--warning) / 0.3)',
                      }}>
                  Unsaved Changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit('draft')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-colors disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: 'rgb(var(--surface))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-2))',
                }}
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit('approved')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:brightness-110"
                style={{ backgroundColor: 'rgb(var(--success))' }}
              >
                <CheckCircle2 size={14} /> {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}
              </button>
            </div>
          </div>
        )}

        {/* ── UNIFIED HERO SECTION: Consumes AssessmentHeroLayout Primitive ── */}
        {liveEvaluation && (
          <AssessmentHeroLayout
            ladderComponent={
              <ProficiencyLadder
                title="CEFR Proficiency Ladder"
                icon="target"
                steps={CEFR_STEPS}
                evaluatedCode={liveEvaluation.band}
                benchmarkCode={liveEvaluation.orgBenchmark}
                benchmarkSubtext={liveEvaluation.orgExpectedScore.toFixed(2)}
                gap={liveEvaluation.overallGap}
              />
            }
            metricCards={
              <>
                {/* Card 1: EVALUATED BAND */}
                <MetricKpiCard
                  label="EVALUATED BAND"
                  badgeContent={<CefrLevelBadge level={liveEvaluation.band} size="md" />}
                  subtext="Weight"
                  subtextValue={liveEvaluation.averageWeight.toFixed(2)}
                />

                {/* Card 2: ROLE BENCHMARK */}
                <MetricKpiCard
                  label="ROLE BENCHMARK"
                  primaryValue={liveEvaluation.orgBenchmark}
                  statusType="warning"
                  subtext="Target"
                  subtextValue={liveEvaluation.orgExpectedScore.toFixed(2)}
                />

                {/* Card 3: BENCHMARK GAP */}
                <MetricKpiCard
                  label="BENCHMARK GAP"
                  primaryValue={
                    liveEvaluation.overallGap > 0
                      ? `+${liveEvaluation.overallGap.toFixed(2)}`
                      : `${liveEvaluation.overallGap.toFixed(2)}`
                  }
                  statusType={liveEvaluation.overallGap >= 0 ? 'success' : 'danger'}
                  statusText={liveEvaluation.overallStatus}
                />

                {/* Card 4: READINESS */}
                <MetricKpiCard
                  label="READINESS"
                  badgeContent={
                    liveEvaluation.isReady ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'rgb(var(--success-soft))',
                          color: 'rgb(var(--success))',
                          borderColor: 'rgb(var(--success) / 0.3)',
                        }}
                      >
                        <CheckCircle2 size={12} />
                        READY
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'rgb(var(--danger-soft))',
                          color: 'rgb(var(--danger))',
                          borderColor: 'rgb(var(--danger) / 0.3)',
                        }}
                      >
                        <AlertTriangle size={12} />
                        GATED
                      </span>
                    )
                  }
                  subtext="Status"
                  subtextValue={liveEvaluation.isGated ? 'Active Gating' : 'Dev Tracking'}
                />
              </>
            }
            priorities={liveEvaluation.priorities.map((p) => p.replace(/_/g, ' '))}
            radarData={radarChartData}
            radarTitle="Communication Competencies Radar"
            radarUnit="Proficiency (0-100)"
          />
        )}

      </div>

      {/* Assessment History Drawer */}
      {showHistory && (
        <div className="p-5 space-y-3 rounded-2xl border shadow-card"
             style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: 'rgb(var(--text-1))' }}>
              <History size={15} /> Assessment History Timeline ({history.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-xs cursor-pointer hover:underline"
              style={{ color: 'rgb(var(--text-3))' }}
            >
              Close
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map((h) => {
              const cefrLevel = h.evaluation?.overallCefr || h.overallCefr || 'B1';
              const scoreNum =
                h.evaluation?.overallScore ??
                h.evaluation?.overallWeight ??
                (typeof h.overallGap === 'number' ? 1 - Math.abs(h.overallGap) : null);

              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl border text-xs"
                  style={{
                    backgroundColor: 'rgb(var(--surface-2))',
                    borderColor: 'rgb(var(--border))',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CefrLevelBadge level={cefrLevel} size="sm" />
                    <div>
                      <span className="font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                        {new Date(h.assessed_at).toLocaleDateString()}
                      </span>
                      <span className="ml-2" style={{ color: 'rgb(var(--text-3))' }}>
                        by {h.assessor_name || (canEdit ? reviewerTitle : 'Line Manager / Authorized Evaluator')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {scoreNum !== null && scoreNum !== undefined && (
                      <span className="font-mono font-bold" style={{ color: 'rgb(var(--text-2))' }}>
                        Score: {Number(scoreNum).toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[10px] border ${
                        h.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Competencies Section: Responsive Grid View vs Stacked View */}
      <div className="space-y-4">
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start w-full'
              : 'space-y-4'
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
              <div
                key={comp.key}
                className="p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 h-full shadow-card hover:border-zinc-400 dark:hover:border-zinc-600"
                style={{
                  backgroundColor: 'rgb(var(--surface))',
                  borderColor: 'rgb(var(--border))',
                }}
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-black" style={{ color: 'rgb(var(--text-1))' }}>
                        {COMPETENCY_TITLES[comp.key] || comp.name}
                      </h4>
                      <span
                        className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border"
                        style={{
                          backgroundColor: 'rgb(var(--accent-soft))',
                          color: 'rgb(var(--accent-txt))',
                          borderColor: 'rgb(var(--accent) / 0.3)',
                        }}
                      >
                        {comp.categoryName}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-normal" style={{ color: 'rgb(var(--text-2))' }}>
                      {comp.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2 pt-1">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                      style={{
                        backgroundColor: 'rgb(var(--warning-soft))',
                        color: 'rgb(var(--warning))',
                        borderColor: 'rgb(var(--warning) / 0.3)',
                      }}
                    >
                      ⭐ Req: {expected} ({expectedWeight.toFixed(2)})
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                      style={{
                        backgroundColor:
                          status === 'MEETS'
                            ? 'rgb(var(--accent-soft))'
                            : status === 'ABOVE'
                            ? 'rgb(var(--success-soft))'
                            : 'rgb(var(--danger-soft))',
                        color:
                          status === 'MEETS'
                            ? 'rgb(var(--accent-txt))'
                            : status === 'ABOVE'
                            ? 'rgb(var(--success))'
                            : 'rgb(var(--danger))',
                        borderColor:
                          status === 'MEETS'
                            ? 'rgb(var(--accent) / 0.3)'
                            : status === 'ABOVE'
                            ? 'rgb(var(--success) / 0.3)'
                            : 'rgb(var(--danger) / 0.3)',
                      }}
                    >
                      {status === 'ABOVE' ? <TrendingUp size={11} /> : status === 'BELOW' ? <TrendingDown size={11} /> : <Check size={11} />}
                      {status} ({gap >= 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2)})
                    </span>
                  </div>

                  {/* LevelSelectorBar Component */}
                  <LevelSelectorBar
                    levels={CEFR_LEVEL_OPTIONS}
                    selectedCode={currentRating}
                    expectedCode={expected}
                    disabled={!canEdit}
                    onSelectLevel={(lvl) => handleRatingChange(comp.key, lvl)}
                  />

                  {/* Active Level Summary Box */}
                  <div
                    className="p-3 rounded-xl border text-xs space-y-1.5"
                    style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="flex items-center gap-1 font-mono" style={{ color: 'rgb(var(--warning))' }}>
                        Req: {expected} ({expectedWeight.toFixed(2)})
                      </span>
                      <span
                        className="font-mono font-bold"
                        style={{
                          color:
                            status === 'ABOVE'
                              ? 'rgb(var(--success))'
                              : status === 'BELOW'
                              ? 'rgb(var(--danger))'
                              : 'rgb(var(--accent-txt))',
                        }}
                      >
                        Set: {currentRating} ({givenWeight.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0"
                        style={{ backgroundColor: 'rgb(var(--accent))' }}
                      >
                        {currentRating}
                      </span>
                      <p className="italic text-[11px] leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                        "{specificRubric}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence Notes & Quick Tags */}
                <div className="pt-2.5 border-t space-y-2" style={{ borderColor: 'rgb(var(--border))' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'rgb(var(--text-3))' }}>
                      EVIDENCE NOTES
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleEvidence(comp.key)}
                      className="text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                      style={{ color: 'rgb(var(--accent-txt))' }}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? 'Hide Notes' : '+ Notes'}
                    </button>
                  </div>

                  {canEdit && (
                    <div className="flex flex-wrap gap-1">
                      {EVIDENCE_TAGS[comp.key]?.map((tag) => {
                        const cleanTag = tag.replace(/^\+\s*/, '');
                        const isSelected = (ratings[comp.key]?.evidence || '').includes(cleanTag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddEvidenceTag(comp.key, tag)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer"
                            style={{
                              backgroundColor: isSelected ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
                              color: isSelected ? '#ffffff' : 'rgb(var(--text-2))',
                              borderColor: isSelected ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                            }}
                          >
                            {isSelected ? <Check size={10} /> : null}
                            {isSelected ? cleanTag : tag}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {canEdit && isExpanded && (
                    <textarea
                      value={ratings[comp.key]?.evidence || ''}
                      onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                      placeholder="Add specific STAR evidence, RFC links, demo feedback..."
                      rows={2}
                      className="w-full mt-1.5 text-xs p-2 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgb(var(--surface-3))',
                        borderColor: 'rgb(var(--border-2))',
                        color: 'rgb(var(--text-1))',
                      }}
                    />
                  )}

                  {!canEdit && (
                    <div
                      className="text-xs p-2.5 rounded-xl border font-medium"
                      style={{
                        backgroundColor: 'rgb(var(--surface-2))',
                        borderColor: 'rgb(var(--border))',
                        color: 'rgb(var(--text-2))',
                      }}
                    >
                      {ratings[comp.key]?.evidence ? (
                        <span>{ratings[comp.key].evidence}</span>
                      ) : (
                        <span className="italic" style={{ color: 'rgb(var(--text-3))' }}>No evidence notes recorded.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
