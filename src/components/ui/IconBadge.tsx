import React from 'react';

export interface IconBadgeProps {
  /** The Lucide or custom icon node */
  icon: React.ReactNode;
  /** Color theme variant */
  color?: 'accent' | 'warning' | 'success' | 'danger' | 'info';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display style: 'subtle' (soft colored background), 'ghost' (icon only), or 'solid' */
  variant?: 'subtle' | 'ghost' | 'solid';
  /** Additional CSS class names */
  className?: string;
}

/**
 * Enterprise Reusable Icon Component Primitive.
 * Standardizes colored icons with soft background containers and theme-aware variables
 * across all dashboard components and sub-components.
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  color = 'accent',
  size = 'md',
  variant = 'subtle',
  className = '',
}) => {
  const colorStyles = {
    accent: {
      color: 'rgb(var(--accent))',
      bg: 'rgba(var(--accent), 0.15)',
    },
    warning: {
      color: 'rgb(var(--warning))',
      bg: 'rgba(var(--warning), 0.15)',
    },
    success: {
      color: 'rgb(var(--success))',
      bg: 'rgba(var(--success), 0.15)',
    },
    danger: {
      color: 'rgb(var(--danger))',
      bg: 'rgba(var(--danger), 0.15)',
    },
    info: {
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
    },
  };

  const sizeStyles = {
    sm: 'p-1 rounded-md min-w-[20px] min-h-[20px]',
    md: 'p-1.5 rounded-lg min-w-[26px] min-h-[26px]',
    lg: 'p-2 rounded-xl min-w-[32px] min-h-[32px]',
  };

  const style = colorStyles[color] || colorStyles.accent;
  const paddingClass = sizeStyles[size];

  if (variant === 'ghost') {
    return (
      <span className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ color: style.color }}>
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${paddingClass} ${className}`}
      style={{
        color: variant === 'solid' ? '#FFFFFF' : style.color,
        backgroundColor: variant === 'solid' ? style.color : style.bg,
      }}
    >
      {icon}
    </span>
  );
};
