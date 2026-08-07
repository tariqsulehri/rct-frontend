import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Award,
  Check,
  Star,
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
  FormattedCommAssessment,
} from '@/types/communication';
import {
  useCommConfig,
  useLatestCommAssessment,
  useCreateCommAssessment,
} from '@/hooks/useCommunication';
import { useAuthStore } from '@/store/authStore';
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
  A1: 'Can understand basic phrases and introduce themselves in simple terms.',
  A2: 'Can communicate in routine tasks and describe immediate environment in simple language.',
  B1: 'Can understand main points of standard input and produce simple connected text on familiar topics.',
  B2: 'Can interact with spontaneity, explain complex viewpoints, and write clear, detailed technical text.',
  C1: 'Can express ideas fluently, use language flexibly for social/professional tasks, and write structured complex reports.',
  C2: 'Can understand virtually everything with ease, express spontaneously and precisely, and lead executive discourse.',
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

const EVIDENCE_TAGS: Record<string, string[]> = {
  written_clarity: ['+ RFC / Tech Spec', '+ Postmortem', '+ PR Description', '+ Architecture Doc'],
  spoken_fluency: ['+ Standup Lead', '+ Technical Debate', '+ Sprint Planning', '+ Incident Call Lead'],
  presentation: ['+ Demo to Client', '+ Architecture Review', '+ All-Hands Talk', '+ Lunch & Learn'],
  active_listening: ['+ 1-on-1 Feedback', '+ PR Review Discussions', '+ Mentee Guidance', '+ Discovery'],
  stakeholder_exec: ['+ Product Exec Demo', '+ Roadmap Tradeoff', '+ Business Impact Case', '+ Escalation Lead'],
  cross_cultural: ['+ Async APAC Handoff', '+ Inclusive Tech Writing', '+ Cross-Timezone Sync', '+ Global Slack'],
};

const getCategoryLabel = (category?: string, compKey?: string): string => {
  if (category && category !== 'core_language' && category !== 'professional_application') {
    return category.replace(/_/g, ' ').toUpperCase();
  }
  if (compKey && ['presentation', 'stakeholder_exec', 'cross_cultural'].includes(compKey)) {
    return 'PROFESSIONAL IMPACT';
  }
  return 'CORE LANGUAGE';
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

export interface CefrAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  currentGradeLevel?: number;
  existingAssessment?: FormattedCommAssessment | null;
}

