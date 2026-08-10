/**
 * Central Utility for Score & Percentage Normalization
 * ----------------------------------------------------
 * Safely converts raw backend score values to standard integer percentage numbers (0-100).
 * Handles both decimal fraction scale (0.0 to 1.0) and percentage scale (0.0 to 100.0).
 */

export function toPct(val: number | null | undefined): number {
  if (val == null || isNaN(val)) return 0;
  return Math.round(val > 1 ? val : val * 100);
}

export function toPctNullable(val: number | null | undefined): number | null {
  if (val == null || isNaN(val)) return null;
  return Math.round(val > 1 ? val : val * 100);
}

export function formatPct(val: number | null | undefined, fallback = 'N/A'): string {
  const pct = toPctNullable(val);
  return pct === null ? fallback : `${pct}%`;
}
