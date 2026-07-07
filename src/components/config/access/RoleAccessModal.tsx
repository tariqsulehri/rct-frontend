import React from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Modal } from '@/components/ui/Modal';
import { ConfigPermission, ConfigRole } from '@/hooks/useConfig';
import { F, L, RoleAccessForm } from './accessUtils';

type RoleAccessModalProps = {
  role: ConfigRole;
  form: RoleAccessForm;
  setForm: React.Dispatch<React.SetStateAction<RoleAccessForm>>;
  selectedPermissionIds: number[];
  setSelectedPermissionIds: React.Dispatch<React.SetStateAction<number[]>>;
  groupedPermissions: Record<string, ConfigPermission[]>;
  saveError: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
};

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({
  role,
  form,
  setForm,
  selectedPermissionIds,
  setSelectedPermissionIds,
  groupedPermissions,
  saveError,
  saving,
  onSave,
  onClose,
}) => (
  <Modal onClose={onClose} wide title="Edit Role">
    <div className="space-y-4">
      {saveError && <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}
      <div><label className={L}>Role Code</label><input className={F} value={role.code} disabled /></div>
      <div><label className={L}>Role Name</label><input className={F} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className={L}>Description</label><input className={F} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={L}>Sort Order</label><input type="number" className={F} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        <label className="flex items-center gap-2 text-sm pt-7" style={{ color: 'rgb(var(--text-1))' }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className={L}>Permissions</label>
          <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
            {selectedPermissionIds.length} selected
          </span>
        </div>
        <div className="rounded-lg border max-h-72 overflow-y-auto" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
          {Object.entries(groupedPermissions).map(([category, items]) => (
            <div key={category} className="border-b last:border-b-0" style={{ borderColor: 'rgb(var(--border))' }}>
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))', backgroundColor: 'rgb(var(--surface))' }}>
                {category}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                {items.map(permission => {
                  const checked = selectedPermissionIds.includes(permission.id);
                  return (
                    <label key={permission.id} className="flex gap-2 rounded-md border px-2.5 py-2 cursor-pointer"
                      style={{
                        borderColor: checked ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                        backgroundColor: checked ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
                      }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={event => {
                          setSelectedPermissionIds(current => event.target.checked
                            ? [...new Set([...current, permission.id])]
                            : current.filter(id => id !== permission.id));
                        }}
                        className="mt-0.5"
                        style={{ accentColor: 'rgb(var(--accent))' }}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{permission.name}</span>
                        <span className="block text-[11px] mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>{permission.description ?? permission.code}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <FormFooter onSave={onSave} onCancel={onClose} saving={saving} />
    </div>
  </Modal>
);
