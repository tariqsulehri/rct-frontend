import React from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DepartmentAccessForm, F, L, SelectOption } from './accessUtils';

type DepartmentAccessModalProps = {
  mode: 'create' | 'edit';
  form: DepartmentAccessForm;
  setForm: React.Dispatch<React.SetStateAction<DepartmentAccessForm>>;
  userOptions: SelectOption[];
  departmentOptions: SelectOption[];
  saveError: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
};

export const DepartmentAccessModal: React.FC<DepartmentAccessModalProps> = ({
  mode,
  form,
  setForm,
  userOptions,
  departmentOptions,
  saveError,
  saving,
  onSave,
  onClose,
}) => (
  <Modal onClose={onClose} wide title={mode === 'create' ? 'Assign Departments' : 'Edit Department Access'}>
    <div className="space-y-4">
      {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
      <div><label className={L}>User</label><SearchableSelect value={form.user_id} onChange={v => setForm({ ...form, user_id: v })} placeholder="Select user..." options={userOptions} /></div>
      {mode === 'create' ? (
        <div>
          <label className={L}>Departments</label>
          <SearchableMultiSelect
            values={form.department_ids}
            onChange={values => setForm({ ...form, department_ids: values })}
            placeholder="Select departments..."
            options={departmentOptions}
            selectAllLabel="Select visible"
            itemLabel="department"
            searchPlaceholder="Search departments..."
          />
        </div>
      ) : (
        <div><label className={L}>Department</label><SearchableSelect value={form.department_id} onChange={v => setForm({ ...form, department_id: v })} placeholder="Select department..." options={departmentOptions} /></div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={L}>Access Type</label><input className={F} value={form.assignment_type} onChange={e => setForm({ ...form, assignment_type: e.target.value })} /></div>
        <div><label className={L}>Start Date</label><input type="date" className={F} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
        <div><label className={L}>End Date</label><input type="date" className={F} value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
        <div className="flex items-center gap-4 pt-7">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={form.can_view} onChange={e => setForm({ ...form, can_view: e.target.checked })} /> View</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={form.can_manage} onChange={e => setForm({ ...form, can_manage: e.target.checked })} /> Manage</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--text-1))' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>
      </div>
      <FormFooter onSave={onSave} onCancel={onClose} saving={saving} />
    </div>
  </Modal>
);
