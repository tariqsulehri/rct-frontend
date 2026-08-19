import React, { useMemo } from 'react';
import { type User } from '@/store/authStore';
import { useGapMatrix } from '@/hooks/useReports';
import { useLatestCommAssessment, useCommConfig } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment, useBehavioralConfig } from '@/hooks/useBehavioral';
import { useConfigSkillDomains, useAppraisalPeriods } from '@/hooks/useConfig';
import { calculateReadinessScore, fractionToPct, roundPct, calculateTargetGrade } from '@/lib/formatters';
import {
  getCommWeightPct,
  getBehavWeightPct,
  mapScoreToBehavCode,
} from '@/lib/assessmentHelpers';
import { type CefrLevelCode } from '@/types/communication';
import { type BehavioralLevelCode } from '@/types/behavioral';
import { TabType } from '../types';

import { DashboardHeader } from './components/DashboardHeader';
import { ReadinessKpiBar } from './components/ReadinessKpiBar';
import { TechnicalDomainsCard } from './components/TechnicalDomainsCard';
import { CefrLanguageCard } from './components/CefrLanguageCard';
import { BehavioralPillarsCard } from './components/BehavioralPillarsCard';

export interface ResourceOverviewDashboardProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

/**
 * ResourceOverviewDashboard
 * --------------------------
 * Pure orchestrator — responsible only for data fetching, memoised derivations,
 * and wiring props to child components. No JSX rendering logic lives here.
 *
 * Components:
 *  - DashboardHeader     — welcome banner, grade pill, cycle badge, assess CTA
 *  - ReadinessKpiBar     — 5-card KPI stat strip
 *  - TechnicalDomainsCard — domain bar chart
 *  - CefrLanguageCard    — CEFR competency bar chart
 *  - BehavioralPillarsCard — behavioral pillar bar chart
 *
 * Utilities:
 *  - src/lib/assessmentHelpers.ts — getCommWeightPct, getBehavWeightPct, mapScoreToBehavCode
 *  - src/lib/formatters.ts        — fractionToPct, calculateReadinessScore, formatGrade
 */
