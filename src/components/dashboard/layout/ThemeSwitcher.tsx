import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { THEMES } from '../types';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const Icon = current.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost w-9 h-9 p-0 rounded-lg flex items-center justify-center"
        title="Change theme"
        aria-label="Change theme"
      >
        <Icon size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-52 rounded-xl border shadow-elevated z-50 overflow-hidden animate-scale-in"
          style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
        >
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-3))' }}>
              Appearance
            </p>
          </div>
          {THEMES.map(({ id, label, icon: TIcon, desc }) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                setTheme(id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
              style={{
                backgroundColor: theme === id ? 'rgb(var(--accent-soft))' : 'transparent',
                color: theme === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
              }}
              onMouseEnter={(e) => {
                if (theme !== id) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
              }}
              onMouseLeave={(e) => {
                if (theme !== id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <TIcon size={15} />
              <div>
                <p className="font-medium leading-none mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                  {desc}
                </p>
              </div>
              {theme === id && (
                <span className="ml-auto text-xs font-bold" style={{ color: 'rgb(var(--accent))' }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
