export type BehavioralLevelCode = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

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
