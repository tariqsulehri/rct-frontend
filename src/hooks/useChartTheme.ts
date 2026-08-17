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
}

/**
 * Enterprise Recharts Theme Bridge Hook.
 * Resolves theme-synchronized colors for SVG chart rendering based on active application theme.
 */
export function useChartTheme(): ChartThemeTokens {
  const { theme } = useThemeStore();

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
  };
}
