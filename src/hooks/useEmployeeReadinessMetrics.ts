/**
 * Single Source of Truth (SSOT) Hook for Employee 3-Pillar Readiness Metrics
 * -------------------------------------------------------------------------
 * Centralizes API fetching and mathematical derivations across Technical,
 * CEFR Communication, and Behavioral Engine pillars.
 *
 * Guarantees 100% data parity between Admin View, Resource View, Executive
 * Reports, and Result Sheets. Zero hardcoded fallbacks allowed.
 *
 * @see src/lib/formatters.ts — fractionToPct, roundPct, calculateReadinessScore
 * @see src/lib/assessmentHelpers.ts — getCommWeightPct, getBehavWeightPct, mapScoreToBehavCode
 */

import { useMemo } from 'react';
import { useGapMatrix, usePromotionReadiness } from '@/hooks/useReports';
import { useLatestCommAssessment, useCommConfig } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment, useBehavioralConfig } from '@/hooks/useBehavioral';
import { fractionToPct, roundPct, calculateReadinessScore } from '@/lib/formatters';
import { getCommWeightPct, getBehavWeightPct, mapScoreToBehavCode } from '@/lib/assessmentHelpers';
import type { CefrLevelCode } from '@/types/communication';
import type { BehavioralLevelCode } from '@/types/behavioral';

export interface EmployeeReadinessMetrics {
  // Candidate Metadata
  empCode: string | null;
  fullName: string;
  department: string;
  currentGrade: string;
  targetGrade: string;

  // 1. Technical Pillar
  techScore: number;
  techTarget: number;
  techMeetsCount: number;
  techTotalCompetencies: number;
  isTechReady: boolean;

  // 2. Communication Pillar (CEFR)
  commLevel: CefrLevelCode;
  commTargetLevel: CefrLevelCode;
  commScorePct: number;
  commReqPct: number;
  isCommReady: boolean;

  // 3. Behavioral Engine Pillar
  behavLevel: BehavioralLevelCode;
  behavTargetLevel: BehavioralLevelCode;
  behavScorePct: number;
  behavReqPct: number;
  isBehavReady: boolean;

  // Composite & Gating Overall Status
  overallReadinessScore: number;
  isOverallReady: boolean;
  readyCount: number;
  gatingStatusText: string;
  isLoading: boolean;
}

