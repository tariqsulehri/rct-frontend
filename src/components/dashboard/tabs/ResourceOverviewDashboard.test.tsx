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
      },
      gradeKey: 'L3',
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

  it('renders Hero Progress Banner with greeting, trajectory grades, and quick actions', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    expect(html).toContain('Test Engineer');
    expect(html).toContain('G14');
    expect(html).toContain('G15');
    expect(html).toContain('Assess Skills');
  });

  it('renders 4 KPI metrics including Technical, CEFR English, Behavioral, and Promotion Gate', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    expect(html).toContain('Technical Score');
    expect(html).toContain('78%');
    expect(html).toContain('CEFR English');
    expect(html).toContain('B2');
    expect(html).toContain('Behavioral');
    expect(html).toContain('L4');
    expect(html).toContain('Promotion Gate');
  });

  it('renders 3 Dimension Action Cards for direct stream navigation', () => {
    const html = renderToString(
      <ResourceOverviewDashboard user={mockUser} onNavigate={() => {}} />
    );

    expect(html).toContain('Technical Capabilities');
    expect(html).toContain('CEFR Communication');
    expect(html).toContain('Behavioral Leadership');
    expect(html).toContain('18 / 20');
  });
});
