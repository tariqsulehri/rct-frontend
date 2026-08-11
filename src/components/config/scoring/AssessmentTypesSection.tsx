import React, { useMemo, useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import {
  ConfigAssessmentType,
  useConfigAssessmentTypes,
  useUpdateAssessmentType,
} from '@/hooks/useConfig';
import { calcHeader, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

const F = 'field';
const L = 'field-label';

export const AssessmentTypesSection: React.FC = () => {
  const { data: types, isLoading, isError } = useConfigAssessmentTypes();
  const updateType = useUpdateAssessmentType();

  const [editing, setEditing] = useState<ConfigAssessmentType | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [form, setForm] = useState({ label: '', weight: '', description: '', sort_order: '', is_active: true });

  const openEdit = (type: ConfigAssessmentType) => {
    setEditing(type);
    setForm({
      label: type.label,
      weight: String(type.weight),
      description: type.description ?? '',
      sort_order: String(type.sort_order),
      is_active: type.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateType.mutateAsync({
        id: editing.id,
        data: {
          label: form.label,
          weight: Number(form.weight),
          description: form.description || null,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        },
      });
      toast.success(`Assessment type "${form.label}" updated successfully.`, 'Type Updated');
      setEditing(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update assessment type.'), 'Update Error');
    }
  };

  const filteredTypes = useMemo(() => {
    return (types ?? []).filter(t => {
      if (statusFilter === 'active') return t.is_active;
      if (statusFilter === 'inactive') return !t.is_active;
      return true;
    });
  }, [types, statusFilter]);

  const ts = useTableState(filteredTypes, (type, q) =>
    type.code.toLowerCase().includes(q) ||
    type.label.toLowerCase().includes(q) ||
    (type.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-types" title="Assessment Types"
        headers={['Type', calcHeader('Base Score'), 'Description', 'Status']}
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
        {ts.paged.map((type, idx) => (
          <TR key={type.id} idx={idx} inactive={!type.is_active}>
            <TD>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: type.code === 'Primary' ? '#2563eb' : type.code === 'Secondary' ? '#059669' : '#d97706' }} />
                <span className={`font-semibold ${type.is_active ? '' : 'line-through opacity-70'}`}>{type.label}</span>
              </div>
            </TD>
            <TD>
              <span className="font-mono font-semibold" style={{ color: 'rgb(var(--accent))' }}>
                {type.weight.toFixed(2)}
              </span>
              <span className="text-xs ml-2" style={{ color: 'rgb(var(--text-3))' }}>
                {(type.weight * 100).toFixed(0)}%
              </span>
            </TD>
            <TD muted small>{type.description ?? '—'}</TD>
            <TD><StatusBadge active={type.is_active} /></TD>
            <td className="px-4 py-3">
              <button onClick={() => openEdit(type)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
            </td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Assessment Type">
          <div className="space-y-4">
            <div><label className={L}>Type</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={L}>Base Score</label><input type="number" min="0" max="1" step="0.01" className={F} value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            </div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateType.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
