import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useConfirmDialog } from '@/components/ui/useConfirmDialog';
import { Stars } from '@/components/ui/Stars';
import { ChevronUp, ChevronDown, Edit3, Plus, Trash2, X, Check, CheckCheck, ShieldCheck, Info, Copy, Layers, SaveAll, Send, RefreshCw } from 'lucide-react';
import { CloneColleagueDialog } from './CloneColleagueDialog';
import { BulkAddDialog, BulkAddTechnologyPayload } from './BulkAddDialog';
import { computeAssessmentScorePreview } from '@/lib/scoringPreview';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';
import { useConfigAssessmentLevels, useConfigAssessmentProjects, useConfigAssessmentTypes } from '@/hooks/useConfig';
import {
  useSkillsHierarchy,
  useEmployeeAssessments,
  useDuplicateAssessmentCheck,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment,
  useApproveAssessment,
  useSubmitDraftsForApproval,
  SkillHierarchy,
  SkillAssessment,
} from '@/hooks/useAssessment';

interface Props {
  employeeId: string;   // emp_code e.g. "1818"
  employeeName?: string;
  readOnlyLevel?: boolean;   // true for engineers: level shown but not editable
  canApprove?: boolean;      // true for managers/admins: shows Approve button on pending rows
  onSuccess?: () => void;
  onClose?: () => void;
}

export type AssessmentLevel = 'Expert' | 'Advanced' | 'Proficient' | 'Foundational' | 'Beginner' | 'Awareness' | 'Unset';

export interface BulkRow {
  id: string;
  existingAssessmentId?: number;
  isNew?: boolean;
  status: 'draft' | 'pending' | 'approved';
  domainId: number | null;
  competencyId: number | null;
  technologyId: number | null;
  type: 'Primary' | 'Secondary' | 'Tertiary';
  projects: number;
  level: AssessmentLevel;
  scorePreview?: number;
  isDuplicate?: boolean;
  error?: string;
}

interface SearchableOption {
  value: string;
  label: string;
}

type SortKey = 'domain' | 'competency' | 'technology' | 'type' | 'projects' | 'level' | 'score';
type SortOrder = 'asc' | 'desc';

const LEVEL_RANKS: Record<string, number> = {
  Expert: 5,
  Advanced: 4,
  Proficient: 3,
  Foundational: 2,
  Beginner: 1,
  Awareness: 0.5,
  Unset: 0,
};

export const LEVEL_COLORS: Record<AssessmentLevel, string> = {
  Unset:       'rgb(var(--text-3))',
  Expert:      'rgb(var(--success))',
  Advanced:    '#22d3ee',
  Proficient:  'rgb(var(--warning))',
  Foundational:'#f97316',
  Beginner:    '#f97316',
  Awareness:   '#a855f7',
};

export const LEVEL_LABELS: Record<AssessmentLevel, string> = {
  Unset:       '— Unset',
  Expert:      'Expert',
  Advanced:    'Advanced',
  Proficient:  'Proficient',
  Foundational:'Foundational',
  Beginner:    'Beginner',
  Awareness:   'Awareness',
};

export const TYPE_OPTIONS = [
  { value: 'Primary', label: 'Primary - main skill' },
  { value: 'Secondary', label: 'Secondary - supporting skill' },
  { value: 'Tertiary', label: 'Tertiary - related skill' },
] as const;

function createRowId() {
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <button
    type="button"
    className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
    title={text}
    aria-label={text}
    onClick={(event) => event.stopPropagation()}
  >
    <Info size={13} />
  </button>
);

