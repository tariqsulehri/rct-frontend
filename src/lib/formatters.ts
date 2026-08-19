/**
 * Central Utility for Score & Percentage Normalization & Data Formatting
 * ------------------------------------------------------------------------
 * Single source of truth for converting raw score values, grades, and status badges.
 */

/**
 * Safely rounds a pre-scaled percentage (e.g., 80.5) to an integer (81) or returns null.
 */
export function roundPctNullable(val: number | null | undefined): number | null {
  if (val == null || isNaN(val)) return null;
  return Math.round(val);
}

/**
 * Explicitly converts a decimal fraction (e.g., 0.8) into a percentage (80).
 */
export function fractionToPct(val: number | null | undefined, maxScale: number = 1): number {
  if (val == null || isNaN(val)) return 0;
  return Math.round((val / maxScale) * 100);
}

/**
 * Explicitly rounds a pre-scaled percentage (e.g., 80.5) to an integer (81).
 */
export function roundPct(val: number | null | undefined): number {
  if (val == null || isNaN(val)) return 0;
  return Math.round(val);
}

/**
 * Safely clamps a percentage value between 0 and 100.
 * Useful for CSS width properties to prevent overflow.
 */
export function clampPct(val: number): number {
  if (isNaN(val)) return 0;
  return Math.max(0, Math.min(100, val));
}

/**
 * Formats a raw score into a display string (e.g. "73%") with a fallback.
 */
export function formatPct(val: number | null | undefined, fallback = 'N/A'): string {
  const pct = roundPctNullable(val);
  return pct === null ? fallback : `${pct}%`;
}

/**
 * Formats a grade code and title into a standard display string (e.g. "G16 - Principal DevOps Engineer").
 */
export function formatGrade(code?: string, title?: string, fallback = 'N/A'): string {
  return [code, title].filter(Boolean).join(' - ') || fallback;
}

/**
 * Calculates the target grade string by incrementing the numeric portion of the current grade.
 * (e.g., "G15" -> "G16").
 */
export function calculateTargetGrade(currentGrade: string | undefined | null): string {
  if (!currentGrade) return '';
  const num = parseInt(currentGrade.replace(/\D/g, ''), 10);
  return !isNaN(num) ? `G${num + 1}` : currentGrade;
}

/**
 * Formats employee name and ID into standard dropdown/header option string (e.g. "Zain UL Abdeen · ID 1392").
 */
export function formatEmployeeOption(name?: string, empCode?: string, fallback = 'Employee'): string {
  return [name, empCode ? `ID ${empCode}` : undefined].filter(Boolean).join(' · ') || fallback;
}

/**
 * Returns standard readiness status metadata (label & CSS color variable tokens).
 */
export function getReadinessStatus(ready?: boolean): { label: string; badgeClass: string } {
  return ready
    ? { label: 'Promotion Ready', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : { label: 'Developing', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
}

/**
 * Calculates the final normalized readiness percentage using configured weights.
 * Defaults to 50% Technical, 30% Communication, 20% Behavioral (from backend schema).
 * Validates inputs and clamps the max value to 100.
 */
export function calculateReadinessScore(
  techScore: number, techReq: number,
  commScorePct: number, commReqPct: number,
  behavScorePct: number, behavReqPct: number,
  weights = { tech: 50, comm: 30, behav: 20 }
): number {
  const techFactor = techReq > 0 ? (techScore / techReq) * weights.tech : 0;
  const commFactor = commReqPct > 0 ? (commScorePct / commReqPct) * weights.comm : 0;
  const behavFactor = behavReqPct > 0 ? (behavScorePct / behavReqPct) * weights.behav : 0;
  return Math.min(100, Math.round(techFactor + commFactor + behavFactor));
}
