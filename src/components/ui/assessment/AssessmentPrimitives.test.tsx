import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProficiencyLadder, LadderStep } from './ProficiencyLadder';
import { MetricKpiCard } from './MetricKpiCard';
import { LevelSelectorBar, LevelOption } from './LevelSelectorBar';
import { InfoTip } from '../InfoTip';

describe('Assessment UI Primitives (SSR Rendering)', () => {
  const steps5: LadderStep[] = [
    { code: 'L1', weightDec: '0.20' },
    { code: 'L2', weightDec: '0.40' },
    { code: 'L3', weightDec: '0.60' },
    { code: 'L4', weightDec: '0.80' },
    { code: 'L5', weightDec: '1.00' },
  ];

  const steps6: LadderStep[] = [
    { code: 'A1', weightDec: '0.17' },
    { code: 'A2', weightDec: '0.33' },
    { code: 'B1', weightDec: '0.50' },
    { code: 'B2', weightDec: '0.67' },
    { code: 'C1', weightDec: '0.83' },
    { code: 'C2', weightDec: '1.00' },
  ];

  const options5: LevelOption[] = [
    { code: 'L1', weightDec: '0.20' },
    { code: 'L2', weightDec: '0.40' },
    { code: 'L3', weightDec: '0.60' },
    { code: 'L4', weightDec: '0.80' },
    { code: 'L5', weightDec: '1.00' },
  ];

  it('should render ProficiencyLadder for 5 levels (L1-L5)', () => {
    const html = renderToString(
      <ProficiencyLadder
        title="Technical Proficiency"
        steps={steps5}
        evaluatedCode="L3"
        benchmarkCode="L3"
        gap={0}
      />
    );
    expect(html).toContain('L1');
    expect(html).toContain('L3');
    expect(html).toContain('L5');
    expect(html).toContain('Technical Proficiency');
    expect(html).toContain('Benchmark:');
  });

  it('should render ProficiencyLadder with Above Benchmark status', () => {
    const html = renderToString(
      <ProficiencyLadder
        title="Behavioral Framework"
        icon="award"
        steps={steps5}
        evaluatedCode="L4"
        benchmarkCode="L3"
        gap={1}
      />
    );
    expect(html).toContain('L4');
    expect(html).toContain('EVALUATED');
  });

  it('should render ProficiencyLadder for 6 levels (A1-C2) with Below Benchmark status', () => {
    const html = renderToString(
      <ProficiencyLadder
        title="CEFR Communication"
        steps={steps6}
        evaluatedCode="B1"
        benchmarkCode="B2"
        gap={-1}
      />
    );
    expect(html).toContain('A1');
    expect(html).toContain('B1');
    expect(html).toContain('C2');
    expect(html).toContain('EVALUATED');
  });

  it('should render MetricKpiCard with label, primaryValue, and subtext', () => {
    const html = renderToString(
      <MetricKpiCard
        label="Evaluated Band"
        primaryValue="L4"
        subtext="Target"
        subtextValue="L3"
        statusType="success"
        statusText="Ready"
      />
    );
    expect(html).toContain('Evaluated Band');
    expect(html).toContain('L4');
    expect(html).toContain('Target');
    expect(html).toContain('L3');
    expect(html).toContain('Ready');
  });

  it('should render MetricKpiCard with warning, danger, and badge content', () => {
    const htmlWarn = renderToString(
      <MetricKpiCard
        label="Benchmark"
        primaryValue="L3"
        statusType="warning"
      />
    );
    expect(htmlWarn).toContain('Benchmark');
    expect(htmlWarn).toContain('L3');

    const htmlDanger = renderToString(
      <MetricKpiCard
        label="Gap Analysis"
        primaryValue="-1 Level"
        statusType="danger"
      />
    );
    expect(htmlDanger).toContain('Gap Analysis');
    expect(htmlDanger).toContain('-1 Level');
  });

  it('should render LevelSelectorBar for 5 levels', () => {
    const html = renderToString(
      <LevelSelectorBar
        levels={options5}
        selectedCode="L3"
        expectedCode="L3"
        onSelectLevel={() => {}}
      />
    );
    expect(html).toContain('L1');
    expect(html).toContain('L3');
    expect(html).toContain('L5');
    expect(html).toContain('SET');
  });

  it('should render LevelSelectorBar with target indicators when below expectation', () => {
    const html = renderToString(
      <LevelSelectorBar
        levels={options5}
        selectedCode="L2"
        expectedCode="L4"
        onSelectLevel={() => {}}
      />
    );
    expect(html).toContain('L2');
    expect(html).toContain('SET');
    expect(html).toContain('Req');
  });

  it('should render InfoTip button with accessible attributes', () => {
    const html = renderToString(
      <InfoTip text="Sample tooltip info" />
    );
    expect(html).toContain('aria-label="Sample tooltip info"');
  });
});
