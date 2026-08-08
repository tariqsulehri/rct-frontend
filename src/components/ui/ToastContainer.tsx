import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, ToastItem, ToastType } from '@/lib/toast';

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const TOAST_BORDER_COLORS: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={`group relative flex items-start gap-3 p-4 rounded-xl shadow-2xl border border-[rgb(var(--border))] border-l-4 ${TOAST_BORDER_COLORS[toast.type]} bg-[rgb(var(--surface))] text-[rgb(var(--text-1))] animate-slide-in pointer-events-auto transition-all hover:scale-[1.01]`}
      style={{
        backgroundColor: 'rgb(var(--surface))',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div className="mt-0.5">{TOAST_ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5 text-[rgb(var(--text-1))]">
            {toast.title}
          </h4>
        )}
        <p className="text-sm font-medium leading-snug text-[rgb(var(--text-1))]">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 -mt-1 rounded-lg text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--surface-2))] transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0 || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[999999] flex flex-col gap-2.5 w-full max-w-sm sm:max-w-md pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>,
    document.body
  );
};
