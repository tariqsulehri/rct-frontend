import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Cpu,
  Play,
  Zap,
} from 'lucide-react';
import { CefrLevelCode, CompetencyKey } from '@/types/communication';
import { CEFR_COLORS } from '../../communication/CefrLevelBadge';

// --- Pure Rule Engine Logic for Test Vectors & Live Simulator ---
const WEIGHT_MAP: Record<CefrLevelCode, number> = {
  A1: 0.17,
  A2: 0.33,
  B1: 0.50,
  B2: 0.67,
  C1: 0.83,
  C2: 1.00,
};

const BANDS: Array<{ lt: number; code: CefrLevelCode }> = [
  { lt: 0.25, code: 'A1' },
  { lt: 0.415, code: 'A2' },
  { lt: 0.585, code: 'B1' },
  { lt: 0.75, code: 'B2' },
  { lt: 0.915, code: 'C1' },
  { lt: 1.01, code: 'C2' },
];

const roundHalfUp = (x: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(x * factor + (x >= 0 ? 1e-9 : -1e-9)) / factor;
};

const getBandOf = (w: number): CefrLevelCode => {
  const match = BANDS.find((b) => w < b.lt);
  return match ? match.code : 'C2';
};

const getStatusOf = (gap: number): 'BELOW' | 'MEETS' | 'ABOVE' => {
  if (gap < 0) return 'BELOW';
  if (gap === 0) return 'MEETS';
  return 'ABOVE';
};

interface SimOrgLevel {
  key: string;
  name: string;
  ordinal: number;
  expectedCefr: CefrLevelCode;
  overrides?: Partial<Record<CompetencyKey, CefrLevelCode>>;
}

const SIM_ORG_LEVELS: Record<string, SimOrgLevel> = {
  associate: {
    key: 'associate',
    name: 'Associate (G13)',
    ordinal: 1,
    expectedCefr: 'B1',
    overrides: { presentation: 'A2', stakeholder_exec: 'A2' },
  },
  engineer: {
    key: 'engineer',
    name: 'Engineer (G14)',
    ordinal: 2,
    expectedCefr: 'B1',
  },
  senior: {
    key: 'senior',
    name: 'Senior Engineer (G15)',
    ordinal: 3,
    expectedCefr: 'B2',
  },
  lead: {
    key: 'lead',
    name: 'Lead / Principal (G16)',
    ordinal: 4,
    expectedCefr: 'B2',
  },
  manager: {
    key: 'manager',
    name: 'Manager (G17)',
    ordinal: 5,
    expectedCefr: 'C1',
  },
  vp: {
    key: 'vp',
    name: 'Vice President (G20)',
    ordinal: 8,
    expectedCefr: 'C2',
  },
};

const ALL_COMPETENCY_KEYS: CompetencyKey[] = [
  'written_clarity',
  'spoken_fluency',
  'presentation',
  'active_listening',
  'stakeholder_exec',
  'cross_cultural',
];

const COMPETENCY_NAMES: Record<CompetencyKey, string> = {
  written_clarity: 'Written Clarity',
  spoken_fluency: 'Spoken Fluency',
  presentation: 'Presentation & Storytelling',
  active_listening: 'Active Listening',
  stakeholder_exec: 'Stakeholder & Exec',
  cross_cultural: 'Cross-Cultural',
};

