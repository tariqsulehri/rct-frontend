import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sub?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: SearchableSelectOption[];
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select...',
  options,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const updateRect = () => {
      if (ref.current) setMenuRect(ref.current.getBoundingClientRect());
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      (option.sub ?? '').toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setQuery('');
        }}
        className="field w-full text-left flex items-center justify-between"
        style={{ color: selected ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))' }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span style={{ color: 'rgb(var(--text-3))' }}>▾</span>
      </button>

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuRect.bottom + 4,
            left: menuRect.left,
            width: menuRect.width,
            zIndex: 10000,
            borderRadius: '10px',
            backgroundColor: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            boxShadow: '0 12px 32px rgb(0 0 0 / 0.3)',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <Search size={13} style={{ color: 'rgb(var(--text-3))' }} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: 'rgb(var(--text-1))' }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="flex items-center px-3 py-2 cursor-pointer text-sm w-full text-left"
              style={{ color: 'rgb(var(--text-3))' }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {placeholder}
            </button>
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 cursor-pointer text-sm w-full text-left"
                style={{
                  backgroundColor: option.value === value ? 'rgb(var(--accent-soft))' : 'transparent',
                  color: option.value === value ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-1))',
                }}
                onMouseEnter={(event) => {
                  if (option.value !== value) {
                    event.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
                  }
                }}
                onMouseLeave={(event) => {
                  if (option.value !== value) {
                    event.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.sub && (
                  <span className="text-xs ml-2 shrink-0" style={{ color: 'rgb(var(--text-3))' }}>
                    {option.sub}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-center" style={{ color: 'rgb(var(--text-3))' }}>
                No results
              </p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
