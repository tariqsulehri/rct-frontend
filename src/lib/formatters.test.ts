import { describe, it, expect } from 'vitest';
import {
  toPct,
  toPctNullable,
  formatPct,
  formatGrade,
  formatEmployeeOption,
  getReadinessStatus,
} from './formatters';

describe('formatters utility (single source of truth)', () => {
  describe('toPct & toPctNullable', () => {
    it('normalizes fraction scores (0.0 to 1.0) to 0-100 percentage integer', () => {
      expect(toPct(0.734)).toBe(73);
      expect(toPct(0.88)).toBe(88);
      expect(toPct(1.0)).toBe(100);
      expect(toPct(0)).toBe(0);
    });

    it('normalizes pre-scaled percentage scores (1.0 to 100.0) without double scaling', () => {
      expect(toPct(73.4)).toBe(73);
      expect(toPct(88.0)).toBe(88);
      expect(toPct(100)).toBe(100);
    });

    it('handles null, undefined, and NaN gracefully', () => {
      expect(toPct(null)).toBe(0);
      expect(toPct(undefined)).toBe(0);
      expect(toPct(NaN)).toBe(0);

      expect(toPctNullable(null)).toBeNull();
      expect(toPctNullable(undefined)).toBeNull();
      expect(toPctNullable(NaN)).toBeNull();
    });
  });

  describe('formatPct', () => {
    it('formats percentages to string output with fallback', () => {
      expect(formatPct(0.734)).toBe('73%');
      expect(formatPct(73.4)).toBe('73%');
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
      expect(getReadinessStatus(true)).toEqual({ label: 'Ready', badgeClass: 'badge-success' });
      expect(getReadinessStatus(false)).toEqual({ label: 'In Progress', badgeClass: 'badge-warning' });
    });
  });
});