// --- Standard Test Vector Presets ---
const PRESETS = [
  {
    id: 'TV1',
    title: 'TV1 — Senior (Mixed Ratings)',
    orgKey: 'senior',
    ratings: {
      written_clarity: 'B2',
      spoken_fluency: 'B2',
      presentation: 'B1',
      active_listening: 'B2',
      stakeholder_exec: 'B1',
      cross_cultural: 'B2',
    } as Record<CompetencyKey, CefrLevelCode | ''>,
    expectedDesc: 'Overall: 0.61 (B2), Gap: -0.06 (BELOW), Gated: true, Ready: false, Priorities: presentation, stakeholder_exec',
  },
  {
    id: 'TV2',
    title: 'TV2 — Associate (Uniform B1)',
    orgKey: 'associate',
    ratings: {
      written_clarity: 'B1',
      spoken_fluency: 'B1',
      presentation: 'B1',
      active_listening: 'B1',
      stakeholder_exec: 'B1',
      cross_cultural: 'B1',
    } as Record<CompetencyKey, CefrLevelCode | ''>,
    expectedDesc: 'Overall: 0.50 (B1), Gap: 0.00 (MEETS), Gated: false, Ready: true, Priorities: none (Overrides A2 -> +0.17 ABOVE)',
  },
  {
    id: 'TV3',
    title: 'TV3 — VP (Uniform C1)',
    orgKey: 'vp',
    ratings: {
      written_clarity: 'C1',
      spoken_fluency: 'C1',
      presentation: 'C1',
      active_listening: 'C1',
      stakeholder_exec: 'C1',
      cross_cultural: 'C1',
    } as Record<CompetencyKey, CefrLevelCode | ''>,
    expectedDesc: 'Overall: 0.83 (C1), Gap: -0.17 (BELOW expected C2), Gated: true, Ready: false, Priorities: all 6',
  },
  {
    id: 'TV4',
    title: 'TV4 — Manager (Uniform C1)',
    orgKey: 'manager',
    ratings: {
      written_clarity: 'C1',
      spoken_fluency: 'C1',
      presentation: 'C1',
      active_listening: 'C1',
      stakeholder_exec: 'C1',
      cross_cultural: 'C1',
    } as Record<CompetencyKey, CefrLevelCode | ''>,
    expectedDesc: 'Overall: 0.83 (C1), Gap: 0.00 (MEETS expected C1), Gated: true, Ready: true, Priorities: none',
  },
  {
    id: 'TV5',
    title: 'TV5 — Senior (Incomplete - 5 Ratings)',
    orgKey: 'senior',
    ratings: {
      written_clarity: 'B2',
      spoken_fluency: 'B2',
      presentation: 'B2',
      active_listening: 'B2',
      stakeholder_exec: 'B2',
      cross_cultural: '',
    } as Record<CompetencyKey, CefrLevelCode | ''>,
    expectedDesc: 'Complete: false, CommunicationReady: null (Gating suspended due to missing ratings)',
  },
];

