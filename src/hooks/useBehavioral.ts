import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useProtectedQueryEnabled } from '@/hooks/useProtectedQueryEnabled';
import {
  BehavioralEngineConfig,
  BehavioralAssessmentData,
  CreateBehavioralAssessmentPayload,
} from '@/types/behavioral';

export const BEHAVIORAL_QUERY_KEYS = {
  all: ['behavioral'] as const,
  config: () => [...BEHAVIORAL_QUERY_KEYS.all, 'config'] as const,
  latestSubject: (employeeId?: string | number | null) =>
    [...BEHAVIORAL_QUERY_KEYS.all, 'subject', String(employeeId ?? ''), 'latest'] as const,
  subjectHistory: (employeeId?: string | number | null) =>
    [...BEHAVIORAL_QUERY_KEYS.all, 'subject', String(employeeId ?? ''), 'history'] as const,
  assessment: (id: string) => [...BEHAVIORAL_QUERY_KEYS.all, 'assessment', id] as const,
};

export function useBehavioralConfig() {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<BehavioralEngineConfig>({
    queryKey: BEHAVIORAL_QUERY_KEYS.config(),
    queryFn: async () => {
      const res = await apiClient.get('/behav/config');
      return res.data.data;
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useLatestBehavioralAssessment(employeeId?: string | number | null) {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<BehavioralAssessmentData | null>({
    queryKey: BEHAVIORAL_QUERY_KEYS.latestSubject(employeeId),
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await apiClient.get(`/behav/subjects/${employeeId}/latest`);
      return res.data.data ?? null;
    },
    enabled: isEnabled && Boolean(employeeId),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useBehavioralAssessmentHistory(employeeId?: string | number | null) {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<BehavioralAssessmentData[]>({
    queryKey: BEHAVIORAL_QUERY_KEYS.subjectHistory(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await apiClient.get(`/behav/subjects/${employeeId}/history`);
      return res.data.data ?? [];
    },
    enabled: isEnabled && Boolean(employeeId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBehavioralAssessmentById(id: string) {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<BehavioralAssessmentData | null>({
    queryKey: BEHAVIORAL_QUERY_KEYS.assessment(id),
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/behav/assessments/${id}/result`);
      return res.data.data ?? null;
    },
    enabled: isEnabled && Boolean(id),
  });
}

export function useCreateBehavioralAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBehavioralAssessmentPayload) => {
      const res = await apiClient.post('/behav/assessments', payload);
      return res.data.data as BehavioralAssessmentData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: BEHAVIORAL_QUERY_KEYS.latestSubject(data.subjectId),
      });
      queryClient.invalidateQueries({
        queryKey: BEHAVIORAL_QUERY_KEYS.subjectHistory(data.subjectId),
      });
    },
  });
}
