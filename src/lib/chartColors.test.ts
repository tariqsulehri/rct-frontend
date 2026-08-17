import { describe, it, expect } from 'vitest';
import { getChartPalette, tooltipStyle } from './chartColors';

describe('chartColors / getChartPalette', () => {
  it('should return light palette by default', () => {
    const c = getChartPalette('light');
    expect(c.accent).toBe('#7c3aed');
    expect(c.surface).toBe('#f9fafb');
  });

  it('should return dark palette when dark theme is active', () => {
    const c = getChartPalette('dark');
    expect(c.accent).toBe('#a78bfa');
    expect(c.surface).toBe('#27272a');
  });

  it('should return midnight palette when midnight theme is active', () => {
    const c = getChartPalette('midnight');
    expect(c.accent).toBe('#22d3ee');
    expect(c.surface).toBe('#0f172a');
  });

  it('should generate tooltipStyle object matching current palette', () => {
    const c = getChartPalette('light');
    const style = tooltipStyle(c);
    expect(style.backgroundColor).toBe(c.surface);
    expect(style.color).toBe(c.text);
    expect(style.borderRadius).toBe('10px');
  });
});
