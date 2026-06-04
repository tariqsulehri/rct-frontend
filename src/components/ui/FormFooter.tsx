import React from 'react';

interface FormFooterProps {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export const FormFooter: React.FC<FormFooterProps> = ({ onSave, onCancel, saving }) => (
  <div className="flex gap-3 pt-4 border-t mt-4" style={{ borderColor: 'rgb(var(--border))' }}>
    <button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-2">
      {saving ? 'Saving...' : 'Save'}
    </button>
    <button onClick={onCancel} className="btn-secondary flex-1 py-2">
      Cancel
    </button>
  </div>
);

