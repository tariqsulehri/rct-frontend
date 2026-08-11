import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, BarChart3, ListChecks, MessageSquareText, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { type User } from '@/store/authStore';
import { useCompetencyScores, usePromotionReadiness, useGapMatrix } from '@/hooks/useReports';
import { useLatestCommAssessment } from '@/hooks/useCommunication';
import { useLatestBehavioralAssessment } from '@/hooks/useBehavioral';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { toPct, formatGrade, formatEmployeeOption } from '@/lib/formatters';
import { toast } from '@/lib/toast';
import { hasPermission, isLeaderRole } from '@/types/rbac';
import { BulkAssessmentTable } from '@/components/BulkAssessmentTable';
import { SkillAreaNameFilterSelect } from '@/components/filters/TaxonomyFilterSelects';
import { CommunicationAssessmentView } from '@/components/communication/CommunicationAssessmentView';
import { BehavioralAssessmentView } from '@/components/behavioral/BehavioralAssessmentView';
import { TriDimensionReadinessCard } from '@/components/dashboard/TriDimensionReadinessCard';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';

/* ── Radar label tick: full text, position-aware alignment ─────────────── */
function RadarTick({
  payload,
  x = 0,
  y = 0,
  cx = 0,
  cy = 0,
}: {
  payload?: { value: string };
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
}) {
  if (!payload) return null;
  const dx = x - (cx as number);
  const dy = y - (cy as number);
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const labelOffset = 14;
  const labelX = x + (dx / distance) * labelOffset;
  const labelY = y + (dy / distance) * labelOffset;
  const textAnchor = Math.abs(dx) < 12 ? 'middle' : dx > 0 ? 'start' : 'end';
  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="rgb(var(--text-2))"
      fontSize={11}
    >
      {payload.value}
    </text>
  );
}

export interface AssessmentsTabProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

