import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react';
import { useAuthStore, type User } from '@/store/authStore';
import { TeamRoster } from '@/components/TeamRoster';
import { PendingApprovalsPanel } from '@/components/PendingApprovalsPanel';
import { ConfigSection } from '@/components/config/ConfigSection';
import { ReportsSection } from '@/components/reports/ReportsSection';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { queryClient } from '@/lib/queryClient';
import apiClient from '@/lib/api';
import { hasPermission, isLeaderRole } from '@/types/rbac';

import { ThemeSwitcher } from '@/components/dashboard/layout/ThemeSwitcher';
import { UserProfileMenu } from '@/components/dashboard/layout/UserProfileMenu';
import { AdminDashboardTab } from '@/components/dashboard/tabs/AdminDashboardTab';
import { OverviewTab } from '@/components/dashboard/tabs/OverviewTab';
import { AssessmentsTab } from '@/components/dashboard/tabs/AssessmentsTab';
import { AIInsightsTab } from '@/components/dashboard/tabs/AIInsightsTab';
import {
  TabType,
  NAV,
  ROLE_GRADIENT,
  CURRENT_ORGANIZATION,
  defaultDashboardTabForRole,
} from '@/components/dashboard/types';

/**
 * Main dashboard container component orchestrating sub-tabs, navigation,
 * real-time user auth synchronization, and role-based views.
 */
export const DashboardPage: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>(() => defaultDashboardTabForRole(user?.role));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const visibleNav = NAV.filter(
    (n) =>
      user?.role &&
      n.roles.includes(user.role) &&
      (!n.permission || hasPermission(user.permissions, n.permission))
  );

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<{ user: User }>('/auth/me')
      .then((response) => {
        if (cancelled) return;
        const freshUser = response.data.user;
        const roleChanged = user?.role && user.role !== freshUser.role;
        setUser({ ...freshUser, permissions: freshUser.permissions ?? [] });
        if (roleChanged) {
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          queryClient.invalidateQueries({ queryKey: ['ai'] });
          queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
          queryClient.invalidateQueries({ queryKey: ['assessments'] });
        }
      })
      .catch(() => {
        // Global API interceptor handles expired sessions.
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, user?.role]);

  useEffect(() => {
    const canSeeActiveTab = visibleNav.some((item) => item.id === activeTab);
    if (!canSeeActiveTab) setActiveTab(defaultDashboardTabForRole(user?.role));
  }, [activeTab, user?.permissions, user?.role, visibleNav]);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    window.location.href = '/login';
  };

  const displayName = user?.employeeName || user?.username || 'Unknown User';
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Unknown Role';
  const gradeLine =
    user?.currentGrade && user?.targetGrade
      ? `${user.currentGrade} -> ${user.targetGrade}`
      : 'Grade not assigned';
  const identityLine = [user?.empCode ? `ID ${user.empCode}` : null, roleLabel, gradeLine]
    .filter(Boolean)
    .join(' | ');
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '??';
  const gradient = ROLE_GRADIENT[user?.role ?? ''] ?? 'from-gray-500 to-gray-600';
  const isTeamTab = activeTab === 'team' && isLeaderRole(user?.role);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg))' }}>
      {/* Top Navigation Bar */}
      <header className="glass shrink-0 z-40 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="flex items-center h-14 px-4 gap-3">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Organization logo / Brand */}
          <a
            href={CURRENT_ORGANIZATION.baseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 mr-4 rounded-lg"
            title={CURRENT_ORGANIZATION.baseUrl}
          >
            <img
              src={CURRENT_ORGANIZATION.logoUrl}
              alt={`${CURRENT_ORGANIZATION.name} logo`}
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                {CURRENT_ORGANIZATION.name}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'rgb(var(--text-3))' }}>
                DevOps Skills Readiness
              </span>
            </div>
          </a>

          {/* Search bar */}
          <div
            className="flex-1 max-w-xs hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 border text-sm"
            style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
          >
            <Search size={13} style={{ color: 'rgb(var(--text-3))' }} />
            <span style={{ color: 'rgb(var(--text-3))' }}>Search…</span>
          </div>

          <div className="flex-1" />

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className="btn-ghost w-9 h-9 p-0 rounded-lg flex items-center justify-center relative shrink-0"
              title="Notifications"
            >
              <Bell size={16} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ backgroundColor: 'rgb(var(--accent))' }}
              />
            </button>

            <ThemeSwitcher />

            <div className="h-5 w-px mx-1" style={{ backgroundColor: 'rgb(var(--border))' }} />

            <UserProfileMenu
              user={user}
              onOpenChangePassword={() => setChangePasswordOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className="shrink-0 flex flex-col border-r overflow-hidden transition-all duration-200"
          style={{
            width: sidebarOpen ? '220px' : '60px',
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
          }}
        >
          <nav className="flex-1 p-2 space-y-0.5 pt-3">
            {visibleNav.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={!sidebarOpen ? label : undefined}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                  style={{
                    backgroundColor: active ? 'rgb(var(--accent-soft))' : 'transparent',
                    color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon
                    size={17}
                    style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-2))', flexShrink: 0 }}
                  />
                  {sidebarOpen && (
                    <span
                      className="truncate"
                      style={{ color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))' }}
                    >
                      {label}
                    </span>
                  )}
                  {active && sidebarOpen && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'rgb(var(--accent))' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom user profile preview */}
          <div className="p-2 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
              style={{ backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {initials}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                    {displayName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>
                    {identityLine}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className={`flex-1 ${isTeamTab ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={isTeamTab ? 'h-full w-full p-6' : 'max-w-6xl mx-auto p-6'}>
            {activeTab === 'admin' && user?.role === 'ADMIN' && (
              <AdminDashboardTab onNavigate={setActiveTab} />
            )}

            {activeTab === 'overview' && <OverviewTab user={user} onNavigate={setActiveTab} />}

            {activeTab === 'approvals' && isLeaderRole(user?.role) && (
              <div className="animate-slide-up">
                <PendingApprovalsPanel />
              </div>
            )}

            {activeTab === 'team' && isLeaderRole(user?.role) && (
              <div className="card p-6 h-full w-full animate-slide-up flex flex-col overflow-hidden">
                <TeamRoster />
              </div>
            )}

            {activeTab === 'assessments' && <AssessmentsTab user={user} onNavigate={setActiveTab} />}

            {activeTab === 'ai' && isLeaderRole(user?.role) && (
              <AIInsightsTab user={user} onNavigate={setActiveTab} />
            )}

            {activeTab === 'reports' && canViewReports && (
              <div className="animate-slide-up">
                <ReportsSection />
              </div>
            )}

            {activeTab === 'config' && user?.role === 'ADMIN' && (
              <div className="animate-slide-up">
                <ConfigSection />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </div>
  );
};
