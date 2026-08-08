import React from 'react';
import { Layers, Sliders, CheckCircle2, Shield, Info } from 'lucide-react';
import { CefrLevelCode } from '@/types/communication';
import { CefrLevelBadge } from '../../communication/CefrLevelBadge';

interface CefrLevelDef {
  code: CefrLevelCode;
  ordinal: number;
  weight: number;
  label: string;
  range: string;
  targetRoles: string;
  description: string;
}

const CEFR_LEVEL_DEFS: CefrLevelDef[] = [
  {
    code: 'A1',
    ordinal: 1,
    weight: 0.17,
    label: 'Beginner / Breakthrough',
    range: '0.00 – 0.24',
    targetRoles: 'Intern / Entry Baseline',
    description: 'Basic templates, simple ticket filing, basic standup updates.',
  },
  {
    code: 'A2',
    ordinal: 2,
    weight: 0.33,
    label: 'Elementary / Basic',
    range: '0.25 – 0.41',
    targetRoles: 'Junior / Associate (G13)',
    description: 'Clear pull request descriptions, local setup guides, structured standup updates.',
  },
  {
    code: 'B1',
    ordinal: 3,
    weight: 0.50,
    label: 'Intermediate / Independent',
    range: '0.42 – 0.57',
    targetRoles: 'Engineer / Professional (G14)',
    description: 'Comprehensive feature docs, runbooks, constructive code reviews, sprint demos.',
  },
  {
    code: 'B2',
    ordinal: 4,
    weight: 0.67,
    label: 'Upper-Intermediate / Operational Lead',
    range: '0.58 – 0.74',
    targetRoles: 'Senior Engineer (G15) / Tech Lead (G16)',
    description: 'RFCs, ADRs, postmortems, incident bridges, async distributed team consensus.',
  },
  {
    code: 'C1',
    ordinal: 5,
    weight: 0.83,
    label: 'Advanced / Strategic Fluency',
    range: '0.75 – 0.91',
    targetRoles: 'Staff / Principal (G17–G18) / Manager',
    description: 'Multi-year architecture visions, governance charters, executive ARBs, keynote talks.',
  },
  {
    code: 'C2',
    ordinal: 6,
    weight: 1.00,
    label: 'Proficiency / Organizational Authority',
    range: '0.92 – 1.00',
    targetRoles: 'Director (G19) / VP / C-Level (CxO)',
    description: 'Enterprise tech strategy, board decks, global engineering culture, high-stakes negotiations.',
  },
];

interface BandThresholdDef {
  code: CefrLevelCode;
  ltWeight: number;
  displayCondition: string;
  midpointMath: string;
  assignedBand: string;
}

const BAND_THRESHOLDS: BandThresholdDef[] = [
  {
    code: 'A1',
    ltWeight: 0.25,
    displayCondition: 'overallWeight < 0.25',
    midpointMath: 'Midpoint between A1 (0.17) and A2 (0.33) = (0.17 + 0.33) / 2 = 0.25',
    assignedBand: 'A1 (Beginner)',
  },
  {
    code: 'A2',
    ltWeight: 0.415,
    displayCondition: '0.25 ≤ overallWeight < 0.415',
    midpointMath: 'Midpoint between A2 (0.33) and B1 (0.50) = (0.33 + 0.50) / 2 = 0.415',
    assignedBand: 'A2 (Elementary)',
  },
  {
    code: 'B1',
    ltWeight: 0.585,
    displayCondition: '0.415 ≤ overallWeight < 0.585',
    midpointMath: 'Midpoint between B1 (0.50) and B2 (0.67) = (0.50 + 0.67) / 2 = 0.585',
    assignedBand: 'B1 (Intermediate)',
  },
  {
    code: 'B2',
    ltWeight: 0.75,
    displayCondition: '0.585 ≤ overallWeight < 0.75',
    midpointMath: 'Midpoint between B2 (0.67) and C1 (0.83) = (0.67 + 0.83) / 2 = 0.75',
    assignedBand: 'B2 (Upper-Intermediate)',
  },
  {
    code: 'C1',
    ltWeight: 0.915,
    displayCondition: '0.75 ≤ overallWeight < 0.915',
    midpointMath: 'Midpoint between C1 (0.83) and C2 (1.00) = (0.83 + 1.00) / 2 = 0.915',
    assignedBand: 'C1 (Advanced)',
  },
  {
    code: 'C2',
    ltWeight: 1.01,
    displayCondition: 'overallWeight ≥ 0.915 (up to 1.00)',
    midpointMath: 'Open top boundary (ltWeight 1.01) capturing all scores up to maximum weight 1.00',
    assignedBand: 'C2 (Mastery / Proficiency)',
  },
];

