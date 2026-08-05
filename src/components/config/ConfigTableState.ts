import { useMemo, useState } from 'react';

const PAGE_SIZE = 8;

export const HEADER_GRADIENTS: Record<string, string> = {
  'assessment-types': 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
  'assessment-levels': 'linear-gradient(135deg, #059669 0%, #d97706 100%)',
  'assessment-statuses': 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
  'assessment-projects': 'linear-gradient(135deg, #0891b2 0%, #16a34a 100%)',
  scoring: 'linear-gradient(135deg, #2563eb 0%, #16a34a 100%)',
  departments: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  users: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  access: 'linear-gradient(135deg, #334155 0%, #0f766e 100%)',
  roles: 'linear-gradient(135deg, #475569 0%, #2563eb 100%)',
  'department-access': 'linear-gradient(135deg, #2563eb 0%, #0f766e 100%)',
  'line-manager-access': 'linear-gradient(135deg, #0f766e 0%, #7c3aed 100%)',
  'access-audit': 'linear-gradient(135deg, #475569 0%, #9333ea 100%)',
  employees: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
  grades: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'skill-domains': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'domain-grade-weights': 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
  competencies: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
  technologies: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  categories: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
  'appraisal-periods': 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
};

export function useTableState<T>(
  data: T[] | undefined,
  filterFn: (item: T, q: string) => boolean,
  sortFn?: (a: T, b: T) => number,
) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const all = data ?? [];
    const result = q.trim() ? all.filter(item => filterFn(item, q.toLowerCase())) : [...all];
    return sortFn ? result.sort(sortFn) : result;
  }, [data, q, filterFn, sortFn]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const onSearch = (v: string) => { setQ(v); setPage(1); };

  return { q, onSearch, page, setPage, filtered, paged };
}

export function getConfigTablePageSize(): number {
  return PAGE_SIZE;
}
