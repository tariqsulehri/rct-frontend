export type CefrLevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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
  name: string;
  category: 'core_language' | 'professional_application';
  givenCefr: CefrLevelCode;
  givenWeight: number;
  expectedCefr: CefrLevelCode;
  expectedWeight: number;
  gap: number;
  status: 'MEETS' | 'BELOW' | 'ABOVE';
  evidence: string | null;
}

export interface CefrAssessmentResult {
  overallScore: number;
  overallCefr: CefrLevelCode;
  expectedCefr: CefrLevelCode;
  expectedScore: number;
  overallGap: number;
  overallStatus: 'MEETS' | 'BELOW' | 'ABOVE';
  isPromotionGated: boolean;
  communicationReady: boolean | null;
  developmentPriorities: CompetencyKey[];
  isComplete: boolean;
  competencyBreakdown: CompetencyEvaluation[];
}

export interface RatingInput {
  competency_key: CompetencyKey;
  cefr: CefrLevelCode;
  evidence?: string | null;
}

export interface FormattedCommAssessment {
  id: string;
  subject_id: number;
  emp_code: string;
  employee_name: string;
  org_level_key: string;
  status: 'draft' | 'pending' | 'approved';
  assessor_id: number | null;
  assessor_name: string | null;
  assessed_at: string;
  created_at: string;
  updated_at: string;
  ratings: Array<{
    competency_key: CompetencyKey;
    cefr: CefrLevelCode;
    evidence: string | null;
  }>;
  evaluation: CefrAssessmentResult;
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
