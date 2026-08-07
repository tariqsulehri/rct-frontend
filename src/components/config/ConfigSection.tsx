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

interface ConfigSectionProps {
  activeTab?: ConfigTab;
  onTabChange?: (tab: ConfigTab) => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<ConfigTab>('scoring');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTab = controlledTab || internalTab;

  const handleSelectTab = (tabId: ConfigTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalTab(tabId);
    }
    window.location.hash = tabId;
  };

  // Handle URL hash navigation or custom tab switch events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = CONFIG_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
      if (validTabs.includes(hash as ConfigTab)) {
        handleSelectTab(hash as ConfigTab);
      }
    };

    const handleCustomTabChange = (e: CustomEvent<ConfigTab>) => {
      if (e.detail) {
        handleSelectTab(e.detail);
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
      const item = cat.items.find((i) => i.id === currentTab);
      if (item) {
        return { category: cat, item };
      }
    }
    return {
      category: CONFIG_CATEGORIES[1],
      item: CONFIG_CATEGORIES[1].items[0],
    };
  }, [currentTab]);

  const activeCategory = activeMeta.category;

  // Filter items if searching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches: Array<{ category: ConfigCategory; item: ConfigTabItem }> = [];

    CONFIG_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(q) ||
          item.shortDesc.toLowerCase().includes(q) ||
          item.help.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
        ) {
          matches.push({ category: cat, item });
        }
      });
    });
    return matches;
  }, [searchQuery]);

  const ActiveIcon = activeMeta.item.icon;

  return (
    <div className="space-y-4 animate-slide-up w-full">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
              <ActiveIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  {activeMeta.item.label}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeCategory.badgeBg}`}
                >
                  {activeCategory.title}
                </span>
                {activeMeta.item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-current ${
                      activeMeta.item.badgeColor || 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    {activeMeta.item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {activeMeta.item.help}
              </p>
            </div>
          </div>

          {/* Search Filter Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search configuration..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* If Search Active: Show Flat Search Results */}
        {searchResults ? (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
            {searchResults.length === 0 ? (
              <span className="text-xs text-zinc-400 py-1">
                No configurations match &quot;{searchQuery}&quot;
              </span>
            ) : (
              searchResults.map(({ category, item }) => {
                const Icon = item.icon;
                const isSelected = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleSelectTab(item.id);
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-70">({category.title})</span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Normal Category Horizontal Tabs Bar */
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            {/* Category Level 1 Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CONFIG_CATEGORIES.map((cat) => {
                const isCurrentCategory = activeCategory.id === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      // switch to the first item in this category if switching category
                      if (!isCurrentCategory) {
                        handleSelectTab(cat.items[0].id);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isCurrentCategory
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <CatIcon size={14} />
                    <span>{cat.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal ${
                        isCurrentCategory
                          ? 'bg-zinc-700 dark:bg-zinc-300 text-zinc-100 dark:text-zinc-900'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Level 2 Sub-Item Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
              {activeCategory.items.map((item) => {
                const isCurrentItem = currentTab === item.id;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    title={item.help}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      isCurrentItem
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent'
                    }`}
                  >
                    <ItemIcon
                      size={13}
                      className={
                        isCurrentItem
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border border-current ${
                          item.badgeColor || 'bg-zinc-100 dark:bg-zinc-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Full-Width Content Container */}
      <div className="w-full">
        {currentTab === 'grades' && <GradesSection />}
        {currentTab === 'departments' && <DepartmentsSection />}
        {currentTab === 'employees' && <EmployeesSection />}
        {currentTab === 'users' && <UsersSection />}
        {currentTab === 'access' && <AccessManagementSection />}

        {currentTab === 'scoring' && <ScoringConfigSection />}
        {currentTab === 'cefr-benchmarks' && <CefrBenchmarksSection />}
        {currentTab === 'periods' && <EvaluationPeriodsSection />}

        {currentTab === 'skill-domains' && <SkillDomainsSection />}
        {currentTab === 'competencies' && <CompetenciesSection />}
        {currentTab === 'technologies' && <TechnologiesSection />}
        {currentTab === 'categories' && <CategoriesSection />}
        {currentTab === 'skill-map' && <SkillTaxonomyView />}
      </div>
    </div>
  );
};
