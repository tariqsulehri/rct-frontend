import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBehavioralConfig, useCreateBehavioralAssessment } from '@/hooks/useBehavioral';
import { BehavioralLevelCode, BehavioralRatingInput, BehavioralCompetencyItem } from '@/types/behavioral';
import { BEHAVIORAL_LEVEL_DETAILS, BEHAVIORAL_COMPETENCY_DEFINITIONS } from '@/lib/behavioralDefinitions';
import { X, Award, Save, AlertCircle, Info, ShieldAlert, BookOpen } from 'lucide-react';

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

export interface BehavioralAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  employeeName?: string;
  initialGradeKey?: string;
}

export const BehavioralAssessmentModal: React.FC<BehavioralAssessmentModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  employeeName,
  initialGradeKey = 'G15',
}) => {
  const { data: config } = useBehavioralConfig();
  const createMutation = useCreateBehavioralAssessment();

  const selectedGradeKey = initialGradeKey;
  const [ratings, setRatings] = useState<Record<string, { level: BehavioralLevelCode; evidence: string }>>({});
  const [activeTab, setActiveTab] = useState<'core' | 'leadership'>('core');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const grades = (config?.dbGrades && config.dbGrades.length > 0)
    ? config.dbGrades
    : [
        { key: 'G13', name: 'Associate' },
        { key: 'G14', name: 'Engineer' },
        { key: 'G15', name: 'Senior' },
        { key: 'G16', name: 'Principal' },
        { key: 'G17', name: 'Associate Architect' },
      ];

  const competencies = (config?.competencies && config.competencies.length > 0)
    ? config.competencies
    : DEFAULT_COMPETENCIES;

  const expectedMatrix = (config?.expectedMatrix && Object.keys(config.expectedMatrix).length > 0)
    ? config.expectedMatrix
    : DEFAULT_EXPECTED_MATRIX;

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
        level: prev[key]?.level || (expectedMatrix[selectedGradeKey]?.[key] as BehavioralLevelCode) || 'L3',
        evidence,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const expMap = expectedMatrix[selectedGradeKey] || {};
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
        subjectId,
        gradeKey: selectedGradeKey,
        ratings: ratingsPayload,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err.message || 'Failed to submit assessment');
    }
  };

  const filteredCompetencies = competencies.filter((c) => c.type === activeTab);
  const isLeadershipMode = activeTab === 'leadership';
  const isLeadershipNAForGrade = isLeadershipMode && ['G13', 'G14', 'G15'].includes(selectedGradeKey);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Sticky Premium Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Behavioral Competency Evaluation
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evaluating <span className="font-semibold text-zinc-800 dark:text-zinc-200">{employeeName || subjectId}</span> ({subjectId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* Controls Bar */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-4 shrink-0">
            {/* Grade Badge (Locked to Employee Role Target) */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                Target Grade:
              </label>
              <div className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-xs" title="Target Grade is locked to the employee's assigned role benchmark.">
                <span>{selectedGradeKey} - {grades.find(g => g.key === selectedGradeKey)?.name || 'Assigned Role'}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                  LOCKED
                </span>
              </div>
            </div>

            {/* Segmented Competency Type Switcher */}
            <div className="flex p-1 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-300/50 dark:border-zinc-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('core')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'core'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Core Competencies (6)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leadership')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'leadership'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Leadership Competencies (5)
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Scrollable Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            
            {/* Leadership N/A Banner Notice */}
            {isLeadershipNAForGrade && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Leadership Competencies Information:</span>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                    Leadership competencies are evaluated for <strong>Principal (G16)</strong> and <strong>Associate Architect (G17)</strong> grades. For target grade <strong>{selectedGradeKey}</strong>, leadership competencies are marked as N/A and do not gate promotion readiness.
                  </p>
                </div>
              </div>
            )}

            {filteredCompetencies.map((comp) => {
              const expectedLevel = expectedMatrix[selectedGradeKey]?.[comp.key] || 'L3';
              const isNA = expectedLevel === 'NA';
              const currentRating = ratings[comp.key]?.level || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode));
              const currentEvidence = ratings[comp.key]?.evidence || '';

              const activeLevelInfo = BEHAVIORAL_LEVEL_DETAILS[currentRating];
              const levelDefinitionText = BEHAVIORAL_COMPETENCY_DEFINITIONS[comp.key]?.[currentRating] || activeLevelInfo.summary;

              return (
                <div
                  key={comp.key}
                  className={`p-5 rounded-2xl border transition-all ${
                    isNA
                      ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/80 opacity-75'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                          {comp.name}
                        </h3>
                        {comp.key === 'integrity' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            CRITICAL GATE
                          </span>
                        )}
                        {isNA && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            N/A for {selectedGradeKey}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Target Bar for {selectedGradeKey}:{' '}
                        <strong className="text-zinc-800 dark:text-zinc-200 font-bold">
                          {isNA ? 'N/A (Not Required)' : `${expectedLevel} - ${BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode]?.label || expectedLevel}`}
                        </strong>
                      </p>
                    </div>

                    {/* Level Pill Buttons with Weights */}
                    {!isNA && (
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {(['L1', 'L2', 'L3', 'L4', 'L5'] as BehavioralLevelCode[]).map((lvl) => {
                          const isActive = currentRating === lvl;
                          const lvlInfo = BEHAVIORAL_LEVEL_DETAILS[lvl];
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleLevelChange(comp.key, lvl)}
                              title={`${lvl} ${lvlInfo.label} (${lvlInfo.weightCw}cw / Weight: ${lvlInfo.weightDec}) - ${lvlInfo.summary}`}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30 scale-105'
                                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
                              }`}
                            >
                              <span>{lvl}</span>
                              <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-200' : 'text-zinc-400'}`}>
                                ({lvlInfo.weightDec})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Level Meaning & Definition Box */}
                  {!isNA && (
                    <div className="p-3 my-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{currentRating} - {activeLevelInfo.label} Level Meaning & Indicator:</span>
                        </span>
                        <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          Weight: {activeLevelInfo.weightDec} ({activeLevelInfo.weightCw}cw)
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                        "{levelDefinitionText}"
                      </p>
                    </div>
                  )}

                  {!isNA && (
                    <div className="mt-2">
                      <textarea
                        placeholder="Optional STAR (Situation, Task, Action, Result) evidence note..."
                        rows={2}
                        value={currentEvidence}
                        onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Premium Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Mode: <strong className="text-zinc-800 dark:text-zinc-200">{activeTab === 'core' ? '6 Core Competencies' : '5 Leadership Competencies'}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{createMutation.isPending ? 'Saving...' : 'Submit Evaluation'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
