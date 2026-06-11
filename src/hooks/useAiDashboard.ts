import apiClient from '@/lib/api';
import { useProtectedQueryEnabled } from '@/hooks/useProtectedQueryEnabled';
import { useQuery } from '@tanstack/react-query';

export type AiFocus = 'executive' | 'risk' | 'skills' | 'readiness';
export type AiPriority = 'critical' | 'warning' | 'positive' | 'neutral';

export interface AiRecommendation {
  title: string;
  insight: string;
  action: string;
  priority: AiPriority;
  owner: string;
  timeframe: string;
}

export interface AiRiskPerson {
  name: string;
  empCode: string;
  currentGrade: string;
  targetGrade: string;
  gapPct: number;
  meets: string;
  action: string;
}

export interface AiSkillArea {
  domain: string;
  averagePct: number;
  assessed: number;
  priority: AiPriority;
  recommendation: string;
}

export interface AiBlocker {
  employee: string;
  competency: string;
  domain: string;
  gapPct: number;
  action: string;
}

export interface AiStrength {
  domain: string;
  averagePct: number;
  recommendation: string;
}

export interface AiDashboardData {
  generatedAt: string;
  model: string | null;
  aiEnabled: boolean;
  source: 'openai' | 'deterministic';
  focus: AiFocus;
  summary: string;
  executiveNarrative: string;
  focusAnswer: string;
  kpis: {
    totalResources: number;
    readyResources: number;
    readinessRatePct: number;
    avgAchievedPct: number;
    avgRequiredPct: number;
    nearReadyCount: number;
    criticalBlockerCount: number;
  };
  recommendations: AiRecommendation[];
  riskPeople: AiRiskPerson[];
  skillAreas: AiSkillArea[];
  blockers: AiBlocker[];
  strengths: AiStrength[];
  suggestedQuestions: string[];
}

export const useAiDashboard = (focus: AiFocus) => {
  const enabled = useProtectedQueryEnabled(['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER']);
  return useQuery<AiDashboardData>({
    queryKey: ['ai', 'dashboard', focus],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: AiDashboardData }>('/ai/dashboard', {
        params: { focus },
      });
      return res.data.data;
    },
    enabled,
    staleTime: 60_000,
  });
};