const SearchableSelect: React.FC<{
  value: string;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  defaultOpen?: boolean;
  className?: string;
  onChange: (value: string) => void;
}> = ({ value, options, placeholder = 'Search...', disabled, invalid, defaultOpen = false, className, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Calculate fixed viewport position so the dropdown escapes overflow:hidden/auto containers
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed' as const,
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (!open) calcPosition();
    setOpen((prev) => !prev);
  }, [disabled, open, calcPosition]);

  // defaultOpen: calculate position on mount then open
  useEffect(() => {
    if (defaultOpen && !disabled) {
      calcPosition();
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close when clicking outside both the trigger and the portal dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Update position on scroll or resize; ignore scrolls originating from within the dropdown itself
  useEffect(() => {
    if (!open) return;
    const updatePosition = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      calcPosition();
    };
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, calcPosition]);

  // Clear search when closed
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={selected?.label}
        onClick={handleToggle}
        className="w-full text-xs px-2 py-1 rounded-md border flex items-center justify-between gap-2"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          borderColor: invalid ? 'rgb(var(--danger))' : 'rgb(var(--border))',
          color: 'rgb(var(--text-1))',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="truncate text-left">{selected?.label || '—'}</span>
        <ChevronDown size={12} style={{ color: 'rgb(var(--text-3))' }} />
      </button>

      {open && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className="rounded-md border shadow-elevated"
          style={{
            ...dropdownStyle,
            backgroundColor: 'rgb(var(--surface))',
            borderColor: 'rgb(var(--border))',
          }}
        >
          <div className="p-1.5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs px-2 py-1 rounded-md border"
              style={{
                backgroundColor: 'rgb(var(--surface-2))',
                borderColor: 'rgb(var(--border))',
                color: 'rgb(var(--text-1))',
              }}
            />
          </div>
          <div className="max-h-44 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md"
                  style={{
                    backgroundColor: option.value === value ? 'rgb(var(--accent-soft))' : 'transparent',
                    color: option.value === value ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-1))',
                  }}
                  onMouseEnter={(e) => {
                    if (option.value !== value) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
                  }}
                  onMouseLeave={(e) => {
                    if (option.value !== value) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

function createEmptyRow(): BulkRow {
  return {
    id: createRowId(),
    isNew: true,
    status: 'draft',
    domainId: null,
    competencyId: null,
    technologyId: null,
    type: 'Primary',
    projects: 1,
    level: 'Unset',
  };
}

function getDuplicateKey(employeeId: string, row: BulkRow) {
  if (!row.domainId || !row.competencyId || !row.technologyId) return null;
  return `${employeeId}:${row.domainId}:${row.competencyId}:${row.technologyId}`;
}

function buildTechnologyLocationMap(hierarchy: SkillHierarchy[]) {
  const map = new Map<number, { domainId: number; competencyId: number }>();

  for (const domain of hierarchy) {
    for (const competency of domain.competencies) {
      for (const technology of competency.technologies) {
        map.set(technology.id, {
          domainId: domain.domainId,
          competencyId: competency.competencyId,
        });
      }
    }
  }

  return map;
}

export const BulkAssessmentTable: React.FC<Props> = ({ employeeId, employeeName, readOnlyLevel = false, canApprove = false, onSuccess, onClose }) => {
  const {
    data: hierarchy = [],
    isLoading: hierarchyLoading,
    isError: hierarchyIsError,
    error: hierarchyError,
    refetch: refetchHierarchy,
  } = useSkillsHierarchy();
  const {
    data: existingAssessments = [],
    isLoading: existingAssessmentsLoading,
    isFetching: existingAssessmentsFetching,
    isError: existingAssessmentsIsError,
    error: existingAssessmentsError,
    refetch: refetchExistingAssessments,
  } = useEmployeeAssessments(employeeId);
  const { checkDuplicate } = useDuplicateAssessmentCheck(employeeId);
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const approveAssessment = useApproveAssessment();
  const submitDrafts = useSubmitDraftsForApproval();
  const { data: assessmentTypes = [] } = useConfigAssessmentTypes();
  const { data: assessmentLevels = [] } = useConfigAssessmentLevels();
  const { data: assessmentProjects = [] } = useConfigAssessmentProjects();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [rows, setRows] = useState<BulkRow[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'draft' | 'approved'>('all');
  // Sort state is purely cosmetic (header indicators). Actual order lives in `rows`.
  const [activeSortKey, setActiveSortKey] = useState<SortKey | null>('domain');
  const [activeSortOrder, setActiveSortOrder] = useState<SortOrder>('asc');
  const [editingRowIds, setEditingRowIds] = useState<Set<string>>(new Set());
  const [approvingRowIds, setApprovingRowIds] = useState<Set<string>>(new Set());
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isSubmittingDrafts, setIsSubmittingDrafts] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const techLocationMap = useMemo(() => buildTechnologyLocationMap(hierarchy), [hierarchy]);
  const scoringValues = useMemo(() => ({
    Primary: assessmentTypes.find((type) => type.code === 'Primary' && type.is_active)?.weight,
    Secondary: assessmentTypes.find((type) => type.code === 'Secondary' && type.is_active)?.weight,
    Tertiary: assessmentTypes.find((type) => type.code === 'Tertiary' && type.is_active)?.weight,
  }), [assessmentTypes]);
  const levelWeights = useMemo(() => Object.fromEntries(
    assessmentLevels.filter((level) => level.is_active).map((level) => [level.code, level.weight]),
  ), [assessmentLevels]);
  const projectCredits = useMemo(() => Object.fromEntries(
    assessmentProjects.filter((project) => project.is_active).map((project) => [project.project_count, project.credit]),
  ), [assessmentProjects]);
  const levelOptions = useMemo(() => {
    const configured = assessmentLevels
      .filter((level) => level.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((level) => ({ value: level.code, label: level.label }));
    return configured.length > 0
      ? configured
      : Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));
  }, [assessmentLevels]);
  const projectOptions = useMemo(() => {
    const configured = assessmentProjects
      .filter((project) => project.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((project) => ({ value: String(project.project_count), label: project.label }));
    return configured.length > 0
      ? configured
      : [
        { value: '0', label: '0 - no project yet' },
        { value: '1', label: '1 - used in 1 project' },
        { value: '2', label: '2 - used in 2 projects' },
        { value: '3', label: '3+ - used in 3 or more projects' },
      ];
  }, [assessmentProjects]);

  useEffect(() => {
    setRows([]);
    setStatusFilter('all');
    setEditingRowIds(new Set());
    setApprovingRowIds(new Set());
    setSavingRowIds(new Set());
    setActiveSortKey('domain');
    setActiveSortOrder('asc');
  }, [employeeId]);

  useEffect(() => {
    if (hierarchyLoading || existingAssessmentsLoading) return;

    const populatedRows: BulkRow[] = existingAssessments.map((assessment) => {
      const mapped = techLocationMap.get(assessment.technology_id);

      return {
        id: `existing-${assessment.id}`,
        existingAssessmentId: assessment.id,
        isNew: false,
        status: (assessment.status as 'draft' | 'pending' | 'approved') ?? 'approved',
        domainId: mapped?.domainId ?? null,
        competencyId: mapped?.competencyId ?? null,
        technologyId: assessment.technology_id,
        type: assessment.type,
        projects: assessment.projects,
        level: (assessment.level as AssessmentLevel) ?? 'Beginner',
        error: mapped ? undefined : 'This tool no longer exists in setup.',
      };
    });

    // Default sort: Skill Area → Skill → Technology (alphabetically)
    populatedRows.sort((a, b) => {
      const resolve = (row: BulkRow) => {
        const domain = hierarchy.find((d) => d.domainId === row.domainId);
        const competency = domain?.competencies.find((c) => c.competencyId === row.competencyId);
        return {
          domainName: domain?.domainName ?? '',
          competencyName: competency?.competencyName ?? '',
          techName: competency?.technologies.find((t) => t.id === row.technologyId)?.name ?? '',
        };
      };
      const an = resolve(a);
      const bn = resolve(b);
      return (
        an.domainName.localeCompare(bn.domainName) ||
        an.competencyName.localeCompare(bn.competencyName) ||
        an.techName.localeCompare(bn.techName)
      );
    });

    setRows((currentRows) => {
      const unsavedDrafts = currentRows.filter((r) => r.isNew);
      return [...unsavedDrafts, ...populatedRows];
    });
  }, [
    hierarchyLoading,
    existingAssessmentsLoading,
    employeeId,
    existingAssessments,
    hierarchy,
    techLocationMap,
  ]);

  const getDomainForRow = useCallback((domainId: number | null) => {
    if (domainId === null) return null;
    return hierarchy.find((d) => d.domainId === domainId);
  }, [hierarchy]);

  const getCompetenciesForDomain = useCallback((domainId: number | null) => {
    if (domainId === null) return [];
    const domain = hierarchy.find((d) => d.domainId === domainId);
    return domain?.competencies || [];
  }, [hierarchy]);

  const getTechnologiesForCompetency = useCallback((domainId: number | null, competencyId: number | null) => {
    if (domainId === null || competencyId === null) return [];
    const domain = hierarchy.find((d) => d.domainId === domainId);
    const competency = domain?.competencies.find((c) => c.competencyId === competencyId);
    return competency?.technologies || [];
  }, [hierarchy]);

  const updateRow = useCallback(<K extends keyof BulkRow>(rowId: string, field: K, value: BulkRow[K]) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;

        const updated = { ...r, [field]: value };

        if (field === 'domainId' && value !== r.domainId) {
          updated.competencyId = null;
          updated.technologyId = null;
          updated.existingAssessmentId = undefined;
        }
        if (field === 'competencyId' && value !== r.competencyId) {
          updated.technologyId = null;
          updated.existingAssessmentId = undefined;
        }

        if (field === 'technologyId' && value !== null) {
          if (value !== r.technologyId) {
            updated.existingAssessmentId = undefined;
          }
        }

        if (field === 'technologyId' && value === null) {
          updated.existingAssessmentId = undefined;
        }

        updated.error = undefined;

        return updated;
      })
    );
  }, []);

  const isRowEditable = useCallback((row: BulkRow) => {
    return row.isNew === true || editingRowIds.has(row.id) || approvingRowIds.has(row.id);
  }, [editingRowIds, approvingRowIds]);

