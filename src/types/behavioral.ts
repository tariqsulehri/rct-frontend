export type BehavioralLevelCode = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export const BEHAVIORAL_LEVEL_COLORS: Record<
  BehavioralLevelCode,
  { bg: string; text: string; border: string; label: string }
> = {
  L1: {
    bg: 'bg-slate-500/15 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    label: 'Intermediate',
  },
  L2: {
    bg: 'bg-blue-500/15 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800/60',
    label: 'Proficient',
  },
  L3: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800/60',
    label: 'Advanced',
  },
  L4: {
    bg: 'bg-purple-500/15 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800/60',
    label: 'Leads',
  },
  L5: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/60',
    label: 'Strategic',
  },
};

export interface BehavioralProficiencyLevel {
  code: BehavioralLevelCode;
  ordinal: number;
  centi_weight: number;
  label: string;
}

export interface BehavioralCompetencyItem {
  key: string;
  name: string;
  type: 'core' | 'leadership';
  sort: number;
}

export interface BehavioralGradeItem {
  key: string;
  ordinal: number;
  name: string;
}

export interface BehavioralEngineConfig {
  levels: BehavioralProficiencyLevel[];
  competencies: BehavioralCompetencyItem[];
  dbGrades: BehavioralGradeItem[];
  expectedMatrix: Record<string, Record<string, BehavioralLevelCode | 'NA'>>;
  grades: Record<string, { ordinal: number }>;
  competencyKeys: string[];
  criticalCompetencies: string[];
  gatePolicy: 'overall' | 'all_competencies';
  gateAppliesFromOrdinal: number;
  performanceScale: Array<{ levelDiff: number; score: number; label: string }>;
}

export interface BehavioralRatingInput {
  competencyKey: string;
  level: BehavioralLevelCode;
  evidence?: string;
}

export interface PerCompetencyResult {
  competencyKey: string;
  level: BehavioralLevelCode;
  expectedLevel: BehavioralLevelCode;
  gapCw: number;
  status: 'BELOW' | 'MEETS' | 'ABOVE';
  performance: { levelDiff: number; score: number; label: string };
}

export interface BehavioralResult {
  overallCw: number | null;
  overallProficiency: BehavioralLevelCode | null;
  overallExpectedCw: number | null;
  overallGapCw: number | null;
  overallStatus: 'BELOW' | 'MEETS' | 'ABOVE' | null;
  overallPerformance: { levelDiff: number; score: number; label: string } | null;
  perCompetency: PerCompetencyResult[];
  complete: boolean;
  isGated: boolean;
  behavioralReady: boolean | null;
  developmentPriority: string[];
  ignoredRatings: string[];
}

export interface BehavioralAssessmentData {
  id: string;
  subjectId: string;
  gradeKey: string;
  assessedAt: string;
  assessorId?: string | null;
  ratings: BehavioralRatingInput[];
  result: BehavioralResult;
}

export interface CreateBehavioralAssessmentPayload {
  subjectId: string;
  gradeKey: string;
  ratings: BehavioralRatingInput[];
}
