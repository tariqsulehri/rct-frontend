import React from 'react';
import { Star } from 'lucide-react';

export interface LevelOption {
  code: string;
  weightDec: string;
  weightNum?: number;
}

export interface LevelSelectorBarProps {
  levels: LevelOption[];
  selectedCode: string;
  expectedCode: string;
  expectedWeightNum?: number;
  disabled?: boolean;
  onSelectLevel: (code: string) => void;
  className?: string;
}

/**
 * Enterprise Single Source of Truth Level Selector Bar for Competency Cards.
 * Implements standard card tile sizing (h-14 min-h-[56px]) and dynamic 3-state semantic colors:
 * - 🔴 Red (Danger) when below benchmark
 * - 🔵 Blue (Accent) when meeting benchmark
 * - 🟢 Green (Success) when exceeding benchmark
 * - ⭐ Gold Star for role required benchmark
 */
export const LevelSelectorBar: React.FC<LevelSelectorBarProps> = ({
  levels,
  selectedCode,
  expectedCode,
  disabled = false,
  onSelectLevel,
  className = '',
}) => {
  const expectedIndex = levels.findIndex((l) => l.code === expectedCode);

  return (
    <div
      className={`grid gap-1.5 pt-1 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))`,
      }}
    >
      {levels.map((lvl, index) => {
        const isSelected = selectedCode === lvl.code;
        const isTarget = expectedCode === lvl.code;

        const isBelow = index < expectedIndex;
        const isAbove = index > expectedIndex;

        const selectedBg = isBelow
          ? 'rgb(var(--danger))'
          : isAbove
          ? 'rgb(var(--success))'
          : 'rgb(var(--accent))';

        return (
          <button
            key={lvl.code}
            type="button"
            disabled={disabled}
            onClick={() => onSelectLevel(lvl.code)}
            title={`${lvl.code} (${lvl.weightDec})`}
            className={`relative h-14 min-h-[56px] p-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
              isSelected
                ? 'text-white shadow-md ring-2 scale-[1.03]'
                : isTarget
                ? 'border-dashed'
                : ''
            } ${disabled ? 'cursor-default' : 'hover:scale-[1.02] cursor-pointer'}`}
            style={{
              backgroundColor: isSelected
                ? selectedBg
                : isTarget
                ? 'rgb(var(--warning-soft))'
                : 'rgb(var(--surface-2))',
              borderColor: isSelected
                ? selectedBg
                : isTarget
                ? 'rgb(var(--warning) / 0.5)'
                : 'rgb(var(--border))',
              color: isSelected
                ? '#ffffff'
                : isTarget
                ? 'rgb(var(--warning))'
                : 'rgb(var(--text-2))',
            }}
          >
            {isTarget && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-white rounded-full p-0.5 shadow-xs"
                style={{ backgroundColor: 'rgb(var(--warning))' }}
                title="Role Requirement Benchmark"
              >
                <Star size={9} fill="currentColor" />
              </div>
            )}
            <div className="text-xs font-black">{lvl.code}</div>
            <div
              className="text-[9px] font-mono font-bold mt-0.5"
              style={{
                color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgb(var(--text-3))',
              }}
            >
              {lvl.weightDec}
            </div>
            {isSelected && (
              <div className="text-[8px] font-black uppercase tracking-wider mt-0.5 bg-white/20 px-1 rounded text-white">
                ✓ SET
              </div>
            )}
            {!isSelected && isTarget && (
              <div
                className="text-[8px] font-bold uppercase tracking-wider mt-0.5"
                style={{ color: 'rgb(var(--warning))' }}
              >
                ★ Req
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
