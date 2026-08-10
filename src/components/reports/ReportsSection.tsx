import React, { useState } from 'react';
import { ExecutiveLeaderboardTab } from './tabs/ExecutiveLeaderboardTab';
import { PromotionReadinessTab } from './tabs/PromotionReadinessTab';
import { EmployeeResultSheetTab } from './tabs/EmployeeResultSheetTab';
import { CompetencyScoresTab } from './tabs/CompetencyScoresTab';
import { GapAnalysisTab } from './tabs/GapAnalysisTab';
import { ExecutiveSummaryTab } from './tabs/ExecutiveSummaryTab';
import { CefrAnalyticsTab } from './tabs/CefrAnalyticsTab';
import { YoYGrowthTab } from './tabs/YoYGrowthTab';
import { ReportFilterBar } from './ReportFilterBar';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from './reportFilters';
import type { ReportTabId } from './ReportSidebar';

interface ReportsSectionProps {
  activeTab: ReportTabId;
  onSelectTab?: (tabId: ReportTabId) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ activeTab }) => {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Executive Analytics & Reports Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pro-level organizational health KPIs, technical domain matrices, CEFR communication gating, and YoY growth reports.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CY2026 Active Period
            </span>
          </div>
        </div>
      </div>

      {/* Global Multi-Angle Filter Bar */}
      <ReportFilterBar filters={filters} onFilterChange={setFilters} />

      {/* Main Full-Width Visualization Canvas */}
      <main className="w-full min-w-0">
        {activeTab === 'executive_leaderboard' && <ExecutiveLeaderboardTab reportFilters={filters} />}
        {activeTab === 'executive_summary' && <ExecutiveSummaryTab reportFilters={filters} />}
        {activeTab === 'cefr_analytics' && <CefrAnalyticsTab reportFilters={filters} />}
        {activeTab === 'promotion_readiness' && <PromotionReadinessTab reportFilters={filters} />}
        {activeTab === 'competency_scores' && <CompetencyScoresTab reportFilters={filters} />}
        {activeTab === 'competency_matrix' && <CompetencyScoresTab reportFilters={filters} />}
        {activeTab === 'gap_analysis' && <GapAnalysisTab reportFilters={filters} />}
        {activeTab === 'skills_summary' && <CompetencyScoresTab reportFilters={filters} />}
        {activeTab === 'employee_result_sheet' && <EmployeeResultSheetTab reportFilters={filters} />}
        {activeTab === 'yoy_growth' && <YoYGrowthTab reportFilters={filters} />}
      </main>
    </div>
  );
};
