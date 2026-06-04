import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ICONS = {
  danger:  <Trash2 size={20} />,
  warning: <AlertTriangle size={20} />,
  info:    <Info size={20} />,
};

const COLORS = {
  danger:  { icon: 'rgb(var(--danger))',  bg: 'rgb(var(--danger-soft))',  btn: 'btn-danger'  },
  warning: { icon: 'rgb(var(--warning))', bg: 'rgb(var(--warning-soft))', btn: 'btn-warning' },
  info:    { icon: 'rgb(var(--accent))',  bg: 'rgb(var(--accent-soft))',  btn: 'btn-primary' },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const color = COLORS[variant];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter')  onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onCancel, onConfirm]);

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        backgroundColor: 'rgb(0 0 0 / 0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: '100%', maxWidth: '400px',
          borderRadius: '16px',
          backgroundColor: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 25px 60px rgb(0 0 0 / 0.4)',
          padding: '24px',
        }}
      >
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: color.bg, color: color.icon }}>
            {ICONS[variant]}
          </div>
          <h3 className="font-bold text-base" style={{ color: 'rgb(var(--text-1))' }}>{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm leading-relaxed mb-6 pl-12" style={{ color: 'rgb(var(--text-2))' }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            className="btn-ghost text-sm px-4 py-2"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            className={`${color.btn} text-sm px-4 py-2`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Hook for imperative usage — manages open/close state
export function useConfirmDialog() {
  const [state, setState] = React.useState<(ConfirmDialogProps & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = React.useCallback((opts: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise(resolve => {
      setState({
        ...opts,
        resolve,
        onConfirm: () => { setState(null); resolve(true); },
        onCancel:  () => { setState(null); resolve(false); },
      });
    });
  }, []);

  const dialog = state ? <ConfirmDialog {...state} /> : null;

  return { confirm, dialog };
}