export const ResourceOverviewDashboard: React.FC<ResourceOverviewDashboardProps> = ({
  user,
  onNavigate,
}) => {
  // ── API Data hooks ────────────────────────────────────────────────────────
  const { data: gapMatrixData } = useGapMatrix();

  const activeUserId = user?.empCode ? String(user.empCode) : undefined;
  const { data: commAss } = useLatestCommAssessment(activeUserId);
  const { data: behavAss } = useLatestBehavioralAssessment(activeUserId);
  const { data: commConfig } = useCommConfig();
  const { data: behavConfig } = useBehavioralConfig();
  const { data: globalDomains } = useConfigSkillDomains();
  const { data: periodsData } = useAppraisalPeriods({ status: 'ACTIVE' });

  // ── Grade targets ─────────────────────────────────────────────────────────
  const currentGrade = user?.currentGrade ?? '';
  const targetGrade = useMemo(() => calculateTargetGrade(currentGrade), [currentGrade]);

  const displayName = user?.employeeName || user?.username || 'Engineer';
  const activeCycleName = periodsData?.[0]?.name || 'Active Cycle';

  // ── 1. Technical domain chart data ───────────────────────────────────────
  const technicalChartData = useMemo(() => {
    const employees = gapMatrixData?.employees || [];
    const myEmp = employees.find(e => e.emp_code === user?.empCode) || employees[0];
    const domainGaps = myEmp?.domain_gaps;

    if (!domainGaps || Object.keys(domainGaps).length === 0) {
      if (!globalDomains || globalDomains.length === 0) return [];
      return globalDomains.map((domain) => ({
        fullLabel: domain.name,
        score: 0,
        benchmark: 0,
      }));
    }

    return Object.entries(domainGaps).map(([domain, val]) => ({
      fullLabel: domain,
      score: fractionToPct(val.score),
      benchmark: fractionToPct(val.threshold ?? 0),
    }));
  }, [gapMatrixData, globalDomains, user?.empCode]);

  // ── 1b. Technical aggregate stats ────────────────────────────────────────
  const { myScore, myRequired, myMeets, myTotal, technicalReady } = useMemo(() => {
    const employees = gapMatrixData?.employees || [];
    const myEmp = employees.find(e => e.emp_code === user?.empCode) || employees[0];
    const total = myEmp?.total_with_threshold || globalDomains?.length || 0;

    if (!technicalChartData.length || !myEmp) {
      return { myScore: 0, myRequired: 0, myMeets: 0, myTotal: total, technicalReady: false };
    }
    
    const avgScore = fractionToPct(myEmp.overall_score);
    const avgReq = fractionToPct(myEmp.overall_threshold);
    const meets = myEmp.meets_count || 0;

    return { myScore: avgScore, myRequired: avgReq, myMeets: meets, myTotal: total, technicalReady: myEmp.promotion_ready };
  }, [technicalChartData, gapMatrixData, user?.empCode, globalDomains]);

  // ── 2. CEFR Language stats ────────────────────────────────────────────────
  // Default level from config policy if unassessed — no hardcoded 'B2'
  const cefrDefaultLevel = (commConfig?.policy?.defaultLevelIfEmpty ?? null) as CefrLevelCode | null;

  const commLevel: CefrLevelCode = (commAss?.evaluation?.overallCefr as CefrLevelCode)
    || (commAss?.overallCefr as CefrLevelCode)
    || cefrDefaultLevel
    || 'A1';

  const commBenchmark: CefrLevelCode = (commAss?.evaluation?.expectedCefr as CefrLevelCode)
    || cefrDefaultLevel
    || 'A1';

  // fractionToPct safely handles 0-1 conversions to integer percentages
  const commScorePct = fractionToPct(commAss?.evaluation?.overallScore) || getCommWeightPct(commLevel, commConfig);
  const commReqPct   = fractionToPct(commAss?.evaluation?.expectedScore) || getCommWeightPct(commBenchmark, commConfig);

  const commReady = commScorePct >= commReqPct && commScorePct > 0;

  const commChartData = useMemo(() => {
    const breakdown = commAss?.evaluation?.competencyBreakdown || [];
    const defaultBenchmark = getCommWeightPct(commBenchmark, commConfig);
    const defaultAssessed = getCommWeightPct(commLevel, commConfig);
    const competencies = commConfig?.competencies || [];

    return competencies.map((comp) => {
      const match = breakdown.find(b => b.competencyKey === comp.key);
      const score = match ? (getCommWeightPct(match.cefr, commConfig) || defaultAssessed) : defaultAssessed;
      return {
        fullLabel: comp.name,
        score,
        benchmark: defaultBenchmark,
      };
    });
  }, [commAss, commLevel, commBenchmark, commConfig]);

  // ── 3. Behavioral stats ───────────────────────────────────────────────────
  const behavLevel: BehavioralLevelCode = (behavAss?.result?.overallProficiency as BehavioralLevelCode)
    || (behavConfig?.levels?.[0]?.code as BehavioralLevelCode)
    || 'L1';

  const behavBenchmark: BehavioralLevelCode = (
    behavAss?.result?.overallExpectedCw != null
      ? mapScoreToBehavCode(behavAss.result.overallExpectedCw, behavConfig)
      : null
  ) || (behavConfig?.levels?.[0]?.code as BehavioralLevelCode) || 'L1';

  // SSOT for 0-100 -> 0-100 rounding
  const behavScorePct = roundPct(behavAss?.result?.overallCw) || getBehavWeightPct(behavLevel, behavConfig);
  const behavReqPct   = roundPct(behavAss?.result?.overallExpectedCw) || getBehavWeightPct(behavBenchmark, behavConfig);

  const behavReady = behavScorePct >= behavReqPct && behavScorePct > 0;

  const behavChartData = useMemo(() => {
    const breakdown = behavAss?.result?.perCompetency || [];
    const defaultBenchmark = getBehavWeightPct(behavBenchmark, behavConfig);
    const defaultAssessed = getBehavWeightPct(behavLevel, behavConfig);
    const competencies = behavConfig?.competencies || [];

    return competencies.map((comp) => {
      const match = breakdown.find(
        (c) => c.competencyKey?.toLowerCase() === comp.key.toLowerCase()
      );
      // isAssessed: true only when the backend returned a real rating for this competency
      const isAssessed = !!match?.level;
      const score = isAssessed ? getBehavWeightPct(match!.level, behavConfig) : defaultAssessed;
      const benchmark = match?.expectedLevel ? getBehavWeightPct(match.expectedLevel, behavConfig) : defaultBenchmark;
      const assessedCode = match?.level || mapScoreToBehavCode(score, behavConfig) || behavLevel;
      const reqCode = match?.expectedLevel || mapScoreToBehavCode(benchmark, behavConfig) || behavBenchmark;

      return {
        fullName: comp.name,
        type: comp.type,
        score,
        benchmark,
        assessedCode,
        reqCode,
        isAssessed,
      };
    });
  }, [behavAss, behavLevel, behavBenchmark, behavConfig]);

  // ── Overall readiness score ───────────────────────────────────────────────
  const skillsCompletionPct = useMemo(() => calculateReadinessScore(
    myScore, myRequired, commScorePct, commReqPct, behavScorePct, behavReqPct
  ), [myScore, myRequired, commScorePct, commReqPct, behavScorePct, behavReqPct]);

  // ── Config-driven competency counts (eliminates hardcoded strings) ────────
  const coreCount = useMemo(
    () => behavConfig?.competencies.filter(c => c.type === 'core').length ?? 0,
    [behavConfig]
  );
  const leadershipCount = useMemo(
    () => behavConfig?.competencies.filter(c => c.type === 'leadership').length ?? 0,
    [behavConfig]
  );
  const cefrCompetencyCount = commConfig?.competencies?.length ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-4 px-4 sm:px-6 py-2">

      <DashboardHeader
        displayName={displayName}
        currentGrade={currentGrade}
        targetGrade={targetGrade}
        activeCycleName={activeCycleName}
        skillsCompletionPct={skillsCompletionPct}
        onNavigate={onNavigate}
      />

      <ReadinessKpiBar
        skillsCompletionPct={skillsCompletionPct}
        currentGrade={currentGrade}
        targetGrade={targetGrade}
        myScore={myScore}
        myRequired={myRequired}
        myMeets={myMeets}
        myTotal={myTotal}
        technicalReady={technicalReady}
        commLevel={commLevel}
        commBenchmark={commBenchmark}
        commScorePct={commScorePct}
        commReqPct={commReqPct}
        commReady={commReady}
        behavLevel={behavLevel}
        behavBenchmark={behavBenchmark}
        behavScorePct={behavScorePct}
        behavReqPct={behavReqPct}
        behavReady={behavReady}
      />

      <div className="flex flex-col gap-6">
        <TechnicalDomainsCard
          chartData={technicalChartData}
          myScore={myScore}
          myRequired={myRequired}
          myMeets={myMeets}
          myTotal={myTotal}
          technicalReady={technicalReady}
          onNavigate={onNavigate}
        />

        <CefrLanguageCard
          chartData={commChartData}
          commLevel={commLevel}
          commBenchmark={commBenchmark}
          commScorePct={commScorePct}
          commReqPct={commReqPct}
          commReady={commReady}
          competencyCount={cefrCompetencyCount}
          onNavigate={onNavigate}
        />

        <BehavioralPillarsCard
          chartData={behavChartData}
          behavLevel={behavLevel}
          behavBenchmark={behavBenchmark}
          behavScorePct={behavScorePct}
          behavReqPct={behavReqPct}
          behavReady={behavReady}
          coreCount={coreCount}
          leadershipCount={leadershipCount}
          onNavigate={onNavigate}
        />
      </div>

    </div>
  );
};
