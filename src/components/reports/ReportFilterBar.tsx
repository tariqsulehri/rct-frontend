import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { DEFAULT_REPORT_FILTERS, type ReportFilters, type ReportReadinessFilter } from './reportFilters';

interface ReportFilterBarProps {
  filters: ReportFilters;
  onFilterChange: (filters: ReportFilters) => void;
  departments?: string[];
  domains?: string[];
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFilterChange,
  departments = ['DevOps'],
  domains = [],
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.department !== 'all' ||
    filters.currentGrade !== 'all' ||
    filters.targetGrade !== 'all' ||
    filters.skillArea !== 'all' ||
    filters.readiness !== 'all';

  const handleReset = () => {
    onFilterChange(DEFAULT_REPORT_FILTERS);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Multi-Angle Report Filters
          </h2>
        </div>
        {isFiltered && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee / ID..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Department */}
        <div>
          <select
            value={filters.department}
            onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Current Grade */}
        <div>
          <select
            value={filters.currentGrade}
            onChange={(e) => onFilterChange({ ...filters, currentGrade: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Current Grade: All</option>
            {['G13', 'G14', 'G15', 'G16', 'G17', 'G18'].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Target Grade */}
        <div>
          <select
            value={filters.targetGrade}
            onChange={(e) => onFilterChange({ ...filters, targetGrade: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Target Grade: All</option>
            {['G14', 'G15', 'G16', 'G17', 'G18'].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Skill Area / Domain */}
        <div>
          <select
            value={filters.skillArea}
            onChange={(e) => onFilterChange({ ...filters, skillArea: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Skill Domains</option>
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>

        {/* Promotion Readiness */}
        <div>
          <select
            value={filters.readiness}
            onChange={(e) => onFilterChange({ ...filters, readiness: e.target.value as ReportReadinessFilter })}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Readiness: All</option>
            <option value="ready">Ready Only</option>
            <option value="near-ready">Near Ready</option>
            <option value="not-ready">Not Ready</option>
          </select>
        </div>
      </div>
    </div>
  );
};
