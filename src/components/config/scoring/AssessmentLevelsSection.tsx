import React, { useMemo, useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import {
  ConfigAssessmentLevel,
  useConfigAssessmentLevels,
  useUpdateAssessmentLevel,
} from '@/hooks/useConfig';
import { calcHeader, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

const F = 'field';
const L = 'field-label';

export const AssessmentLevelsSection: React.FC = () => {
  const { data: levels, isLoading, isError } = useConfigAssessmentLevels();
  const updateLevel = useUpdateAssessmentLevel();
  const [editing, setEditing] = useState<ConfigAssessmentLevel | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ label: '', weight: '', threshold: '', description: '', sort_order: '', is_active: true });

  const openEdit = (levelConfig: ConfigAssessmentLevel) => {
    setEditing(levelConfig);
    setForm({
      label: levelConfig.label,
      weight: String(levelConfig.weight),
      threshold: levelConfig.threshold == null ? '' : String(levelConfig.threshold),
      description: levelConfig.description ?? '',
      sort_order: String(levelConfig.sort_order),
      is_active: levelConfig.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateLevel.mutateAsync({
        id: editing.id,
        data: {
          label: form.label,
          weight: Number(form.weight),
          threshold: form.threshold === '' ? null : Number(form.threshold),
          description: form.description || null,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        },
      });
      toast.success(`Assessment level "${form.label}" updated successfully.`, 'Level Updated');
      setEditing(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update level.'), 'Update Error');
    }
  };

  const filteredLevels = useMemo(() => {
    return (levels ?? []).filter(l => {
      if (statusFilter === 'active' && !l.is_active) return false;
      if (statusFilter === 'inactive' && l.is_active) return false;
      return true;
    });
  }, [levels, statusFilter]);

  const ts = useTableState(filteredLevels, (levelConfig, q) =>
    levelConfig.code.toLowerCase().includes(q) ||
    levelConfig.label.toLowerCase().includes(q) ||
    (levelConfig.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-levels" title="Level Config"
        headers={['Level', calcHeader('Score Factor'), calcHeader('Minimum Target'), 'Description', 'Status']}
        loading={isLoading} error={isError}
        q={ts.q} onSearch={ts.onSearch} page={ts.page} total={ts.filtered.length} onPage={ts.setPage}
        toolbarExtra={(
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              ts.setPage(1);
            }}
          />
        )}>
        {ts.paged.map((levelConfig, idx) => (
          <TR key={levelConfig.id} idx={idx} inactive={!levelConfig.is_active}>
            <TD><span className={`font-semibold ${levelConfig.is_active ? '' : 'line-through opacity-70'}`}>{levelConfig.label}</span></TD>
            <TD mono>{levelConfig.weight.toFixed(2)}</TD>
            <TD mono>{levelConfig.threshold == null ? '—' : levelConfig.threshold.toFixed(2)}</TD>
            <TD muted small>{levelConfig.description ?? '—'}</TD>
            <TD><StatusBadge active={levelConfig.is_active} /></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(levelConfig)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Level Config">
          <div className="space-y-4">
            <div><label className={L}>Code</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={L}>Score Factor</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div><label className={L}>Minimum Target</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
              <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateLevel.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