interface CompetencyDef {
  key: string;
  name: string;
  icon: string;
  focus: string;
}

const COMPETENCY_DEFS: CompetencyDef[] = [
  {
    key: 'written_clarity',
    name: 'Written Clarity',
    icon: '📝',
    focus: 'PR descriptions, technical specifications, runbooks, RFCs, ADRs, postmortems, and async Slack/email clarity.',
  },
  {
    key: 'spoken_fluency',
    name: 'Spoken Fluency & Clarity',
    icon: '🗣️',
    focus: 'Standup updates, pair programming, sprint grooming, incident bridge management, and active verbal communication.',
  },
  {
    key: 'presentation',
    name: 'Presentation & Storytelling',
    icon: '📊',
    focus: 'Sprint demo presentations, architecture review boards, tech talks, vendor pitches, and executive briefings.',
  },
  {
    key: 'active_listening',
    name: 'Active Listening & Comprehension',
    icon: '🎧',
    focus: 'Understanding technical requirements, synthesizing feedback in code reviews, empathy, and active clarification.',
  },
  {
    key: 'stakeholder_exec',
    name: 'Stakeholder & Executive Communication',
    icon: '👔',
    focus: 'Translating deep engineering trade-offs into business value, risk management, and alignment with non-technical leaders.',
  },
  {
    key: 'cross_cultural',
    name: 'Cross-Cultural & Collaborative',
    icon: '🌐',
    focus: 'Asynchronous consensus, inclusive communication across global timezones, blameless culture, and peer mentorship.',
  },
];

export const CefrLevelsBandsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              CEFR Scale Levels & Score Band Thresholds
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              Reference constants for numerical weights (0.17 to 1.00) and midpoint score boundaries used by the deterministic rule engine.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: CEFR 6-Level Weights Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>CEFR Level Scale (6-Level Canonical Framework)</span>
          </h4>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Constant Table: cefrLevels
          </span>
        </div>

        <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold uppercase text-[9.5px] tracking-wider">
                <th className="py-2.5 px-3.5 w-[12%]">CEFR Code</th>
                <th className="py-2.5 px-3 w-[10%] text-center">Ordinal</th>
                <th className="py-2.5 px-3 w-[12%] text-center">Numerical Weight</th>
                <th className="py-2.5 px-3 w-[14%] text-center">Score Band Range</th>
                <th className="py-2.5 px-3.5 w-[22%]">Descriptor Label</th>
                <th className="py-2.5 px-3.5 w-[30%]">Typical Career Mapping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {CEFR_LEVEL_DEFS.map((lvl) => {
                return (
                  <tr
                    key={lvl.code}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <CefrLevelBadge level={lvl.code} size="md" />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      #{lvl.ordinal}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                        {lvl.weight.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                        {lvl.range}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                        {lvl.label}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {lvl.description}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-zinc-700 dark:text-zinc-300 text-xs">
                      {lvl.targetRoles}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Band Thresholds Table (Brand Thresholds) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Score Band Thresholds (Brand Boundaries)</span>
          </h4>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Constant Table: bandThresholds
          </span>
        </div>

        <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold uppercase text-[9.5px] tracking-wider">
                <th className="py-2.5 px-3.5 w-[14%]">Target CEFR</th>
                <th className="py-2.5 px-3 w-[15%] text-center">Upper Bound (ltWeight)</th>
                <th className="py-2.5 px-3.5 w-[25%]">Condition Query</th>
                <th className="py-2.5 px-3.5 w-[46%]">Midpoint Calculation & Boundary Math</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {BAND_THRESHOLDS.map((b) => {
                return (
                  <tr
                    key={b.code}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5">
                      <CefrLevelBadge level={b.code} size="md" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-black text-xs px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {b.ltWeight.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {b.displayCondition}
                    </td>
                    <td className="py-3 px-3.5 text-zinc-700 dark:text-zinc-300 text-xs">
                      {b.midpointMath}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-zinc-700 dark:text-zinc-300">
          <Info size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Deterministic Band Assignment Rule (R5):</strong> The overall weighted score <code className="font-mono text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-800 px-1 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">overallWeight</code> is evaluated against the ordered thresholds. The assigned letter grade is the first band where <code className="font-mono text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-800 px-1 py-0.5 rounded border border-indigo-200 dark:border-indigo-700">overallWeight &lt; ltWeight</code>.
          </div>
        </div>
      </div>

      {/* Section 3: 6 Assessed Communication Competencies */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>The 6 Assessed CEFR Communication Dimensions</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {COMPETENCY_DEFS.map((c) => (
            <div
              key={c.key}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.icon}</span>
                <div>
                  <div className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {c.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    key: {c.key}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {c.focus}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
