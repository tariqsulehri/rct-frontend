import React from 'react';
import { BookOpen, CheckCircle2, Code2, Users, Layers } from 'lucide-react';
import { CefrLevelCode } from '@/types/communication';
import { CefrLevelBadge } from '../../communication/CefrLevelBadge';

interface LevelRubric {
  code: CefrLevelCode;
  label: string;
  weight: number;
  scoreRange: string;
  targetGrades: string;
  summary: string;
  writtenBehaviors: string[];
  spokenBehaviors: string[];
  leadershipBehaviors: string[];
}

const CEFR_RUBRICS: LevelRubric[] = [
  {
    code: 'A1',
    label: 'Beginner / Breakthrough',
    weight: 0.17,
    scoreRange: '0.00 – 0.24',
    targetGrades: 'Intern / Entry Baseline',
    summary: 'Can understand basic everyday phrases and introduce simple technical issues using templates.',
    writtenBehaviors: [
      'Fills out standardized Jira ticket templates with basic error logs.',
      'Writes 1-line commit messages and responds to simple PR comments.',
    ],
    spokenBehaviors: [
      'Answers simple yes/no questions during daily standups.',
      'Communicates immediate blocking issues with direct supervisor.',
    ],
    leadershipBehaviors: [
      'Follows documented onboarding guides with mentor supervision.',
    ],
  },
  {
    code: 'A2',
    label: 'Elementary / Basic',
    weight: 0.33,
    scoreRange: '0.25 – 0.41',
    targetGrades: 'Junior / Associate (G13)',
    summary: 'Can communicate in routine sprint tasks and describe immediate technical context in clear, simple terms.',
    writtenBehaviors: [
      'Writes clear PR descriptions detailing what changed and testing steps.',
      'Documents step-by-step local setup guides in repository READMEs.',
    ],
    spokenBehaviors: [
      'Provides structured standup updates (Yesterday / Today / Blockers).',
      'Asks clarifying questions during sprint planning sessions.',
    ],
    leadershipBehaviors: [
      'Shares findings from routine bug investigations with teammates.',
    ],
  },
  {
    code: 'B1',
    label: 'Intermediate / Independent',
    weight: 0.50,
    scoreRange: '0.42 – 0.57',
    targetGrades: 'Engineer (G14)',
    summary: 'Can understand standard technical discussions, produce connected documentation, and participate in async reviews.',
    writtenBehaviors: [
      'Writes comprehensive feature documentation and runbooks.',
      'Provides constructive, empathetic feedback in code reviews.',
    ],
    spokenBehaviors: [
      'Explains technical implementation options in sprint grooming.',
      'Presents completed user stories during bi-weekly team sprint demos.',
    ],
    leadershipBehaviors: [
      'Collaborates smoothly with QA, Product, and Design counterparts.',
    ],
  },
  {
    code: 'B2',
    label: 'Upper-Intermediate / Operational Lead',
    weight: 0.67,
    scoreRange: '0.58 – 0.74',
    targetGrades: 'Senior Engineer (G15) / Tech Lead (G16)',
    summary: 'Can interact with spontaneity, author structured RFCs, explain complex tradeoffs, and lead incident bridges.',
    writtenBehaviors: [
      'Authors RFCs and Architecture Decision Records (ADRs) evaluating tradeoffs.',
      'Writes blameless, detailed Incident Postmortem reports and RCAs.',
    ],
    spokenBehaviors: [
      'Leads technical debate with conviction while remaining open to counter-arguments.',
      'Coordinates cross-functional incident mitigation bridges calmly under pressure.',
    ],
    leadershipBehaviors: [
      'Regularly mentors junior engineers through 1-on-1 coaching and technical pairing.',
      'Drives async consensus across distributed team members across timezones.',
    ],
  },
  {
    code: 'C1',
    label: 'Advanced / Strategic Fluency',
    weight: 0.83,
    scoreRange: '0.75 – 0.91',
    targetGrades: 'Engineering Manager (G17) / Staff Engineer',
    summary: 'Can express ideas fluently, negotiate complex stakeholder priorities, and lead strategic engineering reviews.',
    writtenBehaviors: [
      'Authors multi-quarter technical roadmaps and business-case proposals.',
      'Creates company-wide architectural standards and security governance guidelines.',
    ],
    spokenBehaviors: [
      'Delivers compelling presentations to non-technical executive stakeholders.',
      'Facilitates high-stakes technical alignment meetings across multiple teams.',
    ],
    leadershipBehaviors: [
      'Translates engineering constraints into business ROI and risk mitigations.',
      'Resolves deep cross-organizational conflict and drives unified consensus.',
    ],
  },
  {
    code: 'C2',
    label: 'Proficiency / Executive Mastery',
    weight: 1.00,
    scoreRange: '0.92 – 1.00',
    targetGrades: 'Director (G19) / VP / C-Level',
    summary: 'Can understand virtually everything with ease, lead executive discourse, and formulate company-wide consensus.',
    writtenBehaviors: [
      'Drafts enterprise technology strategy, board decks, and public thought leadership.',
      'Establishes global engineering culture principles and organizational charters.',
    ],
    spokenBehaviors: [
      'Delivers inspiring keynotes, all-hands addresses, and executive board pitches.',
      'Effortlessly handles hostile questioning and navigates high-stakes executive negotiations.',
    ],
    leadershipBehaviors: [
      'Inspires trust and alignment across international organizations and partners.',
    ],
  },
];

export const CefrRubricsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>CEFR Level Rubrics & Engineering Behavioral Indicators</span>
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Detailed standards mapping CEFR linguistic criteria into observable DevOps, software engineering, and technical leadership behaviors.
        </p>
      </div>

      {/* Rubric Cards */}
      <div className="space-y-4">
        {CEFR_RUBRICS.map((rubric) => (
          <div
            key={rubric.code}
            className="card p-5 space-y-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <CefrLevelBadge level={rubric.code} size="lg" />
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    {rubric.label}
                  </h4>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Targeted Career Grades: <strong className="text-zinc-700 dark:text-zinc-300">{rubric.targetGrades}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Weight: {rubric.weight.toFixed(2)}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  Score Range: {rubric.scoreRange}
                </span>
              </div>
            </div>

            {/* Global Summary */}
            <p className="text-xs text-zinc-700 dark:text-zinc-300 italic bg-zinc-50/70 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
              "{rubric.summary}"
            </p>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
              {/* Written */}
              <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-2">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  <Code2 size={13} />
                  Written & Documentation
                </div>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  {rubric.writtenBehaviors.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Spoken */}
              <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-2">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  <Users size={13} />
                  Spoken & Meeting Cadence
                </div>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  {rubric.spokenBehaviors.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Leadership & Impact */}
              <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-900/40 space-y-2">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                  <Layers size={13} />
                  Leadership & Cross-Functional
                </div>
                <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  {rubric.leadershipBehaviors.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
