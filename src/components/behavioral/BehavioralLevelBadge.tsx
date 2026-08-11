import React from 'react';
import { BehavioralLevelCode } from '@/types/behavioral';

export const BEHAVIORAL_LEVEL_COLORS: Record<
  BehavioralLevelCode,
  { bg: string; text: string; border: string; label: string }
> = {
  L1: {
    bg: 'bg-slate-500/15 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    label: 'Intermediate',
  },
  L2: {
    bg: 'bg-blue-500/15 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800/60',
    label: 'Proficient',
  },
  L3: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800/60',
    label: 'Advanced',
  },
  L4: {
    bg: 'bg-purple-500/15 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800/60',
    label: 'Leads',
  },
  L5: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/60',
    label: 'Strategic',
  },
};

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
