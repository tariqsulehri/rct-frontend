import { useMemo, useState } from 'react';

const PAGE_SIZE = 8;

export const HEADER_GRADIENTS: Record<string, string> = {
  departments: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  users: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  employees: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
  grades: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'skill-domains': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'domain-grade-weights': 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
  competencies: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
  technologies: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
  categories: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
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
