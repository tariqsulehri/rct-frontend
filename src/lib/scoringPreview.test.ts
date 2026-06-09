import { describe, expect, it } from 'vitest';
import { computeAssessmentScorePreview } from './scoringPreview';

describe('scoring preview', () => {
  it('computes assessment preview scores using type, project, and level scoring values', () => {
    expect(computeAssessmentScorePreview('Primary', 3, 'Expert')).toBe(0.5);
    expect(computeAssessmentScorePreview('Secondary', 3, 'Advanced')).toBe(0.24);
    expect(computeAssessmentScorePreview('Tertiary', 3, 'Awareness')).toBe(0.04);
  });

  it('clamps project counts to the supported range', () => {
    expect(computeAssessmentScorePreview('Primary', -1, 'Expert')).toBe(0.25);
    expect(computeAssessmentScorePreview('Primary', 4, 'Expert')).toBe(0.5);
  });

  it('returns zero when no assessment level is selected', () => {
    expect(computeAssessmentScorePreview('Primary', 3, 'Unset')).toBe(0);
  });
});
