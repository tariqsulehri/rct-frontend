import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { type User } from '@/store/authStore';
import { ROLE_GRADIENT } from '../types';

export interface UserProfileMenuProps {
  user: User | null;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  onOpenChangePassword,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.employeeName || user?.username || 'User';
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'ENGINEER';
  const gradeLine =
    user?.currentGrade && user?.targetGrade
      ? `${user.currentGrade} → ${user.targetGrade}`
      : user?.currentGrade || 'Grade not assigned';
  const identityLine = [user?.empCode ? `ID: ${user.empCode}` : null, roleLabel].filter(Boolean).join(' • ');
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';
  const gradient = ROLE_GRADIENT[user?.role ?? ''] ?? 'from-gray-500 to-gray-600';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-[rgb(var(--surface-2))] border border-transparent hover:border-[rgb(var(--border))] transition-all text-left group"
        title="User Account Menu"
        aria-label="User Account Menu"
      >
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
        >
          {initials}
        </div>
        <div className="hidden sm:block max-w-[120px] md:max-w-[160px] truncate leading-tight">
          <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
            {displayName}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'rgb(var(--text-3))' }}>
            {roleLabel}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 text-[rgb(var(--text-3))] group-hover:text-[rgb(var(--text-1))] ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-64 rounded-xl border shadow-elevated z-50 overflow-hidden animate-scale-in"
          style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
        >
          {/* User Profile Card */}
          <div
            className="p-3.5 border-b"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate leading-tight" style={{ color: 'rgb(var(--text-1))' }}>
                  {displayName}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-3))' }}>
                  {identityLine}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-txt))]">
                    {roleLabel}
                  </span>
                  {user?.currentGrade && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-medium border text-[rgb(var(--text-2))]"
                      style={{ borderColor: 'rgb(var(--border))' }}
                    >
                      {gradeLine}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="p-1.5 space-y-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg font-medium transition-colors text-left hover:bg-[rgb(var(--surface-2))]"
              style={{ color: 'rgb(var(--text-1))' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.12)', color: 'rgb(var(--accent))' }}
              >
                <KeyRound size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">Change Password</p>
                <p className="text-[11px]" style={{ color: 'rgb(var(--text-3))' }}>
                  Update your login credentials
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg font-medium transition-colors text-left hover:bg-red-500/10 text-red-600 dark:text-red-400"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10 text-red-600 dark:text-red-400">
                <LogOut size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">Sign Out</p>
                <p className="text-[11px] opacity-80">Log out of your session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
