import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Award,
  Layers,
  Sparkles,
  Users,
  Lock,
  Trophy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export type ReportTabId =
  | 'executive_leaderboard'
  | 'executive_summary'
  | 'department_benchmark'
  | 'competency_scores'
  | 'competency_matrix'
  | 'gap_analysis'
  | 'skills_summary'
  | 'cefr_analytics'
  | 'communication_gating'
  | 'promotion_readiness'
  | 'employee_result_sheet'
  | 'yoy_growth';

export interface ReportCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: Array<{
    id: ReportTabId;
    label: string;
    icon: React.ElementType;
    badge?: string;
    description: string;
  }>;
  isUpcoming?: boolean;
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'executive_leaderboard_suite',
    title: 'EXECUTIVE SUITE',
    icon: Trophy,
    items: [
      {
        id: 'executive_leaderboard',
        label: 'Leaderboard',
        icon: Trophy,
        badge: 'Top Talent',
        description: 'Org-wide top talent rankings, technical scores & CEFR readiness',
      },
      {
        id: 'executive_summary',
        label: 'Health Overview',
        icon: BarChart3,
        badge: 'CEO / CTO',
        description: 'Org-wide health score, CEFR readiness & headcount KPIs',
      },
      {
        id: 'promotion_readiness',
        label: 'Promotion Readiness',
        icon: UserCheck,
        badge: 'Actionable',
        description: 'Candidates meeting technical & CEFR requirements',
      },
      {
        id: 'cefr_analytics',
        label: 'CEFR Benchmarks',
        icon: ShieldCheck,
        badge: 'Gating',
        description: '6-dimension CEFR breakdown & gating blockers',
      },
      {
        id: 'yoy_growth',
        label: 'YoY Growth',
        icon: TrendingUp,
        badge: 'YoY',
        description: 'Historical progression across fiscal years',
      },
    ],
  },
  {
    id: 'technical_capabilities',
    title: 'TECHNICAL CAPABILITIES',
    icon: Layers,
    items: [
      {
        id: 'competency_scores',
        label: 'Domain Scores',
        icon: Layers,
        description: 'Weighted score averages per technology domain',
      },
      {
        id: 'competency_matrix',
        label: 'Competency Matrix',
        icon: FileSpreadsheet,
        description: 'Detailed employee x competency score grid',
      },
      {
        id: 'gap_analysis',
        label: 'Skill Deficit',
        icon: TrendingUp,
        description: 'Critical skill gaps relative to target grades',
      },
      {
        id: 'skills_summary',
        label: 'Star Ratings',
        icon: Award,
        description: 'Overall star ratings and performance bands',
      },
    ],
  },
  {
    id: 'individual_scorecards',
    title: 'INDIVIDUAL SCORECARDS',
    icon: Users,
    items: [
      {
        id: 'employee_result_sheet',
        label: 'Member Scorecard',
        icon: Users,
        description: 'Individual employee report card & target fit',
      },
    ],
  },
  {
    id: 'behavioral_competencies',
    title: 'BEHAVIORAL COMPETENCIES',
    icon: Sparkles,
    isUpcoming: true,
    items: [],
  },
];

interface ReportSidebarProps {
  activeTab: ReportTabId;
  onSelectTab: (tabId: ReportTabId) => void;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({ activeTab, onSelectTab }) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <aside className="w-full lg:w-[310px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2.5 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Analytics Segment
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200/50">
          Pro Suite
        </span>
      </div>

      <nav className="space-y-3.5">
        {REPORT_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;
          const isCollapsed = Boolean(collapsedCategories[category.id]);

          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header Button */}
              <button
                type="button"
                onClick={() => toggleCategoryCollapse(category.id)}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/60 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 tracking-wider flex items-center gap-2 truncate">
                  <CategoryIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">{category.title}</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {category.isUpcoming && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 uppercase">
                      <Lock className="w-2.5 h-2.5" /> Soon
                    </span>
                  )}
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="space-y-1 pt-0.5">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between text-[12.5px] group ${
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-500/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ItemIcon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                            }`}
                          />
                          <span className="truncate font-medium leading-snug">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              isActive
                                ? 'bg-indigo-700/80 text-indigo-100 border-indigo-400/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            {item.badge}
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
      </nav>
    </aside>
  );
};
