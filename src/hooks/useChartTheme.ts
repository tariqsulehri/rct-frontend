import { useThemeStore } from '@/store/themeStore';

export interface ChartThemeTokens {
  isDark: boolean;
  theme: 'light' | 'dark' | 'midnight';
  axisColor: string;
  gridColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  legendColor: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
  domains: string[];
}

/**
 * Pure theme token resolver function (usable in components and test suites).
 */
export function getChartThemeTokens(theme: 'light' | 'dark' | 'midnight'): ChartThemeTokens {
  if (theme === 'midnight') {
    return {
      isDark: true,
      theme: 'midnight',
      axisColor: '#94a3b8',
      gridColor: '#1e293b',
      tooltipBg: '#0b1221',
      tooltipBorder: '#1e293b',
      tooltipText: '#f8fafc',
      legendColor: '#cbd5e1',
      primary: '#06b6d4',
      secondary: '#38bdf8',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      muted: '#64748b',
      domains: ['#06b6d4', '#38bdf8', '#818cf8', '#a78bfa', '#34d399', '#f59e0b', '#f472b6'],
    };
  }

  if (theme === 'dark') {
    return {
      isDark: true,
      theme: 'dark',
      axisColor: '#a1a1aa',
      gridColor: '#27272a',
      tooltipBg: '#18181b',
      tooltipBorder: '#3f3f46',
      tooltipText: '#fafafa',
      legendColor: '#d4d4d8',
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#8b5cf6',
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#f87171',
      muted: '#71717a',
      domains: ['#8b5cf6', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#f472b6'],
    };
  }

  // Light theme (default)
  return {
    isDark: false,
    theme: 'light',
    axisColor: '#64748b',
    gridColor: '#e2e8f0',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#0f172a',
    legendColor: '#475569',
    primary: '#6d28d9',
    secondary: '#0284c7',
    accent: '#7c3aed',
    success: '#16a34a',
    warning: '#b45309',
    danger: '#dc2626',
    muted: '#94a3b8',
    domains: ['#6d28d9', '#0284c7', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#7c3aed'],
  };
}

/**
 * Enterprise Recharts Theme Bridge Hook.
 * Resolves theme-synchronized colors for SVG chart rendering based on active application theme.
 */
export function useChartTheme(): ChartThemeTokens {
  const theme = useThemeStore((s) => s.theme);
  return getChartThemeTokens(theme);
}

/**
 * Standardized Chart Tooltip Styling Helper.
 */
export function getChartTooltipStyle(theme: ChartThemeTokens): React.CSSProperties {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    color: theme.tooltipText,
    borderRadius: '0.75rem',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)',
    padding: '8px 12px',
    fontSize: '11px',
    borderWidth: '1px',
    borderStyle: 'solid',
  };
}

