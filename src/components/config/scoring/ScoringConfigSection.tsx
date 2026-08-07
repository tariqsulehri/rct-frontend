import React, { useState } from 'react';
import { AssessmentLevelsSection } from './AssessmentLevelsSection';
import { AssessmentProjectsSection } from './AssessmentProjectsSection';
import { AssessmentStatusesSection } from './AssessmentStatusesSection';
import { AssessmentTypesSection } from './AssessmentTypesSection';

export const ScoringConfigSection: React.FC = () => {
  const [active, setActive] = useState<'types' | 'levels' | 'statuses' | 'projects'>('types');
  const items = [
    { id: 'types' as const, label: 'Assessment Types' },
    { id: 'levels' as const, label: 'Experience Levels' },
    { id: 'statuses' as const, label: 'Workflow Statuses' },
    { id: 'projects' as const, label: 'Assessment Projects' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs flex gap-1.5 flex-wrap">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : 'bg-zinc-100/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active === 'types' && <AssessmentTypesSection />}
      {active === 'levels' && <AssessmentLevelsSection />}
      {active === 'statuses' && <AssessmentStatusesSection />}
      {active === 'projects' && <AssessmentProjectsSection />}
    </div>
  );
};
