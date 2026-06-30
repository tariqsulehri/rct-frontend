import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search } from 'lucide-react';
import type { SearchableSelectOption } from './SearchableSelect';

interface SearchableMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  options: SearchableSelectOption[];
  selectAllLabel?: string;
  itemLabel?: string;
  searchPlaceholder?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  values,
  onChange,
  placeholder = 'Select...',
  options,
  selectAllLabel = 'Select all',
  itemLabel = 'employee',
  searchPlaceholder,
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

  const selectedSet = useMemo(() => new Set(values), [values]);
  const selected = useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      (option.sub ?? '').toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) onChange(values.filter((current) => current !== value));
    else onChange([...values, value]);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setQuery('');
        }}
        className="field w-full text-left flex items-center justify-between gap-3"
        style={{ color: selected.length ? 'rgb(var(--text-1))' : 'rgb(var(--text-3))' }}
      >
        <span className="truncate">
          {selected.length ? `${selected.length} ${itemLabel}${selected.length === 1 ? '' : 's'} selected` : placeholder}
        </span>
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
            maxHeight: '320px',
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
                placeholder={searchPlaceholder ?? `Search ${itemLabel}s...`}
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: 'rgb(var(--text-1))' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
              {selected.length} selected
            </span>
            <div className="flex items-center gap-3">
              {filtered.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold"
                  style={{ color: 'rgb(var(--accent-txt))' }}
                  onClick={() => onChange(Array.from(new Set([...values, ...filtered.map((option) => option.value)])))}
                >
                  {selectAllLabel}
                </button>
              )}
              {selected.length > 0 && (
                <button type="button" className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }} onClick={() => onChange([])}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((option) => {
              const checked = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-sm w-full text-left"
                  style={{
                    backgroundColor: checked ? 'rgb(var(--accent-soft))' : 'transparent',
                    color: checked ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-1))',
                  }}
                  onMouseEnter={(event) => {
                    if (!checked) event.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
                  }}
                  onMouseLeave={(event) => {
                    if (!checked) event.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.sub && (
                      <span className="block text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>
                        {option.sub}
                      </span>
                    )}
                  </span>
                  {checked && <Check size={15} className="shrink-0" />}
                </button>
              );
            })}
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
