import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import apiClient from '@/lib/api';
import { useProtectedQueryEnabled } from '@/hooks/useProtectedQueryEnabled';

export interface SkillAssessment {
  id: number;
  employee_id: string;   // emp_code e.g. "1818"
  technology_id: number;
  type: 'Primary' | 'Secondary' | 'Tertiary';
  projects: number;
  level: 'Expert' | 'Advanced' | 'Proficient' | 'Intermediate' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';
  status: 'draft' | 'pending' | 'approved';
  assessed_by: string;   // emp_code of assessor e.g. "1139"
  assessed_at: string;
  updated_at: string;
  computed?: {
    score: number;
    starRating: number;
    levelLabel: string;
  };
}

export interface PendingApproval {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  current_grade: string;
  target_grade: string;
  technology_id: number;
  technology_name: string;
  competency_name: string;
  domain_name: string;
  type: 'Primary' | 'Secondary' | 'Tertiary';
  projects: number;
  level: 'Expert' | 'Advanced' | 'Proficient' | 'Intermediate' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';
  score: number;
  status: 'pending';
  submitted_by: string;
  submitted_at: string;
  updated_at: string;
}

export interface TechOption {
  id: number;
  name: string;
  competency_id: number;
  is_active: boolean;
  competency: {
    id: number;
    name: string;
    is_active: boolean;
    competency_domains: { department_id: number; is_primary: boolean; domain: { id: number; name: string } }[];
  };
}

function getPrimaryDomain(competency_domains: TechOption['competency']['competency_domains']): { id: number; name: string } {
  // The picker shows each competency under one domain even if the backend
  // taxonomy allows secondary domain mappings.
  const primary = competency_domains.find(d => d.is_primary);
  return primary?.domain ?? competency_domains[0]?.domain ?? { id: 0, name: 'Unknown' };
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  is_critical: boolean;
}

export interface Technology {
  id: number;
  name: string;
  competency_id: number;
}

export interface SkillHierarchy {
  domainId: number;
  domainName: string;
  competencies: Array<{
    competencyId: number;
    competencyName: string;
    category: string;
    is_critical: boolean;
    technologies: Technology[];
  }>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingAssessmentId?: number;
  existingAssessment?: SkillAssessment;
}

interface TeamMember {
  id: number;
  emp_code: string;
  full_name: string;
  department: string;
  email: string | null;
  current_grade: {
    id: number;
    code: string;
    title: string;
    level: number;
  };
  target_grade: {
    id: number;
    code: string;
    title: string;
    level: number;
  };
  skill_assessments_count: number;
}

export const useTechnologiesForAssessment = () => {
  const enabled = useProtectedQueryEnabled();
  return useQuery({
    queryKey: ['technologiesForAssessment'],
    queryFn: async () => {
      const r = await apiClient.get<{ success: boolean; data: TechOption[] }>(
        '/config/technologies',
      );
      return r.data.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employee_id: string;   // emp_code e.g. "1818"
      technology_id: number;
      type: 'Primary' | 'Secondary' | 'Tertiary';
      projects: number;
      level: 'Expert' | 'Advanced' | 'Proficient' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';
      status?: 'draft' | 'pending' | 'approved';
    }) => {
      const response = await apiClient.post<{ success: boolean; data: SkillAssessment }>(
        '/assessments/skill-assessments',
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
    },
  });
};

export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/assessments/skill-assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
    },
  });
};

/**
 * TanStack Mutation hook for approving or adjusting a pending technical skill assessment.
 * Automatically invalidates assessment, team roster, report, and AI dashboard queries.
 *
 * @summary Approves or updates a pending assessment record.
 * @returns React Query mutation object for approving assessments.
 */
export const useApproveAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: { level?: string; type?: string; projects?: number };
    }) => {
      const response = await apiClient.patch<{ success: boolean; data: SkillAssessment }>(
        `/assessments/skill-assessments/${id}/approve`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
    },
  });
};

