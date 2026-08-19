import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { SkillAreaNameFilterSelect } from '@/components/filters/TaxonomyFilterSelects';

export interface CompetencyFiltersBarProps {
  competencySearch: string;
  setCompetencySearch: (s: string) => void;
  competencyDomainFilter: string;
  setCompetencyDomainFilter: (s: string) => void;
  competencyStatusFilter: string;
  setCompetencyStatusFilter: (s: string) => void;
  competencyCriticalFilter: string;
  setCompetencyCriticalFilter: (s: string) => void;
  competencyDomains: string[];
  hasCompetencyFilters: boolean;
  viewMode: 'grid' | 'table';
  setViewMode: (v: 'grid' | 'table') => void;
  clearFilters: () => void;
}

export const CompetencyFiltersBar: React.FC<CompetencyFiltersBarProps> = ({
  competencySearch,
  setCompetencySearch,
  competencyDomainFilter,
  setCompetencyDomainFilter,
  competencyStatusFilter,
  setCompetencyStatusFilter,
  competencyCriticalFilter,
  setCompetencyCriticalFilter,
  competencyDomains,
  hasCompetencyFilters,
  viewMode,
  setViewMode,
  clearFilters,
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]" />

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div
            className="flex p-0.5 border rounded-lg"
            style={{
              backgroundColor: 'rgb(var(--surface-2))',
              borderColor: 'rgb(var(--border))',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: viewMode === 'grid' ? 'rgb(var(--surface))' : 'transparent',
                color: viewMode === 'grid' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
              }}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: viewMode === 'table' ? 'rgb(var(--surface))' : 'transparent',
                color: viewMode === 'table' ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))',
              }}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Search */}
        <div
          className="md:col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 border"
          style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
        >
          <Search size={14} style={{ color: 'rgb(var(--text-3))' }} />
          <input
            value={competencySearch}
            onChange={(e) => setCompetencySearch(e.target.value)}
            placeholder="Search competencies..."
            className="bg-transparent text-sm outline-none flex-1 min-w-0"
            style={{ color: 'rgb(var(--text-1))' }}
          />
          {competencySearch && (
            <button
              type="button"
              onClick={() => setCompetencySearch('')}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ color: 'rgb(var(--text-3))' }}
            >
              x
            </button>
          )}
        </div>

        {/* Domain Filter */}
        <SkillAreaNameFilterSelect
          value={competencyDomainFilter}
          onChange={setCompetencyDomainFilter}
          skillAreas={competencyDomains}
        />

        {/* Status & Critical Filter */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={competencyStatusFilter}
            onChange={(e) => setCompetencyStatusFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 border outline-none"
            style={{
              background: 'rgb(var(--surface-2))',
              borderColor: 'rgb(var(--border))',
              color: 'rgb(var(--text-1))',
            }}
          >
            <option value="all">All statuses</option>
            <option value="assessed">Assessed</option>
            <option value="unassessed">Unassessed</option>
            <option value="meets">Meets</option>
            <option value="below">Below</option>
            <option value="no-target">No target</option>
          </select>

          <select
            value={competencyCriticalFilter}
            onChange={(e) => setCompetencyCriticalFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 border outline-none"
            style={{
              background: 'rgb(var(--surface-2))',
              borderColor: 'rgb(var(--border))',
              color: 'rgb(var(--text-1))',
            }}
          >
            <option value="all">All types</option>
            <option value="critical">Critical</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {hasCompetencyFilters && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            className="btn-ghost text-xs px-3 py-1.5"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
};
