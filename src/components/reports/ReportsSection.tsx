import React, { useState } from 'react';
import { PromotionReadinessTab } from './tabs/PromotionReadinessTab';
import { EmployeeResultSheetTab } from './tabs/EmployeeResultSheetTab';
import { CompetencyScoresTab } from './tabs/CompetencyScoresTab';
import { GapAnalysisTab } from './tabs/GapAnalysisTab';
import { ExecutiveSummaryTab } from './tabs/ExecutiveSummaryTab';
import { CefrAnalyticsTab } from './tabs/CefrAnalyticsTab';
import { YoYGrowthTab } from './tabs/YoYGrowthTab';
import { ReportSidebar, ReportTabId } from './ReportSidebar';

export const ReportsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTabId>('executive_summary');

  return (
    <div className="space-y-4">
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

      {/* Main Workspace Layout with Segmented Executive Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Executive Sidebar */}
        <ReportSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Right Active Report Canvas */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'executive_summary' && <ExecutiveSummaryTab />}
          {activeTab === 'cefr_analytics' && <CefrAnalyticsTab />}
          {activeTab === 'promotion_readiness' && <PromotionReadinessTab />}
          {activeTab === 'competency_scores' && <CompetencyScoresTab />}
          {activeTab === 'competency_matrix' && <CompetencyScoresTab />}
          {activeTab === 'gap_analysis' && <GapAnalysisTab />}
          {activeTab === 'skills_summary' && <CompetencyScoresTab />}
          {activeTab === 'employee_result_sheet' && <EmployeeResultSheetTab />}
          {activeTab === 'yoy_growth' && <YoYGrowthTab />}
        </main>
      </div>
    </div>
  );
};
