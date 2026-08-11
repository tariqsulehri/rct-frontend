import React, { useState } from 'react';
import { useLatestBehavioralAssessment, useBehavioralConfig, useCreateBehavioralAssessment } from '@/hooks/useBehavioral';
import { BehavioralScoreCard } from './BehavioralScoreCard';
import { BehavioralLevelBadge } from './BehavioralLevelBadge';
import { BehavioralLevelCode, BehavioralRatingInput, BehavioralCompetencyItem } from '@/types/behavioral';
import {
  BEHAVIORAL_LEVEL_DETAILS,
  BEHAVIORAL_COMPETENCY_DEFINITIONS,
  BEHAVIORAL_COMPETENCY_SUBTITLES,
  BEHAVIORAL_EVIDENCE_TAGS,
} from '@/lib/behavioralDefinitions';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
  BookOpen,
  LayoutGrid,
  ListFilter,
  Edit3,
  Save,
  Lock,
  Star,
  Check,
} from 'lucide-react';

const DEFAULT_COMPETENCIES: BehavioralCompetencyItem[] = [
  { key: 'ownership',         name: 'Ownership & Accountability', type: 'core',       sort: 1 },
  { key: 'collaboration',     name: 'Collaboration & Influence',  type: 'core',       sort: 2 },
  { key: 'customer_business', name: 'Customer & Business Focus',   type: 'core',       sort: 3 },
  { key: 'communication',     name: 'Communication',              type: 'core',       sort: 4 },
  { key: 'adaptability',      name: 'Adaptability & Learning',     type: 'core',       sort: 5 },
  { key: 'integrity',         name: 'Integrity & Judgment',        type: 'core',       sort: 6 },
  { key: 'develops_people',   name: 'Develops People',            type: 'leadership', sort: 7 },
  { key: 'strategic_thinking', name: 'Strategic Thinking',         type: 'leadership', sort: 8 },
  { key: 'drives_change',     name: 'Drives Change',              type: 'leadership', sort: 9 },
  { key: 'decision_making',   name: 'Decision-Making',            type: 'leadership', sort: 10 },
  { key: 'builds_teams',      name: 'Builds & Leads Teams',       type: 'leadership', sort: 11 },
];

