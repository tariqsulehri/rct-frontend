export type AssessmentType = 'Primary' | 'Secondary' | 'Tertiary';
export type AssessmentLevel = 'Expert' | 'Advanced' | 'Proficient' | 'Foundational' | 'Awareness' | 'Unset';

const TYPE_COEFFICIENT: Record<AssessmentType, number> = {
  Primary: 0.25,
  Secondary: 0.15,
  Tertiary: 0.10,
};

const LEVEL_WEIGHT: Record<AssessmentLevel, number> = {
  Expert: 1.0,
  Advanced: 0.8,
  Proficient: 0.6,
  Foundational: 0.4,
  Awareness: 0.2,
  Unset: 0.0,
};

export function computeAssessmentScorePreview(
  type: AssessmentType,
  projects: number,
  level: AssessmentLevel,
): number {
  const projectCount = Math.min(Math.max(projects, 0), 3);
  const coefficient = TYPE_COEFFICIENT[type];
  const baseScore = (coefficient * projectCount / 3) + coefficient;
  const levelWeight = LEVEL_WEIGHT[level];

  return Math.round(baseScore * levelWeight * 100) / 100;
}

