import { useState, useMemo, useEffect } from 'react';
import { useGapAnalysis, usePromotionReadiness, useCompetencyScores } from '@/hooks/useReports';
import { useEmployeeReadinessMetrics } from '@/hooks/useEmployeeReadinessMetrics';
import { fractionToPct } from '@/lib/formatters';
import type { ReportFilters } from '@/components/reports/reportFilters';
import type { GapResult } from '@/components/reports/shared';

export const useEmployeeResultSheet = (reportFilters: ReportFilters) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { data: gapData, isLoading: gapLoading, isError: gapError } = useGapAnalysis(selectedId);
  const { data: promoData, isLoading: promoLoading } = usePromotionReadiness();
  const { data: compData, isLoading: compLoading } = useCompetencyScores();

  const personOptions = useMemo(() => {
    const people = new Map<string, { emp_code: string; full_name: string; department?: string; current_grade?: string; target_grade?: string }>();
    const promoByCode = new Map((promoData ?? []).map((row) => [row.emp_code, row]));
    const compByCode = new Map((compData ?? []).map((row) => [row.emp_code, row]));
    for (const row of promoData ?? []) {
      people.set(row.emp_code, {
        emp_code: row.emp_code,
        full_name: row.full_name,
        department: row.department,
        current_grade: row.current_grade,
        target_grade: row.target_grade,
      });
    }
    for (const row of compData ?? []) {
      if (!people.has(row.emp_code)) {
        people.set(row.emp_code, {
          emp_code: row.emp_code,
          full_name: row.full_name,
          department: row.department,
          current_grade: row.current_grade,
          target_grade: row.target_grade,
        });
      }
    }
    const q = reportFilters.search.trim().toLowerCase();
    return [...people.values()]
      .filter((person) => {
        const promo = promoByCode.get(person.emp_code);
        const comp = compByCode.get(person.emp_code);
        const isReady = Boolean(promo?.promotion_ready);
        const nearReady = Boolean(
          promo &&
          !promo.promotion_ready &&
          promo.total_competencies > 0 &&
          promo.meets_count / promo.total_competencies >= 0.75
        );
        const matchesSearch = !q || `${person.full_name} ${person.emp_code}`.toLowerCase().includes(q);
        const matchesDepartment = reportFilters.department === 'all' || person.department === reportFilters.department;
        const matchesCurrent = reportFilters.currentGrade === 'all' || person.current_grade === reportFilters.currentGrade;
        const matchesTarget = reportFilters.targetGrade === 'all' || person.target_grade === reportFilters.targetGrade;
        const matchesSkillArea = reportFilters.skillArea === 'all' || comp?.domain_scores?.[reportFilters.skillArea] !== undefined;
        const matchesReadiness =
          reportFilters.readiness === 'all' ||
          (reportFilters.readiness === 'ready' && isReady) ||
          (reportFilters.readiness === 'near-ready' && nearReady) ||
          (reportFilters.readiness === 'not-ready' && !isReady && !nearReady);
        return matchesSearch && matchesDepartment && matchesCurrent && matchesTarget && matchesSkillArea && matchesReadiness;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [compData, promoData, reportFilters]);

  useEffect(() => {
    if (promoLoading || compLoading || !selectedId) return;
    if (!personOptions.some((person) => person.emp_code === selectedId)) {
      setSelectedId(null);
    }
  }, [compLoading, personOptions, promoLoading, selectedId]);

  const gapResult = gapData as GapResult | undefined;
  const promoRow = (promoData ?? []).find(r => String(r.emp_code) === String(selectedId));
  const compRow = (compData ?? []).find(r => String(r.emp_code) === String(selectedId));

  const metrics = useEmployeeReadinessMetrics(selectedId);

  const isTechReady = metrics.isTechReady;
  const techScore = metrics.techScore;
  const techReq = metrics.techTarget;

  const commLevel = metrics.commLevel;
  const commExpected = metrics.commTargetLevel;
  const isCommReady = metrics.isCommReady;

  const isBehavReady = metrics.isBehavReady;

  const readinessScore = metrics.overallReadinessScore;

  let combinedStatusText = 'NOT READY';
  let combinedBadgeStyle = { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' };

  if (isTechReady && isCommReady && isBehavReady) {
    combinedStatusText = 'PROMOTION READY';
    combinedBadgeStyle = { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' };
  } else if (isTechReady && isBehavReady && !isCommReady) {
    combinedStatusText = 'CEFR GATED';
    combinedBadgeStyle = { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' };
  } else if (isTechReady && isCommReady && !isBehavReady) {
    combinedStatusText = 'BEHAVIORAL GAP';
    combinedBadgeStyle = { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' };
  } else if (!isTechReady) {
    combinedStatusText = 'TECH GAP';
    combinedBadgeStyle = { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' };
  }

  const domainRows = Object.entries(compRow?.domain_scores ?? {})
    .filter(([domain]) => reportFilters.skillArea === 'all' || domain === reportFilters.skillArea)
    .map(([domain, score]) => ({ domain, score: fractionToPct(score) }))
    .sort((a, b) => b.score - a.score);

  const visibleGaps = (gapResult?.gaps ?? [])
    .filter((g: any) => reportFilters.skillArea === 'all' || g.domain_name === reportFilters.skillArea);

  const topGaps = visibleGaps
    .filter((g: any) => g.gap > 0)
    .sort((a: any, b: any) => b.gap - a.gap);

  const overallScorePct = fractionToPct(techScore);
  const meetsCheckedPct = promoRow && promoRow.total_competencies > 0
    ? fractionToPct(promoRow.meets_count / promoRow.total_competencies)
    : gapResult && gapResult.total_competencies > 0
      ? fractionToPct(gapResult.meets_count / gapResult.total_competencies)
      : 0;
  const thresholdPct = fractionToPct(techReq);

  const domainChartData = domainRows.slice(0, 10).map((d) => ({
    domain: d.domain.length > 14 ? `${d.domain.slice(0, 14)}…` : d.domain,
    fullDomain: d.domain,
    score: d.score,
  }));

  const gapChartData = topGaps.slice(0, 8).map((g: any) => ({
    skill: g.competency_name.length > 16 ? `${g.competency_name.slice(0, 16)}…` : g.competency_name,
    fullSkill: g.competency_name,
    score: fractionToPct(g.score),
    target: fractionToPct(g.threshold),
    gap: fractionToPct(g.gap),
  }));

  return {
    selectedId,
    setSelectedId,
    personOptions,
    gapLoading,
    promoLoading,
    compLoading,
    gapError,
    gapResult,
    promoRow,
    isTechReady,
    isCommReady,
    commLevel,
    commExpected,
    readinessScore,
    combinedStatusText,
    combinedBadgeStyle,
    overallScorePct,
    meetsCheckedPct,
    thresholdPct,
    domainChartData,
    domainRows,
    visibleGaps,
    gapChartData,
    topGaps
  };
};
