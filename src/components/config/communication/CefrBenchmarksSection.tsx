import React, { useState } from 'react';
import { Table, ShieldCheck, BookOpen, MessageSquareText, Sliders, FileCode2 } from 'lucide-react';
import { CefrGradeMatrixTab } from './CefrGradeMatrixTab';
import { CefrLevelsBandsTab } from './CefrLevelsBandsTab';
import { CefrPromotionGatingTab } from './CefrPromotionGatingTab';
import { CefrRubricsTab } from './CefrRubricsTab';
import { CefrDocumentationTab } from './CefrDocumentationTab';

type CefrConfigSubTab = 'matrix' | 'levels-bands' | 'gating' | 'rubrics' | 'documentation';

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
      id: 'levels-bands' as const,
      label: 'CEFR Levels & Band Thresholds',
      icon: Sliders,
      help: 'View 6-level weights (0.17-1.00) and midpoint score band boundaries.',
    },
    {
      id: 'gating' as const,
      label: 'Promotion Gating & Rules',
      icon: ShieldCheck,
      help: 'Configure threshold rules where CEFR gates career promotions.',
    },
    {
      id: 'rubrics' as const,
      label: 'Level Rubrics & Behaviors',
      icon: BookOpen,
      help: 'View behavioral indicators and engineering rubrics for A1-C2.',
    },
    {
      id: 'documentation' as const,
      label: 'Engine Specs & Simulator',
      icon: FileCode2,
      help: 'Interactive rule engine specification, R1-R10 rules, and test vector calculator.',
    },
  ];

  return (
    <div className="space-y-3 animate-slide-up w-full">
      {/* Top Header Card — Compact, Unified Navigation */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-2xs space-y-3">
        {/* Title & Description Block */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shrink-0">
            <MessageSquareText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                CEFR Communication Benchmarks & Rule Engine
              </h2>
              <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full border bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">
                CEFR Engine
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              Manage career grade benchmarks, competency rubrics, promotion gating policies, and engine specifications.
            </p>
          </div>
        </div>

        {/* 5 Sub-Tabs Navigation Bar */}
        <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                title={tab.help}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all shrink-0 border ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                    : 'bg-zinc-100/70 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 font-semibold border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  size={13}
                  className={
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Content Rendering */}
      <div className="w-full">
        {subTab === 'matrix' && <CefrGradeMatrixTab />}
        {subTab === 'levels-bands' && <CefrLevelsBandsTab />}
        {subTab === 'gating' && <CefrPromotionGatingTab />}
        {subTab === 'rubrics' && <CefrRubricsTab />}
        {subTab === 'documentation' && <CefrDocumentationTab />}
      </div>
    </div>
  );
};
