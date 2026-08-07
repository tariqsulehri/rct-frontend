import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareText,
  Award,
  Building2,
  Calendar,
  Cpu,
  Layers,
  Network,
  Settings,
  ShieldCheck,
  Tag,
  User,
  Users,
  Zap,
  Search,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import SkillTaxonomyView from './SkillTaxonomyView';
import { AccessManagementSection } from './access/AccessManagementSection';
import { DepartmentsSection } from './organization/DepartmentsSection';
import { EmployeesSection } from './organization/EmployeesSection';
import { GradesSection } from './organization/GradesSection';
import { UsersSection } from './organization/UsersSection';
import { ScoringConfigSection } from './scoring/ScoringConfigSection';
import { CefrBenchmarksSection } from './communication/CefrBenchmarksSection';
import { CategoriesSection } from './taxonomy/CategoriesSection';
import { CompetenciesSection } from './taxonomy/CompetenciesSection';
import { SkillDomainsSection } from './taxonomy/SkillDomainsSection';
import { TechnologiesSection } from './taxonomy/TechnologiesSection';
import { EvaluationPeriodsSection } from './periods/EvaluationPeriodsSection';

export type ConfigTab =
  | 'grades'
  | 'departments'
  | 'employees'
  | 'users'
  | 'access'
  | 'scoring'
  | 'cefr-benchmarks'
  | 'periods'
  | 'skill-domains'
  | 'competencies'
  | 'technologies'
  | 'categories'
  | 'skill-map';

