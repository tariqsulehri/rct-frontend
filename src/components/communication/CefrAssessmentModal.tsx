import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Send,
  Award,
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
  useCreateCommAssessment,
} from '@/hooks/useCommunication';
import { useAuthStore } from '@/store/authStore';
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
  A1: 'Can understand basic phrases and introduce themselves in simple terms.',
  A2: 'Can communicate in routine tasks and describe immediate environment in simple language.',
  B1: 'Can understand main points of standard input and produce simple connected text on familiar topics.',
  B2: 'Can interact with spontaneity, explain complex viewpoints, and write clear, detailed technical text.',
  C1: 'Can express ideas fluently, use language flexibly for social/professional tasks, and write structured complex reports.',
  C2: 'Can understand virtually everything with ease, express spontaneously and precisely, and lead executive discourse.',
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
  const createMutation = useCreateCommAssessment();

  const isEngineer = user?.role === 'ENGINEER';

  // Determine org level key from currentGradeLevel
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

  // Initial ratings state
  const [ratings, setRatings] = useState<Record<CompetencyKey, { cefr: CefrLevelCode; evidence: string }>>(() => {
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
      const existingRating = existingAssessment?.ratings.find((r) => r.competency_key === key);
      const benchmark =
        config?.targetOverrides?.[orgLevelKey]?.[key] ??
        config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ??
        'B2';

      initial[key] = {
        cefr: (existingRating?.cefr as CefrLevelCode) || (benchmark as CefrLevelCode) || 'B2',
        evidence: existingRating?.evidence || '',
      };
    });

    return initial;
  });

  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Dynamic Live Score Engine Simulation
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

    // Band derivation
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
          ? 'Communication evaluation successfully saved and approved!'
          : targetStatus === 'pending'
          ? 'Self-assessment submitted for manager review.'
          : 'Assessment saved as draft.',
        'Success'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                CEFR Communication Evaluation
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  ID: {employeeId}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evaluating <span className="font-semibold text-zinc-700 dark:text-zinc-200">{employeeName}</span> ({orgLevelKey.toUpperCase()} — Expected Benchmark: <span className="font-bold text-indigo-600 dark:text-indigo-400">{livePreview?.orgBenchmark}</span>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Calculation Banner */}
        {livePreview && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Evaluated Level
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <CefrLevelBadge level={livePreview.band} size="md" showLabel />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Score vs Benchmark
              </div>
              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {livePreview.averageWeight.toFixed(2)}{' '}
                <span className="text-xs font-normal text-zinc-500">
                  (Req: {livePreview.orgBenchmark})
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Overall Gap
              </div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  livePreview.overallGap >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {livePreview.overallGap >= 0 ? `+${livePreview.overallGap.toFixed(2)}` : livePreview.overallGap.toFixed(2)}{' '}
                <span className="text-xs font-medium opacity-80">({livePreview.overallStatus})</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Readiness Status
              </div>
              <div className="mt-0.5">
                {livePreview.isReady ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} /> READY
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertTriangle size={12} /> NOT READY (GATED)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: 6 Competencies */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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

            return (
              <div
                key={comp.key}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 space-y-3"
              >
                {/* Competency Title & Target */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {comp.name}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                        {comp.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {comp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Target: <span className="font-bold text-zinc-700 dark:text-zinc-200">{expected}</span>
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        status === 'MEETS'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : status === 'ABOVE'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {status} ({gap >= 0 ? `+${gap}` : gap})
                    </span>
                  </div>
                </div>

                {/* Level Pill Selectors */}
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {CEFR_LEVELS.map((lvl) => {
                    const isSelected = currentRating === lvl;
                    const isTarget = expected === lvl;
                    const color = CEFR_COLORS[lvl];

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleRatingChange(comp.key as CompetencyKey, lvl)}
                        className={`relative py-2 px-1 text-center rounded-lg border transition-all text-xs font-bold ${
                          isSelected
                            ? `${color.bg} ${color.text} ${color.border} ring-2 ring-indigo-500/40 shadow-sm`
                            : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div>{lvl}</div>
                        {isTarget && (
                          <div className="text-[9px] font-semibold opacity-75 mt-0.5">
                            Target
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Descriptor Hint */}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic bg-white/60 dark:bg-zinc-900/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 not-italic">
                    {currentRating}:
                  </span>{' '}
                  {CEFR_DESCRIPTORS[currentRating]}
                </div>

                {/* Evidence Input Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleEvidence(comp.key)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <FileText size={12} />
                    {isExpanded ? 'Hide Evidence Notes' : '+ Add Evidence / Notes'}
                  </button>

                  {isExpanded && (
                    <textarea
                      value={ratings[comp.key as CompetencyKey]?.evidence || ''}
                      onChange={(e) =>
                        handleEvidenceChange(comp.key as CompetencyKey, e.target.value)
                      }
                      placeholder="Add specific RFCs, meeting examples, demos, or presentation feedback..."
                      rows={2}
                      className="w-full mt-2 text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              Save Draft
            </button>

            {isEngineer ? (
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit('pending')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Send size={13} />
                {createMutation.isPending ? 'Submitting...' : 'Submit Self-Assessment'}
              </button>
            ) : (
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => handleSubmit('approved')}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
