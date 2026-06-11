import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, BarChart2, PieChart as PieIcon, Download } from 'lucide-react';
import { PromotionReadinessTab } from './tabs/PromotionReadinessTab';
import { EmployeeResultSheetTab } from './tabs/EmployeeResultSheetTab';
import { CompetencyScoresTab } from './tabs/CompetencyScoresTab';
import { GapAnalysisTab } from './tabs/GapAnalysisTab';

type SubTab = 'summary' | 'promotion' | 'competency' | 'gap' | 'result-sheet';

const SUB_TABS: Array<{ id: SubTab; label: string; icon: React.ElementType; helper: string }> = [
  { id: 'summary',      label: 'Report Guide',       icon: LayoutDashboard, helper: 'Pick the right report' },
  { id: 'promotion',    label: 'Readiness',          icon: TrendingUp,      helper: 'Who is ready' },
  { id: 'competency',   label: 'Skill Scores',       icon: BarChart2,       helper: 'Current skill levels' },
  { id: 'gap',          label: 'Skill Gaps',         icon: PieIcon,         helper: 'What is missing' },
  { id: 'result-sheet', label: 'Person Sheet',       icon: Download,        helper: 'One person summary' },
];

const REPORT_GROUPS: Array<{
  id: SubTab;
  title: string;
  short: string;
  details: string;
  icon: React.ElementType;
  tone: string;
}> = [
  {
    id: 'promotion',
    title: 'Readiness',
    short: 'Who is ready for the next grade?',
    details: 'Use this to see ready people, almost ready people, people who need help, and grade groups.',
    icon: TrendingUp,
    tone: 'rgb(var(--success))',
  },
  {
    id: 'competency',
    title: 'Skill Scores',
    short: 'How strong are the skills now?',
    details: 'Use this to see skill scores for each person, team averages, and skill area scores.',
    icon: BarChart2,
    tone: 'rgb(var(--accent))',
  },
  {
    id: 'gap',
    title: 'Skill Gaps',
    short: 'What is below target?',
    details: 'Use this to compare current score with needed score and download gaps to Excel.',
    icon: PieIcon,
    tone: 'rgb(var(--warning))',
  },
  {
    id: 'result-sheet',
    title: 'Person Sheet',
    short: 'What can I share for one employee?',
    details: 'Use this for one person score, gaps, skill area bars, and print view.',
    icon: Download,
    tone: 'rgb(var(--text-1))',
  },
];

const ReportsGuide: React.FC<{ onOpen: (tab: SubTab) => void }> = ({ onOpen }) => (
  <div className="space-y-5">
    <div>
      <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
        Choose one report for one question
      </p>
      <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
        Use reports to compare people, find gaps, or export results. Pick the report that matches your question.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {REPORT_GROUPS.map(({ id, title, short, details, icon: Icon, tone }) => (
        <button
          key={id}
          onClick={() => onOpen(id)}
          className="text-left rounded-xl border p-4 transition-colors"
          style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.25)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))')}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--surface))', color: tone }}>
              <Icon size={16} />
            </span>
            <span className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>{title}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: tone }}>{short}</p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgb(var(--text-3))' }}>{details}</p>
        </button>
      ))}
    </div>

    <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>
        Simple rule
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="font-bold" style={{ color: 'rgb(var(--success))' }}>Ready</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Use Readiness to see who can move to the next grade.</p>
        </div>
        <div>
          <p className="font-bold" style={{ color: 'rgb(var(--accent))' }}>Score</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Use Skill Scores to see current skill level.</p>
        </div>
        <div>
          <p className="font-bold" style={{ color: 'rgb(var(--warning))' }}>Gap</p>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Use Skill Gaps to see what must improve.</p>
        </div>
      </div>
    </div>
  </div>
);

export const ReportsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('summary');

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-0">
          <h2 className="section-title">Reports</h2>
          <p className="section-desc mb-4">Simple reports for readiness, skill scores, gaps, and one person sheets.</p>
        </div>
        <div className="flex gap-0 border-t overflow-x-auto" style={{ borderColor: 'rgb(var(--border))' }}>
          {SUB_TABS.map(({ id, label, helper, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap"
              style={{
                borderColor: activeTab === id ? 'rgb(var(--accent))' : 'transparent',
                color: activeTab === id ? 'rgb(var(--accent))' : 'rgb(var(--text-2))',
                backgroundColor: activeTab === id ? 'rgb(var(--accent-soft) / 0.3)' : 'transparent',
              }}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={14} />
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span>{label}</span>
                <span className="text-[10px] font-normal" style={{ color: activeTab === id ? 'rgb(var(--accent))' : 'rgb(var(--text-3))' }}>
                  {helper}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 animate-fade-in">
        {activeTab === 'summary'    && <ReportsGuide onOpen={setActiveTab} />}
        {activeTab === 'promotion'  && <PromotionReadinessTab />}
        {activeTab === 'competency'     && <CompetencyScoresTab />}
        {activeTab === 'gap'            && <GapAnalysisTab />}
        {activeTab === 'result-sheet' && <EmployeeResultSheetTab />}
      </div>
    </div>
  );
};
