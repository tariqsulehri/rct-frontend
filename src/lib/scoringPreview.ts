export type AssessmentType = 'Primary' | 'Secondary' | 'Tertiary';
export type AssessmentLevel = 'Expert' | 'Advanced' | 'Proficient' | 'Intermediate' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';

const TYPE_SCORING_VALUE: Record<AssessmentType, number> = {
  Primary: 0.25,
  Secondary: 0.15,
  Tertiary: 0.10,
};

export type AssessmentTypeScoringValues = Partial<Record<AssessmentType, number>>;
export type AssessmentLevelWeights = Partial<Record<AssessmentLevel, number>>;
export type AssessmentProjectCredits = Partial<Record<number, number>>;

const LEVEL_WEIGHT: Record<AssessmentLevel, number> = {
  Expert: 1.0,
  Advanced: 0.8,
  Proficient: 0.6,
  Intermediate: 0.4,
  Foundational: 0.4,
  Beginner: 0.4,
  Awareness: 0.2,
  Unset: 0.0,
};

/**
 * Computes a client-side score preview for a technical skill assessment.
 * Mirror algorithm of backend `computeAssessmentScore` in `backend/src/scoring/scoring.engine.ts`.
 *
 * Mathematical Model:
 *   Project Credit = Min(Max(Projects, 0), 3) / 3.0
 *   Base Score     = (Type Coeff * Project Credit) + Type Coeff
 *   Preview Score  = Round(Base Score * Level Weight, 2)
 *
 * @param type - Skill category: 'Primary', 'Secondary', or 'Tertiary'.
 * @param projects - Total project count (clamped between 0 and 3).
 * @param level - Technical level code string.
 * @param scoringValues - Optional custom skill category weights.
 * @param levelWeights - Optional custom level weights.
 * @param projectCredits - Optional custom project credit mappings.
 *
 * @returns Score preview rounded to 2 decimal places [0.00 - 1.00].
 *
 * @see documentation/backend/scoring-formula.md
 */
export function computeAssessmentScorePreview(
  type: AssessmentType,
  projects: number,
  level: AssessmentLevel,
  scoringValues: AssessmentTypeScoringValues = TYPE_SCORING_VALUE,
  levelWeights: AssessmentLevelWeights = LEVEL_WEIGHT,
  projectCredits: AssessmentProjectCredits = {},
): number {
  const projectCount = Math.min(Math.max(projects, 0), 3);
  const projectCredit = projectCredits[projectCount] ?? (projectCount / 3);
  const scoringValue = scoringValues[type] ?? TYPE_SCORING_VALUE[type];
  const baseScore = (scoringValue * projectCredit) + scoringValue;
  const levelWeight = levelWeights[level] ?? LEVEL_WEIGHT[level];

  return Math.round(baseScore * levelWeight * 100) / 100;
}
