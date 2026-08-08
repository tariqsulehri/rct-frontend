import React, { useEffect, useMemo, useState } from 'react';
import { Save, Search } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { CategoryFilterSelect, SkillAreaFilterSelect } from '@/components/filters/TaxonomyFilterSelects';
import {
  ConfigCompetency,
  useBulkUpsertCompetencyGradeThresholds,
  useConfigCompetencies,
  useConfigCompetencyCategories,
  useConfigCompetencyGradeThresholds,
  useConfigDepartments,
  useConfigGrades,
  useConfigSkillDomains,
  useSyncDepartmentSkillMap,
} from '@/hooks/useConfig';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

export const DepartmentSkillMapSection: React.FC = () => {
  const { data: departments } = useConfigDepartments();
  const { data: domains } = useConfigSkillDomains();
  const { data: competencies } = useConfigCompetencies();
  const { data: categories } = useConfigCompetencyCategories();
  const syncDepartmentSkillMap = useSyncDepartmentSkillMap();

  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [domainId, setDomainId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'mapped' | 'unmapped'>('');

  const selectedDepartmentId = departmentId ? Number(departmentId) : null;

  useEffect(() => {
    if (departmentId || !departments?.length) return;
    const devOps = departments.find((department) => department.name.toLowerCase() === 'devops');
    setDepartmentId(String((devOps ?? departments[0]).id));
  }, [departmentId, departments]);

  useEffect(() => {
    setDomainId('');
  }, [departmentId]);

  const departmentOptions = (departments ?? []).map((department) => ({
    value: String(department.id),
    label: department.name,
    sub: department.description ?? undefined,
  }));
  const statusOptions = [
    { value: 'mapped', label: 'Mapped skills' },
    { value: 'unmapped', label: 'Unmapped skills' },
  ];

  const orderedCompetencies = useMemo(() => [...(competencies ?? [])].sort((a, b) => {
    const categoryA = a.competency_category?.name ?? '';
    const categoryB = b.competency_category?.name ?? '';
    return categoryA.localeCompare(categoryB) || a.name.localeCompare(b.name);
  }), [competencies]);

  const sortDomainMaps = (maps: NonNullable<ConfigCompetency['competency_domains']>) =>
    [...maps].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.domain.name.localeCompare(b.domain.name));

  const getDepartmentMaps = (competency: ConfigCompetency) => {
    if (!selectedDepartmentId) return [];
    return sortDomainMaps((competency.competency_domains ?? []).filter((map) => map.department_id === selectedDepartmentId));
  };

  const getSuggestedDomainIds = (competency: ConfigCompetency) => {
    const mappedIds = getDepartmentMaps(competency).map((map) => map.domain.id);
    if (mappedIds.length > 0) return mappedIds;

    const sourceMaps = sortDomainMaps((competency.competency_domains ?? []).filter((map) => map.department_id !== selectedDepartmentId));
    const sourceIds = sourceMaps.map((map) => map.domain.id);
    if (sourceIds.length > 0) return [...new Set(sourceIds)];

    const sameCategoryDomain = domains?.find((domain) => domain.category_id === competency.category_id);
    return sameCategoryDomain ? [sameCategoryDomain.id] : [];
  };

  const getDisplayMaps = (competency: ConfigCompetency) => {
    const mapped = getDepartmentMaps(competency);
    if (mapped.length > 0) return mapped;
    const suggestedIds = new Set(getSuggestedDomainIds(competency));
    return (domains ?? [])
      .filter((domain) => suggestedIds.has(domain.id))
      .map((domain, index) => ({ department_id: selectedDepartmentId ?? 0, is_primary: index === 0, domain }));
  };

  const filteredCompetencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orderedCompetencies.filter((competency) => {
      const isMapped = getDepartmentMaps(competency).length > 0;
      if (statusFilter === 'mapped' && !isMapped) return false;
      if (statusFilter === 'unmapped' && isMapped) return false;
      const displayMaps = getDisplayMaps(competency);
      const displayDomainIds = displayMaps.map((map) => String(map.domain.id));
      const displayDomainNames = displayMaps.map((map) => map.domain.name).join(' ');
      const matchesCategory = !categoryId || String(competency.category_id) === categoryId;
      if (!matchesCategory) return false;
      const matchesDomain = !domainId || displayDomainIds.includes(domainId);
      if (!matchesDomain) return false;
      if (!q) return true;
      return (
        competency.name.toLowerCase().includes(q) ||
        (competency.competency_category?.name ?? '').toLowerCase().includes(q) ||
        displayDomainNames.toLowerCase().includes(q)
      );
    });
  }, [categoryId, domainId, orderedCompetencies, search, selectedDepartmentId, domains, statusFilter]);

  const mappedCount = orderedCompetencies.filter((competency) => getDepartmentMaps(competency).length > 0).length;
  const unmappedCount = Math.max(0, orderedCompetencies.length - mappedCount);
  const hasFilters = search.trim().length > 0 || categoryId !== '' || domainId !== '' || statusFilter !== '';

  const syncOneSkill = async (competency: ConfigCompetency, domainIds: number[]) => {
    if (!selectedDepartmentId) return;
    try {
      await syncDepartmentSkillMap.mutateAsync({
        department_id: selectedDepartmentId,
        mappings: [{ competency_id: competency.id, domain_ids: domainIds }],
      });
      if (domainIds.length > 0) {
        toast.success(`Skill "${competency.name}" added to department map.`, 'Skill Mapped');
      } else {
        toast.success(`Skill "${competency.name}" removed from department map.`, 'Skill Removed');
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update department skill map.'), 'Error');
    }
  };

  const handleAddSkill = (competency: ConfigCompetency) => {
    const domainIds = getSuggestedDomainIds(competency);
    if (domainIds.length === 0) return;
    void syncOneSkill(competency, domainIds);
  };

  const handleRemoveSkill = (competency: ConfigCompetency) => {
    void syncOneSkill(competency, []);
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-1))' }}>
            Department Skill Map
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
            Select a department, then add or remove skills from that department map.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-72">
            <SearchableSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department..."
              options={departmentOptions}
            />
          </div>
          {syncDepartmentSkillMap.isPending && (
            <span className="text-xs whitespace-nowrap" style={{ color: 'rgb(var(--text-2))' }}>Saving...</span>
          )}
        </div>
      </div>

      <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2) / 0.35)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 h-10"
          style={{ backgroundColor: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))' }}>
          <Search size={15} style={{ color: 'rgb(var(--text-3))' }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search skills, categories, or mapped skill areas..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'rgb(var(--text-1))' }}
          />
        </div>
        <div className="w-full lg:w-56">
          <CategoryFilterSelect
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value);
              const selectedDomain = domains?.find(domain => String(domain.id) === domainId);
              if (value && selectedDomain && String(selectedDomain.category_id) !== value) {
                setDomainId('');
              }
            }}
            categories={categories}
          />
        </div>
        <div className="w-full lg:w-56">
          <SkillAreaFilterSelect
            value={domainId}
            onChange={setDomainId}
            skillAreas={domains}
            categories={categories}
            categoryId={categoryId}
          />
        </div>
        <div className="w-full lg:w-52">
          <SearchableSelect
            value={statusFilter}
              onChange={(value) => setStatusFilter(value as '' | 'mapped' | 'unmapped')}
            placeholder="All skills"
            options={statusOptions}
          />
        </div>
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <span className="text-xs whitespace-nowrap" style={{ color: 'rgb(var(--text-2))' }}>
            Showing {filteredCompetencies.length} / {orderedCompetencies.length} · {mappedCount} mapped · {unmappedCount} unmapped
          </span>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setCategoryId(''); setDomainId(''); setStatusFilter(''); }}
              className="btn-ghost h-9 px-3 rounded-lg text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!selectedDepartmentId ? (
        <div className="p-6 text-sm" style={{ color: 'rgb(var(--text-3))' }}>Select a department to map skills.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill Area</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompetencies.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>No skills match the selected filters.</td></tr>
              ) : filteredCompetencies.map((competency, index) => {
                const category = competency.competency_category;
                const departmentMaps = getDepartmentMaps(competency);
                const displayMaps = getDisplayMaps(competency);
                const isMapped = departmentMaps.length > 0;
                const canAdd = getSuggestedDomainIds(competency).length > 0;
                return (
                  <tr key={competency.id}
                    style={{
                      borderBottom: '1px solid rgb(var(--border))',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.45)',
                    }}>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>{competency.name}</div>
                      {competency.is_critical && <span className="badge badge-danger mt-1">Important</span>}
                    </td>
                    <td className="px-4 py-3">
                      {category ? (
                        <span className="badge text-xs font-semibold"
                          style={{
                            backgroundColor: category.color ? category.color + '22' : 'rgb(var(--accent-soft))',
                            color: category.color ?? 'rgb(var(--accent-txt))',
                            border: `1px solid ${category.color ?? 'rgb(var(--accent))'}44`,
                          }}>
                          {category.name}
                        </span>
                      ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      {displayMaps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {displayMaps.map((map) => (
                            <span key={map.domain.id} className="badge text-xs font-semibold"
                              style={{
                                backgroundColor: map.domain.color ? map.domain.color + '22' : 'rgb(var(--surface-2))',
                                color: map.domain.color ?? 'rgb(var(--text-2))',
                                border: `1px solid ${map.domain.color ?? 'rgb(var(--border))'}44`,
                                opacity: isMapped ? 1 : 0.7,
                              }}>
                              {isMapped ? map.domain.name : `Suggested: ${map.domain.name}`}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-sm" style={{ color: 'rgb(var(--text-3))' }}>No skill area suggestion</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={isMapped ? 'badge badge-success' : 'badge'}>
                        {isMapped ? 'Mapped' : 'Not mapped'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isMapped ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(competency)}
                          disabled={syncDepartmentSkillMap.isPending}
                          className="btn-ghost h-8 px-3 rounded-lg text-xs font-semibold disabled:opacity-60"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddSkill(competency)}
                          disabled={!canAdd || syncDepartmentSkillMap.isPending}
                          className="btn-primary h-8 px-3 rounded-lg text-xs font-semibold disabled:opacity-60"
                        >
                          Add to Department
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const CompetencyThresholdMatrix: React.FC = () => {
  const { data: departments } = useConfigDepartments();
  const { data: grades } = useConfigGrades();
  const { data: competencies } = useConfigCompetencies();
  const { data: categories } = useConfigCompetencyCategories();
  const { data: domains } = useConfigSkillDomains();
  const [departmentId, setDepartmentId] = useState('');
  const selectedDepartmentId = departmentId ? Number(departmentId) : null;
  const { data: thresholds, isLoading, isError } = useConfigCompetencyGradeThresholds(selectedDepartmentId);
  const saveThresholds = useBulkUpsertCompetencyGradeThresholds();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [targetSearch, setTargetSearch] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [targetDomainId, setTargetDomainId] = useState('');

  useEffect(() => {
    if (departmentId || !departments?.length) return;
    const devOps = departments.find((d) => d.name.toLowerCase() === 'devops');
    setDepartmentId(String((devOps ?? departments[0]).id));
  }, [departmentId, departments]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of thresholds ?? []) {
      next[`${row.competency_id}:${row.grade_id}`] = String(Math.round(row.threshold * 100));
    }
    setDraft(next);
  }, [thresholds]);

  const orderedGrades = useMemo(
    () => [...(grades ?? [])]
      .filter((grade) => selectedDepartmentId ? (grade.department_id === selectedDepartmentId && grade.is_active !== false) : false)
      .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code)),
    [grades, selectedDepartmentId]
  );

  const orderedCompetencies = useMemo(
    () => [...(competencies ?? [])].sort((a, b) => {
      const ad = a.competency_domains?.find(d => d.is_primary)?.domain.name ?? a.competency_domains?.[0]?.domain.name ?? '';
      const bd = b.competency_domains?.find(d => d.is_primary)?.domain.name ?? b.competency_domains?.[0]?.domain.name ?? '';
      return ad.localeCompare(bd) || a.name.localeCompare(b.name);
    }),
    [competencies]
  );

  const getDepartmentDomains = (competency: ConfigCompetency) => {
    const maps = competency.competency_domains ?? [];
    if (!selectedDepartmentId) return maps;
    const departmentMaps = maps.filter((map) => map.department_id === selectedDepartmentId);
    return departmentMaps.length > 0 ? departmentMaps : maps;
  };

  const targetAllowedDomainIds = useMemo(() => {
    const domainIds = new Set<number>();
    for (const competency of competencies ?? []) {
      for (const map of getDepartmentDomains(competency)) {
        domainIds.add(map.domain.id);
      }
    }
    return domainIds;
  }, [competencies, selectedDepartmentId]);

  const filteredCompetencies = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    return orderedCompetencies.filter((competency) => {
      const category = competency.competency_category;
      const domainsForCompetency = getDepartmentDomains(competency);
      const matchesCategory = !targetCategoryId || String(competency.category_id) === targetCategoryId;
      if (!matchesCategory) return false;
      const matchesDomain = !targetDomainId || domainsForCompetency.some((map) => String(map.domain.id) === targetDomainId);
      if (!matchesDomain) return false;
      if (!q) return true;
      const domainText = domainsForCompetency.map((map) => map.domain.name).join(' ').toLowerCase();
      const categoryText = (category?.name ?? '').toLowerCase();
      return competency.name.toLowerCase().includes(q) || categoryText.includes(q) || domainText.includes(q);
    });
  }, [orderedCompetencies, selectedDepartmentId, targetCategoryId, targetDomainId, targetSearch]);

  const hasTargetFilters = targetSearch.trim().length > 0 || targetCategoryId !== '' || targetDomainId !== '';

  const departmentOptions = (departments ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
    sub: d.description ?? undefined,
  }));

  const handleDraftChange = (competencyId: number, gradeId: number, value: string) => {
    if (value === '') {
      setDraft((prev) => ({ ...prev, [`${competencyId}:${gradeId}`]: '' }));
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const clamped = Math.max(0, Math.min(100, numeric));
    setDraft((prev) => ({ ...prev, [`${competencyId}:${gradeId}`]: String(clamped) }));
  };

  const handleSaveThresholds = async () => {
    if (!selectedDepartmentId) return;
    const payload = orderedCompetencies.flatMap((competency) =>
      orderedGrades.flatMap((grade) => {
        const raw = draft[`${competency.id}:${grade.id}`];
        if (raw === undefined || raw === '') return [];
        return [{
          competency_id: competency.id,
          grade_id: grade.id,
          threshold: Number(raw) / 100,
        }];
      })
    );
    if (payload.length === 0) return;
    try {
      await saveThresholds.mutateAsync({ department_id: selectedDepartmentId, thresholds: payload });
      toast.success('Department skill target scores updated successfully.', 'Targets Saved');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save skill targets.'), 'Save Error');
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-1))' }}>
            Department Skill Targets
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
            Select a department, then set the minimum score required for each skill at each target grade.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-72">
            <SearchableSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department..."
              options={departmentOptions}
            />
          </div>
          <button
            onClick={handleSaveThresholds}
            disabled={!selectedDepartmentId || saveThresholds.isPending}
            className="btn-primary h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold whitespace-nowrap disabled:opacity-60"
          >
            <Save size={15} />
            {saveThresholds.isPending ? 'Saving' : 'Save Targets'}
          </button>
        </div>
      </div>

      <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3"
        style={{ borderBottom: '1px solid rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2) / 0.35)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 h-10"
          style={{ backgroundColor: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))' }}>
          <Search size={15} style={{ color: 'rgb(var(--text-3))' }} />
          <input
            value={targetSearch}
            onChange={(e) => setTargetSearch(e.target.value)}
            placeholder="Search skills, categories, or skill areas..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'rgb(var(--text-1))' }}
          />
        </div>
        <div className="w-full lg:w-56">
          <CategoryFilterSelect
            value={targetCategoryId}
            onChange={(value) => {
              setTargetCategoryId(value);
              const selectedDomain = domains?.find(domain => String(domain.id) === targetDomainId);
              if (value && selectedDomain && String(selectedDomain.category_id) !== value) {
                setTargetDomainId('');
              }
            }}
            categories={categories}
          />
        </div>
        <div className="w-full lg:w-56">
          <SkillAreaFilterSelect
            value={targetDomainId}
            onChange={setTargetDomainId}
            skillAreas={domains}
            categories={categories}
            categoryId={targetCategoryId}
            allowedSkillAreaIds={targetAllowedDomainIds}
          />
        </div>
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <span className="text-xs whitespace-nowrap" style={{ color: 'rgb(var(--text-2))' }}>
            {filteredCompetencies.length} / {orderedCompetencies.length} skills
          </span>
          {hasTargetFilters && (
            <button
              onClick={() => { setTargetSearch(''); setTargetCategoryId(''); setTargetDomainId(''); }}
              className="btn-ghost h-9 px-3 rounded-lg text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!selectedDepartmentId ? (
        <div className="p-6 text-sm" style={{ color: 'rgb(var(--text-3))' }}>Select a department to configure skill targets.</div>
      ) : isError ? (
        <div className="p-6 text-sm" style={{ color: 'rgb(var(--danger))' }}>Failed to load department skill targets.</div>
      ) : orderedGrades.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
            No grades found for {departments?.find(d => d.id === selectedDepartmentId)?.name || 'this department'}.
          </p>
          <p className="text-xs max-w-md" style={{ color: 'rgb(var(--text-2))' }}>
            Grades (e.g. G13, G14, G15) define the career levels against which skill targets are set. Please add grades for this department in the <strong>Grades</strong> tab first.
          </p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>Skill Area</th>
                {orderedGrades.map((grade) => (
                  <th key={grade.id} className="px-3 py-3 text-center text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>
                    {grade.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={orderedGrades.length + 3} className="px-4 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>Loading targets...</td></tr>
              ) : filteredCompetencies.length === 0 ? (
                <tr><td colSpan={orderedGrades.length + 3} className="px-4 py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>No skills match the selected filters.</td></tr>
              ) : filteredCompetencies.map((competency, idx) => {
                const domainsForCompetency = getDepartmentDomains(competency);
                const primaryDomain = domainsForCompetency.find(d => d.is_primary)?.domain ?? domainsForCompetency[0]?.domain;
                const category = competency.competency_category;
                return (
                  <tr key={competency.id}
                    style={{
                      borderBottom: '1px solid rgb(var(--border))',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.45)',
                    }}>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>{competency.name}</div>
                      {competency.is_critical && <span className="badge badge-danger mt-1">Important</span>}
                    </td>
                    <td className="px-4 py-3">
                      {category ? (
                        <span className="badge text-xs font-semibold"
                          style={{
                            backgroundColor: category.color ? category.color + '22' : 'rgb(var(--accent-soft))',
                            color: category.color ?? 'rgb(var(--accent-txt))',
                            border: `1px solid ${category.color ?? 'rgb(var(--accent))'}44`,
                          }}>
                          {category.name}
                        </span>
                      ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'rgb(var(--text-2))' }}>
                      {primaryDomain?.name ?? 'No skill area'}
                    </td>
                    {orderedGrades.map((grade) => {
                      const key = `${competency.id}:${grade.id}`;
                      return (
                        <td key={grade.id} className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={draft[key] ?? ''}
                              onChange={(e) => handleDraftChange(competency.id, grade.id, e.target.value)}
                              className="field text-center font-mono"
                              style={{ width: 70, height: 34, padding: '0 8px' }}
                            />
                            <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
