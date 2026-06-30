export type ReportReadinessFilter = 'all' | 'ready' | 'near-ready' | 'not-ready';

export interface ReportFilters {
  search: string;
  department: string;
  currentGrade: string;
  targetGrade: string;
  skillArea: string;
  readiness: ReportReadinessFilter;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  search: '',
  department: 'all',
  currentGrade: 'all',
  targetGrade: 'all',
  skillArea: 'all',
  readiness: 'all',
};
