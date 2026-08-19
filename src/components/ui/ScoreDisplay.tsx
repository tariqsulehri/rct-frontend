import React from 'react';

export interface ScoreDisplayProps {
  score: number;
  threshold?: number;
  label?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'stacked' | 'horizontal';
  align?: 'start' | 'center' | 'end';
  showLabel?: boolean;
  showThreshold?: boolean;
  colorBehavior?: 'auto' | 'accent' | 'neutral' | 'inherit';
  className?: string;
}

/**
 * ScoreDisplay
 * ------------
 * A shared UI primitive for displaying metric KPI cards (e.g. Achieved Score vs Required Threshold).
 * Implements strict typography and dynamic color states according to the UI/UX Design Standards.
 */
export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  threshold,
  label,
  size = 'md',
  layout = 'stacked',
  align = 'end',
  showLabel = true,
  showThreshold = true,
  colorBehavior = 'auto',
  className = '',
}) => {
  // Map size to text classes
  const sizeClass = {
    xs: 'text-xs',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[size];

  // Dynamic color resolution
  let colorVar: string | undefined = undefined;
  if (colorBehavior === 'auto') {
    colorVar = 'rgb(var(--accent))';
    if (threshold && threshold > 0) {
      colorVar = score >= threshold ? 'rgb(var(--success))' : 'rgb(var(--danger))';
    }
  } else if (colorBehavior === 'accent') {
    colorVar = 'rgb(var(--accent))';
  } else if (colorBehavior === 'neutral') {
    colorVar = 'rgb(var(--text-1))';
  }

  const displayLabel = label || (threshold && threshold > 0 ? 'Achieved / Required' : 'Achieved Score');

  // Alignment mapping
  const alignClass = {
    start: 'items-start text-left',
    center: 'items-center text-center',
    end: 'items-end text-right',
  }[align];
  
  const flexAlignJustify = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  }[align];

  // Layout mapping
  const layoutClass = layout === 'horizontal' ? 'flex-row gap-3 items-center' : `flex-col ${alignClass}`;

  return (
    <div className={`flex ${layoutClass} ${className}`}>
      <div className={`flex items-baseline gap-1.5 ${layout === 'stacked' ? flexAlignJustify : ''}`}>
        <p
          className={`${sizeClass} font-bold font-mono tabular-nums leading-none`}
          style={colorVar ? { color: colorVar } : {}}
        >
          {score}%
        </p>
        {showThreshold && threshold !== undefined && threshold > 0 && (
          <>
            <span className="text-base font-medium opacity-50" style={{ color: colorBehavior === 'inherit' ? 'inherit' : 'rgb(var(--text-3))' }}>
              /
            </span>
            <span className="text-base font-semibold font-mono tabular-nums" style={{ color: colorBehavior === 'inherit' ? 'inherit' : 'rgb(var(--text-2))' }}>
              {threshold}%
            </span>
          </>
        )}
      </div>
      {showLabel && (
        <div className={`${size === 'xs' ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-wider ${layout === 'stacked' ? 'mt-0.5' : ''}`} style={{ color: colorBehavior === 'inherit' ? 'inherit' : 'rgb(var(--text-3))' }}>
          {displayLabel}
        </div>
      )}
    </div>
  );
};

