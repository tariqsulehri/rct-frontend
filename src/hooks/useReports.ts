import apiClient from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useProtectedPermissionQueryEnabled } from '@/hooks/useProtectedQueryEnabled';

export interface PromotionRow {
  employee_id: number;
  emp_code: string;
  full_name: string;
  department: string;
  current_grade: string;
  target_grade: string;
  overall_score: number;
  avg_threshold: number;
  meets_count: number;
  total_competencies: number;
  promotion_ready: boolean;
  star_rating: number;
}

export interface CompetencyRow {
  employee_id: number;
  full_name: string;
  emp_code: string;
  department: string;
  current_grade: string;
  current_grade_title?: string;
  target_grade: string;
  target_grade_title?: string;
  domain_scores: Record<string, number>;
  overall_score: number;
}

export const useGapAnalysis = (empCode: string | null) => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view', ['ENGINEER']);
  return useQuery({
    queryKey: ['reports', 'gap-analysis', empCode],
    queryFn: async () => {
      const r = await apiClient.get(`/reports/gap-analysis/${empCode}`);
      return r.data.data;
    },
    enabled: enabled && !!empCode,
  });
};

export const usePromotionReadiness = () => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view');
  return useQuery<PromotionRow[]>({
    queryKey: ['reports', 'promotion-readiness'],
    queryFn: async () => {
      const r = await apiClient.get('/reports/promotion-readiness');
      return r.data.data;
    },
    enabled,
  });
};

export const useCompetencyScores = () => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view', ['ENGINEER']);
  return useQuery<CompetencyRow[]>({
    queryKey: ['reports', 'competency-scores'],
    queryFn: async () => {
      const r = await apiClient.get('/reports/competency-scores');
      return r.data.data;
    },
    enabled,
  });
};

export interface CompetencyMatrixEmployee {
  employee_id: number;
  emp_code: string;
  full_name: string;
  department: string;
  current_grade: string;
  target_grade: string;
  overall_score: number;
  competency_scores: Record<string, { score: number; domain: string; is_critical: boolean }>;
}

export interface CompetencyMatrixResult {
  employees: CompetencyMatrixEmployee[];
  competencies: Array<{ name: string; domain: string; is_critical: boolean }>;
}

export const useCompetencyMatrix = () => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view');
  return useQuery<CompetencyMatrixResult>({
    queryKey: ['reports', 'competency-matrix'],
    queryFn: async () => {
      const r = await apiClient.get('/reports/competency-matrix');
      return r.data.data;
    },
    enabled,
  });
};

export interface GapMatrixCompetency { name: string; domain: string; is_critical: boolean; }
export interface GapMatrixEmployee {
  employee_id: number; emp_code: string; full_name: string;
  department: string;
  current_grade: string; target_grade: string;
  overall_score: number; overall_threshold: number; overall_gap: number;
  meets_count: number; total_with_threshold: number; promotion_ready: boolean;
  domain_gaps:     Record<string, { score: number; threshold: number; gap: number; meets: boolean }>;
  competency_gaps: Record<string, { score: number; threshold: number; gap: number; domain: string; is_critical: boolean; meets: boolean }>;
}
export interface GapMatrixResult {
  employees:    GapMatrixEmployee[];
  domains:      string[];
  competencies: GapMatrixCompetency[];
}

export const useGapMatrix = () => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view', ['ENGINEER']);
  return useQuery<GapMatrixResult>({
    queryKey: ['reports', 'gap-matrix'],
    queryFn: async () => {
      const r = await apiClient.get('/reports/gap-matrix');
      return r.data.data;
    },
    enabled,
  });
};

export const useAssessmentHistory = (page = 1, limit = 20) => {
  const enabled = useProtectedPermissionQueryEnabled('reports.view');
  return useQuery({
    queryKey: ['reports', 'assessment-history', page, limit],
    queryFn: async () => {
      const r = await apiClient.get('/reports/assessment-history', {
        params: { page, limit },
      });
      return r.data.data;
    },
    enabled,
  });
};
