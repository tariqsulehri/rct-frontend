import React from 'react';

export interface MetricKpiCardProps {
  label: string;
  badgeContent?: React.ReactNode;
  primaryValue?: string;
  subtext?: string;
  subtextValue?: string;
  statusType?: 'success' | 'warning' | 'danger' | 'neutral';
  statusText?: string;
  className?: string;
}

/**
 * Enterprise Metric KPI Card Primitive.
 * Standardizes the 4 hero metric indicators (Evaluated Band, Benchmark, Gap, Readiness).
 */
export const MetricKpiCard: React.FC<MetricKpiCardProps> = ({
  label,
  badgeContent,
  primaryValue,
  subtext,
  subtextValue,
  statusType,
  statusText,
  className = '',
}) => {
  return (
    <div
      className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${className}`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        borderColor: 'rgb(var(--border))',
      }}
    >
      <span
        className="text-[10px] font-extrabold uppercase tracking-wider"
        style={{ color: 'rgb(var(--text-3))' }}
      >
        {label}
      </span>

      <div className="mt-2 space-y-1">
        {badgeContent && <div>{badgeContent}</div>}

        {primaryValue && (
          <div
            className="text-base font-black font-mono"
            style={{
              color:
                statusType === 'success'
                  ? 'rgb(var(--success))'
                  : statusType === 'danger'
                  ? 'rgb(var(--danger))'
                  : statusType === 'warning'
                  ? 'rgb(var(--warning))'
                  : 'rgb(var(--text-1))',
            }}
          >
            {primaryValue}
          </div>
        )}

        {statusText && (
          <div className="text-[10px] font-bold uppercase" style={{ color: 'rgb(var(--text-3))' }}>
            {statusText}
          </div>
        )}

        {subtext && (
          <div className="text-[11px] font-mono" style={{ color: 'rgb(var(--text-2))' }}>
            {subtext}:{' '}
            <strong className="font-bold font-mono" style={{ color: 'rgb(var(--text-1))' }}>
              {subtextValue}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
};
