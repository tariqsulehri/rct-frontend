import { describe, expect, it } from 'vitest';
import { computeAssessmentScorePreview } from './scoringPreview';

describe('scoring preview', () => {
  it('computes assessment preview scores using type, project, and level scoring values', () => {
    expect(computeAssessmentScorePreview('Primary', 3, 'Expert')).toBe(0.5);
    expect(computeAssessmentScorePreview('Secondary', 3, 'Advanced')).toBe(0.24);
    expect(computeAssessmentScorePreview('Tertiary', 3, 'Awareness')).toBe(0.04);
    expect(computeAssessmentScorePreview('Primary', 1, 'Proficient')).toBe(0.2);
    expect(computeAssessmentScorePreview('Secondary', 2, 'Intermediate')).toBe(0.1);
    expect(computeAssessmentScorePreview('Tertiary', 2, 'Foundational')).toBe(0.07);
    expect(computeAssessmentScorePreview('Tertiary', 2, 'Beginner')).toBe(0.07);
  });

  it('clamps project counts to the supported range', () => {
    expect(computeAssessmentScorePreview('Primary', -1, 'Expert')).toBe(0.25);
    expect(computeAssessmentScorePreview('Primary', 4, 'Expert')).toBe(0.5);
  });

  it('returns zero when no assessment level is selected', () => {
    expect(computeAssessmentScorePreview('Primary', 3, 'Unset')).toBe(0);
  });

  it('handles custom scoringValues, levelWeights, and projectCredits overrides', () => {
    const customTypeValues = { Primary: 0.3 };
    const customLevelWeights = { Expert: 1.2 };
    const customProjectCredits = { 2: 0.8 };

    const score = computeAssessmentScorePreview(
      'Primary',
      2,
      'Expert',
      customTypeValues,
      customLevelWeights,
      customProjectCredits
    );
    expect(score).toBe(0.65);
  });
});
