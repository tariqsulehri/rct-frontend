import React from 'react';

interface ResultSnapshotGaugeProps {
  overallScorePct: number;
  thresholdPct: number | null;
  gapResult: any;
  meetsCheckedPct: number;
}

export const ResultSnapshotGauge: React.FC<ResultSnapshotGaugeProps> = ({
  overallScorePct,
  thresholdPct,
  gapResult,
  meetsCheckedPct,
}) => {
  return (
    <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Result Snapshot & Score Gauge
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Overall score and competencies passed against the target requirement
        </p>
      </div>

      {/* Achieved Score Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-200">Overall Achieved Score</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{overallScorePct}%</span>
        </div>
        <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, overallScorePct)}%` }}
          />
          {thresholdPct !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
              style={{ left: `${Math.min(100, thresholdPct)}%` }}
              title={`Target Required Score: ${thresholdPct}%`}
            />
          )}
        </div>
        {thresholdPct !== null && (
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0%</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Target Threshold: {thresholdPct}%
            </span>
            <span>100%</span>
          </div>
        )}
      </div>

      {/* Skills Met Ratio Progress Bar */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-200">Competencies Passed</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {gapResult.meets_count} / {gapResult.total_competencies} ({meetsCheckedPct}%)
          </span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, meetsCheckedPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
