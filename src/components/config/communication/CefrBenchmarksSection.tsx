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
      {/* Sub-Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <MessageSquareText size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
              CEFR Communication Benchmark Configuration
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage organization-wide communication standards, career grade mappings, and promotion policies.
            </p>
          </div>
        </div>

        {/* 3 Sub-Tabs Pill Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70 w-fit">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                title={tab.help}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-zinc-700/80'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
