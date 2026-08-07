import React, { useState } from 'react';
import { Table, ShieldCheck, BookOpen, MessageSquareText } from 'lucide-react';
import { CefrGradeMatrixTab } from './CefrGradeMatrixTab';
import { CefrPromotionGatingTab } from './CefrPromotionGatingTab';
import { CefrRubricsTab } from './CefrRubricsTab';

type CefrConfigSubTab = 'matrix' | 'gating' | 'rubrics';

export const CefrBenchmarksSection: React.FC = () => {
  const [subTab, setSubTab] = useState<CefrConfigSubTab>('matrix');

  const subTabs = [
    {
      id: 'matrix' as const,
      label: 'Grade Benchmark Matrix',
      icon: Table,
      help: 'Set expected CEFR levels per grade and competency overrides.',
    },
    {
      id: 'gating' as const,
      label: 'Promotion Gating & Rules',
      icon: ShieldCheck,
      help: 'Configure threshold rules where CEFR gates career promotions.',
    },
    {
      id: 'rubrics' as const,
      label: 'Level Rubrics & Rubrics',
      icon: BookOpen,
      help: 'View behavioral indicators and engineering rubrics for A1-C2.',
    },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Sub-Tab Navigation Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shrink-0">
            <MessageSquareText size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
              CEFR Communication Benchmark Configuration
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              Manage organization-wide communication standards, career grade mappings, and promotion policies.
            </p>
          </div>
        </div>

        {/* 3 Sub-Tabs Pill Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 w-fit shrink-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                title={tab.help}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs border border-indigo-500'
                    : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Content Rendering */}
      <div>
        {subTab === 'matrix' && <CefrGradeMatrixTab />}
        {subTab === 'gating' && <CefrPromotionGatingTab />}
        {subTab === 'rubrics' && <CefrRubricsTab />}
      </div>
    </div>
  );
};