export const CefrDocumentationTab: React.FC = () => {
  const [selectedOrgKey, setSelectedOrgKey] = useState<string>('senior');
  const [gateFromOrdinal, setGateFromOrdinal] = useState<number>(3);
  const [gatePolicy, setGatePolicy] = useState<'overall' | 'all_competencies'>('overall');

  const [ratings, setRatings] = useState<Record<CompetencyKey, CefrLevelCode | ''>>({
    written_clarity: 'B2',
    spoken_fluency: 'B2',
    presentation: 'B1',
    active_listening: 'B2',
    stakeholder_exec: 'B1',
    cross_cultural: 'B2',
  });

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedOrgKey(preset.orgKey);
      setRatings({ ...preset.ratings });
    }
  };

  // --- Run Engine Calculation ---
  const result = useMemo(() => {
    const org = SIM_ORG_LEVELS[selectedOrgKey] || SIM_ORG_LEVELS.senior;

    // Check complete
    const complete = ALL_COMPETENCY_KEYS.every((k) => Boolean(ratings[k]));
    const validRatings = ALL_COMPETENCY_KEYS.filter((k): k is CompetencyKey => Boolean(ratings[k])).map((k) => ({
      competencyKey: k,
      cefr: ratings[k] as CefrLevelCode,
    }));

    const perCompetency = validRatings.map((r) => {
      const exp = org.overrides?.[r.competencyKey] ?? org.expectedCefr;
      const actualWeight = WEIGHT_MAP[r.cefr];
      const expectedWeight = WEIGHT_MAP[exp];
      const gap = roundHalfUp(actualWeight - expectedWeight);
      return {
        competencyKey: r.competencyKey,
        cefr: r.cefr,
        expectedCefr: exp,
        gap,
        status: getStatusOf(gap),
      };
    });

    const overallWeight = validRatings.length
      ? roundHalfUp(validRatings.reduce((s, r) => s + WEIGHT_MAP[r.cefr], 0) / validRatings.length)
      : null;

    const overallCefr = overallWeight === null ? null : getBandOf(overallWeight);
    const overallExpectedWeight = WEIGHT_MAP[org.expectedCefr];
    const overallGap =
      overallWeight === null ? null : roundHalfUp(overallWeight - overallExpectedWeight);
    const overallStatus = overallGap === null ? null : getStatusOf(overallGap);

    const isGated = org.ordinal >= gateFromOrdinal;

    let communicationReady: boolean | null;
    if (!complete) {
      communicationReady = null;
    } else if (!isGated) {
      communicationReady = true;
    } else {
      communicationReady =
        gatePolicy === 'all_competencies'
          ? perCompetency.every((c) => c.gap >= 0)
          : (overallGap ?? -1) >= 0;
    }

    const developmentPriority = perCompetency
      .filter((c) => c.status === 'BELOW')
      .sort((a, b) => a.gap - b.gap)
      .map((c) => c.competencyKey);

    return {
      overallWeight,
      overallCefr,
      overallExpectedWeight,
      overallGap,
      overallStatus,
      perCompetency,
      complete,
      isGated,
      communicationReady,
      developmentPriority,
    };
  }, [selectedOrgKey, ratings, gateFromOrdinal, gatePolicy]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Banner — Clean & Streamlined */}
      <div className="bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>CEFR Communication Rule Engine Specification</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                v1.0 Deterministic Engine
              </span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
              Official architectural specification, ruleset R1–R10 definition, and live test vector calculation simulator.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Test Vector & Live Rule Engine Simulator */}
      <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-zinc-900 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Play size={16} className="text-indigo-600 dark:text-indigo-400 fill-current" />
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
              Interactive Test Vector Simulator & Calculation Engine
            </h4>
          </div>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
            Test canonical test vectors (TV1–TV5) or input custom ratings to inspect computed outputs.
          </span>
        </div>

        {/* Preset Selector Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
            Load Standard Test Vectors (§7):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                title={p.expectedDesc}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-600 hover:text-white border border-zinc-300 dark:border-zinc-700 transition-all cursor-pointer"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Org Level Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Select Career Grade (OrgLevel):
            </label>
            <select
              value={selectedOrgKey}
              onChange={(e) => setSelectedOrgKey(e.target.value)}
              className="w-full text-xs font-bold p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              {Object.values(SIM_ORG_LEVELS).map((lvl) => (
                <option key={lvl.key} value={lvl.key}>
                  {lvl.name} (Expected: {lvl.expectedCefr})
                </option>
              ))}
            </select>
          </div>

          {/* Gating Ordinal Threshold */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Gate From Ordinal Threshold:
            </label>
            <select
              value={gateFromOrdinal}
              onChange={(e) => setGateFromOrdinal(Number(e.target.value))}
              className="w-full text-xs font-bold p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              <option value={1}>G13 (All Grades Gated)</option>
              <option value={3}>G15 (Senior & Above Gated — Default)</option>
              <option value={5}>G17 (Manager & Above Gated)</option>
            </select>
          </div>

          {/* Gating Policy Mode */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Promotion Gating Policy:
            </label>
            <select
              value={gatePolicy}
              onChange={(e) => setGatePolicy(e.target.value as any)}
              className="w-full text-xs font-bold p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              <option value="overall">Overall Gap ≥ 0 (Recommended)</option>
              <option value="all_competencies">All 6 Competencies Gaps ≥ 0 (Strict)</option>
            </select>
          </div>
        </div>

        {/* 6 Competencies Assessor Input Selectors */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
            Competency Rating Inputs (Assessor Ratings):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ALL_COMPETENCY_KEYS.map((key) => {
              const currentVal = ratings[key];
              const color = currentVal ? CEFR_COLORS[currentVal] : null;

              return (
                <div key={key} className="space-y-1 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/70">
                  <div className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate" title={COMPETENCY_NAMES[key]}>
                    {COMPETENCY_NAMES[key]}
                  </div>

                  <select
                    value={currentVal}
                    onChange={(e) =>
                      setRatings((prev) => ({
                        ...prev,
                        [key]: e.target.value as CefrLevelCode | '',
                      }))
                    }
                    className={`w-full text-[11px] font-black rounded-lg px-1.5 py-1 border cursor-pointer ${
                      color ? `${color.bg} ${color.text} ${color.border}` : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-300'
                    }`}
                  >
                    <option value="">(Missing)</option>
                    <option value="A1">A1 (0.17)</option>
                    <option value="A2">A2 (0.33)</option>
                    <option value="B1">B1 (0.50)</option>
                    <option value="B2">B2 (0.67)</option>
                    <option value="C1">C1 (0.83)</option>
                    <option value="C2">C2 (1.00)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Engine Output Card */}
        <div className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-950 text-white space-y-3 shadow-inner border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
              <Zap size={14} />
              Computed AssessmentResult (Engine Output)
            </span>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                result.complete ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {result.complete ? '✓ Complete (6/6)' : '⚠️ Incomplete'}
              </span>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                result.isGated ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-700 text-zinc-300'
              }`}>
                {result.isGated ? '🛡️ Gated Grade' : 'Formative Grade'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80">
              <div className="text-[10px] text-zinc-400 font-sans">Overall Weight (R4):</div>
              <div className="text-sm font-black text-indigo-300">
                {result.overallWeight !== null ? result.overallWeight.toFixed(2) : 'null'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80">
              <div className="text-[10px] text-zinc-400 font-sans">Overall CEFR Band (R5):</div>
              <div className="text-sm font-black text-amber-300">
                {result.overallCefr ?? 'null'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80">
              <div className="text-[10px] text-zinc-400 font-sans">Overall Gap (R8):</div>
              <div className={`text-sm font-black ${
                (result.overallGap ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {result.overallGap !== null ? `${result.overallGap > 0 ? '+' : ''}${result.overallGap.toFixed(2)}` : 'null'} ({result.overallStatus ?? 'null'})
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80">
              <div className="text-[10px] text-zinc-400 font-sans">Communication Ready (R9):</div>
              <div className="text-sm font-black">
                {result.communicationReady === null ? (
                  <span className="text-zinc-400">null</span>
                ) : result.communicationReady ? (
                  <span className="text-emerald-400">true (PASSED)</span>
                ) : (
                  <span className="text-rose-400">false (GATED)</span>
                )}
              </div>
            </div>
          </div>

          {/* Development Priorities List */}
          <div className="text-xs pt-1 border-t border-zinc-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-sans font-bold text-zinc-400">
              Development Priorities Roadmap (R10):
            </span>
            {result.developmentPriority.length === 0 ? (
              <span className="text-emerald-400 font-mono text-[11px]">[] (No deficit items)</span>
            ) : (
              result.developmentPriority.map((key) => (
                <span
                  key={key}
                  className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold"
                >
                  {COMPETENCY_NAMES[key]}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ruleset R1–R10 Reference Documentation */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Cpu size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>Ruleset Specification (Rules R1 – R10)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R1 — CEFR to Weight Mapping</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Returns exact numeric constant for code: A1=0.17, A2=0.33, B1=0.50, B2=0.67, C1=0.83, C2=1.00.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R2 — Rating Input Validation</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Validates that ratings correspond to valid CEFR codes and unique competency keys without duplicates.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R3 — Assessment Completeness</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Checks if all 6 competencies are rated. If incomplete, <code className="font-mono text-xs">communicationReady</code> evaluates to <code className="font-mono text-xs">null</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R4 & R5 — Overall Weight & Band Mapping</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Computes arithmetic mean of rating weights rounded half-up to 2 decimals, then maps to the letter band via midpoint thresholds.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R6 & R7 — Target Resolution & Per-Competency Gap</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Resolves expected level (considering target overrides) and computes <code className="font-mono text-xs">gap = weight(actual) - weight(expected)</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 space-y-1.5 shadow-2xs">
            <div className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>R9 & R10 — Promotion Gating & Priorities Roadmap</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              Evaluates promotion readiness based on role ordinal threshold and orders all <code className="font-mono text-xs">BELOW</code> competencies by ascending gap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
