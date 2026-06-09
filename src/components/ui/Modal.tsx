import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const DASHBOARD_HEADER_HEIGHT = 56;

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ onClose, children, wide, title }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: DASHBOARD_HEADER_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgb(0 0 0 / 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: wide ? '860px' : '520px',
          maxHeight: `calc(100vh - ${DASHBOARD_HEADER_HEIGHT}px - 32px)`,
          minHeight: wide ? '520px' : undefined,
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundColor: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 25px 60px rgb(0 0 0 / 0.4)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="flex items-center justify-between gap-4 border-b px-6 py-4 shrink-0"
          style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
            {title ?? 'Form'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            className="shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgb(var(--surface-3))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-2))',
              cursor: 'pointer',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = 'rgb(var(--danger-soft))';
              event.currentTarget.style.color = 'rgb(var(--danger))';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'rgb(var(--surface-3))';
              event.currentTarget.style.color = 'rgb(var(--text-2))';
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