const validateAndEnrichRow = useCallback((row: BulkRow): BulkRow => {
    const errors: string[] = [];

    if (!row.domainId) errors.push('Skill Area');
    if (!row.competencyId) errors.push('Skill');
    if (!row.technologyId) errors.push('Tool');

    const enriched = { ...row };

    if (errors.length === 0) {
      const duplicateKey = getDuplicateKey(employeeId, row);
      const duplicateRow = rows.find((candidate) =>
        candidate.id !== row.id &&
        getDuplicateKey(employeeId, candidate) === duplicateKey
      );
      const duplicate = checkDuplicate(row.domainId!, row.competencyId!, row.technologyId!);

      if (isRowEditable(row) && duplicateRow) {
        errors.push('Duplicate: this person already has the same skill area, skill, and tool.');
      }

      if (
        isRowEditable(row) &&
        duplicate.isDuplicate &&
        duplicate.existingAssessmentId !== undefined &&
        duplicate.existingAssessmentId !== row.existingAssessmentId
      ) {
        enriched.isDuplicate = true;
        enriched.existingAssessmentId = duplicate.existingAssessmentId;
        errors.push('Duplicate: this person already has the same skill area, skill, and tool.');
      }

      enriched.scorePreview = computeAssessmentScorePreview(row.type, row.projects, row.level, scoringValues, levelWeights, projectCredits);
    }

    if (errors.length > 0) {
      enriched.error = errors.some((error) => error.startsWith('Duplicate:'))
        ? errors.find((error) => error.startsWith('Duplicate:'))
        : 'Missing: ' + errors.join(', ');
    }

    return enriched;
  }, [checkDuplicate, employeeId, isRowEditable, rows, scoringValues, levelWeights, projectCredits]);

  const addRow = useCallback(() => {
    // Prepend so new row stays at the top, never jumps
    setRows((prev) => [createEmptyRow(), ...prev]);
  }, []);

  const setRowError = useCallback((rowId: string, error: string | undefined) => {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, error } : r));
  }, []);

  // ✓ click — validate then save that single row immediately
  const handleSaveRow = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const isApproving = approvingRowIds.has(rowId);

    // Validate
    const enriched = validateAndEnrichRow(row);
    if (enriched.error) {
      setRowError(rowId, enriched.error);
      return;
    }

    setRowError(rowId, undefined);
    setSavingRowIds((prev) => new Set(prev).add(rowId));

    try {
      if (isApproving && row.existingAssessmentId) {
        // Manager approving a pending assessment — set status=approved + level
        const saved = await approveAssessment.mutateAsync({
          id: row.existingAssessmentId,
          data: { type: row.type, projects: row.projects, level: row.level },
        });
        setRows((prev) => prev.map((r) =>
          r.id === rowId ? { ...r, status: 'approved', level: saved.level as AssessmentLevel } : r
        ));
        setApprovingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
        toast.success('Skill assessment approved successfully!', 'Approved');
      } else if (row.existingAssessmentId) {
        // Regular update
        await updateAssessment.mutateAsync({
          id: row.existingAssessmentId,
          data: { type: row.type, projects: row.projects, level: row.level },
        });
        setEditingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
        toast.success('Skill assessment updated successfully!', 'Saved');
      } else {
        // Create new assessment
        const initialStatus = readOnlyLevel ? 'draft' : 'approved';
        const saved = await createAssessment.mutateAsync({
          employee_id: employeeId,
          technology_id: row.technologyId!,
          type: row.type,
          projects: row.projects,
          level: row.level,
          status: initialStatus,
        });
        setRows((prev) => prev.map((r) =>
          r.id === rowId
            ? { ...r, isNew: false, status: saved.status as 'draft' | 'pending' | 'approved', existingAssessmentId: saved.id, error: undefined }
            : r
        ));
        toast.success(readOnlyLevel ? 'Skill saved as draft.' : 'Skill assessment added successfully!', 'Saved');
      }
      onSuccess?.();
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, 'Save failed. Try again.');
      setRowError(rowId, errMsg);
      toast.error(errMsg, 'Save Failed');
    } finally {
      setSavingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
    }
  }, [rows, approvingRowIds, validateAndEnrichRow, approveAssessment, updateAssessment, createAssessment, readOnlyLevel, employeeId, onSuccess, setRowError]);

  const handleCloneColleague = useCallback((clonedAssessments: SkillAssessment[]) => {
    const existingTechIds = new Set(rows.map(r => r.technologyId).filter(Boolean));
    const newRows: BulkRow[] = [];
    clonedAssessments.forEach(a => {
      if (!existingTechIds.has(a.technology_id)) {
        const loc = techLocationMap.get(a.technology_id);
        if (loc) {
          newRows.push({
            id: createRowId(),
            isNew: true,
            status: 'draft',
            domainId: loc.domainId,
            competencyId: loc.competencyId,
            technologyId: a.technology_id,
            type: a.type,
            projects: a.projects,
            level: a.level,
          });
        }
      }
    });
    if (newRows.length > 0) {
      setRows(prev => [...newRows, ...prev]);
      toast.success(`Cloned ${newRows.length} skills as drafts. Click Save Draft to persist.`, 'Skills Cloned');
    } else {
      toast.info('All skills from this colleague are already present in your table.', 'No New Skills');
    }
  }, [rows, techLocationMap]);

  const handleBulkAdd = useCallback((technologies: BulkAddTechnologyPayload[]) => {
    const newRows: BulkRow[] = technologies.map(t => ({
      id: createRowId(),
      isNew: true,
      status: 'draft',
      domainId: t.domainId,
      competencyId: t.competencyId,
      technologyId: t.technologyId,
      type: t.type ?? 'Primary',
      projects: t.projects ?? 2,
      level: 'Unset',
    }));
    if (newRows.length > 0) {
      setRows(prev => [...newRows, ...prev]);
      toast.success(`Added ${newRows.length} skills as drafts. Click "Save Draft" or "Submit for Approval".`, 'Skills Added');
    }
  }, []);

  const handleSaveAllDrafts = useCallback(async () => {
    setIsSavingAll(true);
    const unsavedRows = rows.filter(r => r.isNew && r.technologyId);
    let successCount = 0;
    for (const row of unsavedRows) {
      await handleSaveRow(row.id);
      successCount++;
    }
    setIsSavingAll(false);
    if (successCount > 0) {
      toast.success(readOnlyLevel ? `Saved ${successCount} draft skills.` : `Saved ${successCount} skills.`, 'Saved');
    }
  }, [rows, handleSaveRow, readOnlyLevel]);

  const handleSubmitAllDrafts = useCallback(async () => {
    setIsSubmittingDrafts(true);
    try {
      // 1. Save any unpersisted rows first
      const unsavedRows = rows.filter(r => r.isNew && r.technologyId);
      for (const row of unsavedRows) {
        await handleSaveRow(row.id);
      }

      // 2. Submit all drafts for this employee
      const result = await submitDrafts.mutateAsync({ empCode: employeeId });
      toast.success(
        result.count > 0
          ? `Submitted ${result.count} skill${result.count === 1 ? '' : 's'} for manager approval!`
          : 'All skills are already submitted or approved.',
        'Submitted for Approval',
      );
      await refetchExistingAssessments();
      onSuccess?.();
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, 'Failed to submit drafts for approval.');
      toast.error(errMsg, 'Submission Failed');
    } finally {
      setIsSubmittingDrafts(false);
    }
  }, [rows, handleSaveRow, submitDrafts, employeeId, refetchExistingAssessments, onSuccess]);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetchExistingAssessments();
      toast.success('Skill rows refreshed from server.', 'Refreshed');
      onSuccess?.();
    } catch {
      toast.error('Failed to refresh skill rows. Please try again.', 'Refresh Failed');
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchExistingAssessments, onSuccess]);

  const deleteRow = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    if (row.existingAssessmentId) {
      const confirmed = await confirm({
        title: 'Delete Assessment',
        message: 'This will permanently delete the assessment from the database. Continue?',
        confirmLabel: 'Delete',
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        await deleteAssessment.mutateAsync(row.existingAssessmentId);
        toast.success('Skill assessment deleted.', 'Removed');
      } catch {
        const errMsg = 'Delete failed. Please try again.';
        setRowError(rowId, errMsg);
        toast.error(errMsg, 'Delete Failed');
        return;
      }
    } else {
      toast.info('Row removed from table.', 'Removed');
    }

    setEditingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
    setApprovingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
    setSavingRowIds((prev) => { const next = new Set(prev); next.delete(rowId); return next; });
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, [rows, deleteAssessment, confirm, setRowError]);

  // displayRows = rows in their stable insertion order, filtered by status tab & search.
  // No reactive sorting — order only changes when the user explicitly clicks a header.
  const displayRows = useMemo(() => {
    let result = rows;
    if (statusFilter === 'pending') {
      result = result.filter((r) => !r.isNew && r.status === 'pending');
    } else if (statusFilter === 'draft') {
      result = result.filter((r) => r.isNew || r.status === 'draft');
    } else if (statusFilter === 'approved') {
      result = result.filter((r) => !r.isNew && r.status === 'approved');
    }

    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter((r) => {
      const domain = getDomainForRow(r.domainId)?.domainName || '';
      const comp = getCompetenciesForDomain(r.domainId).find((c) => c.competencyId === r.competencyId)?.competencyName || '';
      const tech = getTechnologiesForCompetency(r.domainId, r.competencyId).find((t) => t.id === r.technologyId)?.name || '';
      return (
        domain.toLowerCase().includes(q) ||
        comp.toLowerCase().includes(q) ||
        tech.toLowerCase().includes(q)
      );
    });
  }, [rows, statusFilter, search, getDomainForRow, getCompetenciesForDomain, getTechnologiesForCompetency]);

  const toggleSort = useCallback((key: SortKey) => {
    const nextOrder = activeSortKey === key && activeSortOrder === 'asc' ? 'desc' : 'asc';
    setActiveSortKey(key);
    setActiveSortOrder(nextOrder);

    // Resolve the text label for each sort key (always sorts by name, never by ID)
    const getLabel = (row: BulkRow, field: SortKey): string => {
      switch (field) {
        case 'domain': {
          return hierarchy.find((d) => d.domainId === row.domainId)?.domainName ?? '';
        }
        case 'competency': {
          const domain = hierarchy.find((d) => d.domainId === row.domainId);
          return domain?.competencies.find((c) => c.competencyId === row.competencyId)?.competencyName ?? '';
        }
        case 'technology': {
          const domain = hierarchy.find((d) => d.domainId === row.domainId);
          const comp = domain?.competencies.find((c) => c.competencyId === row.competencyId);
          return comp?.technologies.find((t) => t.id === row.technologyId)?.name ?? '';
        }
        case 'type': return row.type;
        case 'projects': return String(row.projects);
        case 'level': return row.level;
        case 'score': return String(computeAssessmentScorePreview(row.type, row.projects, row.level, scoringValues, levelWeights, projectCredits));
      }
    };

    setRows((prev) => {
      const newRows = [...prev];
      newRows.sort((a, b) => {
        // Unsaved new rows always stay at top
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;

        // Primary: the clicked column (respects asc/desc)
        if (key === 'level') {
          const aRank = LEVEL_RANKS[a.level] ?? (levelWeights[a.level] ?? 0);
          const bRank = LEVEL_RANKS[b.level] ?? (levelWeights[b.level] ?? 0);
          if (aRank !== bRank) return nextOrder === 'asc' ? aRank - bRank : bRank - aRank;
        } else if (key === 'score') {
          const aScore = computeAssessmentScorePreview(a.type, a.projects, a.level, scoringValues, levelWeights, projectCredits);
          const bScore = computeAssessmentScorePreview(b.type, b.projects, b.level, scoringValues, levelWeights, projectCredits);
          if (aScore !== bScore) return nextOrder === 'asc' ? aScore - bScore : bScore - aScore;
        } else {
          const primaryCmp = getLabel(a, key).localeCompare(getLabel(b, key));
          if (primaryCmp !== 0) return nextOrder === 'asc' ? primaryCmp : -primaryCmp;
        }

        // Secondary tiebreakers: always domain → competency → technology (ascending)
        // so related items stay grouped together regardless of primary sort
        const tiebreakers: SortKey[] = ['domain', 'competency', 'technology'];
        for (const tb of tiebreakers) {
          if (tb === key) continue; // already the primary — skip
          const cmp = getLabel(a, tb).localeCompare(getLabel(b, tb));
          if (cmp !== 0) return cmp;
        }

        return 0;
      });
      return newRows;
    });
  }, [activeSortKey, activeSortOrder, hierarchy, scoringValues, levelWeights, projectCredits]);


  const SortIcon = ({ isActive, order }: { isActive: boolean; order: SortOrder }) => {
    if (!isActive) return <span style={{ color: 'rgb(var(--text-3))' }}>⇅</span>;
    return order === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const TableHeader = ({ label, sortKey: sk, help }: { label: string; sortKey: SortKey; help?: string }) => (
    <th
      onClick={() => toggleSort(sk)}
      className="px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer"
      style={{
        color: 'rgb(var(--text-2))',
        backgroundColor: 'rgb(var(--surface-2))',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: '1px solid rgb(var(--border))',
        userSelect: 'none',
      }}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {help && <InfoTip text={help} />}
        <SortIcon isActive={activeSortKey === sk} order={activeSortOrder} />
      </div>
    </th>
  );

  const PlainHeader = ({ label, help }: { label: string; help?: string }) => (
    <th className="px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))', position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'rgb(var(--surface-2))' }}>
      <div className="flex items-center gap-1.5">
        {label}
        {help && <InfoTip text={help} />}
      </div>
    </th>
  );

  const isInitializing = hierarchyLoading || existingAssessmentsLoading;
  const loadErrors = [
    hierarchyIsError ? getApiErrorMessage(hierarchyError, 'Skill setup could not load.') : null,
    existingAssessmentsIsError ? getApiErrorMessage(existingAssessmentsError, 'Saved skill rows could not load.') : null,
  ].filter(Boolean);
  const savedCount = rows.filter((r) => !r.isNew && r.status === 'approved').length;
  const pendingCount = rows.filter((r) => !r.isNew && r.status === 'pending').length;
  const unsavedCount = rows.filter((r) => r.isNew && r.technologyId).length;
  const draftCount = rows.filter((r) => (r.status === 'draft' || r.isNew) && r.technologyId).length;

  const handleApproveAllPending = useCallback(async () => {
    const pendingRows = rows.filter((r) => !r.isNew && r.status === 'pending' && r.existingAssessmentId);
    if (pendingRows.length === 0) return;
    const confirmed = await confirm({
      title: `Approve All Pending Skills (${pendingRows.length})`,
      message: `Are you sure you want to approve all ${pendingRows.length} pending skills for this employee?`,
      confirmLabel: 'Approve All',
    });
    if (!confirmed) return;

    setIsSubmittingDrafts(true);
    try {
      for (const r of pendingRows) {
        await updateAssessment.mutateAsync({
          id: r.existingAssessmentId!,
          data: { status: 'approved' },
        });
      }
      setRows((prev) => prev.map((r) => r.status === 'pending' ? { ...r, status: 'approved' } : r));
      toast.success(`Approved ${pendingRows.length} skills successfully!`, 'Approved');
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to approve all pending skills.'));
    } finally {
      setIsSubmittingDrafts(false);
    }
  }, [rows, confirm, updateAssessment, onSuccess]);

  return (
    <>
    {confirmDialog}
    <div className="h-full flex flex-col gap-3 pt-1 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold leading-tight" style={{ color: 'rgb(var(--text-1))' }}>
            {readOnlyLevel ? 'My Skill Rows' : 'Check Skills'}
          </h3>
          <p className="text-xs mt-1 max-w-2xl" style={{ color: 'rgb(var(--text-3))' }}>
            {readOnlyLevel
              ? 'Add skills and tools you have used. Save as drafts or submit for manager approval.'
              : 'Add skills used by this person. Managers approve rows and set the final level.'}
          </p>
          {employeeName && (
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-2))' }}>
              <span className="font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                Selected Person:
              </span>{' '}
              {employeeName}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {/* Status View Filter Tabs */}
        <div
          className="flex items-center gap-1 p-0.5 rounded-lg border"
          style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
        >
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: statusFilter === 'all' ? 'rgb(var(--surface-1))' : 'transparent',
              color: statusFilter === 'all' ? 'rgb(var(--text-1))' : 'rgb(var(--text-2))',
              boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontWeight: statusFilter === 'all' ? 600 : 500,
            }}
          >
            All
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgb(var(--surface-3))', color: 'rgb(var(--text-2))' }}
            >
              {rows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: statusFilter === 'pending' ? 'rgb(var(--surface-1))' : 'transparent',
              color: statusFilter === 'pending' ? '#f97316' : 'rgb(var(--text-2))',
              boxShadow: statusFilter === 'pending' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontWeight: statusFilter === 'pending' ? 600 : 500,
            }}
          >
            Pending Review
            {pendingCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: 'rgba(251,146,60,0.2)', color: '#f97316' }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className="px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: statusFilter === 'draft' ? 'rgb(var(--surface-1))' : 'transparent',
              color: statusFilter === 'draft' ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
              boxShadow: statusFilter === 'draft' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontWeight: statusFilter === 'draft' ? 600 : 500,
            }}
          >
            Drafts
            {draftCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
              >
                {draftCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className="px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: statusFilter === 'approved' ? 'rgb(var(--surface-1))' : 'transparent',
              color: statusFilter === 'approved' ? 'rgb(var(--text-1))' : 'rgb(var(--text-2))',
              boxShadow: statusFilter === 'approved' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontWeight: statusFilter === 'approved' ? 600 : 500,
            }}
          >
            Approved
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgb(var(--surface-3))', color: 'rgb(var(--text-2))' }}
            >
              {savedCount}
            </span>
          </button>
        </div>

        {/* Global Action / Batch Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!readOnlyLevel && pendingCount > 0 && (
            <button
              type="button"
              onClick={handleApproveAllPending}
              disabled={isSubmittingDrafts || isSavingAll}
              className="btn-primary flex items-center gap-1.5 px-3 h-8 text-xs font-semibold shadow-sm rounded-lg"
              title="Approve all submitted pending skills for this employee"
            >
              <CheckCheck size={13} />
              {isSubmittingDrafts ? 'Approving...' : `Approve All Pending (${pendingCount})`}
            </button>
          )}

          {readOnlyLevel ? (
            <>
              {unsavedCount > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllDrafts}
                  disabled={isSavingAll || isSubmittingDrafts}
                  className="btn-secondary flex items-center gap-1.5 px-3 h-8 text-xs font-semibold shadow-sm rounded-lg"
                  title="Save all unpersisted rows as drafts without submitting"
                >
                  <SaveAll size={13} />
                  {isSavingAll ? 'Saving...' : `Save Draft (${unsavedCount})`}
                </button>
              )}
              {draftCount > 0 && (
                <button
                  type="button"
                  onClick={handleSubmitAllDrafts}
                  disabled={isSubmittingDrafts || isSavingAll}
                  className="btn-primary flex items-center gap-1.5 px-3 h-8 text-xs font-semibold shadow-sm rounded-lg"
                  title="Submit all draft skills to manager for review and approval"
                >
                  <Send size={13} />
                  {isSubmittingDrafts ? 'Submitting...' : `Submit for Approval (${draftCount})`}
                </button>
              )}
            </>
          ) : (
            unsavedCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllDrafts}
                disabled={isSavingAll}
                className="btn-primary flex items-center gap-1.5 px-3 h-8 text-xs font-semibold shadow-sm rounded-lg"
                title="Save and approve all unsaved rows"
              >
                <SaveAll size={13} />
                {isSavingAll ? 'Saving...' : `Save All (${unsavedCount})`}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-center">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by skill area, skill, or tool..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field w-full h-8 text-xs"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={existingAssessmentsLoading || existingAssessmentsFetching || isManualRefreshing}
            className="btn-secondary flex items-center gap-1.5 px-3 h-8 text-xs font-medium shrink-0 rounded-lg"
            title="Refresh skill rows from server"
          >
            <RefreshCw size={13} className={existingAssessmentsFetching || isManualRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {isInitializing && (
        <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
          Loading saved skill rows...
        </div>
      )}

      {loadErrors.length > 0 && (
        <div
          className="rounded-lg border px-3 py-3 text-sm"
          style={{
            borderColor: 'rgb(var(--danger))',
            backgroundColor: 'rgb(var(--danger-soft))',
            color: 'rgb(var(--danger))',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">My Skills could not load</p>
              <p className="mt-1 text-xs leading-relaxed">
                {loadErrors.join(' ')}
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
              onClick={() => {
                refetchHierarchy();
                refetchExistingAssessments();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-lg border flex-1" style={{ borderColor: 'rgb(var(--border))' }}>
        <table className="w-full table-fixed text-xs" style={{ minWidth: '900px' }}>
          <colgroup>
            <col style={{ width: '14%' }} />{/* Skill Area */}
            <col style={{ width: '18%' }} />{/* Skill */}
            <col style={{ width: '18%' }} />{/* Tool */}
            <col style={{ width: '10%' }} />{/* Type */}
            <col style={{ width: '7%'  }} />{/* Projects */}
            <col style={{ width: '9%'  }} />{/* Level */}
            <col style={{ width: '12%' }} />{/* Score */}
            <col style={{ width: '12%' }} />{/* Actions */}
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: 'rgb(var(--surface-2))', borderBottom: '1px solid rgb(var(--border))' }}>
              <TableHeader label="Skill Area" sortKey="domain" help="A group of related skills, such as Cloud, SRE, or Security." />
              <TableHeader label="Skill" sortKey="competency" help="The skill being assessed." />
              <TableHeader label="Tool" sortKey="technology" help="The tool used for this skill." />
              <TableHeader label="Importance" sortKey="type" help="How important this tool is for the skill." />
              <TableHeader label="Projects" sortKey="projects" help="How many real projects used this tool." />
              <TableHeader label="Level" sortKey="level" help="How strong the person is in this tool." />
              <TableHeader label="Score" sortKey="score" help="Auto-calculated from importance, projects, and level." />
              <PlainHeader label="Actions" />
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 && !isInitializing ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                    {statusFilter === 'pending'
                      ? 'No pending skills awaiting review'
                      : statusFilter === 'draft'
                        ? 'No active drafts in progress'
                        : statusFilter === 'approved'
                          ? 'No approved skills recorded yet'
                          : 'No skill rows found'}
                  </p>
                  <p className="text-xs mb-3">
                    {search
                      ? 'Try clearing your search query.'
                      : statusFilter === 'pending'
                        ? 'All submitted skills have been reviewed and approved.'
                        : statusFilter === 'draft'
                          ? 'Click "+ Add Row" or "Bulk Add" below to create drafts.'
                          : 'Click "+ Add Row" or "Bulk Add" below to add skills.'}
                  </p>
                  {!search && (statusFilter === 'all' || statusFilter === 'draft') && (
                    <button
                      type="button"
                      onClick={addRow}
                      className="btn-primary text-xs px-3 h-8 inline-flex items-center gap-1.5 mx-auto rounded-lg font-medium"
                    >
                      <Plus size={14} /> Add Skill
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              displayRows.map((row) => {
              const enriched = validateAndEnrichRow(row);
              const competencies = getCompetenciesForDomain(row.domainId);
              const technologies = getTechnologiesForCompetency(row.domainId, row.competencyId);
              const domainLabel = hierarchy.find((d) => d.domainId === row.domainId)?.domainName ?? '—';
              const competencyLabel = competencies.find((c) => c.competencyId === row.competencyId)?.competencyName ?? '—';
              const technologyLabel = technologies.find((t) => t.id === row.technologyId)?.name ?? '—';
              const projectLabel = row.projects === 3 ? '3+' : String(row.projects);
              const rowEditable = isRowEditable(row);

              const isApproving = approvingRowIds.has(row.id);
              const isDraft = row.status === 'draft' || row.isNew;
              const isPending = row.status === 'pending' && !row.isNew;
              const rowBg = enriched.error
                ? 'rgba(var(--danger-soft), 0.12)'
                : isApproving
                  ? 'rgba(251,146,60,0.10)'   // orange tint — approval mode
                  : rowEditable
                    ? 'rgba(var(--accent-soft), 0.15)'
                    : isPending
                      ? 'rgba(251,146,60,0.06)' // subtle orange for pending
                      : isDraft
                        ? 'rgba(var(--accent-soft), 0.05)'
                        : 'transparent';

              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid rgb(var(--border))',
                    backgroundColor: rowBg,
                    borderLeft: isApproving
                      ? '3px solid #f97316'
                      : rowEditable
                        ? '3px solid rgb(var(--accent))'
                        : isPending
                          ? '3px solid #f97316'
                          : isDraft
                            ? '3px solid rgb(var(--accent-soft))'
                            : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
                >
                  {/* Skill Area */}
                  <td className="px-2.5 py-2 align-middle">
                    {rowEditable
                      ? <SearchableSelect value={row.domainId ? String(row.domainId) : ''} onChange={(v) => updateRow(row.id, 'domainId', v ? Number(v) : null)} invalid={enriched.error?.includes('Skill Area')} className="w-full" placeholder="Search skill area..." options={[{ value: '', label: '—' }, ...hierarchy.map((d) => ({ value: String(d.domainId), label: d.domainName }))]} />
                      : <span className="block truncate text-xs" style={{ color: domainLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{domainLabel}</span>
                    }
                  </td>

                  {/* Skill */}
                  <td className="px-2.5 py-2 align-middle">
                    {rowEditable
                      ? <SearchableSelect value={row.competencyId ? String(row.competencyId) : ''} onChange={(v) => updateRow(row.id, 'competencyId', v ? Number(v) : null)} disabled={!row.domainId} invalid={enriched.error?.includes('Skill')} className="w-full" placeholder="Search skill..." options={[{ value: '', label: '—' }, ...competencies.map((c) => ({ value: String(c.competencyId), label: c.competencyName }))]} />
                      : <span className="block truncate text-xs" style={{ color: competencyLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{competencyLabel}</span>
                    }
                  </td>

                  {/* Tool */}
                  <td className="px-2.5 py-2 align-middle">
                    {rowEditable
                      ? <SearchableSelect value={row.technologyId ? String(row.technologyId) : ''} onChange={(v) => updateRow(row.id, 'technologyId', v ? Number(v) : null)} disabled={!row.competencyId} invalid={enriched.error?.includes('Tool')} className="w-full" placeholder="Search tool..." options={[{ value: '', label: '—' }, ...technologies.map((t) => ({ value: String(t.id), label: t.name }))]} />
                      : <span className="block truncate text-xs" style={{ color: technologyLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{technologyLabel}</span>
                    }
                  </td>

                  {/* Type */}
                  <td className="px-2.5 py-2 align-middle">
                    {rowEditable
                      ? <SearchableSelect value={row.type} onChange={(v) => updateRow(row.id, 'type', v as BulkRow['type'])} className="w-full" placeholder="Importance..." options={TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
                      : <span className="text-xs" style={{ color: 'rgb(var(--text-1))' }}>{row.type}</span>
                    }
                  </td>

                  {/* Projects */}
                  <td className="px-2.5 py-2 align-middle">
                    {rowEditable
                      ? <SearchableSelect value={String(row.projects)} onChange={(v) => updateRow(row.id, 'projects', Number(v))} className="w-full" placeholder="Projects..." options={projectOptions} />
                      : <span className="text-xs" style={{ color: 'rgb(var(--text-1))' }}>{projectLabel}</span>
                    }
                  </td>

                  {/* Level — editable in approval mode or by manager; read-only for engineers */}
                  <td className="px-2.5 py-2 align-middle">
                    {(rowEditable && !readOnlyLevel) || isApproving
                      ? <SearchableSelect value={row.level} onChange={(v) => updateRow(row.id, 'level', v as AssessmentLevel)} className="w-full" placeholder="Level..." options={levelOptions} />
                      : isPending
                        ? <span className="text-xs font-semibold" style={{ color: LEVEL_COLORS[row.level] ?? 'rgb(var(--text-2))' }}>
                            {LEVEL_LABELS[row.level] ?? row.level}
                          </span>
                        : <span className="text-xs font-semibold" style={{ color: LEVEL_COLORS[row.level] ?? 'rgb(var(--text-2))' }}>
                            {LEVEL_LABELS[row.level] ?? row.level}
                            {readOnlyLevel && row.level !== 'Unset' && <span className="ml-1 text-[10px] font-normal" style={{ color: 'rgb(var(--text-3))' }}>(manager)</span>}
                          </span>
                    }
                  </td>

                  {/* Score */}
                  <td className="px-2.5 py-2 align-middle">
                    <div className="flex items-center gap-1">
                      {enriched.scorePreview !== undefined ? (
                        <>
                          <Stars count={Math.round(enriched.scorePreview * 5)} />
                          <span className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
                            {(enriched.scorePreview * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>—</span>
                      )}
                    </div>
                  </td>


                  <td className="px-2.5 py-1.5 align-middle">
                    <div className="flex items-center gap-1.5">

                      {/* Save (✓) when editing or approving */}
                      {rowEditable ? (
                        <button
                          onClick={() => handleSaveRow(row.id)}
                          disabled={savingRowIds.has(row.id)}
                          className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
                          title={isApproving ? 'Approve and save' : isDraft ? 'Save draft' : 'Save this row'}
                        >
                          {savingRowIds.has(row.id)
                            ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: isApproving ? '#f97316' : 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
                            : <Check size={14} style={{ color: isApproving ? '#f97316' : 'rgb(var(--success))' }} />}
                        </button>
                      ) : isPending && canApprove ? (
                        /* Approve button — manager clicks to enter approval mode */
                        <button
                          onClick={() => setApprovingRowIds((prev) => new Set(prev).add(row.id))}
                          className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
                          title="Approve this skill"
                          style={{ color: '#f97316' }}
                        >
                          <ShieldCheck size={15} />
                        </button>
                      ) : !isPending ? (
                        /* Edit button — normal approved rows */
                        <button
                          onClick={() => setEditingRowIds((prev) => new Set(prev).add(row.id))}
                          className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
                          title="Edit row"
                          style={{ color: 'rgb(var(--accent))' }}
                        >
                          <Edit3 size={14} />
                        </button>
                      ) : (
                        /* Pending, no canApprove (engineer view) — no edit button */
                        <div className="w-7 h-7" />
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteRow(row.id)}
                        disabled={savingRowIds.has(row.id) || deleteAssessment.isPending}
                        className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
                          title="Delete row"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Status badges */}
                      {isDraft && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                          style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}
                          title={row.isNew ? 'Unsaved local row' : 'Draft saved in database'}
                        >
                          {row.isNew ? 'Unsaved' : 'Draft'}
                        </span>
                      )}
                      {isPending && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                          style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: '#f97316' }}
                        >
                          Waiting
                        </span>
                      )}

                      {/* Per-row error */}
                      {enriched.error && (
                        <span className="text-[10px] max-w-[140px] leading-tight" style={{ color: 'rgb(var(--danger))' }}>
                          {enriched.error}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            disabled={isInitializing}
            className="btn-secondary flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg"
          >
            <Plus size={14} /> Add Row
          </button>
          
          <button 
            onClick={() => setIsCloneModalOpen(true)}
            disabled={isInitializing}
            className="btn-secondary flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg"
          >
            <Copy size={14} /> Clone Colleague
          </button>

          <button 
            onClick={() => setIsBulkAddModalOpen(true)}
            disabled={isInitializing}
            className="btn-secondary flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg"
          >
            <Layers size={14} /> Bulk Add
          </button>
        </div>

        {onClose && (
          <button onClick={onClose} className="btn-ghost px-4 h-8 text-xs font-medium rounded-lg">
            Close
          </button>
        )}
      </div>

      <CloneColleagueDialog
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onClone={handleCloneColleague}
        currentEmployeeCode={employeeId}
      />

      <BulkAddDialog
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onBulkAdd={handleBulkAdd}
        existingTechnologyIds={new Set(rows.map(r => r.technologyId as number).filter(Boolean))}
      />
    </div>
    </>
  );
};
