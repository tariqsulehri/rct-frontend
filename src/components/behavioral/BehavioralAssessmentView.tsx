import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  ListFilter,
  Edit3,
  Lock,
  BookOpen,
  FileText,
} from 'lucide-react';
import {
  useLatestBehavioralAssessment,
  useBehavioralConfig,
  useCreateBehavioralAssessment,
} from '@/hooks/useBehavioral';
import { useTeamRoster } from '@/hooks/useAssessment';
import { toast } from '@/lib/toast';
import { BehavioralLevelBadge } from './BehavioralLevelBadge';
import { ProficiencyLadder, LadderStep } from '@/components/ui/assessment/ProficiencyLadder';
import { MetricKpiCard } from '@/components/ui/assessment/MetricKpiCard';
import { LevelSelectorBar, LevelOption } from '@/components/ui/assessment/LevelSelectorBar';
import { AssessmentHeroLayout } from '@/components/ui/assessment/AssessmentHeroLayout';
import {
  BehavioralLevelCode,
  BehavioralRatingInput,
  BehavioralCompetencyItem,
} from '@/types/behavioral';
import {
  BEHAVIORAL_LEVEL_DETAILS,
  BEHAVIORAL_COMPETENCY_DEFINITIONS,
  BEHAVIORAL_COMPETENCY_SUBTITLES,
  BEHAVIORAL_EVIDENCE_TAGS,
} from '@/lib/behavioralDefinitions';

const DEFAULT_COMPETENCIES: BehavioralCompetencyItem[] = [
  { key: 'ownership',          name: 'Ownership & Accountability', type: 'core',       sort: 1 },
  { key: 'collaboration',      name: 'Collaboration & Influence',  type: 'core',       sort: 2 },
  { key: 'customer_business',  name: 'Customer & Business Focus',   type: 'core',       sort: 3 },
  { key: 'communication',      name: 'Communication',              type: 'core',       sort: 4 },
  { key: 'adaptability',       name: 'Adaptability & Learning',     type: 'core',       sort: 5 },
  { key: 'integrity',          name: 'Integrity & Judgment',        type: 'core',       sort: 6 },
  { key: 'develops_people',    name: 'Develops People',            type: 'leadership', sort: 7 },
  { key: 'strategic_thinking',  name: 'Strategic Thinking',         type: 'leadership', sort: 8 },
  { key: 'drives_change',      name: 'Drives Change',              type: 'leadership', sort: 9 },
  { key: 'decision_making',    name: 'Decision-Making',            type: 'leadership', sort: 10 },
  { key: 'builds_teams',       name: 'Builds & Leads Teams',       type: 'leadership', sort: 11 },
];

