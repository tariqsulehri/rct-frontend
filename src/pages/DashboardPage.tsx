import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { useAuthStore, type User } from '@/store/authStore';
import { TeamRoster } from '@/components/TeamRoster';
import { PendingApprovalsPanel } from '@/components/PendingApprovalsPanel';
import { ConfigSection, CONFIG_CATEGORIES, type ConfigTab } from '@/components/config/ConfigSection';
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
import { BehavioralAssessmentView } from '@/components/behavioral/BehavioralAssessmentView';
import { CommunicationAssessmentView } from '@/components/communication/CommunicationAssessmentView';
import {
  TabType,
  NAV,
  ROLE_GRADIENT,
  defaultDashboardTabForRole,
} from '@/components/dashboard/types';

import { REPORT_CATEGORIES, type ReportTabId } from '@/components/reports/ReportSidebar';

/**
 * Main dashboard container component orchestrating sub-tabs, navigation,
 * real-time user auth synchronization, and role-based views.
 */
export const DashboardPage: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>(() => defaultDashboardTabForRole(user?.role));
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('scoring');
  const [activeReportTab, setActiveReportTab] = useState<ReportTabId>('executive_leaderboard');
  const [configMenuOpen, setConfigMenuOpen] = useState(true);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

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
          <div className="flex items-center gap-2.5 mr-4 py-1">
            <img
              src="/assets/svg/calibr-lockup-horizontal-color.svg"
              alt="Calibr Logo"
              className="h-8 w-auto object-contain"
            />
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
            width: sidebarOpen ? '310px' : '68px',
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
          }}
        >
          <nav className="flex-1 p-2.5 space-y-1 pt-3.5 overflow-y-auto scrollbar-none">
            {visibleNav.map(({ id, label, icon: Icon }) => {
              const isConfig = id === 'config';
              const isReports = id === 'reports';
              const active = activeTab === id;

              if (isReports) {
                return (
                  <div key={id} className="space-y-1.5">
                    {/* Reports Parent Toggle */}
                    <button
                      onClick={() => {
                        setActiveTab('reports');
                        if (sidebarOpen) {
                          setReportsMenuOpen((prev) => !prev);
                        } else {
                          setSidebarOpen(true);
                          setReportsMenuOpen(true);
                        }
                      }}
                      title={!sidebarOpen ? label : undefined}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150 group"
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
                        size={19}
                        style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-2))', flexShrink: 0 }}
                      />
                      {sidebarOpen && (
                        <>
                          <span
                            className="truncate flex-1 text-left font-bold text-[14px]"
                            style={{ color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))' }}
                          >
                            {label}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportsMenuOpen((prev) => !prev);
                            }}
                            className="p-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 text-zinc-400"
                          >
                            {reportsMenuOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Expandable Report Category Tree (When Sidebar is Open) */}
                    {sidebarOpen && reportsMenuOpen && (
                      <div className="pl-2 pr-1 py-1 space-y-3 border-l-2 border-indigo-500/60 dark:border-indigo-600/60 ml-4 animate-fade-in">
                        {REPORT_CATEGORIES.map((category) => {
                          const CatIcon = category.icon;
                          const isCollapsed = Boolean(collapsedCategories[category.id]);

                          return (
                            <div key={category.id} className="space-y-1">
                              {/* Category Header */}
                              <button
                                type="button"
                                onClick={() => toggleCategoryCollapse(category.id)}
                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/60 transition-colors mb-1 cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CatIcon size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span className="truncate text-slate-800 dark:text-slate-100 font-bold">{category.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {category.isUpcoming && (
                                    <span className="text-[8.5px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-extrabold border border-indigo-200 dark:border-indigo-800 uppercase">
                                      Soon
                                    </span>
                                  )}
                                  {isCollapsed ? (
                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                  )}
                                </div>
                              </button>

                              {/* Category Items */}
                              {!isCollapsed && (
                                <div className="space-y-1">
                                  {category.items.map((subItem) => {
                                    const SubIcon = subItem.icon;
                                    const isSubActive = activeTab === 'reports' && activeReportTab === subItem.id;

                                    return (
                                      <button
                                        key={subItem.id}
                                        type="button"
                                        onClick={() => {
                                          setActiveTab('reports');
                                          setActiveReportTab(subItem.id);
                                        }}
                                        title={subItem.description}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all ${
                                          isSubActive
                                            ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <SubIcon size={13.5} className={isSubActive ? 'text-white' : 'text-zinc-400 group-hover:text-indigo-600'} />
                                          <span className="truncate leading-snug">{subItem.label}</span>
                                        </div>
                                        {subItem.badge && (
                                          <span
                                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                              isSubActive
                                                ? 'bg-indigo-700/80 text-indigo-100 border-indigo-400/40'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80'
                                            }`}
                                          >
                                            {subItem.badge}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (isConfig) {
                return (
                  <div key={id} className="space-y-1.5">
                    {/* Setup Parent Toggle */}
                    <button
                      onClick={() => {
                        setActiveTab('config');
                        if (sidebarOpen) {
                          setConfigMenuOpen((prev) => !prev);
                        } else {
                          setSidebarOpen(true);
                          setConfigMenuOpen(true);
                        }
                      }}
                      title={!sidebarOpen ? label : undefined}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150 group"
                      style={{
                        backgroundColor: active ? '#2563eb' : 'transparent',
                        color: active ? '#ffffff' : 'rgb(var(--text-2))',
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
                        size={19}
                        style={{ color: active ? '#ffffff' : 'rgb(var(--text-2))', flexShrink: 0 }}
                      />
                      {sidebarOpen && (
                        <>
                          <span
                            className="truncate flex-1 text-left font-bold text-[14px]"
                            style={{ color: active ? '#ffffff' : 'rgb(var(--text-2))' }}
                          >
                            {label}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfigMenuOpen((prev) => !prev);
                            }}
                            className="p-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 text-zinc-400"
                          >
                            {configMenuOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Expandable Category Tree (When Sidebar is Open) */}
                    {sidebarOpen && configMenuOpen && (
                      <div className="pl-2 pr-1 py-1 space-y-3 border-l-2 border-indigo-500/60 dark:border-indigo-600/60 ml-4 animate-fade-in">
                        {CONFIG_CATEGORIES.map((category) => {
                          const CatIcon = category.icon;
                          const isCollapsed = Boolean(collapsedCategories[category.id]);

                          return (
                            <div key={category.id} className="space-y-1">
                              {/* Category Header */}
                              <button
                                type="button"
                                onClick={() => toggleCategoryCollapse(category.id)}
                                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/60 transition-colors mb-1 cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CatIcon size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span className="truncate text-slate-800 dark:text-slate-100 font-bold">{category.title}</span>
                                </div>
                                {isCollapsed ? (
                                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                )}
                              </button>

                              {/* Category Items */}
                              {!isCollapsed && (
                                <div className="space-y-1">
                                  {category.items.map((subItem) => {
                                    const SubIcon = subItem.icon;
                                    const isSubActive = activeTab === 'config' && activeConfigTab === subItem.id;

                                    return (
                                      <button
                                        key={subItem.id}
                                        type="button"
                                        onClick={() => {
                                          setActiveTab('config');
                                          setActiveConfigTab(subItem.id);
                                          window.location.hash = subItem.id;
                                        }}
                                        title={subItem.help}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all ${
                                          isSubActive
                                            ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <SubIcon size={14} className={isSubActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600'} />
                                          <span className="truncate leading-snug">{subItem.label}</span>
                                        </div>
                                        {subItem.badge && (
                                          <span
                                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                              isSubActive
                                                ? 'bg-indigo-700/80 text-indigo-100 border-indigo-400/40'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80'
                                            }`}
                                          >
                                            {subItem.badge}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={!sidebarOpen ? label : undefined}
                  className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150 group"
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
                    size={19}
                    style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-2))', flexShrink: 0 }}
                  />
                  {sidebarOpen && (
                    <span
                      className="truncate text-[14px]"
                      style={{ color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))' }}
                    >
                      {label}
                    </span>
                  )}
                  {active && sidebarOpen && (
                    <div
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'rgb(var(--accent))' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom user profile preview */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: 'rgb(var(--border))' }}>
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs`}
              >
                {initials}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'rgb(var(--text-1))' }}>
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
          <div
            className={
              isTeamTab
                ? 'h-full w-full p-6'
                : activeTab === 'reports'
                ? 'w-full px-4 sm:px-6 py-4'
                : activeTab === 'config'
                ? 'w-full max-w-7xl mx-auto p-4 sm:p-6'
                : 'max-w-6xl mx-auto p-6'
            }
          >
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

            {activeTab === 'communication' && (
              <div className="animate-slide-up w-full">
                <CommunicationAssessmentView
                  employeeId={user?.empCode || ''}
                  employeeName={user?.employeeName || user?.username || 'Employee'}
                  currentGradeCode={user?.currentGrade}
                />
              </div>
            )}

            {activeTab === 'behavioral' && (
              <div className="animate-slide-up w-full">
                <BehavioralAssessmentView
                  employeeId={user?.empCode || ''}
                  employeeName={user?.employeeName || user?.username || 'Employee'}
                  canAssess={isLeaderRole(user?.role)}
                />
              </div>
            )}

            {activeTab === 'ai' && isLeaderRole(user?.role) && (
              <AIInsightsTab user={user} onNavigate={setActiveTab} />
            )}

            {activeTab === 'reports' && canViewReports && (
              <div className="animate-slide-up w-full">
                <ReportsSection
                  activeTab={activeReportTab}
                  onSelectTab={(tab) => setActiveReportTab(tab)}
                />
              </div>
            )}

            {activeTab === 'config' && user?.role === 'ADMIN' && (
              <div className="animate-slide-up w-full">
                <ConfigSection
                  activeTab={activeConfigTab}
                  onTabChange={(tab) => setActiveConfigTab(tab)}
                />
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