export const AssessmentsTab: React.FC<AssessmentsTabProps> = ({ user, onNavigate }) => {
  const { data: compData, isLoading, isFetching: isFetchingComp, refetch: refetchComp } = useCompetencyScores();
  const { data: promoData, isFetching: isFetchingPromo, refetch: refetchPromo } = usePromotionReadiness();
  const { data: gapData, isFetching: isFetchingGap, refetch: refetchGap } = useGapMatrix();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchComp(), refetchPromo(), refetchGap()]);
      toast.success('Skill progress and reports refreshed.', 'Refreshed');
    } catch {
      toast.error('Failed to refresh data. Please try again.', 'Refresh Failed');
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchComp, refetchPromo, refetchGap]);

  const c = useChartColors();
  const isPrivileged = isLeaderRole(user?.role);
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [competencySearch, setCompetencySearch] = useState('');
  const [competencyDomainFilter, setCompetencyDomainFilter] = useState('all');
  const [competencyStatusFilter, setCompetencyStatusFilter] = useState('all');
  const [competencyCriticalFilter, setCompetencyCriticalFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'competencies' | 'communication' | 'behavioral'>('overview');

  const rows = compData ?? [];
  const [selectedEmpCode, setSelectedEmpCode] = useState<string | null>(null);

  // Default to logged-in user; admin/manager can override via dropdown
  const effectiveEmpCode = selectedEmpCode ?? user?.empCode;
  const myRow = rows.find((r) => r.emp_code === effectiveEmpCode);
  const promoRow = (promoData ?? []).find((r) => r.emp_code === effectiveEmpCode);
  const gapRow = (gapData?.employees ?? []).find((r) => r.emp_code === effectiveEmpCode);

  const { data: commAssessment } = useLatestCommAssessment(effectiveEmpCode);
  const { data: behavAssessment } = useLatestBehavioralAssessment(effectiveEmpCode);

  const fromGrade = formatGrade(myRow?.current_grade, myRow?.current_grade_title);
  const toGrade = formatGrade(myRow?.target_grade, myRow?.target_grade_title);
  const selectedListRow = rows.find((r) => r.emp_code === effectiveEmpCode);
  const selectedFromGrade = formatGrade(selectedListRow?.current_grade, selectedListRow?.current_grade_title);
  const selectedToGrade = formatGrade(selectedListRow?.target_grade, selectedListRow?.target_grade_title);

  const avgThreshold = toPct(promoRow?.avg_threshold);

  const domains = Array.from(
    new Set([
      ...Object.keys(myRow?.domain_scores ?? {}),
      ...Object.keys(gapRow?.domain_gaps ?? {}),
      ...(gapData?.domains ?? []),
    ])
  );

  const radarData = domains.map((d, i) => {
    const score = toPct(myRow?.domain_scores[d]);
    const domGap = gapRow?.domain_gaps[d];
    const threshold = domGap && domGap.threshold > 0 ? toPct(domGap.threshold) : avgThreshold;
    return {
      domain: d.length > 14 ? d.slice(0, 14) + '…' : d,
      fullDomain: d,
      score,
      threshold,
      meets: threshold > 0 && score >= threshold,
      fill: c.domains[i % c.domains.length],
    };
  });

  const barData = [...radarData].sort((a, b) => b.score - a.score || a.fullDomain.localeCompare(b.fullDomain));
  const competencyRows = (gapData?.competencies ?? [])
    .map((comp) => {
      const gap = gapRow?.competency_gaps?.[comp.name];
      const score = toPct(gap?.score);
      const threshold = toPct(gap?.threshold);
      const gapPct = Math.max(0, threshold - score);
      const meets = threshold > 0 && score >= threshold;

      return {
        name: comp.name,
        domain: gap?.domain ?? comp.domain,
        score,
        threshold,
        gap: gapPct,
        meets,
        hasRequirement: threshold > 0,
        isCritical: gap?.is_critical ?? comp.is_critical,
      };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name));
  const competencyDomains = Array.from(new Set(competencyRows.map((row) => row.domain).filter(Boolean))).sort();
  const hasCompetencyFilters =
    competencySearch.trim() !== '' ||
    competencyDomainFilter !== 'all' ||
    competencyStatusFilter !== 'all' ||
    competencyCriticalFilter !== 'all';
  const filteredCompetencyRows = competencyRows.filter((row) => {
    const q = competencySearch.trim().toLowerCase();
    const matchesSearch =
      !q || row.name.toLowerCase().includes(q) || row.domain.toLowerCase().includes(q);
    const matchesDomain = competencyDomainFilter === 'all' || row.domain === competencyDomainFilter;
    const matchesStatus =
      competencyStatusFilter === 'all' ||
      (competencyStatusFilter === 'assessed' && row.score > 0) ||
      (competencyStatusFilter === 'unassessed' && row.score === 0) ||
      (competencyStatusFilter === 'meets' && row.hasRequirement && row.meets) ||
      (competencyStatusFilter === 'below' && row.hasRequirement && !row.meets) ||
      (competencyStatusFilter === 'no-target' && !row.hasRequirement);
    const matchesCritical =
      competencyCriticalFilter === 'all' ||
      (competencyCriticalFilter === 'critical' && row.isCritical) ||
      (competencyCriticalFilter === 'standard' && !row.isCritical);

    return matchesSearch && matchesDomain && matchesStatus && matchesCritical;
  });
  const filteredSkillDomainScores = Array.from(
    filteredCompetencyRows.reduce((acc, row) => {
      const current = acc.get(row.domain) ?? {
        scoreSum: 0,
        thresholdSum: 0,
        count: 0,
        requiredCount: 0,
        meetsCount: 0,
      };
      current.scoreSum += row.score;
      current.thresholdSum += row.threshold;
      current.count += 1;
      if (row.hasRequirement) {
        current.requiredCount += 1;
        if (row.meets) current.meetsCount += 1;
      }
      acc.set(row.domain, current);
      return acc;
    }, new Map<string, { scoreSum: number; thresholdSum: number; count: number; requiredCount: number; meetsCount: number }>())
  )
    .map(([domain, value]) => ({
      domain,
      score: Math.round(value.scoreSum / value.count),
      threshold: value.requiredCount > 0 ? Math.round(value.thresholdSum / value.requiredCount) : 0,
      count: value.count,
      meetsCount: value.meetsCount,
      requiredCount: value.requiredCount,
    }))
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'rgb(var(--text-2))' }}>
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}
        />
        <span className="text-sm">Loading skill data…</span>
      </div>
    );
  }

  if (!myRow || domains.length === 0) {
    const selectedName = selectedEmpCode
      ? rows.find((r) => r.emp_code === selectedEmpCode)?.full_name ?? `Resource ${selectedEmpCode}`
      : 'You';
    return (
      <div className="space-y-4 animate-slide-up">
        {isPrivileged && rows.length > 0 && (
          <div className="card p-4 flex items-center gap-3">
            <span className="text-sm font-medium shrink-0" style={{ color: 'rgb(var(--text-2))' }}>
              Viewing:
            </span>
            <div className="flex-1 min-w-0 space-y-1 sm:max-w-xl">
              <select
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
                style={{
                  background: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
                value={selectedEmpCode ?? user?.empCode ?? ''}
                onChange={(e) => setSelectedEmpCode(e.target.value)}
              >
                {rows.map((r) => (
                  <option key={r.emp_code} value={r.emp_code}>
                    {formatEmployeeOption(r.full_name, r.emp_code)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="font-semibold" style={{ color: 'rgb(var(--accent-txt))' }}>
                  From Grade:
                </span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{selectedFromGrade}</span>
                <span style={{ color: 'rgb(var(--text-3))' }}>→</span>
                <span className="font-semibold" style={{ color: 'rgb(var(--warning))' }}>
                  To Grade:
                </span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{selectedToGrade}</span>
              </div>
            </div>
          </div>
        )}
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'rgb(var(--text-1))' }}>
            No Assessments Yet
          </h3>
          <p className="text-sm mb-5" style={{ color: 'rgb(var(--text-2))' }}>
            {selectedName} {selectedName === 'You' ? 'have' : 'has'} no skill assessments recorded yet.
          </p>
          {isPrivileged && (
            <button type="button" onClick={() => onNavigate('team')} className="btn-primary">
              Start Assessing Team →
            </button>
          )}
        </div>
      </div>
    );
  }

  const overallPct = toPct(myRow?.overall_score);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="section-title">
            {myRow?.emp_code === user?.empCode ? 'My Skill Progress' : 'Skill Progress'}
          </h2>
          <p className="section-desc mt-1">Current skill scores compared with the target grade.</p>
          {isPrivileged ? (
            <div className="flex flex-col gap-1 mt-1 w-full sm:max-w-xl">
              <select
                className="w-full text-sm rounded-lg px-3 py-1.5 border outline-none"
                style={{
                  background: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
                value={selectedEmpCode ?? user?.empCode ?? ''}
                onChange={(e) => setSelectedEmpCode(e.target.value)}
              >
                {rows.map((r) => (
                  <option key={r.emp_code} value={r.emp_code}>
                    {formatEmployeeOption(r.full_name, r.emp_code)}
                  </option>
                ))}
              </select>
              <div className="grid gap-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--accent-txt))' }}>
                    From Grade:
                  </span>
                  <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--warning))' }}>
                    To Grade:
                  </span>
                  <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="section-desc grid gap-1">
              <span>{formatEmployeeOption(myRow?.full_name, myRow?.emp_code)}</span>
              <div className="flex items-start gap-2">
                <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--accent-txt))' }}>
                  From Grade:
                </span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--warning))' }}>
                  To Grade:
                </span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <p
                className="text-3xl font-bold"
                style={{
                  color:
                    avgThreshold > 0
                      ? overallPct >= avgThreshold
                        ? 'rgb(var(--success))'
                        : 'rgb(var(--danger))'
                      : 'rgb(var(--accent))',
                }}
              >
                {overallPct}%
              </p>
              {avgThreshold > 0 && (
                <>
                  <span className="text-base font-medium" style={{ color: 'rgb(var(--text-3))' }}>
                    /
                  </span>
                  <span className="text-base font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                    {avgThreshold}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
              {avgThreshold > 0 ? 'Achieved / Required' : 'Achieved Score'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isFetchingComp || isFetchingPromo || isFetchingGap || isManualRefreshing}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
              title="Refresh skill progress and scores"
            >
              <RefreshCw
                size={13}
                className={
                  isFetchingComp || isFetchingPromo || isFetchingGap || isManualRefreshing ? 'animate-spin' : ''
                }
              />
              <span>Refresh</span>
            </button>
            {isPrivileged && canViewReports && (
              <button type="button" onClick={() => onNavigate('reports')} className="btn-secondary text-xs">
                Full Reports →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clean Segmented 4-Sub-Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70 w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'overview'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <BarChart3 size={15} />
          <span>Overview & Radar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('competencies')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'competencies'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <ListChecks size={15} />
          <span>Technical Competencies ({competencyRows.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('communication')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'communication'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <MessageSquareText size={15} />
          <span>CEFR Communication</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('behavioral')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'behavioral'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Award size={15} />
          <span>Behavioral Framework</span>
        </button>
      </div>

      {/* ── Sub-Tab 4: Behavioral Framework ─────────────────────────── */}
      {activeSubTab === 'behavioral' && effectiveEmpCode && (
        <BehavioralAssessmentView
          employeeId={effectiveEmpCode}
          employeeName={myRow?.full_name || user?.employeeName || 'Employee'}
          canAssess={isPrivileged}
        />
      )}

      {/* ── Sub-Tab 3: CEFR Communication ─────────────────────────────────── */}
      {activeSubTab === 'communication' && effectiveEmpCode && (
        <CommunicationAssessmentView
          employeeId={effectiveEmpCode}
          employeeName={myRow?.full_name || user?.employeeName || 'Employee'}
          currentGradeCode={myRow?.current_grade}
          currentGradeTitle={myRow?.current_grade_title}
        />
      )}

      {/* ── Sub-Tab 1: Overview & Radar ────────────────────────────────────── */}
      {activeSubTab === 'overview' && (
        <>
          {/* Tri-Dimension Promotion Readiness Card */}
          <TriDimensionReadinessCard
            technicalReady={promoRow?.promotion_ready ?? false}
            communicationReady={commAssessment ? true : false}
            behavioralReady={behavAssessment?.result?.behavioralReady ?? false}
            currentGrade={myRow?.current_grade || 'G14'}
            targetGrade={myRow?.target_grade || 'G15'}
          />

          {/* KPI strip — status, meets, stars, required */}
          {promoRow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                Readiness
              </p>
              <InfoTip text="Ready means all required skills for the target grade are met." />
            </div>
            <p
              className="text-sm font-bold"
              style={{ color: promoRow.promotion_ready ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}
            >
              {promoRow.promotion_ready ? '✓ Ready' : '⟳ In Progress'}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                Skills Met
              </p>
              <InfoTip text="How many required skills are complete for the target grade." />
            </div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
              {promoRow.total_competencies === 0 ? 'N/A' : `${promoRow.meets_count} / ${promoRow.total_competencies}`}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                Rating
              </p>
              <InfoTip text="A quick visual rating based on the achieved score." />
            </div>
            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {'★'.repeat(promoRow.star_rating)}
              {'☆'.repeat(Math.max(0, 5 - promoRow.star_rating))}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                Target Score
              </p>
              <InfoTip text="The required score expected for the selected target grade." />
            </div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--warning))' }}>
              {avgThreshold > 0 ? `${avgThreshold}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="card p-6">
          <div className="mb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                Skill Area Coverage
              </p>
              <InfoTip text="Shows how strong this person is in each skill area." />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              How strong this person is in each skill area.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={640}>
            <RadarChart data={radarData} outerRadius="82%" margin={{ top: 76, right: 126, bottom: 76, left: 126 }}>
              <PolarGrid stroke={c.radarGrid} />
              <PolarAngleAxis dataKey="fullDomain" tick={<RadarTick />} />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: c.radarTick }}
                tickFormatter={(v) => `${v}%`}
                angle={30}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke={c.accent}
                fill={c.accent}
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {avgThreshold > 0 && (
                <Radar
                  name={`Required (${avgThreshold}%)`}
                  dataKey="threshold"
                  stroke={c.warning}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={tooltipStyle(c)}>
                      <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>
                        {d.fullDomain ?? d.domain}
                      </p>
                      <p style={{ color: c.text }}>Score: {d.score}%</p>
                      {d.threshold > 0 && (
                        <p style={{ color: d.meets ? c.success : c.danger }}>
                          Required: {d.threshold}% ({d.meets ? '✓ Meets' : '✗ Below'})
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {avgThreshold > 0 && (
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{v}</span>}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill-area gap map */}
        <div className="card p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                  Score by Skill Area
                </p>
                <InfoTip text="Compares achieved score with the required target for each skill area." />
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                Gap map of skill-area strength against the required target.
              </p>
            </div>
            <div
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'rgb(var(--surface-3))', color: 'rgb(var(--text-1))' }}
            >
              {barData.length} areas
            </div>
          </div>

          <div
            className="mb-3 grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'rgb(var(--text-3))' }}
          >
            <span>Skill area</span>
            <div className="relative">
              <div className="absolute left-0">0</div>
              <div className="absolute left-1/4 -translate-x-1/2">25</div>
              <div className="absolute left-1/2 -translate-x-1/2">50</div>
              <div className="absolute left-3/4 -translate-x-1/2">75</div>
              <div className="absolute right-0">100</div>
            </div>
            <span className="text-right">Gap</span>
          </div>

          <div className="space-y-3">
            {barData.map((d) => {
              const gap = Math.max(0, d.threshold - d.score);
              const isNear = d.threshold > 0 && !d.meets && gap <= 10;
              const rowColor =
                d.threshold > 0
                  ? d.meets
                    ? c.success
                    : isNear
                      ? c.warning
                      : c.danger
                  : d.score >= 75
                    ? c.success
                    : d.score >= 40
                      ? c.warning
                      : c.danger;
              const targetLabel = d.threshold > 0 ? `${d.threshold}% required` : 'No target set';
              const statusLabel =
                d.threshold > 0 ? (d.meets ? 'Met' : isNear ? 'Near' : 'Below') : 'Score';

              return (
                <div
                  key={d.fullDomain}
                  className="grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] items-center gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'rgb(var(--text-1))' }}>
                      {d.fullDomain}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>
                      {d.score}% achieved{d.threshold > 0 ? ` / ${d.threshold}% required` : ''}
                    </p>
                  </div>

                  <div className="relative h-6" title={`${d.fullDomain}: ${d.score}% achieved. ${targetLabel}.`}>
                    <div
                      className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                      style={{ backgroundColor: 'rgb(var(--border))' }}
                    />
                    {[25, 50, 75].map((tick) => (
                      <div
                        key={tick}
                        className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                        style={{ left: `${tick}%`, backgroundColor: 'rgb(var(--border))' }}
                      />
                    ))}
                    <div
                      className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, d.score))}%`, backgroundColor: rowColor }}
                    />
                    {d.threshold > 0 && (
                      <div
                        className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                        style={{
                          left: `calc(${Math.min(100, Math.max(0, d.threshold))}% - 1px)`,
                          backgroundColor: c.warning,
                          boxShadow: '0 0 0 2px rgb(var(--surface-1))',
                        }}
                      />
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className="inline-flex min-w-14 justify-center rounded-full px-2 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: `${rowColor}22`, color: rowColor }}
                    >
                      {d.threshold > 0 && !d.meets ? `${gap}%` : statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}

      {/* ── Sub-Tab 2: Technical Competencies ──────────────────────────────── */}
      {activeSubTab === 'competencies' && (
        <>
          {/* Engineers: manage their own skill list */}
          {!isPrivileged && user?.empCode && (
            <div className="card p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                  My Skills
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                  Add or update your skills and tools. Your manager will set skill levels. Your saved rows appear as pending
                  until approved.
                </p>
              </div>
              <button type="button" onClick={() => setShowSkillEditor(true)} className="btn-primary text-xs shrink-0">
                Manage My Skills
              </button>
            </div>
          )}

          {/* Full competency progress */}
          {competencyRows.length > 0 && (
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                      All Competencies
                    </p>
                    <InfoTip text="Shows every competency for the selected target grade, including zero scores." />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                    Full skill view for the selected person.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span
                    className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
                    style={{ color: 'rgb(var(--accent-txt))', backgroundColor: 'rgb(var(--accent-soft))' }}
                  >
                    {filteredCompetencyRows.length} / {competencyRows.length}
                  </span>
                  {promoRow && (
                    <span
                      className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
                      style={{ color: 'rgb(var(--success))', backgroundColor: 'rgb(var(--success-soft))' }}
                    >
                      {promoRow.meets_count} / {promoRow.total_competencies} met
                    </span>
                  )}
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div
              className="md:col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 border"
              style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
            >
              <Search size={14} style={{ color: 'rgb(var(--text-3))' }} />
              <input
                value={competencySearch}
                onChange={(e) => setCompetencySearch(e.target.value)}
                placeholder="Search competencies..."
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
                style={{ color: 'rgb(var(--text-1))' }}
              />
              {competencySearch && (
                <button
                  type="button"
                  onClick={() => setCompetencySearch('')}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'rgb(var(--text-3))' }}
                >
                  x
                </button>
              )}
            </div>
            <SkillAreaNameFilterSelect
              value={competencyDomainFilter}
              onChange={setCompetencyDomainFilter}
              skillAreas={competencyDomains}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={competencyStatusFilter}
                onChange={(e) => setCompetencyStatusFilter(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border outline-none"
                style={{
                  background: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
              >
                <option value="all">All statuses</option>
                <option value="assessed">Assessed</option>
                <option value="unassessed">Unassessed</option>
                <option value="meets">Meets</option>
                <option value="below">Below</option>
                <option value="no-target">No target</option>
              </select>
              <select
                value={competencyCriticalFilter}
                onChange={(e) => setCompetencyCriticalFilter(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border outline-none"
                style={{
                  background: 'rgb(var(--surface-2))',
                  borderColor: 'rgb(var(--border))',
                  color: 'rgb(var(--text-1))',
                }}
              >
                <option value="all">All types</option>
                <option value="critical">Critical</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>
          {hasCompetencyFilters && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => {
                  setCompetencySearch('');
                  setCompetencyDomainFilter('all');
                  setCompetencyStatusFilter('all');
                  setCompetencyCriticalFilter('all');
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredSkillDomainScores.length > 0 && (
            <div
              className="mb-4 grid gap-2.5"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}
            >
              {filteredSkillDomainScores.map((domainScore, idx) => {
                const meetsDomain = domainScore.threshold > 0 && domainScore.score >= domainScore.threshold;
                const nearDomain =
                  domainScore.threshold > 0 && !meetsDomain && domainScore.threshold - domainScore.score <= 10;
                const color =
                  domainScore.threshold > 0
                    ? meetsDomain
                      ? c.success
                      : nearDomain
                        ? c.warning
                        : c.danger
                    : c.domains[idx % c.domains.length];
                const statusLabel =
                  domainScore.requiredCount > 0
                    ? `${domainScore.meetsCount}/${domainScore.requiredCount} met`
                    : `${domainScore.count} comp${domainScore.count !== 1 ? 's' : ''}`;
                const statusBg =
                  domainScore.threshold > 0
                    ? meetsDomain
                      ? 'rgb(var(--success-soft))'
                      : nearDomain
                        ? 'rgb(var(--warning-soft))'
                        : 'rgb(var(--danger-soft))'
                    : 'rgb(var(--surface-3))';
                return (
                  <div
                    key={domainScore.domain}
                    className="rounded-lg border px-3 py-2.5 min-h-[82px]"
                    style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xs font-semibold leading-snug min-w-0"
                        style={{
                          color: 'rgb(var(--text-1))',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={domainScore.domain}
                      >
                        {domainScore.domain}
                      </p>
                      <span
                        className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                        style={{ color, backgroundColor: statusBg }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold leading-none" style={{ color }}>
                          {domainScore.score}%
                        </span>
                        {domainScore.threshold > 0 && (
                          <>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                              /
                            </span>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                              {domainScore.threshold}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium leading-snug">
                        <span style={{ color: 'rgb(var(--text-2))' }}>
                          {domainScore.threshold > 0 ? 'Achieved / Required' : 'Achieved'}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full mt-2 overflow-hidden"
                      style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(domainScore.score, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr style={{ color: 'rgb(var(--text-3))' }}>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 pr-3">Skill</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 px-3">Skill Area</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Achieved</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Required</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Gap</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetencyRows.map((row) => {
                  const rowColor = row.hasRequirement ? (row.meets ? c.success : c.danger) : c.text;
                  return (
                    <tr key={row.name} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                      <td className="py-3 pr-3 align-top">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="font-medium truncate"
                            style={{ color: 'rgb(var(--text-1))' }}
                            title={row.name}
                          >
                            {row.name}
                          </span>
                          {row.isCritical && (
                            <span
                              className="text-[10px] font-bold uppercase rounded-full px-1.5 py-0.5 shrink-0"
                              style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}
                            >
                              Critical
                            </span>
                          )}
                        </div>
                        <div
                          className="h-1.5 rounded-full mt-2 overflow-hidden"
                          style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(row.score, 100)}%`, backgroundColor: rowColor }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top" style={{ color: 'rgb(var(--text-2))' }}>
                        {row.domain}
                      </td>
                      <td className="py-3 px-3 text-right align-top font-semibold" style={{ color: rowColor }}>
                        {row.score}%
                      </td>
                      <td
                        className="py-3 px-3 text-right align-top"
                        style={{ color: row.hasRequirement ? c.warning : 'rgb(var(--text-3))' }}
                      >
                        {row.hasRequirement ? `${row.threshold}%` : 'N/A'}
                      </td>
                      <td
                        className="py-3 px-3 text-right align-top"
                        style={{ color: row.gap > 0 ? c.danger : 'rgb(var(--text-3))' }}
                      >
                        {row.hasRequirement ? `${row.gap}%` : 'N/A'}
                      </td>
                      <td className="py-3 pl-3 align-top">
                        <span
                          className="text-xs font-semibold rounded-full px-2 py-1"
                          style={{
                            color: row.hasRequirement ? (row.meets ? c.success : c.danger) : 'rgb(var(--text-3))',
                            backgroundColor: row.hasRequirement
                              ? row.meets
                                ? 'rgb(var(--success-soft))'
                                : 'rgb(var(--danger-soft))'
                              : 'rgb(var(--surface-2))',
                          }}
                        >
                          {!row.hasRequirement ? 'No target' : row.meets ? 'Meets' : 'Below'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCompetencyRows.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                No competencies match the selected filters.
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Skill editor modal for engineers */}
      {showSkillEditor &&
        user?.empCode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSkillEditor(false);
            }}
          >
            <div
              className="w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-elevated overflow-hidden flex flex-col"
              style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <BulkAssessmentTable
                  employeeId={user.empCode}
                  employeeName={user.employeeName || user.username}
                  readOnlyLevel
                  onSuccess={() => {
                    refetchComp();
                    refetchPromo();
                    refetchGap();
                  }}
                  onClose={() => setShowSkillEditor(false)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