const DEFAULT_EXPECTED_MATRIX: Record<string, Record<string, BehavioralLevelCode | 'NA'>> = {
  G13: { ownership: 'L1', collaboration: 'L1', customer_business: 'L1', communication: 'L2', adaptability: 'L1', integrity: 'L3', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G14: { ownership: 'L2', collaboration: 'L2', customer_business: 'L2', communication: 'L2', adaptability: 'L2', integrity: 'L3', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G15: { ownership: 'L3', collaboration: 'L3', customer_business: 'L3', communication: 'L3', adaptability: 'L3', integrity: 'L4', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G16: { ownership: 'L4', collaboration: 'L4', customer_business: 'L4', communication: 'L4', adaptability: 'L3', integrity: 'L4', develops_people: 'L3', strategic_thinking: 'L3', drives_change: 'L3', decision_making: 'L3', builds_teams: 'L3' },
  G17: { ownership: 'L5', collaboration: 'L5', customer_business: 'L5', communication: 'L4', adaptability: 'L4', integrity: 'L5', develops_people: 'L4', strategic_thinking: 'L4', drives_change: 'L4', decision_making: 'L4', builds_teams: 'L4' },
};

import { useTeamRoster } from '@/hooks/useAssessment';

export interface BehavioralAssessmentViewProps {
  employeeId: string;
  employeeName?: string;
  gradeCode?: string;
  canAssess?: boolean;
}

export const BehavioralAssessmentView: React.FC<BehavioralAssessmentViewProps> = ({
  employeeId,
  employeeName,
  gradeCode,
  canAssess = false,
}) => {
  const { data: assessment, isLoading } = useLatestBehavioralAssessment(employeeId);
  const { data: config } = useBehavioralConfig();
  const { data: roster } = useTeamRoster();
  const createMutation = useCreateBehavioralAssessment();

  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'stacked'>('grid');
  const [activeTab, setActiveTab] = useState<'core' | 'leadership'>('core');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, { level: BehavioralLevelCode; evidence: string }>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rosterMember = roster?.find(
    (m) => m.emp_code === employeeId || String(m.id) === String(employeeId)
  );

  const resolvedName = employeeName || rosterMember?.full_name || 'Tariq Mahmood';
  const gradeKey = gradeCode || assessment?.gradeKey || rosterMember?.current_grade.code || 'G18';

  const competencies = (config?.competencies && config.competencies.length > 0)
    ? config.competencies
    : DEFAULT_COMPETENCIES;

  const expectedMatrix = (config?.expectedMatrix && Object.keys(config.expectedMatrix).length > 0)
    ? config.expectedMatrix
    : DEFAULT_EXPECTED_MATRIX;

  const handleStartEditing = () => {
    const initial: Record<string, { level: BehavioralLevelCode; evidence: string }> = {};
    const expMap = expectedMatrix[gradeKey] || {};

    competencies.forEach((c) => {
      const existing = assessment?.ratings.find((r) => r.competencyKey === c.key);
      const defaultLvl = (expMap[c.key] as BehavioralLevelCode) || 'L3';
      initial[c.key] = {
        level: existing ? (existing.level as BehavioralLevelCode) : defaultLvl,
        evidence: existing?.evidence || '',
      };
    });

    setRatings(initial);
    setIsEditing(true);
  };

  const handleLevelChange = (key: string, level: BehavioralLevelCode) => {
    setRatings((prev) => ({
      ...prev,
      [key]: {
        level,
        evidence: prev[key]?.evidence || '',
      },
    }));
  };

  const handleEvidenceChange = (key: string, evidence: string) => {
    setRatings((prev) => ({
      ...prev,
      [key]: {
        level: prev[key]?.level || 'L3',
        evidence,
      },
    }));
  };

  const handleAddEvidenceTag = (key: string, tag: string) => {
    const cleanTag = tag.replace(/^\+\s*/, '');
    const current = ratings[key]?.evidence || '';
    if (current.includes(cleanTag)) {
      const updated = current.replace(cleanTag, '').replace(/,\s*,/g, ',').replace(/^,\s*|\s*,\s*$/g, '');
      handleEvidenceChange(key, updated);
    } else {
      const updated = current ? `${current}, ${cleanTag}` : cleanTag;
      handleEvidenceChange(key, updated);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const expMap = expectedMatrix[gradeKey] || {};
    const applicable = competencies.filter((c) => expMap[c.key] && expMap[c.key] !== 'NA');

    const ratingsPayload: BehavioralRatingInput[] = applicable.map((c) => {
      const userRating = ratings[c.key];
      const defaultLevel = (expMap[c.key] as BehavioralLevelCode) || 'L3';
      return {
        competencyKey: c.key,
        level: userRating?.level || defaultLevel,
        evidence: userRating?.evidence || undefined,
      };
    });

    try {
      await createMutation.mutateAsync({
        subjectId: employeeId,
        gradeKey,
        ratings: ratingsPayload,
      });
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Failed to save assessment');
    }
  };

  const toggleEvidence = (key: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredCompetencies = competencies.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-6">
      
      {/* Top Header Row (Matching CEFR Header format exactly) */}
      <div className="card p-6 space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{resolvedName}</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                ID: {employeeId}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Lock size={10} className="text-amber-500" />
                Grade: {gradeKey} (Locked)
              </span>
              {assessment?.result?.behavioralReady === true ? (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  STATUS: APPROVED / PROMOTION READY
                </span>
              ) : assessment?.result?.behavioralReady === false ? (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  STATUS: GATED BY BEHAVIOR
                </span>
              ) : (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 border border-zinc-300">
                  STATUS: UNCHECKED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Target Level: <span className="font-bold text-zinc-800 dark:text-zinc-200">{gradeKey}</span> — Role Benchmark: <span className="font-bold text-amber-600 dark:text-amber-400">{assessment?.result?.overallExpectedCw ? `L3 (${assessment.result.overallExpectedCw}cw)` : 'L3 (60cw)'}</span> • <span className="text-zinc-500 italic">Reviewer Mode: System Administrator / Evaluator</span>
            </p>
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
                onClick={() => setViewMode('stacked')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'stacked'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ListFilter size={13} /> Stacked
              </button>
            </div>

            {canAssess && !isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
              >
                <Edit3 size={14} /> Evaluate Inline
              </button>
            )}
          </div>
        </div>

        {/* Top Action Header Bar (when editing) */}
        {isEditing && (
          <div className="p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl shadow-xs animate-fade-in">
            <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap font-medium">
              <div>Overall Level: <strong className="text-zinc-900 dark:text-zinc-100 font-extrabold">{assessment?.result?.overallProficiency || 'L3'} ({assessment?.result?.overallCw || 60}cw)</strong></div>
              <span className="text-zinc-300">•</span>
              <div>Role Benchmark Req: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{gradeKey} (L3 - 60cw)</strong></div>
            </div>

            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => setIsEditing(false)} className="px-3.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors shadow-xs">Cancel</button>
              <button type="button" disabled={createMutation.isPending} onClick={handleSubmit} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"><Save size={14} /> {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}</button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Overview Score Card & Radar Chart */}
        <BehavioralScoreCard
          assessment={assessment ?? null}
          isLoading={isLoading}
          canAssess={canAssess}
          onOpenAssessmentModal={handleStartEditing}
        />
      </div>

      {/* Main Body Content: Breakdown & Competency Cards Grid */}
      <div className="space-y-4">
        
        {/* Competencies Section Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Behavioral Competencies ({competencies.length})</span>
              {isEditing && (
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  EDITING INLINE
                </span>
              )}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Assigned Grade Benchmark: <strong className="text-zinc-700 dark:text-zinc-300 font-bold">{gradeKey}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Core vs Leadership Switcher */}
            <div className="flex p-1 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-xl border border-zinc-300/50 dark:border-zinc-700/50 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('core')}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  activeTab === 'core'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Core (6)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leadership')}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  activeTab === 'leadership'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Leadership (5)
              </button>
            </div>
          </div>
        </div>

        {/* ── Mode A: 3-Column Grid View (CEFR Tile Format) ───────────────── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start w-full">
            {filteredCompetencies.map((comp) => {
              const expectedLevel = expectedMatrix[gradeKey]?.[comp.key] || 'L3';
              const isNA = expectedLevel === 'NA';

              const activeRatingLevel = isEditing
                ? ratings[comp.key]?.level || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode))
                : (assessment?.ratings.find((r) => r.competencyKey === comp.key)?.level as BehavioralLevelCode) || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode));

              const activeEvidence = isEditing
                ? ratings[comp.key]?.evidence || ''
                : assessment?.ratings.find((r) => r.competencyKey === comp.key)?.evidence || '';

              const levelDetail = BEHAVIORAL_LEVEL_DETAILS[activeRatingLevel];
              const expectedDetail = BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode];
              const levelDef = BEHAVIORAL_COMPETENCY_DEFINITIONS[comp.key]?.[activeRatingLevel] || levelDetail.summary;
              const isExpanded = Boolean(expandedEvidence[comp.key]);

              const expCw = expectedLevel !== 'NA' ? BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode]?.weightCw || 60 : 0;
              const gapCw = levelDetail.weightCw - expCw;

              return (
                <div
                  key={comp.key}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 h-full ${
                    isNA
                      ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 opacity-75'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header: Title + Category Pill + Critical Gate */}
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">{comp.name}</h4>
                        <div className="flex items-center gap-1">
                          {comp.key === 'integrity' && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              CRITICAL GATE
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {comp.type === 'core' ? 'CORE BEHAVIORAL' : 'LEADERSHIP'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                        {BEHAVIORAL_COMPETENCY_SUBTITLES[comp.key] || 'Behavioral evaluation metric.'}
                      </p>
                    </div>

                    {/* Top Metrics Bar: Requirement Pill & Status Gap Pill */}
                    {!isNA && (
                      <div className="flex items-center justify-between text-xs gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          ⭐ Req: {expectedLevel} ({expectedDetail?.weightDec || '0.60'})
                        </span>

                        {gapCw > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            📈 ABOVE (+{gapCw}cw)
                          </span>
                        ) : gapCw === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            MEETS (0cw)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            📉 BELOW ({gapCw}cw)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Horizontal 5-Level Pill Buttons (Single Row - CEFR Style) */}
                    {!isNA && (
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {(['L1', 'L2', 'L3', 'L4', 'L5'] as BehavioralLevelCode[]).map((lvl) => {
                          const isSelected = activeRatingLevel === lvl;
                          const isTarget = expectedLevel === lvl;
                          const info = BEHAVIORAL_LEVEL_DETAILS[lvl];

                          return (
                            <button
                              key={lvl}
                              type="button"
                              disabled={!isEditing}
                              onClick={() => handleLevelChange(comp.key, lvl)}
                              title={`${lvl} ${info.label} (${info.weightDec})`}
                              className={`relative p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-rose-600 dark:bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/40 shadow-md transform scale-[1.03]'
                                  : isTarget
                                  ? 'bg-amber-500/10 border-amber-400 text-amber-900 dark:text-amber-200'
                                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 opacity-80'
                              } ${!isEditing ? 'cursor-default' : 'hover:scale-[1.02] cursor-pointer'}`}
                            >
                              {isTarget && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Role Requirement Benchmark">
                                  <Star size={9} fill="currentColor" />
                                </div>
                              )}
                              <div className="text-xs font-black">{lvl}</div>
                              <div className={`text-[9px] font-mono font-bold mt-0.5 ${isSelected ? 'text-rose-100' : 'text-zinc-400'}`}>
                                {info.weightDec}
                              </div>
                              {isSelected && (
                                <div className="text-[8px] font-black uppercase text-white tracking-wider mt-0.5 bg-white/20 px-1 rounded">
                                  ✓ SET
                                </div>
                              )}
                              {!isSelected && isTarget && (
                                <div className="text-[8px] font-bold uppercase text-amber-600 dark:text-amber-300 tracking-wider mt-0.5">
                                  ★ Req
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Active Level Summary Box (CEFR Style) */}
                    {!isNA && (
                      <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Star size={11} fill="currentColor" /> Req: {expectedLevel} ({expectedDetail?.weightDec || '0.60'})
                          </span>
                          <span className={gapCw < 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                            Set: {activeRatingLevel} ({levelDetail.weightDec})
                          </span>
                        </div>

                        <div className="flex items-start gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-indigo-600 text-white shrink-0">
                            {activeRatingLevel}
                          </span>
                          <p className="text-zinc-700 dark:text-zinc-300 italic text-[11px] leading-relaxed">
                            "{levelDef}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evidence Notes & Quick Tags Section (CEFR Style) */}
                  {!isNA && (
                    <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">EVIDENCE NOTES</span>
                        <button
                          type="button"
                          onClick={() => toggleEvidence(comp.key)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Hide Notes' : '+ Notes'}
                        </button>
                      </div>

                      {/* Quick Evidence Tag Pills */}
                      {isEditing && (
                        <div className="flex flex-wrap gap-1">
                          {BEHAVIORAL_EVIDENCE_TAGS[comp.key]?.map((tag) => {
                            const cleanTag = tag.replace(/^\+\s*/, '');
                            const isSelected = activeEvidence.includes(cleanTag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddEvidenceTag(comp.key, tag)}
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50'
                                }`}
                              >
                                {isSelected ? <Check size={10} /> : null}
                                {isSelected ? cleanTag : tag}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Editable Textarea / Read-only View */}
                      {isEditing && isExpanded && (
                        <textarea
                          value={activeEvidence}
                          onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                          placeholder="Add specific STAR evidence, tickets, postmortems..."
                          rows={2}
                          className="w-full mt-1.5 text-xs p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      )}

                      {!isEditing && (
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 font-medium">
                          {activeEvidence ? (
                            <span>{activeEvidence}</span>
                          ) : (
                            <span className="text-zinc-400 italic">No evidence notes recorded.</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Mode B: Stacked Table View ───────────────────────────── */}
        {viewMode === 'stacked' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Competency</th>
                    <th className="py-3.5 px-4 text-center">Assessed Level</th>
                    <th className="py-3.5 px-4 text-center">Target Bar</th>
                    <th className="py-3.5 px-4 text-center">Gap (cw)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Details & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredCompetencies.map((comp) => {
                    const expectedLevel = expectedMatrix[gradeKey]?.[comp.key] || 'L3';
                    const isNA = expectedLevel === 'NA';

                    const activeRatingLevel = isEditing
                      ? ratings[comp.key]?.level || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode))
                      : (assessment?.ratings.find((r) => r.competencyKey === comp.key)?.level as BehavioralLevelCode) || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode));

                    const activeEvidence = isEditing
                      ? ratings[comp.key]?.evidence || ''
                      : assessment?.ratings.find((r) => r.competencyKey === comp.key)?.evidence || '';

                    const levelDetail = BEHAVIORAL_LEVEL_DETAILS[activeRatingLevel];
                    const levelDef = BEHAVIORAL_COMPETENCY_DEFINITIONS[comp.key]?.[activeRatingLevel] || levelDetail.summary;
                    const isExpanded = Boolean(expandedEvidence[comp.key]);

                    const expCw = expectedLevel !== 'NA' ? BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode]?.weightCw || 60 : 0;
                    const gapCw = levelDetail.weightCw - expCw;

                    return (
                      <React.Fragment key={comp.key}>
                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex items-center gap-1.5">
                              <span>{comp.name}</span>
                              {comp.key === 'integrity' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  CRITICAL
                                </span>
                              )}
                              {isNA && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isEditing && !isNA ? (
                              <div className="flex items-center justify-center gap-1">
                                {(['L1', 'L2', 'L3', 'L4', 'L5'] as BehavioralLevelCode[]).map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleLevelChange(comp.key, lvl)}
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                      activeRatingLevel === lvl
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                                    }`}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <BehavioralLevelBadge level={activeRatingLevel} size="sm" />
                                <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                  {levelDetail.weightDec} ({levelDetail.weightCw}cw)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isNA ? (
                              <span className="text-zinc-400 italic text-xs">N/A</span>
                            ) : (
                              <BehavioralLevelBadge level={expectedLevel as BehavioralLevelCode} size="sm" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {isNA ? (
                              <span className="text-zinc-400">-</span>
                            ) : (
                              <span className={gapCw > 0 ? 'text-emerald-600' : gapCw < 0 ? 'text-rose-600' : 'text-zinc-500'}>
                                {gapCw > 0 ? `+${gapCw}` : gapCw}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isNA ? (
                              <span className="text-zinc-400 font-mono text-[10px]">N/A</span>
                            ) : gapCw > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 rounded-md">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                ABOVE
                              </span>
                            ) : gapCw === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-500/10 rounded-md">
                                MEETS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-500/10 rounded-md">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                BELOW
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => toggleEvidence(comp.key)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Details</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-indigo-500/5 dark:bg-indigo-950/20">
                            <td colSpan={6} className="p-4 border-t border-b border-indigo-500/20 space-y-2">
                              <div className="flex items-start gap-2 text-xs">
                                <BookOpen className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                                    {activeRatingLevel} Indicator Meaning:
                                  </span>
                                  <p className="mt-0.5 text-zinc-700 dark:text-zinc-300 italic">
                                    "{levelDef}"
                                  </p>
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="pt-2 border-t border-indigo-500/10 space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                    STAR Evidence Note & Quick Tags:
                                  </label>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {BEHAVIORAL_EVIDENCE_TAGS[comp.key]?.map((tag) => {
                                      const cleanTag = tag.replace(/^\+\s*/, '');
                                      const isSelected = activeEvidence.includes(cleanTag);
                                      return (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => handleAddEvidenceTag(comp.key, tag)}
                                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                                            isSelected
                                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                              : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-50'
                                          }`}
                                        >
                                          {isSelected ? <Check size={10} /> : null}
                                          {isSelected ? cleanTag : tag}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <textarea
                                    value={activeEvidence}
                                    onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                                    placeholder="Add evidence notes..."
                                    rows={2}
                                    className="w-full text-xs p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                                  />
                                </div>
                              ) : activeEvidence ? (
                                <div className="flex items-start gap-2 text-xs pt-2 border-t border-indigo-500/10">
                                  <FileText className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                                      STAR Evidence Note:
                                    </span>
                                    <p className="mt-0.5 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                      {activeEvidence}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
