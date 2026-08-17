import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
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
import { CONFIG_CATEGORIES, type ConfigTab, type ConfigTabItem, type ConfigCategory } from './configCategories';
export { CONFIG_CATEGORIES, type ConfigTab, type ConfigTabItem, type ConfigCategory };

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

  const handleSelectTab = useCallback((tabId: ConfigTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalTab(tabId);
    }
    window.location.hash = tabId;
  }, [onTabChange]);

  // Handle URL hash navigation or custom tab switch events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = CONFIG_CATEGORIES.flatMap((c) => c.items.map((i) => i.id));
      if (validTabs.includes(hash as ConfigTab)) {
        handleSelectTab(hash as ConfigTab);
      }
    };

    const handleCustomTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<ConfigTab>;
      if (customEvent.detail) {
        handleSelectTab(customEvent.detail);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('config-tab-change', handleCustomTabChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('config-tab-change', handleCustomTabChange);
    };
  }, [handleSelectTab]);

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
    <div className="space-y-3 animate-slide-up w-full">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shrink-0">
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
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 font-medium">
                {activeMeta.item.help}
              </p>
            </div>
          </div>

          {/* Search Filter Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search configuration..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* If Search Active: Show Flat Search Results */}
        {searchResults ? (
          <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-1.5">
            {searchResults.length === 0 ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 py-1">
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
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
          <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            {/* Category Level 1 Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CONFIG_CATEGORIES.map((cat) => {
                const isCurrentCategory = activeCategory.id === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (!isCurrentCategory) {
                        handleSelectTab(cat.items[0].id);
                      }
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      isCurrentCategory
                        ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-300/80 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <CatIcon size={14} />
                    <span>{cat.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                        isCurrentCategory
                          ? 'bg-indigo-700/80 text-indigo-100 border-indigo-400/40'
                          : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-600'
                      }`}
                    >
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Level 2 Sub-Item Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
              {activeCategory.items.map((item) => {
                const isCurrentItem = currentTab === item.id;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    title={item.help}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${
                      isCurrentItem
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-200 font-bold border-indigo-300 dark:border-indigo-600/80 shadow-2xs'
                        : 'bg-zinc-100/70 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 font-semibold border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <ItemIcon
                      size={13}
                      className={
                        isCurrentItem
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-500 dark:text-zinc-400'
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
