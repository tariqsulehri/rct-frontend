import React from 'react';
import { Stars } from '@/components/ui/Stars';
import { Check, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { TableSearchableSelect } from '@/components/ui/TableSearchableSelect';
import { SkillHierarchy } from '@/hooks/useAssessment';
import { BulkRow, AssessmentLevel, TYPE_OPTIONS, LEVEL_COLORS, LEVEL_LABELS } from './BulkAssessmentTable';

interface BulkAssessmentTableRowProps {
  row: BulkRow;
  hierarchy: SkillHierarchy[];
  readOnlyLevel: boolean;
  canApprove: boolean;
  isEditable: boolean;
  isApproving: boolean;
  isSaving: boolean;
  isPending: boolean;
  isDeleting: boolean;
  enriched: BulkRow;
  competencies: any[];
  technologies: any[];
  domainLabel: string;
  competencyLabel: string;
  technologyLabel: string;
  projectOptions: { value: string; label: string }[];
  levelOptions: { value: string; label: string }[];
  onUpdateRow: (rowId: string, field: keyof BulkRow, value: any) => void;
  onSaveRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
  onSetApproving: (rowId: string) => void;
  onSetEditing: (rowId: string) => void;
}

export const BulkAssessmentTableRow: React.FC<BulkAssessmentTableRowProps> = ({
  row,
  hierarchy,
  readOnlyLevel,
  canApprove,
  isEditable,
  isApproving,
  isSaving,
  isPending,
  isDeleting,
  enriched,
  competencies,
  technologies,
  domainLabel,
  competencyLabel,
  technologyLabel,
  projectOptions,
  levelOptions,
  onUpdateRow,
  onSaveRow,
  onDeleteRow,
  onSetApproving,
  onSetEditing,
}) => {
  const projectLabel = row.projects === 3 ? '3+' : String(row.projects);
  
  const rowBg = enriched.error
    ? 'rgba(var(--danger-soft), 0.12)'
    : isApproving
      ? 'rgba(251,146,60,0.10)'
      : isEditable
        ? 'rgba(var(--accent-soft), 0.15)'
        : isPending
          ? 'rgba(251,146,60,0.06)'
          : 'transparent';

  return (
    <tr
      style={{
        borderBottom: '1px solid rgb(var(--border))',
        backgroundColor: rowBg,
        borderLeft: isApproving
          ? '3px solid #f97316'
          : isEditable
            ? '3px solid rgb(var(--accent))'
            : isPending
              ? '3px solid #f97316'
              : '3px solid transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBg)}
    >
      {/* Skill Area */}
      <td className="px-2.5 py-2 align-middle">
        {isEditable
          ? <TableSearchableSelect value={row.domainId ? String(row.domainId) : ''} onChange={(v) => onUpdateRow(row.id, 'domainId', v ? Number(v) : null)} invalid={enriched.error?.includes('Skill Area')} className="w-full" placeholder="Search skill area..." options={[{ value: '', label: '—' }, ...hierarchy.map((d) => ({ value: String(d.domainId), label: d.domainName }))]} />
          : <span className="block truncate text-xs" style={{ color: domainLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{domainLabel}</span>
        }
      </td>

      {/* Skill */}
      <td className="px-2.5 py-2 align-middle">
        {isEditable
          ? <TableSearchableSelect value={row.competencyId ? String(row.competencyId) : ''} onChange={(v) => onUpdateRow(row.id, 'competencyId', v ? Number(v) : null)} disabled={!row.domainId} invalid={enriched.error?.includes('Skill')} className="w-full" placeholder="Search skill..." options={[{ value: '', label: '—' }, ...competencies.map((c) => ({ value: String(c.competencyId), label: c.competencyName }))]} />
          : <span className="block truncate text-xs" style={{ color: competencyLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{competencyLabel}</span>
        }
      </td>

      {/* Tool */}
      <td className="px-2.5 py-2 align-middle">
        {isEditable
          ? <TableSearchableSelect value={row.technologyId ? String(row.technologyId) : ''} onChange={(v) => onUpdateRow(row.id, 'technologyId', v ? Number(v) : null)} disabled={!row.competencyId} invalid={enriched.error?.includes('Tool')} className="w-full" placeholder="Search tool..." options={[{ value: '', label: '—' }, ...technologies.map((t) => ({ value: String(t.id), label: t.name }))]} />
          : <span className="block truncate text-xs" style={{ color: technologyLabel === '—' ? 'rgb(var(--text-3))' : 'rgb(var(--text-1))' }}>{technologyLabel}</span>
        }
      </td>

      {/* Type */}
      <td className="px-2.5 py-2 align-middle">
        {isEditable
          ? <TableSearchableSelect value={row.type} onChange={(v) => onUpdateRow(row.id, 'type', v)} className="w-full" placeholder="Importance..." options={TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
          : <span className="text-xs" style={{ color: 'rgb(var(--text-1))' }}>{row.type}</span>
        }
      </td>

      {/* Projects */}
      <td className="px-2.5 py-2 align-middle">
        {isEditable
          ? <TableSearchableSelect value={String(row.projects)} onChange={(v) => onUpdateRow(row.id, 'projects', Number(v))} className="w-full" placeholder="Projects..." options={projectOptions} />
          : <span className="text-xs" style={{ color: 'rgb(var(--text-1))' }}>{projectLabel}</span>
        }
      </td>

      {/* Level */}
      <td className="px-2.5 py-2 align-middle">
        {(isEditable && !readOnlyLevel) || isApproving
          ? <TableSearchableSelect value={row.level} onChange={(v) => onUpdateRow(row.id, 'level', v)} className="w-full" placeholder="Level..." options={levelOptions} />
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
          {isEditable ? (
            <button
              onClick={() => onSaveRow(row.id)}
              disabled={isSaving}
              className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
              title={isApproving ? 'Approve and save' : 'Save this row'}
            >
              {isSaving
                ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: isApproving ? '#f97316' : 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
                : <Check size={14} style={{ color: isApproving ? '#f97316' : 'rgb(var(--success))' }} />}
            </button>
          ) : isPending && canApprove ? (
            <button
              onClick={() => onSetApproving(row.id)}
              className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
              title="Approve this skill"
              style={{ color: '#f97316' }}
            >
              <ShieldCheck size={15} />
            </button>
          ) : !isPending ? (
            <button
              onClick={() => onSetEditing(row.id)}
              className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
              title="Edit row"
              style={{ color: 'rgb(var(--accent))' }}
            >
              <Edit3 size={14} />
            </button>
          ) : (
            <div className="w-7 h-7" />
          )}

          {/* Delete */}
          <button
            onClick={() => onDeleteRow(row.id)}
            disabled={isSaving || isDeleting}
            className="btn-ghost w-7 h-7 p-0 rounded-md flex items-center justify-center"
            title="Delete row"
          >
            <Trash2 size={14} />
          </button>

          {/* Pending Approval badge */}
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
};
