import React from 'react';
import { BehavioralLevelCode, BEHAVIORAL_LEVEL_COLORS } from '@/types/behavioral';
export { BEHAVIORAL_LEVEL_COLORS };

export interface BehavioralLevelBadgeProps {
  level: BehavioralLevelCode | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const BehavioralLevelBadge: React.FC<BehavioralLevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const code = (level as BehavioralLevelCode) in BEHAVIORAL_LEVEL_COLORS ? (level as BehavioralLevelCode) : 'L1';
  const color = BEHAVIORAL_LEVEL_COLORS[code];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs font-semibold rounded',
    md: 'px-2.5 py-1 text-xs font-bold rounded-md',
    lg: 'px-3.5 py-1.5 text-sm font-black rounded-lg tracking-wide',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono ${color.bg} ${color.text} ${color.border} ${sizeClasses} ${className}`}
      title={`${code} - ${color.label}`}
    >
      <span>{code}</span>
      {showLabel && <span className="font-sans font-normal opacity-90">{color.label}</span>}
    </span>
  );
};
