import { describe, it, expect } from 'vitest';
import { getChartThemeTokens, getChartTooltipStyle } from './useChartTheme';

describe('useChartTheme / getChartThemeTokens', () => {
  it('should return light theme tokens for light theme', () => {
    const tokens = getChartThemeTokens('light');

    expect(tokens.isDark).toBe(false);
    expect(tokens.theme).toBe('light');
    expect(tokens.tooltipBg).toBe('#ffffff');
    expect(tokens.tooltipText).toBe('#0f172a');
    expect(tokens.domains.length).toBe(7);
  });

  it('should return dark theme tokens for dark theme', () => {
    const tokens = getChartThemeTokens('dark');

    expect(tokens.isDark).toBe(true);
    expect(tokens.theme).toBe('dark');
    expect(tokens.tooltipBg).toBe('#18181b');
    expect(tokens.tooltipText).toBe('#fafafa');
    expect(tokens.accent).toBe('#8b5cf6');
  });

  it('should return midnight theme tokens for midnight theme', () => {
    const tokens = getChartThemeTokens('midnight');

    expect(tokens.isDark).toBe(true);
    expect(tokens.theme).toBe('midnight');
    expect(tokens.tooltipBg).toBe('#0b1221');
    expect(tokens.tooltipText).toBe('#f8fafc');
    expect(tokens.accent).toBe('#06b6d4');
  });

  it('should produce CSS properties for tooltip style', () => {
    const tokens = getChartThemeTokens('light');
    const style = getChartTooltipStyle(tokens);

    expect(style.backgroundColor).toBe(tokens.tooltipBg);
    expect(style.borderColor).toBe(tokens.tooltipBorder);
    expect(style.color).toBe(tokens.tooltipText);
    expect(style.borderRadius).toBe('0.75rem');
    expect(style.fontSize).toBe('11px');
  });
});
