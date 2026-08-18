/**
 * Assessment Domain Helper Utilities
 * ------------------------------------
 * SSOT for CEFR and Behavioral weight/level computations shared across
 * dashboard cards and any other consumer components. All inline functions
 * previously embedded in ResourceOverviewDashboard are centralised here.
 *
 * @see src/lib/formatters.ts  — for toPct / toPctNullable / calculateReadinessScore
 */

import type { CefrEngineConfig, CefrLevelCode } from '@/types/communication';
import type { BehavioralEngineConfig, BehavioralLevelCode } from '@/types/behavioral';

// ── CEFR / Communication ─────────────────────────────────────────────────────

/**
 * Returns a 0–100 integer weight for a CEFR level code from the live config.
 * The CEFR config stores `weight` as a 0–1 decimal (e.g. 0.67 for B2 = 67%).
 * Returns 0 if the config is unavailable or the level is unrecognised.
 *
 * @param levelCode  - CEFR code e.g. 'B2'
 * @param config     - Live config object from useCommConfig()
 */
export function getCommWeightPct(
  levelCode: string,
  config: CefrEngineConfig | null | undefined
): number {
  if (!config?.cefrLevels) return 0;
  const weight = config.cefrLevels[levelCode as CefrLevelCode]?.weight;
  return weight != null ? Math.round(weight * 100) : 0;
}

// ── Behavioral ───────────────────────────────────────────────────────────────

/**
 * Returns the centi_weight integer (0–100) for a Behavioral level code.
 * `centi_weight` is stored as a whole integer in the DB: L1=20, L2=40, L3=60, L4=80, L5=100.
 * No scaling needed — value is already a percentage integer.
 * Returns 0 if the config is unavailable or the level is unrecognised.
 *
 * @param levelCode - Behavioral code e.g. 'L3'
 * @param config    - Live config object from useBehavioralConfig()
 */
export function getBehavWeightPct(
  levelCode: string,
  config: BehavioralEngineConfig | null | undefined
): number {
  if (!config?.levels) return 0;
  return config.levels.find((l) => l.code === levelCode)?.centi_weight ?? 0;
}

/**
 * Maps a 0–100 integer score back to the nearest Behavioral level code.
 * Levels are sorted descending by centi_weight; the first level whose
 * weight <= score is returned (i.e. the highest bracket the score reaches).
 * Returns null when the config is unavailable — callers treat null as "not assessed".
 *
 * @param score  - Integer on the 0–100 scale (matching centi_weight units)
 * @param config - Live config object from useBehavioralConfig()
 */
export function mapScoreToBehavCode(
  score: number,
  config: BehavioralEngineConfig | null | undefined
): BehavioralLevelCode | null {
  if (!config?.levels || config.levels.length === 0) return null;
  const sorted = [...config.levels].sort((a, b) => b.centi_weight - a.centi_weight);
  const match = sorted.find((l) => score >= l.centi_weight);
  return (match?.code ?? sorted[sorted.length - 1].code) as BehavioralLevelCode;
}