const DEFAULT_EXPECTED_MATRIX: Record<string, Record<string, BehavioralLevelCode | 'NA'>> = {
  G13: { ownership: 'L1', collaboration: 'L1', customer_business: 'L1', communication: 'L2', adaptability: 'L1', integrity: 'L3', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G14: { ownership: 'L2', collaboration: 'L2', customer_business: 'L2', communication: 'L2', adaptability: 'L2', integrity: 'L3', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G15: { ownership: 'L3', collaboration: 'L3', customer_business: 'L3', communication: 'L3', adaptability: 'L3', integrity: 'L4', develops_people: 'NA', strategic_thinking: 'NA', drives_change: 'NA', decision_making: 'NA', builds_teams: 'NA' },
  G16: { ownership: 'L4', collaboration: 'L4', customer_business: 'L4', communication: 'L4', adaptability: 'L3', integrity: 'L4', develops_people: 'L3', strategic_thinking: 'L3', drives_change: 'L3', decision_making: 'L3', builds_teams: 'L3' },
  G17: { ownership: 'L5', collaboration: 'L5', customer_business: 'L5', communication: 'L4', adaptability: 'L4', integrity: 'L5', develops_people: 'L4', strategic_thinking: 'L4', drives_change: 'L4', decision_making: 'L4', builds_teams: 'L4' },
  G18: { ownership: 'L5', collaboration: 'L5', customer_business: 'L5', communication: 'L5', adaptability: 'L5', integrity: 'L5', develops_people: 'L5', strategic_thinking: 'L5', drives_change: 'L5', decision_making: 'L5', builds_teams: 'L5' },
};

const BEHAVIORAL_RADAR_LABELS: Record<string, string> = {
  ownership: 'Ownership',
  collaboration: 'Collaboration',
  customer_business: 'Customer Focus',
  communication: 'Communication',
  adaptability: 'Adaptability',
  integrity: 'Integrity',
  develops_people: 'Develops People',
  strategic_thinking: 'Strategic Thinking',
  drives_change: 'Drives Change',
  decision_making: 'Decision Making',
  builds_teams: 'Builds Teams',
};

const BEHAVIORAL_STEPS: LadderStep[] = [
  { code: 'L1', weightDec: '0.20', weightNum: 20 },
  { code: 'L2', weightDec: '0.40', weightNum: 40 },
  { code: 'L3', weightDec: '0.60', weightNum: 60 },
  { code: 'L4', weightDec: '0.80', weightNum: 80 },
  { code: 'L5', weightDec: '1.00', weightNum: 100 },
];

const BEHAVIORAL_LEVEL_OPTIONS: LevelOption[] = [
  { code: 'L1', weightDec: '0.20', weightNum: 20 },
  { code: 'L2', weightDec: '0.40', weightNum: 40 },
  { code: 'L3', weightDec: '0.60', weightNum: 60 },
  { code: 'L4', weightDec: '0.80', weightNum: 80 },
  { code: 'L5', weightDec: '1.00', weightNum: 100 },
];

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
  const { data: assessment, isLoading, refetch: refetchLatest } = useLatestBehavioralAssessment(employeeId);
  const { data: config, isLoading: isConfigLoading } = useBehavioralConfig();
  const { data: roster } = useTeamRoster();
  const createMutation = useCreateBehavioralAssessment();

  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'stacked'>('grid');
  const [activeTab, setActiveTab] = useState<'core' | 'leadership'>('core');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [ratings, setRatings] = useState<Record<string, { level: BehavioralLevelCode; evidence: string }>>({});
  const [initialRatingsString, setInitialRatingsString] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rosterMember = roster?.find(
    (m) => m.emp_code === employeeId || String(m.id) === String(employeeId)
  );

  const resolvedName = employeeName || rosterMember?.full_name || 'Employee';
  
  // Safely extract the grade from rosterMember regardless of string vs object type
  const rosterGradeCode = typeof rosterMember?.current_grade === 'string' 
    ? rosterMember.current_grade 
    : rosterMember?.current_grade?.code;

  const gradeKey = gradeCode || assessment?.gradeKey || rosterGradeCode || 'G1';

  const competencies = (config?.competencies && config.competencies.length > 0)
    ? config.competencies
    : DEFAULT_COMPETENCIES;

  const expectedMatrix = (config?.expectedMatrix && Object.keys(config.expectedMatrix).length > 0)
    ? config.expectedMatrix
    : DEFAULT_EXPECTED_MATRIX;

  // Initialize or synchronize local ratings from saved assessment or role default baseline
  useEffect(() => {
    const initial: Record<string, { level: BehavioralLevelCode; evidence: string }> = {};
    const expMap = expectedMatrix[gradeKey] || {};

    competencies.forEach((c) => {
      const existing = assessment?.ratings.find((r) => r.competencyKey === c.key);
      const defaultLvl = (expMap[c.key] !== 'NA' && expMap[c.key]) ? (expMap[c.key] as BehavioralLevelCode) : 'L3';
      initial[c.key] = {
        level: existing ? (existing.level as BehavioralLevelCode) : defaultLvl,
        evidence: existing?.evidence || '',
      };
    });

    setRatings(initial);
    setInitialRatingsString(JSON.stringify(initial));
  }, [assessment, config, gradeKey]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialRatingsString) return false;
    return JSON.stringify(ratings) !== initialRatingsString;
  }, [ratings, initialRatingsString]);

  // Reactive live evaluation calculated in real time
  const liveEvaluation = useMemo(() => {
    const expMap = expectedMatrix[gradeKey] || {};
    const applicableCompetencies = competencies.filter((c) => expMap[c.key] !== 'NA');

    if (applicableCompetencies.length === 0) return null;

    let totalCw = 0;
    let totalTargetCw = 0;

    const breakdown = applicableCompetencies.map((comp) => {
      const activeRating = ratings[comp.key];
      const givenLevel: BehavioralLevelCode = activeRating?.level || (expMap[comp.key] as BehavioralLevelCode) || 'L3';
      const givenCw = BEHAVIORAL_LEVEL_DETAILS[givenLevel]?.weightCw ?? 60;
      const expectedLevel: BehavioralLevelCode = (expMap[comp.key] as BehavioralLevelCode) || 'L3';
      const expectedCw = BEHAVIORAL_LEVEL_DETAILS[expectedLevel]?.weightCw ?? 60;

      totalCw += givenCw;
      totalTargetCw += expectedCw;

      const gapCw = givenCw - expectedCw;
      const status: 'ABOVE' | 'MEETS' | 'BELOW' = gapCw > 0 ? 'ABOVE' : gapCw === 0 ? 'MEETS' : 'BELOW';

      return {
        key: comp.key,
        name: comp.name,
        type: comp.type,
        givenLevel,
        givenCw,
        givenDec: BEHAVIORAL_LEVEL_DETAILS[givenLevel]?.weightDec || '0.60',
        expectedLevel,
        expectedCw,
        expectedDec: BEHAVIORAL_LEVEL_DETAILS[expectedLevel]?.weightDec || '0.60',
        gapCw,
        status,
        evidence: activeRating?.evidence || '',
      };
    });

    const overallCw = Math.round(totalCw / applicableCompetencies.length);
    const overallExpectedCw = Math.round(totalTargetCw / applicableCompetencies.length);
    const overallGapCw = overallCw - overallExpectedCw;

    let overallProficiency: BehavioralLevelCode = 'L1';
    if (overallCw >= 90) overallProficiency = 'L5';
    else if (overallCw >= 70) overallProficiency = 'L4';
    else if (overallCw >= 50) overallProficiency = 'L3';
    else if (overallCw >= 30) overallProficiency = 'L2';

    let overallExpectedLevel: BehavioralLevelCode = 'L1';
    if (overallExpectedCw >= 90) overallExpectedLevel = 'L5';
    else if (overallExpectedCw >= 70) overallExpectedLevel = 'L4';
    else if (overallExpectedCw >= 50) overallExpectedLevel = 'L3';
    else if (overallExpectedCw >= 30) overallExpectedLevel = 'L2';

    const integrityRating = breakdown.find((b) => b.key === 'integrity');
    const isIntegrityOk = integrityRating ? integrityRating.gapCw >= 0 : true;
    const behavioralReady = overallGapCw >= 0 && isIntegrityOk;
    const priorities = breakdown.filter((b) => b.status === 'BELOW').map((b) => b.name);

    const radarData = breakdown.map((item) => {
      const label = BEHAVIORAL_RADAR_LABELS[item.key] || item.name;
      return {
        competency: label,
        fullName: item.name,
        Assessed: item.givenCw,
        Target: item.expectedCw,
      };
    });

    return {
      overallCw,
      overallDec: (overallCw / 100).toFixed(2),
      overallProficiency,
      overallExpectedCw,
      overallExpectedDec: (overallExpectedCw / 100).toFixed(2),
      overallExpectedLevel,
      overallGapCw,
      isIntegrityOk,
      behavioralReady,
      priorities,
      breakdown,
      radarData,
    };
  }, [ratings, competencies, expectedMatrix, gradeKey]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleLevelChange = (key: string, level: string) => {
    if (!canAssess && !isEditing) return;
    setIsEditing(true);
    setRatings((prev) => ({
      ...prev,
      [key]: {
        level: level as BehavioralLevelCode,
        evidence: prev[key]?.evidence || '',
      },
    }));
  };

  const handleEvidenceChange = (key: string, evidence: string) => {
    if (!canAssess && !isEditing) return;
    setRatings((prev) => ({
      ...prev,
      [key]: {
        level: prev[key]?.level || 'L3',
        evidence,
      },
    }));
  };

  const handleAddEvidenceTag = (key: string, tag: string) => {
    if (!canAssess && !isEditing) return;
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
    if (!canAssess) return;
    const expMap = expectedMatrix[gradeKey] || {};
    const aligned: Record<string, { level: BehavioralLevelCode; evidence: string }> = {};

    competencies.forEach((c) => {
      const defaultLvl = (expMap[c.key] !== 'NA' && expMap[c.key]) ? (expMap[c.key] as BehavioralLevelCode) : 'L3';
      aligned[c.key] = {
        level: defaultLvl,
        evidence: ratings[c.key]?.evidence || '',
      };
    });

    setRatings(aligned);
    setIsEditing(true);
    toast.info('Behavioral ratings aligned to grade benchmark baseline.', 'Benchmark Baseline');
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
        evidence: userRating?.evidence?.trim() || undefined,
      };
    });

    try {
      await createMutation.mutateAsync({
        subjectId: employeeId,
        gradeKey,
        ratings: ratingsPayload,
      });
      await refetchLatest();
      setInitialRatingsString(JSON.stringify(ratings));
      setIsEditing(false);
      toast.success('Behavioral assessment evaluation saved successfully!', 'Saved');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to save assessment';
      setErrorMsg(msg);
      toast.error(msg, 'Save Failed');
    }
  };

  const filteredCompetencies = competencies.filter((c) => c.type === activeTab);

  if (isLoading || isConfigLoading) {
    return (
      <div className="p-8 text-center rounded-2xl border shadow-card space-y-4"
           style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
        <div className="w-8 h-8 mx-auto border-3 border-t-transparent rounded-full animate-spin mb-3"
             style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
        <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-2))' }}>Loading Behavioral Framework...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Read-only Alert Notice when not an evaluator */}
      {!canAssess && (
        <div className="p-4 rounded-2xl border flex items-center gap-3 shadow-card"
             style={{
               backgroundColor: 'rgb(var(--warning-soft))',
               borderColor: 'rgb(var(--warning) / 0.3)',
               color: 'rgb(var(--warning))',
             }}>
          <AlertTriangle size={16} className="shrink-0" />
          <span className="text-xs font-semibold">
            🔒 Read-only view. Behavioral competencies are evaluated by your Engineering Line Manager or Authorized Evaluator.
          </span>
        </div>
      )}

      {/* Main Score Summary Card */}
      <div className="p-6 space-y-6 rounded-2xl border shadow-card transition-all"
           style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
        
        {/* Top Identification Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4"
             style={{ borderColor: 'rgb(var(--border))' }}>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl font-black" style={{ color: 'rgb(var(--text-1))' }}>{resolvedName}</span>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'rgb(var(--accent-soft))',
                      color: 'rgb(var(--accent-txt))',
                      borderColor: 'rgb(var(--accent) / 0.3)',
                    }}>
                ID: {employeeId}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                    style={{
                      backgroundColor: 'rgb(var(--surface-2))',
                      borderColor: 'rgb(var(--border))',
                      color: 'rgb(var(--text-2))',
                    }}>
                <Lock size={10} style={{ color: 'rgb(var(--warning))' }} />
                Grade: {gradeKey} (Locked)
              </span>

              {assessment?.result?.behavioralReady === true ? (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--success-soft))',
                        color: 'rgb(var(--success))',
                        borderColor: 'rgb(var(--success) / 0.3)',
                      }}>
                  STATUS: APPROVED / PROMOTION READY
                </span>
              ) : assessment?.result?.behavioralReady === false ? (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--danger-soft))',
                        color: 'rgb(var(--danger))',
                        borderColor: 'rgb(var(--danger) / 0.3)',
                      }}>
                  STATUS: GATED BY BEHAVIOR
                </span>
              ) : (
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--surface-2))',
                        color: 'rgb(var(--text-2))',
                        borderColor: 'rgb(var(--border))',
                      }}>
                  STATUS: UNCHECKED
                </span>
              )}
            </div>

            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-2))' }}>
              Target Level: <span className="font-bold" style={{ color: 'rgb(var(--text-1))' }}>{gradeKey}</span> — Role Benchmark:{' '}
              <span className="font-bold font-mono" style={{ color: 'rgb(var(--warning))' }}>
                {liveEvaluation ? `${liveEvaluation.overallExpectedLevel} (${liveEvaluation.overallExpectedCw}cw)` : 'L3 (60cw)'}
              </span> • <span className="italic" style={{ color: 'rgb(var(--text-3))' }}>{canAssess ? 'Reviewer Mode: System Administrator / Evaluator' : 'Evaluated by: Line Manager / Authorized Evaluator'}</span>
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
                onClick={() => setViewMode('stacked')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'stacked'
                    ? 'shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: viewMode === 'stacked' ? 'rgb(var(--surface))' : 'transparent',
                  color: viewMode === 'stacked' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                }}
              >
                <ListFilter size={13} /> Stacked
              </button>
            </div>

            {canAssess && (
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

            {canAssess && !isEditing && (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer hover:brightness-105"
                style={{
                  backgroundColor: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
              >
                <Edit3 size={14} /> Evaluate Inline
              </button>
            )}
          </div>
        </div>

        {/* Top Reviewer Action Bar (when editing or reviewing) */}
        {canAssess && (
          <div className="p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border rounded-2xl shadow-card transition-all"
               style={{
                 backgroundColor: 'rgb(var(--accent-soft) / 0.25)',
                 borderColor: 'rgb(var(--accent) / 0.3)',
               }}>
            <div className="flex items-center gap-3 text-xs flex-wrap font-medium"
                 style={{ color: 'rgb(var(--text-2))' }}>
              <div>
                Overall Level: <strong className="font-extrabold font-mono" style={{ color: 'rgb(var(--text-1))' }}>
                  {liveEvaluation?.overallProficiency} ({liveEvaluation?.overallCw}cw)
                </strong>
              </div>
              <span style={{ color: 'rgb(var(--border-2))' }}>•</span>
              <div>
                Role Benchmark Req: <strong className="font-extrabold font-mono" style={{ color: 'rgb(var(--warning))' }}>
                  {gradeKey} ({liveEvaluation?.overallExpectedLevel} - {liveEvaluation?.overallExpectedCw}cw)
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
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'rgb(var(--surface))',
                    borderColor: 'rgb(var(--border))',
                    color: 'rgb(var(--text-2))',
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:brightness-110"
                style={{ backgroundColor: 'rgb(var(--success))' }}
              >
                <CheckCircle2 size={14} /> {createMutation.isPending ? 'Saving...' : 'Approve & Save Evaluation'}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl border text-xs font-semibold"
               style={{
                 backgroundColor: 'rgb(var(--danger-soft))',
                 borderColor: 'rgb(var(--danger) / 0.3)',
                 color: 'rgb(var(--danger))',
               }}>
            {errorMsg}
          </div>
        )}

        {/* ── UNIFIED HERO SECTION: Consumes AssessmentHeroLayout Primitive ── */}
        {liveEvaluation && (
          <AssessmentHeroLayout
            ladderComponent={
              <ProficiencyLadder
                title="Behavioral Proficiency Ladder"
                icon="award"
                steps={BEHAVIORAL_STEPS}
                evaluatedCode={liveEvaluation.overallProficiency}
                benchmarkCode={liveEvaluation.overallExpectedLevel}
                benchmarkSubtext={liveEvaluation.overallExpectedDec}
                gap={liveEvaluation.overallGapCw}
              />
            }
            metricCards={
              <>
                {/* Card 1: EVALUATED BAND */}
                <MetricKpiCard
                  label="EVALUATED BAND"
                  badgeContent={<BehavioralLevelBadge level={liveEvaluation.overallProficiency} size="md" />}
                  subtext="Weight"
                  subtextValue={liveEvaluation.overallDec}
                />

                {/* Card 2: ROLE BENCHMARK */}
                <MetricKpiCard
                  label="ROLE BENCHMARK"
                  primaryValue={liveEvaluation.overallExpectedLevel}
                  statusType="warning"
                  subtext="Target"
                  subtextValue={liveEvaluation.overallExpectedDec}
                />

                {/* Card 3: BENCHMARK GAP */}
                <MetricKpiCard
                  label="BENCHMARK GAP"
                  primaryValue={
                    liveEvaluation.overallGapCw > 0
                      ? `+${liveEvaluation.overallGapCw}cw`
                      : `${liveEvaluation.overallGapCw}cw`
                  }
                  statusType={liveEvaluation.overallGapCw >= 0 ? 'success' : 'danger'}
                  statusText={
                    liveEvaluation.overallGapCw > 0
                      ? 'ABOVE'
                      : liveEvaluation.overallGapCw === 0
                      ? 'MEETS'
                      : 'BELOW'
                  }
                />

                {/* Card 4: READINESS */}
                <MetricKpiCard
                  label="READINESS"
                  badgeContent={
                    liveEvaluation.behavioralReady ? (
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
                  subtextValue={liveEvaluation.isIntegrityOk ? 'Active Gating' : 'Integrity Gate'}
                />
              </>
            }
            priorities={liveEvaluation.priorities}
            radarData={liveEvaluation.radarData}
            radarTitle="Behavioral Competencies Radar"
            radarUnit="Centi-Weight (cw)"
          />
        )}

      </div>

      {/* ── Main Body Content: Breakdown & Competency Cards Grid ── */}
      <div className="space-y-4">
        
        {/* Competencies Section Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl border shadow-card"
             style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
          <div>
            <h4 className="text-sm font-extrabold flex items-center gap-2" style={{ color: 'rgb(var(--text-1))' }}>
              <span>Behavioral Competencies ({competencies.length})</span>
              {isEditing && (
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border"
                      style={{
                        backgroundColor: 'rgb(var(--accent-soft))',
                        color: 'rgb(var(--accent-txt))',
                        borderColor: 'rgb(var(--accent) / 0.3)',
                      }}>
                  EDITING INLINE
                </span>
              )}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>
              Assigned Grade Benchmark: <strong className="font-bold" style={{ color: 'rgb(var(--text-1))' }}>{gradeKey}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Core vs Leadership Switcher */}
            <div className="flex p-1 rounded-xl border text-xs"
                 style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
              <button
                type="button"
                onClick={() => setActiveTab('core')}
                className="px-3 py-1 font-bold rounded-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTab === 'core' ? 'rgb(var(--surface))' : 'transparent',
                  color: activeTab === 'core' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                  boxShadow: activeTab === 'core' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Core (6)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('leadership')}
                className="px-3 py-1 font-bold rounded-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTab === 'leadership' ? 'rgb(var(--surface))' : 'transparent',
                  color: activeTab === 'leadership' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                  boxShadow: activeTab === 'leadership' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Leadership (5)
              </button>
            </div>
          </div>
        </div>

        {/* ── Mode A: 3-Column Grid View ── */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start w-full">
            {filteredCompetencies.map((comp) => {
              const expectedLevel = expectedMatrix[gradeKey]?.[comp.key] || 'L3';
              const isNA = expectedLevel === 'NA';

              const activeRatingLevel = ratings[comp.key]?.level || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode));
              const activeEvidence = ratings[comp.key]?.evidence || '';

              const levelDetail = BEHAVIORAL_LEVEL_DETAILS[activeRatingLevel] || BEHAVIORAL_LEVEL_DETAILS['L3'];
              const expectedDetail = BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode] || BEHAVIORAL_LEVEL_DETAILS['L3'];
              const levelDef = BEHAVIORAL_COMPETENCY_DEFINITIONS[comp.key]?.[activeRatingLevel] || levelDetail.summary;
              const isExpanded = Boolean(expandedEvidence[comp.key]);

              const expCw = expectedLevel !== 'NA' ? expectedDetail.weightCw : 0;
              const gapCw = levelDetail.weightCw - expCw;

              return (
                <div
                  key={comp.key}
                  className="p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 h-full shadow-card hover:border-zinc-400 dark:hover:border-zinc-600"
                  style={{
                    backgroundColor: isNA ? 'rgb(var(--surface-2))' : 'rgb(var(--surface))',
                    borderColor: 'rgb(var(--border))',
                    opacity: isNA ? 0.75 : 1,
                  }}
                >
                  <div className="space-y-3">
                    {/* Card Header: Title + Category Pill + Critical Gate */}
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-black" style={{ color: 'rgb(var(--text-1))' }}>{comp.name}</h4>
                        <div className="flex items-center gap-1">
                          {comp.key === 'integrity' && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md border"
                                  style={{
                                    backgroundColor: 'rgb(var(--danger-soft))',
                                    color: 'rgb(var(--danger))',
                                    borderColor: 'rgb(var(--danger) / 0.3)',
                                  }}>
                              CRITICAL GATE
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border"
                                style={{
                                  backgroundColor: 'rgb(var(--accent-soft))',
                                  color: 'rgb(var(--accent-txt))',
                                  borderColor: 'rgb(var(--accent) / 0.3)',
                                }}>
                            {comp.type === 'core' ? 'CORE BEHAVIORAL' : 'LEADERSHIP'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs mt-1 leading-normal" style={{ color: 'rgb(var(--text-2))' }}>
                        {BEHAVIORAL_COMPETENCY_SUBTITLES[comp.key] || 'Behavioral evaluation metric.'}
                      </p>
                    </div>

                    {/* Top Metrics Bar: Requirement Pill & Status Gap Pill */}
                    {!isNA && (
                      <div className="flex items-center justify-between text-xs gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                              style={{
                                backgroundColor: 'rgb(var(--warning-soft))',
                                color: 'rgb(var(--warning))',
                                borderColor: 'rgb(var(--warning) / 0.3)',
                              }}>
                          ⭐ Req: {expectedLevel} ({expectedDetail.weightDec})
                        </span>

                        {gapCw > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                                style={{
                                  backgroundColor: 'rgb(var(--success-soft))',
                                  color: 'rgb(var(--success))',
                                  borderColor: 'rgb(var(--success) / 0.3)',
                                }}>
                            📈 ABOVE (+{gapCw}cw)
                          </span>
                        ) : gapCw === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                                style={{
                                  backgroundColor: 'rgb(var(--accent-soft))',
                                  color: 'rgb(var(--accent-txt))',
                                  borderColor: 'rgb(var(--accent) / 0.3)',
                                }}>
                            MEETS (0cw)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border font-mono"
                                style={{
                                  backgroundColor: 'rgb(var(--danger-soft))',
                                  color: 'rgb(var(--danger))',
                                  borderColor: 'rgb(var(--danger) / 0.3)',
                                }}>
                            📉 BELOW ({gapCw}cw)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Horizontal 5-Level Selector Bar Component */}
                    {!isNA && (
                      <LevelSelectorBar
                        levels={BEHAVIORAL_LEVEL_OPTIONS}
                        selectedCode={activeRatingLevel}
                        expectedCode={expectedLevel}
                        disabled={!canAssess}
                        onSelectLevel={(code) => handleLevelChange(comp.key, code)}
                      />
                    )}

                    {/* Active Level Summary Box */}
                    {!isNA && (
                      <div className="p-3 rounded-xl border text-xs space-y-1.5"
                           style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="flex items-center gap-1 font-mono" style={{ color: 'rgb(var(--warning))' }}>
                            Req: {expectedLevel} ({expectedDetail.weightDec})
                          </span>
                          <span className="font-mono font-bold"
                                style={{
                                  color: gapCw < 0 ? 'rgb(var(--danger))' : 'rgb(var(--success))',
                                }}>
                            Set: {activeRatingLevel} ({levelDetail.weightDec})
                          </span>
                        </div>

                        <div className="flex items-start gap-2 pt-1 border-t"
                             style={{ borderColor: 'rgb(var(--border))' }}>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-white shrink-0"
                                style={{ backgroundColor: 'rgb(var(--accent))' }}>
                            {activeRatingLevel}
                          </span>
                          <p className="italic text-[11px] leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                            "{levelDef}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evidence Notes & Quick Tags Section */}
                  {!isNA && (
                    <div className="pt-2.5 border-t space-y-2"
                         style={{ borderColor: 'rgb(var(--border))' }}>
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

                      {/* Quick Evidence Tag Pills */}
                      {canAssess && (
                        <div className="flex flex-wrap gap-1">
                          {BEHAVIORAL_EVIDENCE_TAGS[comp.key]?.map((tag) => {
                            const cleanTag = tag.replace(/^\+\s*/, '');
                            const isSelected = activeEvidence.includes(cleanTag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddEvidenceTag(comp.key, tag)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
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

                      {/* Editable Textarea / Read-only View */}
                      {canAssess && isExpanded && (
                        <textarea
                          value={activeEvidence}
                          onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                          placeholder="Add specific STAR evidence, tickets, postmortems..."
                          rows={2}
                          className="w-full mt-1.5 text-xs p-2 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: 'rgb(var(--surface-3))',
                            borderColor: 'rgb(var(--border-2))',
                            color: 'rgb(var(--text-1))',
                          }}
                        />
                      )}

                      {!canAssess && (
                        <div className="text-xs p-2.5 rounded-xl border font-medium"
                             style={{
                               backgroundColor: 'rgb(var(--surface-2))',
                               borderColor: 'rgb(var(--border))',
                               color: 'rgb(var(--text-2))',
                             }}>
                          {activeEvidence ? (
                            <span>{activeEvidence}</span>
                          ) : (
                            <span className="italic" style={{ color: 'rgb(var(--text-3))' }}>No evidence notes recorded.</span>
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

        {/* ── Mode B: Stacked Table View ── */}
        {viewMode === 'stacked' && (
          <div className="rounded-2xl border overflow-hidden shadow-card"
               style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b"
                       style={{
                         backgroundColor: 'rgb(var(--surface-2))',
                         borderColor: 'rgb(var(--border))',
                         color: 'rgb(var(--text-2))',
                       }}>
                  <tr>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Competency</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Assessed Level</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Target Bar</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Gap (cw)</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Details & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                  {filteredCompetencies.map((comp) => {
                    const expectedLevel = expectedMatrix[gradeKey]?.[comp.key] || 'L3';
                    const isNA = expectedLevel === 'NA';

                    const activeRatingLevel = ratings[comp.key]?.level || (isNA ? 'L1' : (expectedLevel as BehavioralLevelCode));
                    const activeEvidence = ratings[comp.key]?.evidence || '';

                    const levelDetail = BEHAVIORAL_LEVEL_DETAILS[activeRatingLevel] || BEHAVIORAL_LEVEL_DETAILS['L3'];
                    const levelDef = BEHAVIORAL_COMPETENCY_DEFINITIONS[comp.key]?.[activeRatingLevel] || levelDetail.summary;
                    const isExpanded = Boolean(expandedEvidence[comp.key]);

                    const expCw = expectedLevel !== 'NA' ? (BEHAVIORAL_LEVEL_DETAILS[expectedLevel as BehavioralLevelCode]?.weightCw || 60) : 0;
                    const gapCw = levelDetail.weightCw - expCw;

                    return (
                      <React.Fragment key={comp.key}>
                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                            <div className="flex items-center gap-1.5">
                              <span>{comp.name}</span>
                              {comp.key === 'integrity' && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded border"
                                      style={{
                                        backgroundColor: 'rgb(var(--danger-soft))',
                                        color: 'rgb(var(--danger))',
                                        borderColor: 'rgb(var(--danger) / 0.3)',
                                      }}>
                                  CRITICAL
                                </span>
                              )}
                              {isNA && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded"
                                      style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-3))' }}>
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {canAssess && !isNA ? (
                              <div className="flex items-center justify-center gap-1">
                                {(['L1', 'L2', 'L3', 'L4', 'L5'] as BehavioralLevelCode[]).map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleLevelChange(comp.key, lvl)}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all"
                                    style={{
                                      backgroundColor: activeRatingLevel === lvl ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
                                      color: activeRatingLevel === lvl ? '#ffffff' : 'rgb(var(--text-2))',
                                    }}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <BehavioralLevelBadge level={activeRatingLevel} size="sm" />
                                <span className="text-[10px] font-mono mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                                  {levelDetail.weightDec} ({levelDetail.weightCw}cw)
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isNA ? (
                              <span className="italic text-xs" style={{ color: 'rgb(var(--text-3))' }}>N/A</span>
                            ) : (
                              <BehavioralLevelBadge level={expectedLevel as BehavioralLevelCode} size="sm" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            {isNA ? (
                              <span style={{ color: 'rgb(var(--text-3))' }}>-</span>
                            ) : (
                              <span style={{
                                color: gapCw > 0
                                  ? 'rgb(var(--success))'
                                  : gapCw < 0
                                  ? 'rgb(var(--danger))'
                                  : 'rgb(var(--text-2))',
                              }}>
                                {gapCw > 0 ? `+${gapCw}` : gapCw}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isNA ? (
                              <span className="font-mono text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>N/A</span>
                            ) : gapCw > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border"
                                    style={{
                                      backgroundColor: 'rgb(var(--success-soft))',
                                      color: 'rgb(var(--success))',
                                      borderColor: 'rgb(var(--success) / 0.3)',
                                    }}>
                                <CheckCircle2 className="w-3 h-3" />
                                ABOVE
                              </span>
                            ) : gapCw === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border"
                                    style={{
                                      backgroundColor: 'rgb(var(--accent-soft))',
                                      color: 'rgb(var(--accent-txt))',
                                      borderColor: 'rgb(var(--accent) / 0.3)',
                                    }}>
                                MEETS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border"
                                    style={{
                                      backgroundColor: 'rgb(var(--danger-soft))',
                                      color: 'rgb(var(--danger))',
                                      borderColor: 'rgb(var(--danger) / 0.3)',
                                    }}>
                                <XCircle className="w-3 h-3" />
                                BELOW
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => toggleEvidence(comp.key)}
                              className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer hover:underline"
                              style={{ color: 'rgb(var(--accent-txt))' }}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Details</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ backgroundColor: 'rgb(var(--accent-soft) / 0.15)' }}>
                            <td colSpan={6} className="p-4 border-t border-b space-y-2"
                                style={{ borderColor: 'rgb(var(--accent) / 0.2)' }}>
                              <div className="flex items-start gap-2 text-xs">
                                <BookOpen className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'rgb(var(--accent))' }} />
                                <div>
                                  <span className="font-bold" style={{ color: 'rgb(var(--accent-txt))' }}>
                                    {activeRatingLevel} Indicator Meaning:
                                  </span>
                                  <p className="mt-0.5 italic" style={{ color: 'rgb(var(--text-2))' }}>
                                    "{levelDef}"
                                  </p>
                                </div>
                              </div>

                              {canAssess ? (
                                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'rgb(var(--border))' }}>
                                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'rgb(var(--text-3))' }}>
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
                                  <textarea
                                    value={activeEvidence}
                                    onChange={(e) => handleEvidenceChange(comp.key, e.target.value)}
                                    placeholder="Add evidence notes..."
                                    rows={2}
                                    className="w-full text-xs p-2 rounded border"
                                    style={{
                                      backgroundColor: 'rgb(var(--surface-3))',
                                      borderColor: 'rgb(var(--border-2))',
                                      color: 'rgb(var(--text-1))',
                                    }}
                                  />
                                </div>
                              ) : activeEvidence ? (
                                <div className="flex items-start gap-2 text-xs pt-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                                  <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'rgb(var(--accent))' }} />
                                  <div>
                                    <span className="font-bold" style={{ color: 'rgb(var(--accent-txt))' }}>
                                      STAR Evidence Note:
                                    </span>
                                    <p className="mt-0.5 whitespace-pre-wrap" style={{ color: 'rgb(var(--text-2))' }}>
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
