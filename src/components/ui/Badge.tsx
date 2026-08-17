import React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  neutral: {
    bg: 'rgb(var(--surface-2))',
    text: 'rgb(var(--text-2))',
    border: 'rgb(var(--border))',
    dot: 'rgb(var(--text-3))',
  },
  accent: {
    bg: 'rgb(var(--accent-soft))',
    text: 'rgb(var(--accent-txt))',
    border: 'rgb(var(--accent) / 0.3)',
    dot: 'rgb(var(--accent))',
  },
  success: {
    bg: 'rgb(var(--success-soft))',
    text: 'rgb(var(--success))',
    border: 'rgb(var(--success) / 0.35)',
    dot: 'rgb(var(--success))',
  },
  warning: {
    bg: 'rgb(var(--warning-soft))',
    text: 'rgb(var(--warning))',
    border: 'rgb(var(--warning) / 0.35)',
    dot: 'rgb(var(--warning))',
  },
  danger: {
    bg: 'rgb(var(--danger-soft))',
    text: 'rgb(var(--danger))',
    border: 'rgb(var(--danger) / 0.35)',
    dot: 'rgb(var(--danger))',
  },
  info: {
    bg: 'rgba(2, 132, 199, 0.12)',
    text: '#0284c7',
    border: 'rgba(2, 132, 199, 0.3)',
    dot: '#0284c7',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[10px] font-semibold gap-1',
  sm: 'px-2.5 py-0.5 text-xs font-semibold gap-1.5',
  md: 'px-3 py-1 text-xs font-bold gap-1.5',
};

/**
 * Standardized Enterprise Badge Component.
 * Supports theme-aware variants, sizing scales, and status indicators.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  style = {},
  children,
  ...props
}) => {
  const v = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all select-none ${sizeStyles[size]} ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.text,
        borderColor: v.border,
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse-dot"
          style={{ backgroundColor: v.dot }}
        />
      )}
      {children}
    </span>
  );
};
