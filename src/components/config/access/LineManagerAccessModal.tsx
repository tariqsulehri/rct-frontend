import React from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { ConfigLineManagerAssignment } from '@/hooks/useConfig';
import {
  F,
  L,
  LineManagerAccessForm,
  formatEmployeeLabel,
  formatUserLabel,
} from './accessUtils';

type LineManagerAccessModalProps = {
  editingLine: ConfigLineManagerAssignment | null;
  form: LineManagerAccessForm;
  setForm: React.Dispatch<React.SetStateAction<LineManagerAccessForm>>;
  saveError: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
};

export const LineManagerAccessModal: React.FC<LineManagerAccessModalProps> = ({
  editingLine,
  form,
  setForm,
  saveError,
  saving,
  onSave,
  onClose,
}) => (
  <Modal onClose={onClose} wide title="Edit Line Manager Access">
    <div className="space-y-4">
      {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className={L}>Line Manager Employee</label><input className={F} value={formatUserLabel(editingLine?.manager_user)} disabled /></div>
        <div><label className={L}>Reporting Employee</label><input className={F} value={formatEmployeeLabel(editingLine?.employee)} disabled /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={L}>Role Type</label><input className={F} value={form.relationship_type} disabled /></div>
        <div><label className={L}>Start Date</label><input type="date" className={F} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
        <div><label className={L}>End Date</label><input type="date" className={F} value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
      </div>
      <FormFooter onSave={onSave} onCancel={onClose} saving={saving} />
    </div>
  </Modal>
);
