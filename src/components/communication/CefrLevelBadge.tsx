import React from 'react';
import { CefrLevelCode, CEFR_COLORS } from '@/types/communication';
export { CEFR_COLORS };

export interface CefrLevelBadgeProps {
  level: CefrLevelCode | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CefrLevelBadge: React.FC<CefrLevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const code = (level as CefrLevelCode) in CEFR_COLORS ? (level as CefrLevelCode) : 'A1';
  const color = CEFR_COLORS[code];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs font-semibold rounded',
    md: 'px-2.5 py-1 text-xs font-bold rounded-md',
    lg: 'px-3.5 py-1.5 text-sm font-black rounded-lg tracking-wide',
  }[size];

  const labels: Record<CefrLevelCode, string> = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced',
    C2: 'Proficient / Mastery',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono ${color.bg} ${color.text} ${color.border} ${sizeClasses} ${className}`}
      title={`${code} - ${labels[code]}`}
    >
      <span>{code}</span>
      {showLabel && <span className="font-sans font-normal opacity-80">({labels[code]})</span>}
    </span>
  );
};
