import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
}

interface TableSearchableSelectProps {
  value: string;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  defaultOpen?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

export const TableSearchableSelect: React.FC<TableSearchableSelectProps> = ({ 
  value, 
  options, 
  placeholder = 'Search...', 
  disabled, 
  invalid, 
  defaultOpen = false, 
  className, 
  onChange 
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Calculate fixed viewport position so the dropdown escapes overflow:hidden/auto containers
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed' as const,
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (!open) calcPosition();
    setOpen((prev) => !prev);
  }, [disabled, open, calcPosition]);

  // defaultOpen: calculate position on mount then open
  useEffect(() => {
    if (defaultOpen && !disabled) {
      calcPosition();
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close when clicking outside both the trigger and the portal dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on any scroll or resize to avoid stale positioning
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  // Clear search when closed
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={selected?.label}
        onClick={handleToggle}
        className="w-full text-xs px-2 py-1 rounded-md border flex items-center justify-between gap-2"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          borderColor: invalid ? 'rgb(var(--danger))' : 'rgb(var(--border))',
          color: 'rgb(var(--text-1))',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span className="truncate text-left">{selected?.label || '—'}</span>
        <ChevronDown size={12} style={{ color: 'rgb(var(--text-3))' }} />
      </button>

      {open && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className="rounded-md border shadow-elevated"
          style={{
            ...dropdownStyle,
            backgroundColor: 'rgb(var(--surface))',
            borderColor: 'rgb(var(--border))',
          }}
        >
          <div className="p-1.5 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs px-2 py-1 rounded-md border"
              style={{
                backgroundColor: 'rgb(var(--surface-2))',
                borderColor: 'rgb(var(--border))',
                color: 'rgb(var(--text-1))',
              }}
            />
          </div>
          <div className="max-h-44 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-md"
                  style={{
                    backgroundColor: option.value === value ? 'rgb(var(--accent-soft))' : 'transparent',
                    color: option.value === value ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-1))',
                  }}
                  onMouseEnter={(e) => {
                    if (option.value !== value) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
                  }}
                  onMouseLeave={(e) => {
                    if (option.value !== value) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
