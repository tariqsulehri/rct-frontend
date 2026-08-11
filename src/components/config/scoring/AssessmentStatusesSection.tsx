import React, { useMemo, useState } from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import {
  ConfigAssessmentStatus,
  useConfigAssessmentStatuses,
  useUpdateAssessmentStatus,
} from '@/hooks/useConfig';
import { calcHeader, StatusBadge, StatusFilterSelect, TableShell, TD, TR } from '../ConfigTable';
import { useTableState } from '../ConfigTableState';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

const F = 'field';
const L = 'field-label';

export const AssessmentStatusesSection: React.FC = () => {
  const { data: statuses, isLoading, isError } = useConfigAssessmentStatuses();
  const updateStatus = useUpdateAssessmentStatus();
  const [editing, setEditing] = useState<ConfigAssessmentStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [form, setForm] = useState({ label: '', description: '', counts_toward_score: false, is_terminal: false, sort_order: '', is_active: true });

  const openEdit = (status: ConfigAssessmentStatus) => {
    setEditing(status);
    setForm({
      label: status.label,
      description: status.description ?? '',
      counts_toward_score: status.counts_toward_score,
      is_terminal: status.is_terminal,
      sort_order: String(status.sort_order),
      is_active: status.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateStatus.mutateAsync({
        id: editing.id,
        data: {
          label: form.label,
          description: form.description || null,
          counts_toward_score: form.counts_toward_score,
          is_terminal: form.is_terminal,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        },
      });
      toast.success(`Assessment status "${form.label}" updated successfully.`, 'Status Updated');
      setEditing(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update assessment status.'), 'Update Error');
    }
  };

  const filteredStatuses = useMemo(() => {
    return (statuses ?? []).filter(s => {
      if (statusFilter === 'active') return s.is_active;
      if (statusFilter === 'inactive') return !s.is_active;
      return true;
    });
  }, [statuses, statusFilter]);

  const ts = useTableState(filteredStatuses, (status, q) =>
    status.code.toLowerCase().includes(q) ||
    status.label.toLowerCase().includes(q) ||
    (status.description ?? '').toLowerCase().includes(q),
    (a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <TableShell tabKey="assessment-statuses" title="Status Config"
        headers={['Status', calcHeader('Affects Score'), 'Review Complete', 'Description', 'Active']}
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
        {ts.paged.map((status, idx) => (
          <TR key={status.id} idx={idx} inactive={!status.is_active}>
            <TD><span className={`font-semibold ${status.is_active ? '' : 'line-through opacity-70'}`}>{status.label}</span></TD>
            <TD><span className={status.counts_toward_score ? 'badge badge-success' : 'badge'}>{status.counts_toward_score ? 'Yes' : 'No'}</span></TD>
            <TD><span className={status.is_terminal ? 'badge badge-accent' : 'badge'}>{status.is_terminal ? 'Yes' : 'No'}</span></TD>
            <TD muted small>{status.description ?? '—'}</TD>
            <TD><StatusBadge active={status.is_active} /></TD>
            <td className="px-4 py-3"><button onClick={() => openEdit(status)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button></td>
          </TR>
        ))}
      </TableShell>

      {editing && (
        <Modal onClose={() => setEditing(null)} wide title="Edit Status Config">
          <div className="space-y-4">
            <div><label className={L}>Code</label><input className={F} value={editing.code} disabled /></div>
            <div><label className={L}>Label</label><input className={F} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={L}>Sort Order</label><input type="number" min="0" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.counts_toward_score} onChange={e => setForm({ ...form, counts_toward_score: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Affects score</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_terminal} onChange={e => setForm({ ...form, is_terminal: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Review complete</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: 'rgb(var(--accent))' }} />
              <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-1))' }}>Active</span>
            </label>
            <FormFooter onSave={handleSave} onCancel={() => setEditing(null)} saving={updateStatus.isPending} />
          </div>
        </Modal>
      )}
    </>
  );
};
