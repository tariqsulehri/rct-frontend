import React from 'react';
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

          return (
            <div key={category.id} className="space-y-1">
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                  <CategoryIcon className="w-3.5 h-3.5 text-slate-400" />
                  {category.title}
                </span>
                {category.isUpcoming && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded border border-amber-200/40">
                    <Lock className="w-2.5 h-2.5" /> Coming Soon
                  </span>
                )}
              </div>

              {category.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between text-xs group ${
                      isActive
                        ? 'bg-indigo-600 text-white font-medium shadow-xs shadow-indigo-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                        }`}
                      />
                      <div className="truncate">
                        <div className="font-medium leading-tight truncate">{item.label}</div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-indigo-500/40 text-white border border-indigo-400/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
