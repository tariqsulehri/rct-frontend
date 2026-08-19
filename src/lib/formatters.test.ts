import { describe, it, expect } from 'vitest';
import {
  fractionToPct,
  roundPct,
  roundPctNullable,
  formatPct,
  formatGrade,
  formatEmployeeOption,
  getReadinessStatus,
} from './formatters';

describe('formatters utility (single source of truth)', () => {
  describe('fractionToPct & roundPct & roundPctNullable', () => {
    it('normalizes fraction scores (0.0 to 1.0) to 0-100 percentage integer', () => {
      expect(fractionToPct(0.734)).toBe(73);
      expect(fractionToPct(0.88)).toBe(88);
      expect(fractionToPct(1.0)).toBe(100);
      expect(fractionToPct(0)).toBe(0);
    });

    it('rounds pre-scaled percentage scores (0.0 to 100.0)', () => {
      expect(roundPct(73.4)).toBe(73);
      expect(roundPct(88.0)).toBe(88);
      expect(roundPct(100)).toBe(100);
      expect(roundPct(58.57)).toBe(59);
    });

    it('correctly calculates team roster score averages', () => {
      const scores = Array(30).fill(58.57);
      const thresholds = Array(30).fill(72.0);

      const rawAvgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const rawAvgThresh = thresholds.reduce((sum, t) => sum + t, 0) / thresholds.length;

      expect(roundPctNullable(rawAvgScore)).toBe(59);
      expect(roundPctNullable(rawAvgThresh)).toBe(72);
      expect((roundPctNullable(rawAvgScore) ?? 0) - (roundPctNullable(rawAvgThresh) ?? 0)).toBe(-13);
    });

    it('handles null, undefined, and NaN gracefully', () => {
      expect(fractionToPct(null)).toBe(0);
      expect(fractionToPct(undefined)).toBe(0);
      expect(fractionToPct(NaN)).toBe(0);

      expect(roundPct(null)).toBe(0);
      expect(roundPct(undefined)).toBe(0);
      expect(roundPct(NaN)).toBe(0);

      expect(roundPctNullable(null)).toBeNull();
      expect(roundPctNullable(undefined)).toBeNull();
      expect(roundPctNullable(NaN)).toBeNull();
    });
  });

  describe('formatPct', () => {
    it('formats percentages to string output with fallback', () => {
      expect(formatPct(73.4)).toBe('73%');
      expect(formatPct(88.0)).toBe('88%');
      expect(formatPct(null)).toBe('N/A');
      expect(formatPct(undefined, '—')).toBe('—');
    });
  });

  describe('formatGrade', () => {
    it('combines grade code and title correctly', () => {
      expect(formatGrade('G16', 'Principal DevOps Engineer')).toBe('G16 - Principal DevOps Engineer');
      expect(formatGrade('G16', undefined)).toBe('G16');
      expect(formatGrade(undefined, undefined)).toBe('N/A');
    });
  });

  describe('formatEmployeeOption', () => {
    it('combines name and employee code correctly', () => {
      expect(formatEmployeeOption('Zain UL Abdeen', '1392')).toBe('Zain UL Abdeen · ID 1392');
      expect(formatEmployeeOption('Zain UL Abdeen', undefined)).toBe('Zain UL Abdeen');
      expect(formatEmployeeOption(undefined, undefined)).toBe('Employee');
    });
  });

  describe('getReadinessStatus', () => {
    it('returns correct readiness metadata', () => {
      expect(getReadinessStatus(true)).toEqual({ label: 'Promotion Ready', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' });
      expect(getReadinessStatus(false)).toEqual({ label: 'Developing', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' });
    });
  });
});
