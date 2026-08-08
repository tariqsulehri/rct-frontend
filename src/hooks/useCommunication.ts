import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useProtectedQueryEnabled } from '@/hooks/useProtectedQueryEnabled';
import {
  CefrEngineConfig,
  FormattedCommAssessment,
  CreateCommAssessmentPayload,
  UpdateCommAssessmentStatusPayload,
} from '@/types/communication';

export const COMM_QUERY_KEYS = {
  all: ['communication'] as const,
  config: () => [...COMM_QUERY_KEYS.all, 'config'] as const,
  latestSubject: (employeeId?: string | number | null) =>
    [...COMM_QUERY_KEYS.all, 'subject', String(employeeId ?? ''), 'latest'] as const,
  subjectHistory: (employeeId?: string | number | null) =>
    [...COMM_QUERY_KEYS.all, 'subject', String(employeeId ?? ''), 'history'] as const,
  assessment: (id: string) => [...COMM_QUERY_KEYS.all, 'assessment', id] as const,
};

export function useCommConfig() {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<CefrEngineConfig>({
    queryKey: COMM_QUERY_KEYS.config(),
    queryFn: async () => {
      const res = await apiClient.get('/comm/config');
      return res.data.data;
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useLatestCommAssessment(employeeId?: string | number | null) {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<FormattedCommAssessment | null>({
    queryKey: COMM_QUERY_KEYS.latestSubject(employeeId),
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await apiClient.get(`/comm/subjects/${employeeId}/latest`);
      return res.data.data ?? null;
    },
    enabled: isEnabled && Boolean(employeeId),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

export function useCommAssessmentHistory(employeeId?: string | number | null) {
  const isEnabled = useProtectedQueryEnabled();
  return useQuery<FormattedCommAssessment[]>({
    queryKey: COMM_QUERY_KEYS.subjectHistory(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await apiClient.get(`/comm/subjects/${employeeId}/history`);
      return res.data.data ?? [];
    },
    enabled: isEnabled && Boolean(employeeId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCommAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCommAssessmentPayload) => {
      const res = await apiClient.post('/comm/assessments', payload);
      return res.data.data as FormattedCommAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.latestSubject(data.emp_code),
      });
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.latestSubject(data.subject_id),
      });
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.subjectHistory(data.emp_code),
      });
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.subjectHistory(data.subject_id),
      });
    },
  });
}

export function useUpdateCommAssessmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCommAssessmentStatusPayload;
    }) => {
      const res = await apiClient.patch(`/comm/assessments/${id}/status`, payload);
      return res.data.data as FormattedCommAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.assessment(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.latestSubject(data.emp_code),
      });
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.subjectHistory(data.emp_code),
      });
    },
  });
}

export function useUpdateCommConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CefrEngineConfig>) => {
      const res = await apiClient.put('/comm/config', payload);
      return res.data.data as CefrEngineConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMM_QUERY_KEYS.all,
      });
    },
  });
}