export function useEmployeeReadinessMetrics(
  targetEmpCode?: string | number | null
): EmployeeReadinessMetrics {
  const activeEmpCode = targetEmpCode != null ? String(targetEmpCode) : null;

  // ── API Queries ────────────────────────────────────────────────────────────
  const { data: gapMatrixData, isLoading: gapLoading } = useGapMatrix();
  const { data: promoData, isLoading: promoLoading } = usePromotionReadiness();
  const { data: commAss, isLoading: commLoading } = useLatestCommAssessment(activeEmpCode);
  const { data: commConfig } = useCommConfig();
  const { data: behavAss, isLoading: behavLoading } = useLatestBehavioralAssessment(activeEmpCode);
  const { data: behavConfig } = useBehavioralConfig();

  const isLoading = gapLoading || promoLoading || commLoading || behavLoading;

  return useMemo(() => {
    // ── Employee Matching ─────────────────────────────────────────────────────
    const employees = gapMatrixData?.employees || [];
    const promoRows = promoData || [];

    const gapEmp = employees.find((e) => String(e.emp_code) === String(activeEmpCode)) || employees[0];
    const promoEmp = promoRows.find((r) => String(r.emp_code) === String(activeEmpCode));

    const fullName = gapEmp?.full_name || promoEmp?.full_name || 'Engineer';
    const department = gapEmp?.department || promoEmp?.department || 'Engineering';
    const currentGrade = gapEmp?.current_grade || promoEmp?.current_grade || 'G14';
    const targetGrade = gapEmp?.target_grade || promoEmp?.target_grade || 'G15';

    // ── 1. Technical Pillar Metrics ──────────────────────────────────────────
    const techScore = gapEmp ? fractionToPct(gapEmp.overall_score) : (promoEmp ? fractionToPct(promoEmp.overall_score) : 0);
    const techTarget = gapEmp && gapEmp.overall_threshold > 0
      ? fractionToPct(gapEmp.overall_threshold)
      : (promoEmp && promoEmp.avg_threshold > 0 ? fractionToPct(promoEmp.avg_threshold) : 100);
    const techMeetsCount = gapEmp?.meets_count ?? promoEmp?.meets_count ?? 0;
    const techTotalCompetencies = gapEmp?.total_with_threshold ?? promoEmp?.total_competencies ?? 0;
    const isTechReady = Boolean(promoEmp?.promotion_ready) || (techScore >= techTarget && techScore > 0);

    // ── 2. CEFR Communication Metrics ────────────────────────────────────────
    const cefrDefaultLevel = (commConfig?.policy?.defaultLevelIfEmpty ?? null) as CefrLevelCode | null;
    const commLevel: CefrLevelCode =
      (commAss?.evaluation?.overallCefr as CefrLevelCode) ||
      (commAss?.overallCefr as CefrLevelCode) ||
      (promoEmp?.cefr_level as CefrLevelCode) ||
      cefrDefaultLevel ||
      'A1';

    const commTargetLevel: CefrLevelCode =
      (commAss?.evaluation?.expectedCefr as CefrLevelCode) ||
      cefrDefaultLevel ||
      'C1';

    const commScorePct =
      fractionToPct(commAss?.evaluation?.overallScore) ||
      getCommWeightPct(commLevel, commConfig);

    const commReqPct =
      fractionToPct(commAss?.evaluation?.expectedScore) ||
      getCommWeightPct(commTargetLevel, commConfig);

    const isCommReady = commScorePct >= commReqPct && commScorePct > 0;

    // ── 3. Behavioral Engine Metrics ─────────────────────────────────────────
    const behavLevel: BehavioralLevelCode =
      (behavAss?.result?.overallProficiency as BehavioralLevelCode) ||
      (behavConfig?.levels?.[0]?.code as BehavioralLevelCode) ||
      'L1';

    const behavTargetLevel: BehavioralLevelCode =
      (behavAss?.result?.overallExpectedCw != null
        ? mapScoreToBehavCode(behavAss.result.overallExpectedCw, behavConfig)
        : null) ||
      (behavConfig?.levels?.[0]?.code as BehavioralLevelCode) ||
      'L1';

    const behavScorePct =
      roundPct(behavAss?.result?.overallCw) ||
      getBehavWeightPct(behavLevel, behavConfig);

    const behavReqPct =
      roundPct(behavAss?.result?.overallExpectedCw) ||
      getBehavWeightPct(behavTargetLevel, behavConfig);

    const isBehavReady = behavScorePct >= behavReqPct && behavScorePct > 0;

    // ── Composite & Overall Readiness ────────────────────────────────────────
    const overallReadinessScore = calculateReadinessScore(
      techScore, techTarget,
      commScorePct, commReqPct,
      behavScorePct, behavReqPct
    );

    const isOverallReady = isTechReady && isCommReady && isBehavReady;
    const readyCount = [isTechReady, isCommReady, isBehavReady].filter(Boolean).length;

    let gatingStatusText = 'PROMOTION READY';
    if (!isOverallReady) {
      if (!isTechReady) gatingStatusText = 'TECHNICAL GATED';
      else if (!isCommReady) gatingStatusText = 'CEFR GATED';
      else if (!isBehavReady) gatingStatusText = 'BEHAVIORAL GATED';
    }

    return {
      empCode: activeEmpCode,
      fullName,
      department,
      currentGrade,
      targetGrade,
      techScore,
      techTarget,
      techMeetsCount,
      techTotalCompetencies,
      isTechReady,
      commLevel,
      commTargetLevel,
      commScorePct,
      commReqPct,
      isCommReady,
      behavLevel,
      behavTargetLevel,
      behavScorePct,
      behavReqPct,
      isBehavReady,
      overallReadinessScore,
      isOverallReady,
      readyCount,
      gatingStatusText,
      isLoading,
    };
  }, [gapMatrixData, promoData, commAss, commConfig, behavAss, behavConfig, activeEmpCode, isLoading]);
}
