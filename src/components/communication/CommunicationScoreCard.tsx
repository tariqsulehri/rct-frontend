import React, { useState } from 'react';
import {
  MessageSquare,
  Award,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  useLatestCommAssessment,
  useCommConfig,
} from '@/hooks/useCommunication';
import { CefrLevelBadge } from './CefrLevelBadge';
import { CefrAssessmentModal } from './CefrAssessmentModal';
import { CefrLevelCode, OrgLevelKey } from '@/types/communication';

export interface CommunicationScoreCardProps {
  employeeId: string;
  employeeName: string;
  currentGradeLevel?: number;
  readOnly?: boolean;
}

export const CommunicationScoreCard: React.FC<CommunicationScoreCardProps> = ({
  employeeId,
  employeeName,
  currentGradeLevel = 3,
  readOnly = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: latestAssessment, isLoading } = useLatestCommAssessment(employeeId);
  const { data: config } = useCommConfig();

  const orgLevelKey: OrgLevelKey = (() => {
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
  })();

  const benchmarkCefr: CefrLevelCode = config?.orgLevels?.[orgLevelKey]?.benchmarkCefr ?? 'B2';

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>
    );
  }

  const evaluation = latestAssessment?.evaluation;
  const isEvaluated = Boolean(latestAssessment && evaluation);

  return (
    <>
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                CEFR Communication Proficiency
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Separate Dimension
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evaluation aligned with Global CEFR standards (A1–C2) and role benchmarks.
              </p>
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all self-start sm:self-center"
            >
              <Award size={14} />
              {isEvaluated ? 'Update Evaluation' : 'Evaluate Communication'}
            </button>
          )}
        </div>

        {/* Evaluation Summary */}
        {isEvaluated && evaluation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Band Card */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Overall CEFR Level
              </div>
              <div className="my-2 flex items-baseline gap-3">
                <CefrLevelBadge level={evaluation.overallCefr} size="lg" showLabel />
                <span className="text-xs font-bold text-zinc-500">
                  Weight: {evaluation.overallScore.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Role Target:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {evaluation.expectedCefr} ({evaluation.expectedScore.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Gap & Status Card */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Benchmark Gap
              </div>
              <div className="my-2">
                <div
                  className={`text-2xl font-black ${
                    evaluation.overallGap >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {evaluation.overallGap >= 0
                    ? `+${evaluation.overallGap.toFixed(2)}`
                    : evaluation.overallGap.toFixed(2)}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-0.5">
                  {evaluation.overallStatus === 'MEETS'
                    ? 'Meets Benchmark'
                    : evaluation.overallStatus === 'ABOVE'
                    ? 'Exceeds Benchmark'
                    : 'Below Benchmark'}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                Calculated across 6 core communication competencies.
              </div>
            </div>

            {/* Readiness & Gating Card */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Communication Readiness
              </div>
              <div className="my-2">
                {evaluation.communicationReady ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-sm">
                    <CheckCircle2 size={16} /> READY
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-sm">
                    <AlertCircle size={16} /> NOT READY (GATED)
                  </div>
                )}
              </div>
              <div className="text-xs text-zinc-500">
                {evaluation.isPromotionGated
                  ? 'Promotion Gating: Active for Grade >= Senior'
                  : 'Development Only: No promotion blocker'}
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Unassessed State */
          <div className="p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No Communication Assessment Recorded Yet
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
                Expected benchmark for current role (<span className="font-semibold">{orgLevelKey.toUpperCase()}</span>) is{' '}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{benchmarkCefr}</span>.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm"
              >
                <Award size={14} />
                Start CEFR Self-Assessment
              </button>
            )}
          </div>
        )}

        {/* Competency Breakdown Matrix */}
        {isEvaluated && evaluation && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Competency Breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {evaluation.competencyBreakdown.map((item) => (
                <div
                  key={item.competencyKey}
                  className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {config?.competencies.find(c => c.key === item.competencyKey)?.name || item.competencyKey}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        item.status === 'MEETS'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : item.status === 'ABOVE'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {item.status} ({item.gap >= 0 ? `+${item.gap}` : item.gap})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Rated:</span>
                      <CefrLevelBadge level={item.cefr} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Target:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {item.expectedCefr}
                      </span>
                    </div>
                  </div>

                  {item.evidence && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-100/60 dark:bg-zinc-900/40 p-1.5 rounded">
                      "{item.evidence}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development Priorities Banner */}
        {isEvaluated && evaluation && evaluation.developmentPriorities.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Key Development Priorities
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-0.5">
                To meet benchmark expectations for this role, focus development on:{' '}
                <span className="font-semibold underline">
                  {evaluation.developmentPriorities.map((p) => p.replace(/_/g, ' ')).join(', ')}
                </span>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      {modalOpen && (
        <CefrAssessmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          employeeId={employeeId}
          employeeName={employeeName}
          currentGradeLevel={currentGradeLevel}
          existingAssessment={latestAssessment}
        />
      )}
    </>
  );
};
