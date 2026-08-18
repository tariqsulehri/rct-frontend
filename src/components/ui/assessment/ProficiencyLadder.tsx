import React from 'react';
import { Star, Target, Award } from 'lucide-react';

export interface LadderStep {
  code: string;
  label?: string;
  weightDec: string; // e.g. "0.33", "0.60"
  weightNum?: number;
}

export interface ProficiencyLadderProps {
  title?: string;
  icon?: 'target' | 'award';
  steps: LadderStep[];
  evaluatedCode: string;
  benchmarkCode: string;
  benchmarkSubtext?: string;
  gap?: number; // positive = above, negative = below, 0 = meets
  className?: string;
}

/**
 * Enterprise Single Source of Truth Proficiency Ladder Component.
 * Implements standard tile sizing (h-16 min-h-[64px]) and 3-state semantic coloring:
 * - 🔴 Red (Danger) when below benchmark
 * - 🔵 Blue (Accent) when meeting benchmark
 * - 🟢 Green (Success) when exceeding benchmark
 * - ⭐ Gold Star for Role Required Benchmark target
 */
export const ProficiencyLadder: React.FC<ProficiencyLadderProps> = ({
  title = 'Proficiency Ladder',
  icon = 'target',
  steps,
  evaluatedCode,
  benchmarkCode,
  benchmarkSubtext,
  gap = 0,
  className = '',
}) => {
  const IconComponent = icon === 'award' ? Award : Target;

  const isBelow = gap < 0;
  const isAbove = gap > 0;
  const evaluatedBg = isBelow
    ? 'rgb(var(--danger))'
    : isAbove
    ? 'rgb(var(--success))'
    : 'rgb(var(--accent))';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${className}`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        borderColor: 'rgb(var(--border))',
      }}
    >
      {/* Header Bar */}
      <div
        className="flex items-center justify-between text-xs font-bold flex-wrap gap-2 mb-3"
        style={{ color: 'rgb(var(--text-1))' }}
      >
        <span className="flex items-center gap-1.5">
          <IconComponent size={15} style={{ color: 'rgb(var(--accent))' }} />
          <span>{title}</span>
        </span>
        <span className="font-mono text-xs" style={{ color: 'rgb(var(--text-2))' }}>
          Benchmark:{' '}
          <strong className="font-bold font-mono" style={{ color: 'rgb(var(--warning))' }}>
            {benchmarkCode} {benchmarkSubtext ? `(${benchmarkSubtext})` : ''}
          </strong>
        </span>
      </div>

      {/* Ladder Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step) => {
          const isEvaluated = evaluatedCode === step.code;
          const isTarget = benchmarkCode === step.code;

          return (
            <div
              key={step.code}
              className={`relative h-16 min-h-[64px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                isEvaluated
                  ? 'text-white shadow-md ring-2 scale-[1.02]'
                  : isTarget
                  ? 'border-dashed'
                  : ''
              }`}
              style={{
                backgroundColor: isEvaluated
                  ? evaluatedBg
                  : isTarget
                  ? 'rgb(var(--warning-soft))'
                  : 'rgb(var(--surface-2))',
                borderColor: isEvaluated
                  ? evaluatedBg
                  : isTarget
                  ? 'rgb(var(--warning) / 0.5)'
                  : 'rgb(var(--border))',
                color: isEvaluated
                  ? '#ffffff'
                  : isTarget
                  ? 'rgb(var(--warning))'
                  : 'rgb(var(--text-1))',
              }}
            >
              {/* Benchmark Target Star Badge */}
              {isTarget && (
                <div
                  className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 text-white rounded-full p-0.5 shadow-sm"
                  style={{ backgroundColor: 'rgb(var(--warning))' }}
                  title="Role Required Benchmark"
                >
                  <Star size={10} fill="currentColor" />
                </div>
              )}

              {/* Level Code */}
              <div className="font-extrabold text-sm flex items-center justify-center gap-1">
                <span>{step.code}</span>
              </div>

              {/* Decimal Weight */}
              <div
                className="text-[10px] font-mono font-bold mt-0.5"
                style={{
                  color: isEvaluated ? 'rgba(255,255,255,0.9)' : 'rgb(var(--text-3))',
                }}
              >
                {step.weightDec}
              </div>

              {/* Evaluated / Target Status Pill */}
              {isEvaluated && (
                <div className="text-[8px] font-black uppercase tracking-wider mt-0.5 bg-white/20 px-1.5 py-0.2 rounded text-white">
                  EVALUATED
                </div>
              )}
              {!isEvaluated && isTarget && (
                <div
                  className="text-[8px] font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: 'rgb(var(--warning))' }}
                >
                  TARGET
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