export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: Partial<{
        type: 'Primary' | 'Secondary' | 'Tertiary';
        projects: number;
        level: 'Expert' | 'Advanced' | 'Proficient' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';
        status: 'draft' | 'pending' | 'approved';
      }>;
    }) => {
      const response = await apiClient.patch<{ success: boolean; data: SkillAssessment }>(
        `/assessments/skill-assessments/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
    },
  });
};

export const useSubmitDraftsForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empCode, assessmentIds }: { empCode: string; assessmentIds?: number[] }) => {
      const response = await apiClient.post<{ success: boolean; data: { count: number; data: SkillAssessment[] } }>(
        `/assessments/employees/${empCode}/submit-drafts`,
        { assessment_ids: assessmentIds },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['ai-dashboard'] });
    },
  });
};

export const useEmployeeAssessments = (empCode: string) => {
  const enabled = useProtectedQueryEnabled();
  return useQuery({
    queryKey: ['assessments', empCode],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: SkillAssessment[] }>(
        `/assessments/employees/${empCode}/assessments`,
      );
      return response.data.data;
    },
    enabled: enabled && !!empCode,
  });
};

export const usePendingApprovals = () => {
  const enabled = useProtectedQueryEnabled(['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER']);
  return useQuery({
    queryKey: ['assessments', 'pending-approvals'],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: PendingApproval[] }>(
        '/assessments/pending-approvals',
      );
      return response.data.data;
    },
    enabled,
  });
};

export const useTeamRoster = (department?: string) => {
  const enabled = useProtectedQueryEnabled(['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER']);
  return useQuery({
    queryKey: ['teamRoster', department],
    queryFn: async () => {
      const params = department ? { department } : {};
      const response = await apiClient.get<{ success: boolean; data: TeamMember[] }>(
        '/assessments/team-roster',
        { params },
      );
      return response.data.data;
    },
    enabled,
  });
};

export const useAllEmployees = (department?: string) => {
  const enabled = useProtectedQueryEnabled(['ADMIN', 'TOP_MANAGEMENT']);
  return useQuery({
    queryKey: ['employees', department],
    queryFn: async () => {
      const params = department ? { department } : {};
      const response = await apiClient.get<{ success: boolean; data: TeamMember[] }>(
        '/assessments/employees',
        { params },
      );
      return response.data.data;
    },
    enabled,
  });
};

// Builds the cascading picker model from the flat /config/technologies payload.
// Shape: Domain -> Competency -> Technologies.
export const useSkillsHierarchy = () => {
  const { data: technologies, isLoading, isError, error, refetch } = useTechnologiesForAssessment();

  const hierarchy = React.useMemo(() => {
    if (!technologies) return [];

    // Filter out inactive technologies and their parent competencies
    const activeTechnologies = technologies.filter(tech => tech.is_active !== false && tech.competency?.is_active !== false);

    // Group by the domain and competency selected by getPrimaryDomain above.
    const grouped = activeTechnologies.reduce((acc, tech) => {
      const primaryDomain = getPrimaryDomain(tech.competency.competency_domains);
      const domainId = primaryDomain.id;
      const domainName = primaryDomain.name;
      const competencyId = tech.competency.id;
      const competencyName = tech.competency.name;

      // Find or create domain entry
      let domain = acc.find(d => d.domainId === domainId);
      if (!domain) {
        domain = {
          domainId,
          domainName,
          competencies: [],
        };
        acc.push(domain);
      }

      // Find or create competency entry within domain
      let competency = domain.competencies.find(c => c.competencyId === competencyId);
      if (!competency) {
        competency = {
          competencyId,
          competencyName,
          category: tech.competency.name,
          is_critical: false,
          technologies: [],
        };
        domain.competencies.push(competency);
      }

      // Add technology
      competency.technologies.push({
        id: tech.id,
        name: tech.name,
        competency_id: tech.competency_id,
      });

      return acc;
    }, [] as SkillHierarchy[]);

    // Sort for consistent ordering
    grouped.forEach(domain => {
      domain.competencies.sort((a, b) => a.competencyName.localeCompare(b.competencyName));
      domain.competencies.forEach(comp => {
        comp.technologies.sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    return grouped;
  }, [technologies]);

  return { data: hierarchy, isLoading, isError, error, refetch };
};

// Product duplicate rule: one assessment per employee for the same
// Skill Area -> Skill -> Technology picker path.
export const useDuplicateAssessmentCheck = (
  empCode: string,
  domainId?: number,
  competencyId?: number,
  technologyId?: number,
) => {
  const { data: assessments } = useEmployeeAssessments(empCode);
  const { data: technologies } = useTechnologiesForAssessment();

  const techLocationMap = React.useMemo(() => {
    const map = new Map<number, { domainId: number; competencyId: number }>();

    if (!technologies) {
      return map;
    }

    technologies.forEach((tech) => {
      map.set(tech.id, {
        domainId: getPrimaryDomain(tech.competency.competency_domains).id,
        competencyId: tech.competency.id,
      });
    });

    return map;
  }, [technologies]);

  const checkDuplicate = React.useCallback((domId: number, compId: number, techId: number): DuplicateCheckResult => {
    if (!assessments) {
      return { isDuplicate: false };
    }

    const existing = assessments.find((assessment) => {
      if (assessment.technology_id !== techId) return false;

      const location = techLocationMap.get(assessment.technology_id);
      if (!location) return false;

      return location.domainId === domId && location.competencyId === compId;
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingAssessmentId: existing.id,
        existingAssessment: existing,
      };
    }

    return { isDuplicate: false };
  }, [assessments, techLocationMap]);

  const checkDuplicateImportance = React.useCallback((
    compId: number,
    type: 'Primary' | 'Secondary' | 'Tertiary',
    excludeTechId?: number,
    excludeAssessmentId?: number,
  ): DuplicateCheckResult => {
    if (!assessments) {
      return { isDuplicate: false };
    }

    const existing = assessments.find((assessment) => {
      if (excludeAssessmentId && assessment.id === excludeAssessmentId) return false;
      if (excludeTechId && assessment.technology_id === excludeTechId) return false;
      if (assessment.type !== type) return false;

      const location = techLocationMap.get(assessment.technology_id);
      if (!location) return false;

      return location.competencyId === compId;
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingAssessmentId: existing.id,
        existingAssessment: existing,
      };
    }

    return { isDuplicate: false };
  }, [assessments, techLocationMap]);

  // Optional: pre-check if specific IDs provided
  const isDuplicate = React.useMemo(() => {
    if (!domainId || !competencyId || !technologyId) return false;
    return checkDuplicate(domainId, competencyId, technologyId).isDuplicate;
  }, [domainId, competencyId, technologyId, checkDuplicate]);

  return { checkDuplicate, checkDuplicateImportance, isDuplicate };
};
