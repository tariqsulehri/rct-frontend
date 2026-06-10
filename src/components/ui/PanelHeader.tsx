import React from 'react';

interface PanelHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  background?: string;
  accent?: boolean;
  dense?: boolean;
  highContrast?: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  action,
  background,
  accent = true,
  dense,
  highContrast,
}) => {
  const isGradient = !!background;
  const titleColor = highContrast || isGradient ? '#ffffff' : 'rgb(var(--text-1))';
  const subtitleColor = highContrast || isGradient ? 'rgba(255,255,255,0.76)' : 'rgb(var(--text-2))';

  return (
    <div
      className={`flex items-center justify-between gap-4 border-b shrink-0 ${dense ? 'px-4 py-3' : 'px-6 py-4'}`}
      style={{
        borderColor: isGradient ? 'rgb(var(--border-2))' : 'rgb(var(--border-2))',
        background: background ?? 'linear-gradient(135deg, rgb(var(--surface-2)) 0%, rgb(var(--surface-3)) 100%)',
        boxShadow: 'inset 0 -1px 0 rgb(var(--border) / 0.8)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {accent && (
          <span
            aria-hidden="true"
            className={`${dense ? 'h-6' : 'h-7'} w-1 rounded-full shrink-0`}
            style={{ backgroundColor: highContrast || isGradient ? 'rgba(255,255,255,0.86)' : 'rgb(var(--accent))' }}
          />
        )}
        <div className="min-w-0">
          <h2 className={`${dense ? 'text-sm' : 'text-base'} font-extrabold truncate`} style={{ color: titleColor }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5 truncate" style={{ color: subtitleColor }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
