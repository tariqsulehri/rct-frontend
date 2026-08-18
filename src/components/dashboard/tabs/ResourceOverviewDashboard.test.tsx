import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ResourceOverviewDashboard } from './ResourceOverviewDashboard';
import { type User } from '@/store/authStore';

// Mock hooks
vi.mock('@/hooks/useReports', () => ({
  useCompetencyScores: () => ({
    data: [
      {
        employee_id: 1,
        emp_code: 'TK-1001',
        full_name: 'Test Engineer',
        current_grade: 'G14',
        target_grade: 'G15',
        overall_score: 0.78,
      },
    ],
    isLoading: false,
  }),
  useGapMatrix: () => ({
    data: {
      employees: [
        {
          employee_id: 1,
          emp_code: 'TK-1001',
          full_name: 'Test Engineer',
          overall_score: 0.78,
          overall_threshold: 0.80,
          overall_gap: -0.02,
          meets_count: 18,
          total_with_threshold: 20,
          promotion_ready: false,
          domain_gaps: {
            'Cloud Architecture': { score: 0.85, threshold: 0.80, gap: 0.05, meets: true },
            'CI/CD & DevOps': { score: 0.70, threshold: 0.80, gap: -0.10, meets: false },
          },
        },
      ],
      domains: ['Cloud Architecture', 'CI/CD & DevOps'],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCommunication', () => ({
  useLatestCommAssessment: () => ({
    data: {
      overallCefr: 'B2',
      org_level_key: 'B2',
      status: 'approved',
      communicationReady: true,
      ratings: [
        { competency_key: 'written_clarity', cefr: 'B2', evidence: 'Clear RFCs' },
        { competency_key: 'spoken_fluency', cefr: 'B2', evidence: 'Fluent standups' },
      ],
    },
    isLoading: false,
  }),
  useCommConfig: () => ({
    data: {
      cefrLevels: {
        A1: { weight: 0.17 },
        A2: { weight: 0.33 },
        B1: { weight: 0.50 },
        B2: { weight: 0.67 },
        C1: { weight: 0.83 },
        C2: { weight: 1.00 },
      },
      competencies: [
        { key: 'written_clarity', name: 'Written Clarity' },
        { key: 'spoken_fluency', name: 'Spoken Fluency' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useBehavioral', () => ({
  useLatestBehavioralAssessment: () => ({
    data: {
      result: {
        overallProficiency: 'L4',
        behavioralReady: true,
        perCompetency: [
          { competencyKey: 'ownership', level: 'L4', expectedLevel: 'L3', status: 'ABOVE' },
          { competencyKey: 'collaboration', level: 'L4', expectedLevel: 'L3', status: 'ABOVE' },
        ],
      },
      gradeKey: 'L3',
    },
    isLoading: false,
  }),
  useBehavioralConfig: () => ({
    data: {
      levels: [
        { code: 'L1', centi_weight: 20 },
        { code: 'L2', centi_weight: 40 },
        { code: 'L3', centi_weight: 60 },
        { code: 'L4', centi_weight: 80 },
        { code: 'L5', centi_weight: 100 },
      ],
      competencies: [
        { key: 'ownership', name: 'Ownership', type: 'core' },
        { key: 'communication', name: 'Communication', type: 'core' },
      ],
    },
    isLoading: false,
  }),
}));


vi.mock('@/hooks/useChartTheme', () => ({
  useChartTheme: () => ({
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
    domains: ['#8b5cf6', '#a78bfa'],
  }),
  getChartTooltipStyle: () => ({
    backgroundColor: '#18181b',
  }),
}));

describe('ResourceOverviewDashboard (SSR Rendering)', () => {
  const mockUser: User = {
    id: 1,
    employeeId: 1,
    empCode: 'TK-1001',
    employeeName: 'Test Engineer',
    username: 'test.engineer',
    department: 'DevOps',
    role: 'ENGINEER',
    permissions: [],
    currentGrade: 'G14',
    currentGradeTitle: 'DevOps Engineer',
    targetGrade: 'G15',
    targetGradeTitle: 'Senior DevOps Engineer',
  };

  it('renders Header Ribbon with greeting, career grade trajectory, and evaluation cycle title', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    expect(html).toContain('Test Engineer');
    expect(html).toContain('G14');
    expect(html).toContain('G15');
    expect(html).toContain('Cycle 2026 (Active)');
    expect(html).toContain('Assess Skills');
  });

  it('renders all three graphs simultaneously (Technical, CEFR Language, Behavioral 11-Pillar Bars)', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    expect(html).toContain('1. Technical Domains');
    expect(html).toContain('2. CEFR Language');
    expect(html).toContain('3. Behavioral (11 Pillars)');
    expect(html).toContain('Skills Grid');
    expect(html).toContain('CEFR Rubric');
    expect(html).toContain('Assessed');
    expect(html).toContain('Core (6)');
    expect(html).toContain('Leadership (5)');
  });

  it('renders KPI stats bar with all 5 focused metrics (replaces removed AI Copilot panel)', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    // KPI stats bar \u2014 must show all 5 KPI tiles
    expect(html).toContain('Readiness');
    expect(html).toContain('Technical');
    expect(html).toContain('CEFR Lang');
    expect(html).toContain('Behavioral');
    expect(html).toContain('Skills Gate');
    // Promotion gate trajectory shown in header
    expect(html).toContain('Assess Skills');
  });

  it('renders expanded 3-graph layout with scrollable bars and no bottom card row (Donut/Milestones removed)', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    // All 3 graph cards must be present with scrollable bars
    expect(html).toContain('1. Technical Domains');
    expect(html).toContain('2. CEFR Language');
    expect(html).toContain('3. Behavioral (11 Pillars)');
    // Footer legend elements
    expect(html).toContain('Skills Grid');
    expect(html).toContain('CEFR Rubric');
    expect(html).toContain('Core (6)');
    expect(html).toContain('Leadership (5)');
    // The removed bottom cards must NOT appear
    expect(html).not.toContain('Competency Distribution');
    expect(html).not.toContain('Promotion Milestones');
  });
});
