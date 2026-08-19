import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, BarChart3, ListChecks, MessageSquareText, Award, Layers } from 'lucide-react';
import { type User } from '@/store/authStore';
import { useCompetencyScores, usePromotionReadiness, useGapMatrix } from '@/hooks/useReports';
import { useChartTheme } from '@/hooks/useChartTheme';
import { fractionToPct, roundPct, formatGrade, formatEmployeeOption } from '@/lib/formatters';
import { toast } from '@/lib/toast';
import { hasPermission, isLeaderRole } from '@/types/rbac';
import { BulkAssessmentTable } from '@/components/BulkAssessmentTable';
import { CommunicationAssessmentView } from '@/components/communication/CommunicationAssessmentView';
import { BehavioralAssessmentView } from '@/components/behavioral/BehavioralAssessmentView';
import { TriDimensionReadinessCard } from '@/components/dashboard/TriDimensionReadinessCard';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';
import { SkillTile } from '@/components/ui/SkillTile';
import { IconBadge } from '@/components/ui/IconBadge';

// Modular Sub-Components
import { DomainProgressOverview } from './components/assessments/DomainProgressOverview';
import { CompetencyFiltersBar } from './components/assessments/CompetencyFiltersBar';
import { CompetencyTableView } from './components/assessments/CompetencyTableView';
import { TriDimensionRadar } from './components/assessments/TriDimensionRadar';
import { PriorityGapMatrix } from './components/assessments/PriorityGapMatrix';

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

  const c = useChartTheme();
  const isPrivileged = isLeaderRole(user?.role);
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [competencySearch, setCompetencySearch] = useState('');
  const [competencyDomainFilter, setCompetencyDomainFilter] = useState('all');
  const [competencyStatusFilter, setCompetencyStatusFilter] = useState('all');
  const [competencyCriticalFilter, setCompetencyCriticalFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'competencies' | 'communication' | 'behavioral'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const rows = compData ?? [];
  const [selectedEmpCode, setSelectedEmpCode] = useState<string | null>(null);

  // Default to logged-in user; admin/manager can override via dropdown
  const effectiveEmpCode = selectedEmpCode ?? user?.empCode ?? null;
  const myRow = rows.find((r) => r.emp_code === effectiveEmpCode);
  const promoRow = (promoData ?? []).find((r) => r.emp_code === effectiveEmpCode);
  const gapRow = (gapData?.employees ?? []).find((r) => r.emp_code === effectiveEmpCode);

  const competencyRows = (gapData?.competencies ?? [])
    .map((comp) => {
      const gap = gapRow?.competency_gaps?.[comp.name];
      const score = fractionToPct(gap?.score);
      const threshold = fractionToPct(gap?.threshold);
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

  const clearCompetencyFilters = () => {
    setCompetencySearch('');
    setCompetencyDomainFilter('all');
    setCompetencyStatusFilter('all');
    setCompetencyCriticalFilter('all');
  };

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
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading assessment dataset...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Employee Selector (Leader) ─────────────────────────────────── */}
      {isPrivileged && rows.length > 0 && (
        <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
            >
              👤
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-3))' }}>
                Viewing Assessment For
              </p>
              <select
                value={effectiveEmpCode ?? ''}
                onChange={(e) => setSelectedEmpCode(e.target.value || null)}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                style={{ color: 'rgb(var(--text-1))' }}
              >
                {rows.map((r) => (
                  <option key={r.emp_code} value={r.emp_code} className="bg-surface text-text-1">
                    {formatEmployeeOption(r.full_name, r.emp_code)} ({r.current_grade_title ?? r.current_grade})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {myRow && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className="px-2 py-1 rounded-md font-semibold"
                style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}
              >
                Grade: {formatGrade(myRow.current_grade, myRow.current_grade_title)}
              </span>
              {myRow.target_grade && (
                <span
                  className="px-2 py-1 rounded-md font-semibold"
                  style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
                >
                  Next: {formatGrade(myRow.target_grade, myRow.target_grade_title)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--text-1))' }}>
            Skill Assessments & Readiness
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>
            Multi-dimensional evaluation across Technical, Behavioral, and Communication pillars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetchingComp || isFetchingPromo || isFetchingGap || isManualRefreshing}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isFetchingComp || isManualRefreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>

          {canViewReports && (
            <button
              type="button"
              className="btn-primary text-xs px-3 py-1.5"
              onClick={() => onNavigate('reports')}
            >
              View Full Reports →
            </button>
          )}

          {isPrivileged && user?.empCode && (
            <button
              type="button"
              className="btn-ghost text-xs px-3 py-1.5"
              onClick={() => setShowSkillEditor((prev) => !prev)}
            >
              {showSkillEditor ? 'Hide Assessment Panel' : 'Bulk Assessment Panel'}
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Selector Navigation */}
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto" style={{ borderColor: 'rgb(var(--border))' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'overview' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeSubTab === 'overview' ? 'rgb(var(--surface-2))' : 'transparent',
            color: activeSubTab === 'overview' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
            borderColor: activeSubTab === 'overview' ? 'rgb(var(--border))' : 'transparent',
            borderWidth: 1,
          }}
        >
          <IconBadge icon={<BarChart3 size={13} />} color="warning" size="sm" />
          Overview & Readiness
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('competencies')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'competencies' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeSubTab === 'competencies' ? 'rgb(var(--surface-2))' : 'transparent',
            color: activeSubTab === 'competencies' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
            borderColor: activeSubTab === 'competencies' ? 'rgb(var(--border))' : 'transparent',
            borderWidth: 1,
          }}
        >
          <IconBadge icon={<ListChecks size={13} />} color="success" size="sm" />
          Technical Competencies ({competencyRows.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('communication')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'communication' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeSubTab === 'communication' ? 'rgb(var(--surface-2))' : 'transparent',
            color: activeSubTab === 'communication' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
            borderColor: activeSubTab === 'communication' ? 'rgb(var(--border))' : 'transparent',
            borderWidth: 1,
          }}
        >
          <IconBadge icon={<MessageSquareText size={13} />} color="info" size="sm" />
          Communication (CEFR)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('behavioral')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'behavioral' ? 'shadow-sm' : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: activeSubTab === 'behavioral' ? 'rgb(var(--surface-2))' : 'transparent',
            color: activeSubTab === 'behavioral' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
            borderColor: activeSubTab === 'behavioral' ? 'rgb(var(--border))' : 'transparent',
            borderWidth: 1,
          }}
        >
          <IconBadge icon={<Award size={13} />} color="accent" size="sm" />
          Behavioral Assessment
        </button>
      </div>

      {/* ── Sub-Tab 1: Overview & Multi-Dimensional Readiness ───────────── */}
      {activeSubTab === 'overview' && (
        <>
          <TriDimensionReadinessCard
            technicalReady={promoRow?.promotion_ready}
            communicationReady={promoRow ? !promoRow.is_cefr_gated : false}
            behavioralReady={true}
            currentGrade={formatGrade(myRow?.current_grade, myRow?.current_grade_title)}
            targetGrade={formatGrade(myRow?.target_grade, myRow?.target_grade_title)}
            technicalScore={roundPct(promoRow?.overall_score ?? 45)}
            commBand={promoRow?.is_cefr_gated ? 'B1' : 'C1'}
            targetCommBand="C1"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TriDimensionRadar
              techScore={roundPct(promoRow?.overall_score ?? 45)}
              commScore={promoRow?.is_cefr_gated ? 50 : 85}
              behavioralScore={80}
              techTarget={roundPct(promoRow?.avg_threshold ?? 100)}
              commTarget={83}
              behavioralTarget={80}
              chartTheme={c}
            />

            <PriorityGapMatrix
              topGaps={competencyRows
                .filter((r) => r.hasRequirement && !r.meets)
                .sort((a, b) => b.gap - a.gap || (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0))}
              chartTheme={c}
            />
          </div>
        </>
      )}

      {/* ── Sub-Tab 2: Technical Competencies ──────────────────────────────── */}
      {activeSubTab === 'competencies' && (
        <>
          {competencyRows.length > 0 && (
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <IconBadge icon={<ListChecks size={13} />} color="success" size="sm" />
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

              <CompetencyFiltersBar
                competencySearch={competencySearch}
                setCompetencySearch={setCompetencySearch}
                competencyDomainFilter={competencyDomainFilter}
                setCompetencyDomainFilter={setCompetencyDomainFilter}
                competencyStatusFilter={competencyStatusFilter}
                setCompetencyStatusFilter={setCompetencyStatusFilter}
                competencyCriticalFilter={competencyCriticalFilter}
                setCompetencyCriticalFilter={setCompetencyCriticalFilter}
                competencyDomains={competencyDomains}
                hasCompetencyFilters={hasCompetencyFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
                clearFilters={clearCompetencyFilters}
              />

              <DomainProgressOverview
                filteredSkillDomainScores={filteredSkillDomainScores}
                chartTheme={c}
              />

              <div className="flex items-center justify-between mb-3 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'rgb(var(--text-2))' }}>
                  <IconBadge icon={<Layers size={13} />} color="accent" size="sm" /> Competency Assessment Tiles ({filteredCompetencyRows.length})
                </h3>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCompetencyRows.map((row) => (
                    <SkillTile
                      key={row.name}
                      name={row.name}
                      domain={row.domain}
                      score={row.score}
                      required={row.threshold}
                      isCritical={row.isCritical}
                      meets={row.meets}
                      hasRequirement={row.hasRequirement}
                    />
                  ))}
                </div>
              ) : (
                <CompetencyTableView
                  filteredCompetencyRows={filteredCompetencyRows}
                  chartTheme={c}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ── Sub-Tab 3: Communication Assessment (CEFR) ──────────────────────── */}
      {activeSubTab === 'communication' && (
        <CommunicationAssessmentView
          employeeId={effectiveEmpCode ?? ''}
          employeeName={myRow?.full_name ?? user?.employeeName ?? user?.username ?? 'Employee'}
        />
      )}

      {/* ── Sub-Tab 4: Behavioral Assessment ─────────────────────────────── */}
      {activeSubTab === 'behavioral' && (
        <BehavioralAssessmentView
          employeeId={effectiveEmpCode ?? ''}
          employeeName={myRow?.full_name ?? user?.employeeName ?? user?.username ?? 'Employee'}
        />
      )}

      {/* Skill editor modal for leaders */}
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
