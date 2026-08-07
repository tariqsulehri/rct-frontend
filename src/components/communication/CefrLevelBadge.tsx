import React from 'react';
import { CefrLevelCode } from '@/types/communication';

export const CEFR_COLORS: Record<
  CefrLevelCode,
  { bg: string; text: string; border: string; glow: string }
> = {
  A1: {
    bg: 'bg-zinc-500/15 dark:bg-zinc-800/60',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
    glow: 'shadow-zinc-500/10',
  },
  A2: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-800/60',
    glow: 'shadow-cyan-500/10',
  },
  B1: {
    bg: 'bg-sky-500/15 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800/60',
    glow: 'shadow-sky-500/10',
  },
  B2: {
    bg: 'bg-indigo-500/15 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800/60',
    glow: 'shadow-indigo-500/10',
  },
  C1: {
    bg: 'bg-purple-500/15 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800/60',
    glow: 'shadow-purple-500/10',
  },
  C2: {
    bg: 'bg-amber-500/15 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800/60',
    glow: 'shadow-amber-500/10',
  },
};

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
