import React, { useState, useMemo } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Stars } from '@/components/ui/Stars';
import {
  useSkillsHierarchy,
  useDuplicateAssessmentCheck,
  useCreateAssessment,
  useUpdateAssessment,
  SkillAssessment,
} from '@/hooks/useAssessment';
import { useConfigAssessmentLevels, useConfigAssessmentProjects, useConfigAssessmentTypes } from '@/hooks/useConfig';
import { getApiErrorMessage } from '@/lib/apiError';

interface Props {
  employeeId: string;   // emp_code e.g. "1818"
  onSuccess?: () => void;
  onClose?: () => void;
}

const DEFAULT_PROJECT_OPTIONS = [
  { value: 0, label: '0 projects' },
  { value: 1, label: '1 project' },
  { value: 2, label: '2 projects' },
  { value: 3, label: '3+ projects' },
];

// Preview hint mirrors the backend row-score formula before level weighting.
const DEFAULT_TYPE_HINTS: Record<string, string> = {
  Primary: 'coeff 0.25',
  Secondary: 'coeff 0.15',
  Tertiary: 'coeff 0.10',
};

type AssessmentLevel = 'Unset' | 'Expert' | 'Advanced' | 'Proficient' | 'Foundational' | 'Beginner' | 'Awareness';
const LEVEL_LABELS: Record<AssessmentLevel, string> = {
  Unset:       '— Unset',
  Expert:      'Expert',
  Advanced:    'Advanced',
  Proficient:  'Proficient',
  Foundational:'Foundational',
  Beginner:    'Beginner',
  Awareness:   'Awareness',
};

const LEVEL_COLORS: Record<string, string> = {
  Unset:       'rgb(var(--text-3))',
  Expert:      'rgb(var(--success))',
  Advanced:    '#22d3ee',
  Proficient:  'rgb(var(--warning))',
  Foundational:'#f97316',
  Beginner:    '#f97316',
  Awareness:   '#a855f7',
  // computed labels (for result card)
  'L4 Expert': 'rgb(var(--success))',
  'L3 Proficient': '#22d3ee',
  'L2 Intermediate': 'rgb(var(--warning))',
  'L1 Beginner': '#f97316',
  'L0 Developing': 'rgb(var(--text-3))',
};

