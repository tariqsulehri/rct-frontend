import React from 'react';
import { Empty, Loading } from '../shared';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

import { useEmployeeResultSheet } from './components/result-sheet/hooks/useEmployeeResultSheet';
import { generateResultSheetPdf } from './components/result-sheet/pdfGenerator';
import { ResultSheetHeader } from './components/result-sheet/ResultSheetHeader';
import { ResultSheetKpiCards } from './components/result-sheet/ResultSheetKpiCards';
import { ResultSnapshotGauge } from './components/result-sheet/ResultSnapshotGauge';
import { SkillAreaScoresList } from './components/result-sheet/SkillAreaScoresList';
import { ActionableGapsTable } from './components/result-sheet/ActionableGapsTable';

// ─────────────────────────────────────────────────────────────────────────────
// ── Person Result Sheet PDF ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export const EmployeeResultSheetTab: React.FC<{ reportFilters?: ReportFilters }> = ({ reportFilters = DEFAULT_REPORT_FILTERS }) => {
  const data = useEmployeeResultSheet(reportFilters);

  const {
    selectedId,
    setSelectedId,
    personOptions,
    gapLoading,
    promoLoading,
    compLoading,
    gapError,
    gapResult,
    promoRow,
    isCommReady,
    commLevel,
    commExpected,
    combinedStatusText,
    combinedBadgeStyle,
    overallScorePct,
    meetsCheckedPct,
    thresholdPct,
    domainChartData,
    gapChartData,
    topGaps
  } = data;

  const handleDownloadPdf = () => {
    generateResultSheetPdf(data);
  };

  return (
    <div className="space-y-4">
      <ResultSheetHeader
        personOptions={personOptions}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        promoLoading={promoLoading}
        compLoading={compLoading}
        gapLoading={gapLoading}
        gapResult={gapResult}
        onDownloadPdf={handleDownloadPdf}
      />

      {!selectedId && <Empty msg="Select an employee to generate their result sheet." />}
      {selectedId && (gapLoading || promoLoading || compLoading) && <Loading />}
      {selectedId && gapError && <Empty msg="Failed to load result sheet details for this employee." />}

      {gapResult && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{gapResult.employee.full_name}</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                {gapResult.employee.emp_code} • {gapResult.employee.department} • {gapResult.employee.current_grade} {'->'} {gapResult.employee.target_grade}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge" style={combinedBadgeStyle}>{combinedStatusText}</span>
            </div>
          </div>

          <ResultSheetKpiCards
            gapResult={gapResult}
            promoRow={promoRow}
            overallScorePct={overallScorePct}
            thresholdPct={thresholdPct}
            isCommReady={isCommReady}
            commLevel={commLevel}
            commExpected={commExpected}
            topGaps={topGaps}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ResultSnapshotGauge
              overallScorePct={overallScorePct}
              thresholdPct={thresholdPct}
              gapResult={gapResult}
              meetsCheckedPct={meetsCheckedPct}
            />

            <SkillAreaScoresList
              domainChartData={domainChartData}
              thresholdPct={thresholdPct}
            />
          </div>

          <ActionableGapsTable gapChartData={gapChartData} />
        </div>
      )}
    </div>
  );
};