export interface ConfigTabItem {
  id: ConfigTab;
  label: string;
  shortDesc: string;
  help: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export interface ConfigCategory {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  items: ConfigTabItem[];
}

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'organization',
    title: 'Organization & People',
    tagline: 'Manage career grades, company departments, employee rosters, and permissions',
    icon: Building2,
    accentColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    items: [
      {
        id: 'grades',
        label: 'Career Grades',
        shortDesc: 'Ladder levels & titles',
        help: 'Configure organizational career grades such as G13, G14, G15 up to EXEC.',
        icon: Award,
      },
      {
        id: 'departments',
        label: 'Departments',
        shortDesc: 'Units & engineering teams',
        help: 'Company departments and organizational structures.',
        icon: Building2,
      },
      {
        id: 'employees',
        label: 'Employees',
        shortDesc: 'Roster & targets',
        help: 'People whose skills, baselines, and promotion readiness are tracked.',
        icon: Users,
      },
      {
        id: 'users',
        label: 'User Accounts',
        shortDesc: 'Logins & system credentials',
        help: 'Application logins, authentication credentials, and user profiles.',
        icon: User,
      },
      {
        id: 'access',
        label: 'Access & RBAC',
        shortDesc: 'Roles & permission matrix',
        help: 'Role-based access permissions and security control scopes.',
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 'scoring_rules',
    title: 'Scoring & Evaluation Rules',
    tagline: 'Define mathematical weights, CEFR language benchmarks, and review cycles',
    icon: Sliders,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    items: [
      {
        id: 'scoring',
        label: 'Technical Scoring',
        shortDesc: 'Formula weights & thresholds',
        help: 'Core scoring algorithms, domain multipliers, and star rating bands.',
        icon: Settings,
      },
      {
        id: 'cefr-benchmarks',
        label: 'CEFR Benchmarks',
        shortDesc: 'Grade communication matrix',
        help: 'Configure grade-wise CEFR benchmarks, competency rubrics, and promotion gating rules.',
        icon: MessageSquareText,
        badge: 'CEFR',
        badgeColor: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
      },
      {
        id: 'periods',
        label: 'Evaluation Periods',
        shortDesc: 'Appraisal cycles & years',
        help: 'Set up performance review cycles and fiscal evaluation years (e.g. 2024, 2025, 2026).',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'taxonomy',
    title: 'Skill Taxonomy & Tools',
    tagline: 'Structure domains, competencies, technologies, and relational skill mappings',
    icon: Layers,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    items: [
      {
        id: 'skill-domains',
        label: 'Skill Domains',
        shortDesc: 'Major discipline areas',
        help: 'High-level discipline areas such as Cloud Architecture, SRE, and CI/CD.',
        icon: Layers,
      },
      {
        id: 'competencies',
        label: 'Skills & Competencies',
        shortDesc: 'Assessed capabilities',
        help: 'Granular technical competencies that engineers are evaluated against.',
        icon: Cpu,
      },
      {
        id: 'technologies',
        label: 'Tools & Tech',
        shortDesc: 'Frameworks & stacks',
        help: 'Specific tools, platforms, and technologies linked to competencies.',
        icon: Zap,
      },
      {
        id: 'categories',
        label: 'Categories & Tags',
        shortDesc: 'Classification labels',
        help: 'Tagging and metadata categories used to organize skills.',
        icon: Tag,
      },
      {
        id: 'skill-map',
        label: 'Interactive Skill Map',
        shortDesc: 'Visual taxonomy graph',
        help: 'Interactive relational graph connecting domains, skills, and tools.',
        icon: Network,
        badge: 'Interactive',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      },
    ],
  },
];

export const ConfigSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('scoring');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL hash navigation or custom tab switch events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = CONFIG_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
      if (validTabs.includes(hash as ConfigTab)) {
        setActiveTab(hash as ConfigTab);
      }
    };

    const handleCustomTabChange = (e: CustomEvent<ConfigTab>) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('config-tab-change' as any, handleCustomTabChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('config-tab-change' as any, handleCustomTabChange);
    };
  }, []);

  // Find active category and item metadata
  const activeMeta = useMemo(() => {
    for (const cat of CONFIG_CATEGORIES) {
      const item = cat.items.find((i) => i.id === activeTab);
      if (item) {
        return { category: cat, item };
      }
    }
    return {
      category: CONFIG_CATEGORIES[1],
      item: CONFIG_CATEGORIES[1].items[0],
    };
  }, [activeTab]);

  // Filter items by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CONFIG_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();

    return CONFIG_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.shortDesc.toLowerCase().includes(q) ||
          item.help.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const handleSelectTab = (tabId: ConfigTab) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const ActiveIcon = activeMeta.item.icon;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Setup & Configuration</span>
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeMeta.category.badgeBg}`}
            >
              {activeMeta.category.title}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Organized management for organizational hierarchy, scoring rules, and technical taxonomies.
          </p>
        </div>

        {/* Quick Filter Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter options..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Main Category-Rail Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Category Rail Navigation */}
        <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2.5 shadow-xs space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              No configuration options matched &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredCategories.map((category) => {
              const CatIcon = category.icon;

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <div className="px-2.5 py-1.5 flex items-center gap-2">
                    <div
                      className={`p-1 rounded-md ${category.badgeBg} flex items-center justify-center shrink-0`}
                    >
                      <CatIcon size={13} />
                    </div>
                    <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      {category.title}
                    </span>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          title={item.help}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all group ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-2xs font-bold border border-indigo-200 dark:border-indigo-800/80'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                              }`}
                            >
                              <ItemIcon size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs truncate leading-tight flex items-center gap-1.5">
                                <span>{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-current ${
                                      item.badgeColor || 'bg-zinc-100 dark:bg-zinc-800'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {item.shortDesc}
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <ChevronRight
                              size={14}
                              className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-1"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-3">
          {/* Active Context Bar */}
          <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                <ActiveIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    {activeMeta.item.label}
                  </h3>
                  <span className="text-[10px] font-medium text-zinc-400">
                    • {activeMeta.category.title}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activeMeta.item.help}
                </p>
              </div>
            </div>
          </div>

          {/* Section Component Content */}
          <div className="w-full">
            {activeTab === 'grades' && <GradesSection />}
            {activeTab === 'departments' && <DepartmentsSection />}
            {activeTab === 'employees' && <EmployeesSection />}
            {activeTab === 'users' && <UsersSection />}
            {activeTab === 'access' && <AccessManagementSection />}

            {activeTab === 'scoring' && <ScoringConfigSection />}
            {activeTab === 'cefr-benchmarks' && <CefrBenchmarksSection />}
            {activeTab === 'periods' && <EvaluationPeriodsSection />}

            {activeTab === 'skill-domains' && <SkillDomainsSection />}
            {activeTab === 'competencies' && <CompetenciesSection />}
            {activeTab === 'technologies' && <TechnologiesSection />}
            {activeTab === 'categories' && <CategoriesSection />}
            {activeTab === 'skill-map' && <SkillTaxonomyView />}
          </div>
        </main>
      </div>
    </div>
  );
};
