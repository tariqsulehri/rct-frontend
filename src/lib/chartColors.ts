import { useThemeStore } from '@/store/themeStore';

export interface ChartPalette {
  accent:  string;
  success: string;
  warning: string;
  danger:  string;
  grid:    string;
  text:    string;
  surface: string;
  domains: string[];
}

const LIGHT: ChartPalette = {
  accent:  '#7c3aed',
  success: '#16a34a',
  warning: '#d97706',
  danger:  '#dc2626',
  grid:    '#e5e7eb',
  text:    '#6b7280',
  surface: '#f9fafb',
  domains: ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626','#9333ea'],
};

const DARK: ChartPalette = {
  accent:  '#a78bfa',
  success: '#4ade80',
  warning: '#fbbf24',
  danger:  '#f87171',
  grid:    '#3f3f46',
  text:    '#a1a1aa',
  surface: '#27272a',
  domains: ['#a78bfa','#60a5fa','#22d3ee','#34d399','#fbbf24','#f87171','#c084fc'],
};

const MIDNIGHT: ChartPalette = {
  accent:  '#22d3ee',
  success: '#34d399',
  warning: '#fbbf24',
  danger:  '#f87171',
  grid:    '#1e293b',
  text:    '#64748b',
  surface: '#0f172a',
  domains: ['#22d3ee','#818cf8','#34d399','#a78bfa','#fbbf24','#f87171','#38bdf8'],
};

export function useChartColors(): ChartPalette {
  const theme = useThemeStore((s) => s.theme);
  if (theme === 'dark')     return DARK;
  if (theme === 'midnight') return MIDNIGHT;
  return LIGHT;
}

/** Tooltip container style that matches the current theme surface */
export const tooltipStyle = (c: ChartPalette) => ({
  backgroundColor: c.surface,
  border: `1px solid ${c.grid}`,
  borderRadius: '10px',
  padding: '8px 12px',
  color: c.text,
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
});