// Duplicate warning modal
const DuplicateModal: React.FC<{
  existingAssessment: SkillAssessment;
  onUpdate: () => void;
  onSelectDifferent: () => void;
  isUpdating: boolean;
}> = ({ existingAssessment, onUpdate, onSelectDifferent, isUpdating }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgb(0 0 0 / 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-elevated animate-scale-in overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} style={{ color: 'rgb(var(--warning))' }} />
            <h3 className="text-base font-bold" style={{ color: 'rgb(var(--text-1))' }}>
              Skill Already Checked
            </h3>
          </div>
          <button
            onClick={onSelectDifferent}
            className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p style={{ color: 'rgb(var(--text-2))' }} className="text-sm">
            This skill already has a score of{' '}
            <span className="font-bold" style={{ color: LEVEL_COLORS[existingAssessment.computed?.levelLabel || ''] }}>
              {(existingAssessment.computed?.score ?? 0 * 100).toFixed(0)}%
            </span>
            .
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase" style={{ color: 'rgb(var(--text-3))' }}>
              Current Skill Check
            </p>
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <p className="text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                <span className="font-medium">Type:</span> {existingAssessment.type}
              </p>
              <p className="text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                <span className="font-medium">Projects:</span> {existingAssessment.projects === 3 ? '3+' : existingAssessment.projects}
              </p>
              <p className="text-sm flex items-center gap-1.5 mt-1">
                <span className="font-medium">Level:</span>
                <Stars count={existingAssessment.computed?.starRating ?? 1} />
                <span style={{ color: LEVEL_COLORS[existingAssessment.computed?.levelLabel || ''] }}>
                  {existingAssessment.computed?.levelLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onUpdate}
              disabled={isUpdating}
              className="btn-primary flex-1"
            >
              {isUpdating ? 'Updating...' : 'Update Skill Check'}
            </button>
            <button
              onClick={onSelectDifferent}
              className="btn-secondary flex-1"
            >
              Choose Another Skill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AssessmentForm: React.FC<Props> = ({ employeeId, onSuccess, onClose }) => {
  const { data: hierarchy = [], isLoading: hierarchyLoading } = useSkillsHierarchy();
  const { data: assessmentTypes = [] } = useConfigAssessmentTypes();
  const { data: assessmentLevels = [] } = useConfigAssessmentLevels();
  const { data: assessmentProjects = [] } = useConfigAssessmentProjects();
  const { checkDuplicate } = useDuplicateAssessmentCheck(employeeId);
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();

  // Form state
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  const [selectedTechnologyId, setSelectedTechnologyId] = useState<number | null>(null);
  const [type, setType] = useState<'Primary' | 'Secondary' | 'Tertiary'>('Primary');
  const [projects, setProjects] = useState(1);
  const [level, setLevel] = useState<AssessmentLevel>('Unset');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; starRating: number; levelLabel: string } | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ show: boolean; assessment: SkillAssessment | null }>({
    show: false,
    assessment: null,
  });

  // Get selected domain, competency, technology
  const selectedDomain = useMemo(
    () => hierarchy.find((d) => d.domainId === selectedDomainId),
    [hierarchy, selectedDomainId]
  );

  const selectedCompetency = useMemo(
    () => selectedDomain?.competencies.find((c) => c.competencyId === selectedCompetencyId),
    [selectedDomain, selectedCompetencyId]
  );

  const selectedTechnology = useMemo(
    () => selectedCompetency?.technologies.find((t) => t.id === selectedTechnologyId),
    [selectedCompetency, selectedTechnologyId]
  );
  const typeHints = useMemo(() => {
    const hints = { ...DEFAULT_TYPE_HINTS };
    assessmentTypes.forEach((assessmentType) => {
      hints[assessmentType.code] = `coeff ${assessmentType.weight.toFixed(2)}`;
    });
    return hints;
  }, [assessmentTypes]);
  const levelOptions = useMemo(() => {
    const configured = assessmentLevels
      .filter((levelConfig) => levelConfig.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((levelConfig) => ({ value: levelConfig.code, label: levelConfig.label }));
    return configured.length > 0
      ? configured
      : Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));
  }, [assessmentLevels]);
  const projectOptions = useMemo(() => {
    const configured = assessmentProjects
      .filter((projectConfig) => projectConfig.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((projectConfig) => ({ value: projectConfig.project_count, label: projectConfig.label }));
    return configured.length > 0 ? configured : DEFAULT_PROJECT_OPTIONS;
  }, [assessmentProjects]);

  // Reset dependent fields when parent changes
  const handleDomainChange = (domainId: number) => {
    setSelectedDomainId(domainId);
    setSelectedCompetencyId(null);
    setSelectedTechnologyId(null);
    setError(null);
    setResult(null);
  };

  const handleCompetencyChange = (competencyId: number) => {
    setSelectedCompetencyId(competencyId);
    setSelectedTechnologyId(null);
    setError(null);
    setResult(null);
  };

  const handleTechnologyChange = (technologyId: number) => {
    setSelectedTechnologyId(technologyId);
    setError(null);
    setResult(null);

    // Type is selected by the assessor at assessment time — default to Primary
    setType('Primary');
  };

  // Check for duplicates before submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedDomainId || !selectedCompetencyId || !selectedTechnologyId) {
      setError('Please select a skill area, skill, and tool.');
      return;
    }

    // Check for duplicate
    const duplicateCheck = checkDuplicate(selectedDomainId, selectedCompetencyId, selectedTechnologyId);
    if (duplicateCheck.isDuplicate && duplicateCheck.existingAssessment) {
      setDuplicateModal({
        show: true,
        assessment: duplicateCheck.existingAssessment,
      });
      return;
    }

    // Submit as new assessment
    await submitAssessment(selectedTechnologyId);
  };

  const submitAssessment = async (techId: number) => {
    try {
      const saved = await createAssessment.mutateAsync({
        employee_id: employeeId,
        technology_id: techId,
        type,
        projects,
        level,
      });

      if (saved.computed) {
        setResult(saved.computed);
      }

      // Reset form
      setSelectedDomainId(null);
      setSelectedCompetencyId(null);
      setSelectedTechnologyId(null);
      setProjects(1);
      setType('Primary');
      setLevel('Unset');
      onSuccess?.();

      // Close modal after 2 seconds
      setTimeout(() => onClose?.(), 2000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not save this skill check.'));
    }
  };

  const handleUpdateAssessment = async () => {
    if (!duplicateModal.assessment) return;

    try {
      const saved = await updateAssessment.mutateAsync({
        id: duplicateModal.assessment.id,
        data: {
          type,
          projects,
          level,
        },
      });

      if (saved.computed) {
        setResult(saved.computed);
      }

      setDuplicateModal({ show: false, assessment: null });
      onSuccess?.();

      // Close modal after 2 seconds
      setTimeout(() => onClose?.(), 2000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update this skill check.'));
      setDuplicateModal({ show: false, assessment: null });
    }
  };

  const isFormValid = selectedDomainId && selectedCompetencyId && selectedTechnologyId;
  const isLoading = hierarchyLoading || createAssessment.isPending || updateAssessment.isPending;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full font-bold"
            style={{
              backgroundColor: selectedDomainId ? 'rgb(var(--success))' : 'rgb(var(--surface-2))',
              color: selectedDomainId ? 'white' : 'rgb(var(--text-2))',
            }}
          >
            1
          </span>
          <span>Skill Area</span>
          <span className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full font-bold"
            style={{
              backgroundColor: selectedCompetencyId ? 'rgb(var(--success))' : 'rgb(var(--surface-2))',
              color: selectedCompetencyId ? 'white' : 'rgb(var(--text-2))',
            }}
          >
            2
          </span>
          <span>Skill</span>
          <span className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full font-bold"
            style={{
              backgroundColor: selectedTechnologyId ? 'rgb(var(--success))' : 'rgb(var(--surface-2))',
              color: selectedTechnologyId ? 'white' : 'rgb(var(--text-2))',
            }}
          >
            3
          </span>
          <span>Tool</span>
        </div>

        {/* Step 1: Skill Area (Domain) */}
        <div>
          <label className="field-label">Skill Area</label>
          {hierarchyLoading ? (
            <div className="field flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-3))' }}>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading skill areas…
            </div>
          ) : (
            <select value={selectedDomainId || ''} onChange={(e) => handleDomainChange(Number(e.target.value))} className="field">
              <option value="">Select a skill area</option>
              {hierarchy.map((domain) => (
                <option key={domain.domainId} value={domain.domainId}>
                  {domain.domainName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Skill (Competency) */}
        <div>
          <label className="field-label">Skill</label>
          {!selectedDomain ? (
            <div className="field text-sm" style={{ color: 'rgb(var(--text-3))' }}>
              Select a skill area first
            </div>
          ) : (
            <select value={selectedCompetencyId || ''} onChange={(e) => handleCompetencyChange(Number(e.target.value))} className="field">
              <option value="">Select a skill</option>
              {selectedDomain.competencies.map((comp) => (
                <option key={comp.competencyId} value={comp.competencyId}>
                  {comp.competencyName}
                  {comp.is_critical ? ' ⭐' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 3: Technology */}
        <div>
          <label className="field-label">Tool</label>
          {!selectedCompetency ? (
            <div className="field text-sm" style={{ color: 'rgb(var(--text-3))' }}>
              Select a skill first
            </div>
          ) : (
            <select value={selectedTechnologyId || ''} onChange={(e) => handleTechnologyChange(Number(e.target.value))} className="field">
              <option value="">Select a tool</option>
              {selectedCompetency.technologies.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected hierarchy badge */}
        {selectedTechnology && (
          <div className="rounded-lg px-4 py-3 flex items-center gap-2 text-xs" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <span className="badge badge-accent">{selectedDomain?.domainName}</span>
            <span style={{ color: 'rgb(var(--text-3))' }}>›</span>
            <span className="font-medium" style={{ color: 'rgb(var(--text-1))' }}>
              {selectedCompetency?.competencyName}
            </span>
            <span style={{ color: 'rgb(var(--text-3))' }}>›</span>
            <span style={{ color: 'rgb(var(--text-2))' }}>{selectedTechnology.name}</span>
          </div>
        )}

        {/* Type + Projects + Level grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Skill Importance</label>
            <div className="space-y-2">
              {(['Primary', 'Secondary', 'Tertiary'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                    {t}
                  </span>
                  <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                    {typeHints[t]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="field-label">Projects Used In</label>
              <select value={String(projects)} onChange={(e) => setProjects(Number(e.target.value))} className="field">
                {projectOptions.map((o) => (
                  <option key={o.value} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Skill Level</label>
              <div className="space-y-2">
                {levelOptions.map((levelOption) => (
                  <label key={levelOption.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      value={levelOption.value}
                      checked={level === levelOption.value}
                      onChange={() => setLevel(levelOption.value as AssessmentLevel)}
                      className="w-4 h-4"
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LEVEL_COLORS[levelOption.value] ?? 'rgb(var(--text-1))' }}
                    >
                      {levelOption.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2" style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success feedback */}
        {result && (
          <div
            className="rounded-lg px-4 py-3 flex items-center gap-3 animate-scale-in"
            style={{ backgroundColor: 'rgb(var(--success-soft))' }}
          >
            <Stars count={result.starRating} />
            <div>
              <p className="text-sm font-semibold" style={{ color: LEVEL_COLORS[result.levelLabel] ?? 'inherit' }}>
                {result.levelLabel}
              </p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
                Skill score: {(result.score * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading || !isFormValid} className="btn-primary flex-1">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              'Add Assessment'
            )}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="btn-secondary px-5">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Duplicate modal */}
      {duplicateModal.show && duplicateModal.assessment && (
        <DuplicateModal
          existingAssessment={duplicateModal.assessment}
          onUpdate={handleUpdateAssessment}
          onSelectDifferent={() => {
            setDuplicateModal({ show: false, assessment: null });
            setSelectedTechnologyId(null);
          }}
          isUpdating={updateAssessment.isPending}
        />
      )}
    </>
  );
};
