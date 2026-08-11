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
    title: 'EXECUTIVE LEADERBOARD',
    icon: Trophy,
    items: [
      {
        id: 'executive_leaderboard',
        label: 'Executive Leaderboard',
        icon: Trophy,
        badge: 'Top Talent',
        description: 'Org-wide top talent rankings, technical scores & CEFR readiness',
      },
      {
        id: 'executive_summary',
        label: 'Executive Health Overview',
        icon: BarChart3,
        badge: 'CEO / CTO',
        description: 'Org-wide health score, CEFR readiness & headcount KPIs',
      },
      {
        id: 'promotion_readiness',
        label: 'Promotion Readiness Index',
        icon: UserCheck,
        badge: 'Actionable',
        description: 'Candidates meeting technical & CEFR requirements',
      },
      {
        id: 'cefr_analytics',
        label: 'CEFR Org Benchmarks',
        icon: ShieldCheck,
        badge: 'Gating Matrix',
        description: '6-dimension CEFR breakdown & gating blockers',
      },
      {
        id: 'yoy_growth',
        label: 'Multi-Year YoY Growth',
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
        label: 'Domain Scores Summary',
        icon: Layers,
        description: 'Weighted score averages per technology domain',
      },
      {
        id: 'competency_matrix',
        label: 'Competency Score Matrix',
        icon: FileSpreadsheet,
        description: 'Detailed employee x competency score grid',
      },
      {
        id: 'gap_analysis',
        label: 'Skill Deficit Matrix',
        icon: TrendingUp,
        description: 'Critical skill gaps relative to target grades',
      },
      {
        id: 'skills_summary',
        label: 'Star Rating Summary',
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
        label: 'Member Result Sheet',
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
    <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Analytics Segment
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200/50">
          Pro Suite
        </span>
      </div>

      <nav className="space-y-4">
        {REPORT_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon;
          const isCollapsed = Boolean(collapsedCategories[category.id]);

          return (
            <div key={category.id} className="space-y-1.5">
              {/* Category Header Button */}
              <button
                type="button"
                onClick={() => toggleCategoryCollapse(category.id)}
                className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 dark:bg-blue-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors mb-1.5 flex items-center justify-between cursor-pointer"
              >
                <span className="text-[11px] font-extrabold text-white tracking-wider flex items-center gap-2 truncate">
                  <CategoryIcon className="w-4 h-4 text-white shrink-0" />
                  <span className="text-white font-extrabold truncate">{category.title}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {category.isUpcoming && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-blue-800 text-white px-1.5 py-0.5 rounded uppercase">
                      <Lock className="w-2.5 h-2.5 text-white" /> Soon
                    </span>
                  )}
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white shrink-0" />
                  )}
                </div>
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between text-xs group ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-xs shadow-blue-500/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ItemIcon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                            }`}
                          />
                          <div className="truncate">
                            <div className="font-medium leading-tight truncate">{item.label}</div>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                              isActive
                                ? 'bg-blue-700 text-blue-100 border-blue-400/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
