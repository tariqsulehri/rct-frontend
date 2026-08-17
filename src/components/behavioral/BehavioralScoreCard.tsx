import React from 'react';
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
import { BehavioralAssessmentData, BehavioralLevelCode } from '@/types/behavioral';
import { BehavioralLevelBadge } from './BehavioralLevelBadge';
import { BEHAVIORAL_LEVEL_DETAILS } from '@/lib/behavioralDefinitions';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { Award, AlertTriangle, CheckCircle2, XCircle, Zap, Star } from 'lucide-react';

export interface BehavioralScoreCardProps {
  assessment: BehavioralAssessmentData | null;
  isLoading?: boolean;
  onOpenAssessmentModal?: () => void;
  canAssess?: boolean;
}

export const BehavioralScoreCard: React.FC<BehavioralScoreCardProps> = ({
  assessment,
  isLoading = false,
  onOpenAssessmentModal,
  canAssess = false,
}) => {
  const c = useChartColors();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
        <div className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
      </div>
    );
  }

  if (!assessment || !assessment.result) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Behavioral Competency Framework
            </h3>
          </div>
          {canAssess && onOpenAssessmentModal && (
            <button
              onClick={onOpenAssessmentModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Evaluate Behavioral
            </button>
          )}
        </div>
        <div className="p-6 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No behavioral evaluation recorded for this employee yet.
          </p>
        </div>
      </div>
    );
  }

  const { result, gradeKey, assessedAt } = assessment;
  const integrityItem = result.perCompetency.find((c) => c.competencyKey === 'integrity');
  const isIntegrityOk = integrityItem ? integrityItem.gapCw >= 0 : true;

  // Below-bar priorities
  const priorityItems = result.perCompetency
    .filter((c) => c.gapCw < 0)
    .map((c) => c.competencyKey.replace(/_/g, ' '));

  const overallAssessedLevel = result.overallProficiency || 'L3';
  const overallAssessedDetail = BEHAVIORAL_LEVEL_DETAILS[overallAssessedLevel];
  const overallTargetCw = result.overallExpectedCw ?? 60;
  const overallTargetLevel: BehavioralLevelCode =
    overallTargetCw >= 90 ? 'L5' : overallTargetCw >= 70 ? 'L4' : overallTargetCw >= 50 ? 'L3' : overallTargetCw >= 30 ? 'L2' : 'L1';
  const overallTargetDetail = BEHAVIORAL_LEVEL_DETAILS[overallTargetLevel];

  const overallGapCw = (result.overallCw ?? 60) - overallTargetCw;

  const radarData = result.perCompetency.map((comp) => {
    const rawKey = comp.competencyKey.replace(/_/g, ' ');
    const name = rawKey.charAt(0).toUpperCase() + rawKey.slice(1);
    const shortName = name.length > 14 ? name.slice(0, 12) + '…' : name;
    const assessedCw = BEHAVIORAL_LEVEL_DETAILS[comp.level]?.weightCw || 20;
    const targetCw = BEHAVIORAL_LEVEL_DETAILS[comp.expectedLevel as BehavioralLevelCode]?.weightCw || 20;

    return {
      competency: shortName,
      fullName: name,
      Assessed: assessedCw,
      Target: targetCw,
    };
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Top Bar: Title & Readiness */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Behavioral Competency Framework
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Target Grade: {gradeKey}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Evaluated on {new Date(assessedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Readiness Badge */}
          {result.behavioralReady === true ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              PROMOTION READY
            </span>
          ) : result.behavioralReady === false ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-full">
              <XCircle className="w-4 h-4 text-rose-500" />
              GATED BY BEHAVIOR
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              INCOMPLETE
            </span>
          )}

          {canAssess && onOpenAssessmentModal && (
            <button
              onClick={onOpenAssessmentModal}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-sm ml-2"
            >
              Re-evaluate
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid: Left (Ladder + 4 Metric Cards + Priorities) & Right (Radar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (Span 7/12): Ladder + 4 Metric Cards + Priorities */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Behavioral Proficiency Ladder (CEFR Style) */}
          <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Behavioral Proficiency Ladder</span>
              </span>
              <span className="font-mono text-zinc-500">
                Benchmark: <strong className="text-amber-600 dark:text-amber-400 font-bold">{overallTargetLevel} ({overallTargetDetail.weightDec})</strong>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {(['L1', 'L2', 'L3', 'L4', 'L5'] as BehavioralLevelCode[]).map((lvl) => {
                const detail = BEHAVIORAL_LEVEL_DETAILS[lvl];
                const isEvaluated = result.overallProficiency === lvl;
                const isTarget = overallTargetLevel === lvl;

                return (
                  <div
                    key={lvl}
                    className={`relative p-3 rounded-xl border text-center transition-all ${
                      isEvaluated
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                        : isTarget
                        ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {isTarget && (
                      <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow-sm" title="Role Required Benchmark">
                        <Star size={10} fill="currentColor" />
                      </div>
                    )}
                    <div className="font-extrabold text-sm flex items-center justify-center gap-1">
                      <span>{lvl}</span>
                    </div>
                    <div className={`text-[10px] font-mono font-bold mt-0.5 ${isEvaluated ? 'text-indigo-100' : 'text-zinc-400'}`}>
                      {detail.weightDec}
                    </div>
                    {isEvaluated && (
                      <div className="text-[9px] font-bold uppercase text-white tracking-wider mt-1 bg-white/20 px-1 rounded">
                        EVALUATED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 CEFR-Style Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: EVALUATED BAND */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                EVALUATED BAND
              </span>
              <div className="mt-2 space-y-1">
                <BehavioralLevelBadge level={overallAssessedLevel} size="md" />
                <div className="text-[11px] font-mono text-zinc-500">
                  Weight: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{overallAssessedDetail.weightDec}</strong>
                </div>
              </div>
            </div>

            {/* Card 2: ROLE BENCHMARK */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                ROLE BENCHMARK
              </span>
              <div className="mt-2 space-y-1">
                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                  {overallTargetLevel}
                </span>
                <div className="text-[11px] font-mono text-zinc-500">
                  Target: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{overallTargetDetail.weightDec}</strong>
                </div>
              </div>
            </div>

            {/* Card 3: BENCHMARK GAP */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                BENCHMARK GAP
              </span>
              <div className="mt-2 space-y-1">
                <span
                  className={`text-base font-black font-mono ${
                    overallGapCw >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {overallGapCw > 0 ? `+${overallGapCw}cw` : `${overallGapCw}cw`}
                </span>
                <div className="text-[10px] font-bold uppercase text-zinc-400">
                  {overallGapCw > 0 ? 'ABOVE' : overallGapCw === 0 ? 'MEETS' : 'BELOW'}
                </div>
              </div>
            </div>

            {/* Card 4: READINESS */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                READINESS
              </span>
              <div className="mt-2 space-y-1">
                {result.behavioralReady === true ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    READY
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    <AlertTriangle size={12} className="text-rose-500" />
                    GATED
                  </span>
                )}
                <div className="text-[10px] text-zinc-400">
                  {isIntegrityOk ? 'Active Gating' : 'Integrity Gate'}
                </div>
              </div>
            </div>
          </div>

          {/* Priorities Banner Callout */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5">
            <Zap size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">Priorities for promotion readiness: </span>
              {priorityItems.length > 0
                ? priorityItems.join(', ') + '.'
                : 'All behavioral competencies currently meet or exceed role target benchmarks.'}
            </div>
          </div>

        </div>

        {/* Right Column (Span 5/12): Behavioral Competencies Radar Chart (CEFR Style) */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 px-1">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Behavioral Competencies Radar
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">Centi-Weight (cw)</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={c.grid} />
                <PolarAngleAxis dataKey="competency" tick={{ fill: c.text, fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle(c)} formatter={(val: unknown, name: unknown) => [`${val} cw`, String(name ?? '')]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: '4px' }} />
                <Radar name="Assessed Level" dataKey="Assessed" stroke="rgb(99, 102, 241)" fill="rgb(99, 102, 241)" fillOpacity={0.4} />
                <Radar name="Role Benchmark" dataKey="Target" stroke="rgb(245, 158, 11)" fill="rgb(245, 158, 11)" fillOpacity={0.15} strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
