export type CefrLevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_COLORS: Record<
  CefrLevelCode,
  { bg: string; text: string; border: string; glow: string }
> = {
  A1: {
    bg: 'bg-zinc-500/15 dark:bg-zinc-800/60',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
    glow: 'shadow-zinc-500/10',
  },
  A2: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-800/60',
    glow: 'shadow-cyan-500/10',
  },
  B1: {
    bg: 'bg-sky-500/15 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800/60',
    glow: 'shadow-sky-500/10',
  },
  B2: {
    bg: 'bg-indigo-500/15 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800/60',
    glow: 'shadow-indigo-500/10',
  },
  C1: {
    bg: 'bg-purple-500/15 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800/60',
    glow: 'shadow-purple-500/10',
  },
  C2: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/60',
    glow: 'shadow-amber-500/10',
  },
};

export type CompetencyKey =
  | 'written_clarity'
  | 'spoken_fluency'
  | 'presentation'
  | 'active_listening'
  | 'stakeholder_exec'
  | 'cross_cultural';

export type OrgLevelKey =
  | 'associate'
  | 'engineer'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'senior_mgr'
  | 'director'
  | 'vp'
  | 'c_level';

export interface CefrLevelDefinition {
  code: CefrLevelCode;
  label: string;
  weight: number;
  description: string;
}

export interface CompetencyDefinition {
  key: CompetencyKey;
  name: string;
  category: 'core_language' | 'professional_application';
  description: string;
}

export interface OrgLevelDefinition {
  key: OrgLevelKey;
  title: string;
  minLevel: number;
  maxLevel: number;
  benchmarkCefr: CefrLevelCode;
  promotionGated: boolean;
}

export interface CefrEngineConfig {
  cefrLevels: Record<CefrLevelCode, CefrLevelDefinition>;
  bandThresholds: Array<{ band: CefrLevelCode; min: number; max: number }>;
  competencies: CompetencyDefinition[];
  orgLevels: Record<OrgLevelKey, OrgLevelDefinition>;
  targetOverrides: Record<string, Partial<Record<CompetencyKey, CefrLevelCode>>>;
  policy: {
    minimumRequiredCompetencies: number;
    gatingThresholdOrgLevel: OrgLevelKey;
    defaultLevelIfEmpty: CefrLevelCode;
    roundingPrecision: number;
  };
}

export interface CompetencyEvaluation {
  competencyKey: CompetencyKey;
  cefr: CefrLevelCode;
  expectedCefr: CefrLevelCode;
  gap: number;
  status: 'MEETS' | 'BELOW' | 'ABOVE';
  evidence?: string | null;
}

export interface CefrAssessmentResult {
  overallScore: number;
  overallWeight?: number | null;
  overallCefr: CefrLevelCode;
  expectedCefr: CefrLevelCode;
  expectedScore: number;
  overallExpectedWeight?: number;
  overallGap: number;
  overallStatus: 'MEETS' | 'BELOW' | 'ABOVE';
  isPromotionGated: boolean;
  isGated?: boolean;
  communicationReady: boolean | null;
  developmentPriorities: CompetencyKey[];
  developmentPriority?: CompetencyKey[];
  isComplete: boolean;
  complete?: boolean;
  competencyBreakdown: CompetencyEvaluation[];
  perCompetency?: CompetencyEvaluation[] | Record<string, unknown>[];
}

export interface RatingInput {
  competency_key: CompetencyKey;
  cefr: CefrLevelCode;
  evidence?: string | null;
}

export interface FormattedCommAssessment {
  id: string;
  employee_id: number;
  subject_id: number;
  emp_code: string;
  employee_name: string;
  org_level_key: string;
  status: 'draft' | 'pending' | 'approved';
  assessor_id: number | null;
  assessor_name: string | null;
  appraisal_period_id?: number | null;
  period?: {
    id: number;
    code: string;
    name: string;
  } | null;
  assessed_at: string;
  created_at: string;
  updated_at: string;
  ratings?: Array<{
    competency_key: CompetencyKey;
    cefr: CefrLevelCode;
    evidence: string | null;
  }>;
  ratingCount?: number;
  overallCefr?: CefrLevelCode | null;
  overallGap?: number | null;
  overallStatus?: 'MEETS' | 'BELOW' | 'ABOVE' | null;
  communicationReady?: boolean | null;
  evaluation?: CefrAssessmentResult;
}

export interface CreateCommAssessmentPayload {
  employee_id: string;
  org_level_key?: OrgLevelKey;
  status?: 'draft' | 'pending' | 'approved';
  ratings: RatingInput[];
}

export interface UpdateCommAssessmentStatusPayload {
  status: 'draft' | 'pending' | 'approved';
  ratings?: RatingInput[];
}
