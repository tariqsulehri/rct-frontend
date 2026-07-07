import React, { useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import {
  ConfigAssessmentProject,
  useConfigAssessmentProjects,
  useUpdateAssessmentProject,
} from '@/hooks/useConfig';
import { calcHeader, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';

const F = 'field';
const L = 'field-label';

export const AssessmentProjectsSection: React.FC = () => {
  const { data: projects, isLoading, isError } = useConfigAssessmentProjects();
  const updateProject = useUpdateAssessmentProject();
  const [editing, setEditing] = useState<ConfigAssessmentProject | null>(null);
  const [form, setForm] = useState({ label: '', description: '', duration_months_min: '', duration_months_max: '', credit: '', threshold: '', sort_order: '', is_active: true });

  const openEdit = (project: ConfigAssessmentProject) => {
    setEditing(project);
    setForm({
      label: project.label,
      description: project.description ?? '',
      duration_months_min: project.duration_months_min == null ? '' : String(project.duration_months_min),
      duration_months_max: project.duration_months_max == null ? '' : String(project.duration_months_max),
      credit: String(project.credit),
      threshold: project.threshold == null ? '' : String(project.threshold),
      sort_order: String(project.sort_order),
      is_active: project.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateProject.mutateAsync({
      id: editing.id,
      data: {
        label: form.label,
        description: form.description || null,
        duration_months_min: form.duration_months_min === '' ? null : Number(form.duration_months_min),
        duration_months_max: form.duration_months_max === '' ? null : Number(form.duration_months_max),
        credit: Number(form.credit),
        threshold: form.threshold === '' ? null : Number(form.threshold),
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      },
    });
    setEditing(null);
  };

  const ts = useTableState(projects, (project, q) =>
    project.label.toLowerCase().includes(q) ||
    String(project.project_count).includes(q) ||
    (project.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-projects" title="Project Config"
        headers={['Projects', calcHeader('Project Score'), 'Duration', calcHeader('Minimum Target'), 'Description', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}>
        {ts.paged.map((project, idx) => (
          <TR key={project.id} idx={idx}>
            <TD><span className="font-semibold">{project.label}</span></TD>
            <TD mono>{project.credit.toFixed(2)}</TD>
            <TD muted small>
              {project.duration_months_min == null && project.duration_months_max == null
                ? '—'
                : `${project.duration_months_min ?? 0}-${project.duration_months_max ?? '∞'} months`}
            </TD>
            <TD mono>{project.threshold == null ? '—' : project.threshold.toFixed(2)}</TD>
            <TD muted small>{project.description ?? '—'}</TD>
            <TD><span className={project.is_active ? 'badge badge-success' : 'badge'}>{project.is_active ? 'Active' : 'Inactive'}</span></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(project)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Project Config">
          <div className="space-y-4">
            <div><label className={L}>Project Count</label><input className={F} value={editing.project_count === 3 ? '3+' : String(editing.project_count)} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={L}>Min Months</label><input type="number" min="0" className={F} value={form.duration_months_min} onChange={e => setForm({ ...form, duration_months_min: e.target.value })} /></div>
              <div><label className={L}>Max Months</label><input type="number" min="0" className={F} value={form.duration_months_max} onChange={e => setForm({ ...form, duration_months_max: e.target.value })} /></div>
              <div><label className={L}>Project Score</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} /></div>
              <div><label className={L}>Minimum Target</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateProject.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
