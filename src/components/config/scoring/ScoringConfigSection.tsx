import React, { useState } from 'react';
import { AssessmentLevelsSection } from './AssessmentLevelsSection';
import { AssessmentProjectsSection } from './AssessmentProjectsSection';
import { AssessmentStatusesSection } from './AssessmentStatusesSection';
import { AssessmentTypesSection } from './AssessmentTypesSection';

export const ScoringConfigSection: React.FC = () => {
  const [active, setActive] = useState<'types' | 'levels' | 'statuses' | 'projects'>('types');
  const items = [
    { id: 'types' as const, label: 'Types' },
    { id: 'levels' as const, label: 'Levels' },
    { id: 'statuses' as const, label: 'Statuses' },
    { id: 'projects' as const, label: 'Projects' },
  ];

  return (
    <div className="space-y-4">
      <div className="card p-1 flex gap-1 flex-wrap">
        {items.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: active === item.id ? 'rgb(var(--accent))' : 'transparent',
              color: active === item.id ? 'white' : 'rgb(var(--text-2))',
            }}>
            {item.label}
          </button>
        ))}
      </div>
      {active === 'types' && <AssessmentTypesSection />}
      {active === 'levels' && <AssessmentLevelsSection />}
      {active === 'statuses' && <AssessmentStatusesSection />}
      {active === 'projects' && <AssessmentProjectsSection />}
    </div>
  );
};
