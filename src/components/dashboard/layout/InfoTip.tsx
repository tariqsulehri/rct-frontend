import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface InfoTipProps {
  text: string;
}

export const InfoTip: React.FC<InfoTipProps> = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
        title={text}
        aria-label={text}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 bottom-full z-30 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border px-3 py-2 text-xs leading-relaxed shadow-lg"
          style={{
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
            color: 'rgb(var(--text-2))',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};