export const CefrAssessmentModal: React.FC<CefrAssessmentModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  currentGradeLevel = 3,
  existingAssessment,
}) => {
  const { user } = useAuthStore();
  const { data: config } = useCommConfig();
  const { data: fetchedLatest } = useLatestCommAssessment(isOpen ? employeeId : '');
  const createMutation = useCreateCommAssessment();

  const activeAssessment = existingAssessment || fetchedLatest;
  const reviewerTitle = getReviewerRoleLabel(user?.role);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const [ratings, setRatings] = useState<Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }>>({} as any);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
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
      const existingRating = activeAssessment?.ratings?.find((r) => r.competency_key === key);
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
  }, [isOpen, employeeId, activeAssessment, config, orgLevelKey]);

  const livePreview = useMemo(() => {
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
      };
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

    return {
      averageWeight,
      band,
      orgBenchmark,
      overallGap,
      overallStatus,
      isGated,
      isReady,
      breakdown,
    };
  }, [ratings, config, orgLevelKey, currentGradeLevel]);

  if (!isOpen) return null;

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

      toast.success(
        targetStatus === 'approved'
          ? `CEFR Evaluation approved and saved by ${reviewerTitle}!`
          : 'Assessment saved as draft.',
        'Evaluation Saved'
      );
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Evaluation Failed');
    }
  };

  const competenciesList = config?.competencies || [
    { key: 'written_clarity', name: 'Written Clarity & Documentation', category: 'core_language', description: 'Technical design specs, RFCs, PR descriptions, and incident postmortems.' },
    { key: 'spoken_fluency', name: 'Spoken Fluency & Meeting Presence', category: 'core_language', description: 'Standup cadence, synchronous debate, and technical clarification.' },
    { key: 'presentation', name: 'Technical Presentation & Demos', category: 'professional_application', description: 'Sprint reviews, architecture walkthroughs, and client demonstrations.' },
    { key: 'active_listening', name: 'Active Listening & Feedback Reception', category: 'core_language', description: 'Code review discussions, 1-on-1s, and requirement discovery.' },
    { key: 'stakeholder_exec', name: 'Stakeholder & Executive Alignment', category: 'professional_application', description: 'Translating engineering concerns into business impact and trade-offs.' },
    { key: 'cross_cultural', name: 'Cross-Cultural & Global Collaboration', category: 'professional_application', description: 'Asynchronous handoffs across timezones and inclusive language.' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col w-screen h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/90 flex-wrap gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                CEFR Communication Evaluation
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                  ID: {employeeId}
                </span>
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                Evaluating <span className="font-bold text-zinc-900 dark:text-zinc-100">{employeeName}</span> ({orgLevelKey.toUpperCase()} — Benchmark: <span className="font-bold text-amber-600 dark:text-amber-400">{livePreview?.orgBenchmark}</span>) • <span className="text-zinc-500 italic">Reviewer: {reviewerTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Calculation Banner - 4 Executive Metric Cards */}
        {livePreview && (
          <div className="px-6 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center shrink-0">
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Evaluated Level
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CefrLevelBadge level={livePreview.band} size="md" showLabel />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Score vs Benchmark
              </div>
              <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {livePreview.averageWeight.toFixed(2)}{' '}
                <span className="text-xs font-semibold text-zinc-500">
                  (Req: {livePreview.orgBenchmark} / 0.67)
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Overall Gap
              </div>
              <div
                className={`text-sm font-black mt-0.5 ${
                  livePreview.overallGap >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {livePreview.overallGap >= 0 ? `+${livePreview.overallGap.toFixed(2)}` : livePreview.overallGap.toFixed(2)}{' '}
                <span className="text-xs font-bold opacity-80">({livePreview.overallStatus})</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Readiness Status
              </div>
              <div className="mt-0.5">
                {livePreview.isReady ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} /> READY
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                    <AlertTriangle size={12} /> NOT READY (GATED)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Responsive Grid View vs Stacked View */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-5 w-full max-w-full overflow-x-hidden ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start'
              : 'space-y-4.5'
          }`}
        >
          {competenciesList.map((comp) => {
            const currentRating = ratings[comp.key as CompetencyKey]?.cefr || 'B1';
            const expected =
              config?.targetOverrides?.[orgLevelKey]?.[comp.key as CompetencyKey] ??
              config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
              'B2';
            const givenWeight = LEVEL_WEIGHTS[currentRating] || 0.5;
            const expectedWeight = LEVEL_WEIGHTS[expected as CefrLevelCode] || 0.67;
            const gap = Number((givenWeight - expectedWeight).toFixed(2));
            const status = gap >= 0.001 ? 'ABOVE' : gap <= -0.001 ? 'BELOW' : 'MEETS';
            const isExpanded = expandedEvidence[comp.key];

            const categoryName = getCategoryLabel(comp.category, comp.key);
            const specificRubric =
              COMPETENCY_RUBRICS[comp.key]?.[currentRating] ||
              CEFR_DESCRIPTORS[currentRating];

            return (
              <div
                key={comp.key}
                className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs space-y-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all h-full flex flex-col justify-between min-w-0 overflow-hidden"
              >
                <div className="space-y-2.5">
                  {/* Competency Title & Domain Category */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-zinc-950 dark:text-zinc-50 leading-tight flex-1 min-w-0">
                        {COMPETENCY_TITLES[comp.key] || comp.name}
                      </h3>
                      <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                        {categoryName}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 font-medium leading-snug">
                      {comp.description}
                    </p>
                  </div>

                  {/* Target Benchmark vs Evaluator Chip Header */}
                  <div className="flex items-center justify-between gap-1 flex-wrap text-[9.5px]">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star size={8} className="fill-amber-500 text-amber-500" /> Req: {expected} ({expectedWeight.toFixed(2)})
                    </span>
                    <span
                      className={`font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        status === 'MEETS'
                          ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                          : status === 'ABOVE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {status === 'ABOVE' ? (
                        <TrendingUp size={9} />
                      ) : status === 'BELOW' ? (
                        <TrendingDown size={9} />
                      ) : (
                        <Check size={9} />
                      )}
                      Evaluated: {currentRating} ({gap >= 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2)})
                    </span>
                  </div>

                  {/* Level Pill Selectors */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-6 gap-0.5 sm:gap-1 w-full">
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
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleRatingChange(comp.key as CompetencyKey, lvl)}
                            className={`py-1 px-0.5 text-center rounded-lg border transition-all text-[10px] w-full ${btnStyle}`}
                          >
                            <div className="font-black leading-none">{lvl}</div>
                            <div className="text-[7.5px] opacity-75 font-mono leading-none mt-0.5">{lvlWeight.toFixed(2)}</div>
                            {isSelected ? (
                              <div className="text-[7px] font-black uppercase tracking-tighter mt-0.5 text-white/90 truncate">
                                ✓ Set
                              </div>
                            ) : isTarget ? (
                              <div className="text-[7px] font-black text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                                ★ Req
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* Level Descriptor Callout Box */}
                    <div className="bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-1">
                      <div className="flex items-center justify-between gap-1 border-b border-zinc-200 dark:border-zinc-800/80 pb-1 text-[8.5px] font-bold">
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                          <Star size={8} className="fill-amber-500" /> Req: {expected} ({expectedWeight.toFixed(2)})
                        </span>
                        <span className={status === 'ABOVE' ? 'text-emerald-700 dark:text-emerald-400' : status === 'BELOW' ? 'text-rose-700 dark:text-rose-400' : 'text-indigo-700 dark:text-indigo-400'}>
                          Set: {currentRating} ({givenWeight.toFixed(2)})
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 pt-0.5">
                        <span className="text-[8.5px] font-black font-mono px-1 py-0.5 rounded bg-indigo-600 text-white shrink-0">
                          {currentRating}
                        </span>
                        <p className="text-[10px] text-zinc-800 dark:text-zinc-200 italic leading-snug font-medium">
                          {specificRubric}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Tags & Input Drawer */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Evidence Tags
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleEvidence(comp.key)}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      <FileText size={11} />
                      {isExpanded ? 'Hide Notes' : '+ Notes'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {EVIDENCE_TAGS[comp.key]?.map((tag) => {
                      const cleanTag = tag.replace(/^\+\s*/, '');
                      const isTagSelected = (ratings[comp.key as CompetencyKey]?.evidence || '').includes(cleanTag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddEvidenceTag(comp.key as CompetencyKey, tag)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all active:scale-95 flex items-center gap-0.5 ${
                            isTagSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50'
                          }`}
                        >
                          {isTagSelected ? <Check size={9} /> : null}
                          {isTagSelected ? cleanTag : tag}
                        </button>
                      );
                    })}
                  </div>

                  {isExpanded && (
                    <textarea
                      value={ratings[comp.key as CompetencyKey]?.evidence || ''}
                      onChange={(e) =>
                        handleEvidenceChange(comp.key as CompetencyKey, e.target.value)
                      }
                      placeholder="Add specific RFCs, meeting examples, demos..."
                      rows={2}
                      className="w-full mt-1 text-[11px] p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              Save Draft
            </button>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('approved')}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
