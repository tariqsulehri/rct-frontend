/**
 * Central Utility for Score & Percentage Normalization & Data Formatting
 * ------------------------------------------------------------------------
 * Single source of truth for converting raw score values, grades, and status badges.
 */

/**
 * Normalizes a score value to a 0–100 percentage integer (always returns 0..100).
 * Handles both decimal fraction scale (0.0 to 1.0) and pre-scaled percentage scale (0.0 to 100.0).
 */
export function toPct(val: number | null | undefined): number {
  if (val == null || isNaN(val)) return 0;
  return Math.round(val > 1 ? val : val * 100);
}

/**
 * Normalizes a score value to a 0–100 percentage integer or null if value is empty/invalid.
 */
export function toPctNullable(val: number | null | undefined): number | null {
  if (val == null || isNaN(val)) return null;
  return Math.round(val > 1 ? val : val * 100);
}

/**
 * Formats a raw score into a display string (e.g. "73%") with a fallback.
 */
export function formatPct(val: number | null | undefined, fallback = 'N/A'): string {
  const pct = toPctNullable(val);
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
 * Calculates the final normalized readiness percentage using the 40/30/30 weighting rule.
 * 40% Technical, 30% Communication, 30% Behavioral.
 * Validates inputs and clamps the max value to 100.
 */
export function calculateReadinessScore(
  techScore: number, techReq: number,
  commScorePct: number, commReqPct: number,
  behavScorePct: number, behavReqPct: number
): number {
  const techFactor = techReq > 0 ? (techScore / techReq) * 40 : 0;
  const commFactor = commReqPct > 0 ? (commScorePct / commReqPct) * 30 : 0;
  const behavFactor = behavReqPct > 0 ? (behavScorePct / behavReqPct) * 30 : 0;
  return Math.min(100, Math.round(techFactor + commFactor + behavFactor));
}
