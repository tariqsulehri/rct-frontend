import React, { useMemo, useState } from 'react';
import { LayoutDashboard, TrendingUp, BarChart2, PieChart as PieIcon, Download, Filter, RotateCcw } from 'lucide-react';
import { PromotionReadinessTab } from './tabs/PromotionReadinessTab';
import { EmployeeResultSheetTab } from './tabs/EmployeeResultSheetTab';
import { CompetencyScoresTab } from './tabs/CompetencyScoresTab';
import { GapAnalysisTab } from './tabs/GapAnalysisTab';
import { useCompetencyMatrix, useGapMatrix, usePromotionReadiness } from '@/hooks/useReports';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from './reportFilters';
import { SkillAreaNameFilterSelect } from '@/components/filters/TaxonomyFilterSelects';

type SubTab = 'summary' | 'promotion' | 'competency' | 'gap' | 'result-sheet';

type ReportTone = {
  text: string;
  body: string;
  note: string;
  border: string;
  bg: string;
  iconBg: string;
};

const REPORT_TONES: Record<'people' | 'ready' | 'near' | 'gap' | 'area' | 'score' | 'sheet', ReportTone> = {
  people: { text: '#a78bfa', body: '#ddd6fe', note: '#c4b5fd', border: 'rgba(167,139,250,0.48)', bg: 'rgba(124,58,237,0.12)', iconBg: 'rgba(124,58,237,0.22)' },
  ready: { text: '#34d399', body: '#bbf7d0', note: '#86efac', border: 'rgba(52,211,153,0.48)', bg: 'rgba(5,150,105,0.12)', iconBg: 'rgba(5,150,105,0.22)' },
  near: { text: '#fbbf24', body: '#fde68a', note: '#fcd34d', border: 'rgba(251,191,36,0.48)', bg: 'rgba(217,119,6,0.12)', iconBg: 'rgba(217,119,6,0.22)' },
  gap: { text: '#fb7185', body: '#fecdd3', note: '#fda4af', border: 'rgba(251,113,133,0.52)', bg: 'rgba(220,38,38,0.12)', iconBg: 'rgba(220,38,38,0.22)' },
  area: { text: '#38bdf8', body: '#bae6fd', note: '#7dd3fc', border: 'rgba(56,189,248,0.48)', bg: 'rgba(2,132,199,0.12)', iconBg: 'rgba(2,132,199,0.22)' },
  score: { text: '#818cf8', body: '#c7d2fe', note: '#a5b4fc', border: 'rgba(129,140,248,0.48)', bg: 'rgba(79,70,229,0.12)', iconBg: 'rgba(79,70,229,0.22)' },
  sheet: { text: '#22d3ee', body: '#a5f3fc', note: '#67e8f9', border: 'rgba(34,211,238,0.46)', bg: 'rgba(8,145,178,0.12)', iconBg: 'rgba(8,145,178,0.22)' },
};

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
  tone: ReportTone;
}> = [
  {
    id: 'promotion',
    title: 'Readiness',
    short: 'Who is ready for the next grade?',
    details: 'Use this to see ready people, almost ready people, people who need help, and grade groups.',
    icon: TrendingUp,
    tone: REPORT_TONES.ready,
  },
  {
    id: 'competency',
    title: 'Skill Scores',
    short: 'How strong are the skills now?',
    details: 'Use this to see skill scores for each person, team averages, and skill area scores.',
    icon: BarChart2,
    tone: REPORT_TONES.score,
  },
  {
    id: 'gap',
    title: 'Skill Gaps',
    short: 'What is below target?',
    details: 'Use this to compare current score with needed score and download gaps to Excel.',
    icon: PieIcon,
    tone: REPORT_TONES.near,
  },
  {
    id: 'result-sheet',
    title: 'Person Sheet',
    short: 'What can I share for one employee?',
    details: 'Use this for one person score, gaps, skill area bars, and print view.',
    icon: Download,
    tone: REPORT_TONES.sheet,
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
          style={{ borderColor: tone.border, backgroundColor: tone.bg, boxShadow: `inset 0 1px 0 ${tone.border}` }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = tone.text;
            e.currentTarget.style.backgroundColor = tone.iconBg;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = tone.border;
            e.currentTarget.style.backgroundColor = tone.bg;
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tone.iconBg, color: tone.text }}>
              <Icon size={16} />
            </span>
            <span className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>{title}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: tone.text }}>{short}</p>
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
  const [reportFilters, setReportFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const { data: readinessRows } = usePromotionReadiness();
  const { data: gapData } = useGapMatrix();
  const { data: competencyData } = useCompetencyMatrix();

  const filterOptions = useMemo(() => {
    const departments = new Set<string>();
    const currentGrades = new Set<string>();
    const targetGrades = new Set<string>();
    const skillAreas = new Set<string>();

    for (const row of readinessRows ?? []) {
      if (row.department) departments.add(row.department);
      currentGrades.add(row.current_grade);
      targetGrades.add(row.target_grade);
    }
    for (const employee of gapData?.employees ?? []) {
      if (employee.department) departments.add(employee.department);
      currentGrades.add(employee.current_grade);
      targetGrades.add(employee.target_grade);
    }
    for (const employee of competencyData?.employees ?? []) {
      if (employee.department) departments.add(employee.department);
      currentGrades.add(employee.current_grade);
      targetGrades.add(employee.target_grade);
    }
    for (const domain of gapData?.domains ?? []) skillAreas.add(domain);
    for (const competency of competencyData?.competencies ?? []) skillAreas.add(competency.domain);

    return {
      departments: [...departments].sort(),
      currentGrades: [...currentGrades].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      targetGrades: [...targetGrades].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      skillAreas: [...skillAreas].sort(),
    };
  }, [competencyData, gapData, readinessRows]);

  const filteredReadinessRows = useMemo(() => {
    const q = reportFilters.search.trim().toLowerCase();
    return (readinessRows ?? []).filter((row) => {
      const nearReady = !row.promotion_ready && row.total_competencies > 0 && row.meets_count / row.total_competencies >= 0.75;
      const matchesSearch = !q || `${row.full_name} ${row.emp_code}`.toLowerCase().includes(q);
      const matchesDepartment = reportFilters.department === 'all' || row.department === reportFilters.department;
      const matchesCurrent = reportFilters.currentGrade === 'all' || row.current_grade === reportFilters.currentGrade;
      const matchesTarget = reportFilters.targetGrade === 'all' || row.target_grade === reportFilters.targetGrade;
      const matchesReadiness =
        reportFilters.readiness === 'all' ||
        (reportFilters.readiness === 'ready' && row.promotion_ready) ||
        (reportFilters.readiness === 'near-ready' && nearReady) ||
        (reportFilters.readiness === 'not-ready' && !row.promotion_ready && !nearReady);
      return matchesSearch && matchesDepartment && matchesCurrent && matchesTarget && matchesReadiness;
    });
  }, [readinessRows, reportFilters]);

  const filteredGapEmployees = useMemo(() => {
    const q = reportFilters.search.trim().toLowerCase();
    const readinessByCode = new Map((readinessRows ?? []).map((row) => [row.emp_code, row]));
    return (gapData?.employees ?? []).filter((employee) => {
      const readiness = readinessByCode.get(employee.emp_code);
      const nearReady = !employee.promotion_ready && employee.total_with_threshold > 0 && employee.meets_count / employee.total_with_threshold >= 0.75;
      const matchesSearch = !q || `${employee.full_name} ${employee.emp_code}`.toLowerCase().includes(q);
      const matchesDepartment = reportFilters.department === 'all' || employee.department === reportFilters.department;
      const matchesCurrent = reportFilters.currentGrade === 'all' || employee.current_grade === reportFilters.currentGrade;
      const matchesTarget = reportFilters.targetGrade === 'all' || employee.target_grade === reportFilters.targetGrade;
      const matchesReadiness =
        reportFilters.readiness === 'all' ||
        (reportFilters.readiness === 'ready' && (readiness?.promotion_ready ?? employee.promotion_ready)) ||
        (reportFilters.readiness === 'near-ready' && nearReady) ||
        (reportFilters.readiness === 'not-ready' && !(readiness?.promotion_ready ?? employee.promotion_ready) && !nearReady);
      return matchesSearch && matchesDepartment && matchesCurrent && matchesTarget && matchesReadiness;
    });
  }, [gapData, readinessRows, reportFilters]);

  const reportDecision = useMemo(() => {
    const readyCount = filteredReadinessRows.filter((row) => row.promotion_ready).length;
    const readinessRate = filteredReadinessRows.length > 0
      ? Math.round((readyCount / filteredReadinessRows.length) * 100)
      : 0;
    const nearReadyCount = filteredReadinessRows.filter((row) => !row.promotion_ready && row.total_competencies > 0 && row.meets_count / row.total_competencies >= 0.75).length;
    const criticalGaps = filteredGapEmployees.flatMap((employee) =>
      Object.entries(employee.competency_gaps ?? {})
        .filter(([, gap]) =>
          gap.threshold > 0 &&
          !gap.meets &&
          Math.abs(gap.gap) >= 0.3 &&
          (reportFilters.skillArea === 'all' || gap.domain === reportFilters.skillArea)
        )
        .map(([skill, gap]) => ({
          person: employee.full_name,
          skill,
          domain: gap.domain,
          gapPct: Math.round(Math.abs(gap.gap) * 100),
        })),
    ).sort((a, b) => b.gapPct - a.gapPct);

    const domainStats = (gapData?.domains ?? [])
      .filter((domain) => reportFilters.skillArea === 'all' || domain === reportFilters.skillArea)
      .map((domain) => {
        const values = filteredGapEmployees
          .map((employee) => employee.domain_gaps[domain]?.score ?? 0)
          .filter((score) => score > 0);
        const avg = values.length > 0 ? Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 100) : 0;
        return { domain, avg, assessed: values.length };
      })
      .filter((item) => item.assessed > 0)
      .sort((a, b) => a.avg - b.avg);

    const weakestSkillArea = domainStats[0];
    const topGap = criticalGaps[0];
    const summary = criticalGaps.length > 0
      ? `Fix ${criticalGaps.length} big skill gaps first. Start with ${topGap?.skill ?? 'the largest gap'}${topGap ? ` for ${topGap.person}` : ''}.`
      : readinessRate < 75
        ? `Improve readiness from ${readinessRate}% by helping ${nearReadyCount} near-ready people first.`
        : `Readiness is ${readinessRate}%. Keep watching weak skill areas and new assessments.`;

    return {
      people: filteredReadinessRows.length,
      readyCount,
      readinessRate,
      nearReadyCount,
      criticalGapCount: criticalGaps.length,
      weakestSkillArea,
      summary,
    };
  }, [filteredGapEmployees, filteredReadinessRows, gapData, reportFilters.skillArea]);

  const hasReportFilters = Object.entries(reportFilters).some(([key, value]) => {
    const defaultValue = DEFAULT_REPORT_FILTERS[key as keyof ReportFilters];
    return value !== defaultValue;
  });

  const updateFilter = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setReportFilters((filters) => ({ ...filters, [key]: value }));
  };

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

      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: 'rgb(var(--accent))' }} />
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Report Filters</p>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              Choose people, grades, and skill area once. All reports below use the same filters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportFilters(DEFAULT_REPORT_FILTERS)}
            disabled={!hasReportFilters}
            className="btn-ghost text-xs px-3 py-2 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={13} /> Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_170px_150px_150px_190px_150px] gap-2">
          <input
            value={reportFilters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search person or employee code..."
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
          />
          <select
            value={reportFilters.department}
            onChange={(event) => updateFilter('department', event.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
          >
            <option value="all">All departments</option>
            {filterOptions.departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select
            value={reportFilters.currentGrade}
            onChange={(event) => updateFilter('currentGrade', event.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
          >
            <option value="all">All current grades</option>
            {filterOptions.currentGrades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select
            value={reportFilters.targetGrade}
            onChange={(event) => updateFilter('targetGrade', event.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
          >
            <option value="all">All target grades</option>
            {filterOptions.targetGrades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <SkillAreaNameFilterSelect
            value={reportFilters.skillArea}
            onChange={(value) => updateFilter('skillArea', value)}
            skillAreas={filterOptions.skillAreas}
          />
          <select
            value={reportFilters.readiness}
            onChange={(event) => updateFilter('readiness', event.target.value as ReportFilters['readiness'])}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
          >
            <option value="all">All readiness</option>
            <option value="ready">Ready</option>
            <option value="near-ready">Near ready</option>
            <option value="not-ready">Needs help</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            {
              label: 'People Shown',
              value: reportDecision.people,
              detail: 'after filters',
              meaning: 'How many employees are included in the reports below.',
              effect: 'All totals and averages are calculated from only these people.',
              tone: REPORT_TONES.people,
            },
            {
              label: 'Ready',
              value: `${reportDecision.readyCount}`,
              detail: `${reportDecision.readinessRate}% ready`,
              meaning: 'People who already meet the target-grade skill requirements.',
              effect: 'A higher number means the team is closer to promotion readiness.',
              tone: REPORT_TONES.ready,
            },
            {
              label: 'Near Ready',
              value: reportDecision.nearReadyCount,
              detail: 'small gaps remain',
              meaning: 'People who are close but still missing a few requirements.',
              effect: 'These are usually the quickest wins for coaching or training.',
              tone: REPORT_TONES.near,
            },
            {
              label: 'Big Skill Gaps',
              value: reportDecision.criticalGapCount,
              detail: 'fix first',
              meaning: 'Required skill checks that are at least 30 points below target.',
              effect: 'These can block readiness and should be handled before small gaps.',
              tone: REPORT_TONES.gap,
            },
            {
              label: 'Weakest Area',
              value: reportDecision.weakestSkillArea?.domain ?? 'N/A',
              detail: reportDecision.weakestSkillArea ? `${reportDecision.weakestSkillArea.avg}% avg` : 'no data',
              meaning: 'The skill area with the lowest average current score.',
              effect: 'Use it to pick the training topic with the biggest team impact.',
              tone: REPORT_TONES.area,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-3 min-h-[142px] flex flex-col"
              style={{ borderColor: item.tone.border, backgroundColor: item.tone.bg, boxShadow: `inset 0 1px 0 ${item.tone.border}` }}
              title={`${item.label}: ${item.meaning} ${item.effect}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase" style={{ color: item.tone.text, letterSpacing: 0 }}>{item.label}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0" style={{ color: item.tone.text, backgroundColor: item.tone.iconBg }}>
                  {item.detail}
                </span>
              </div>
              <p className="text-2xl font-bold mt-2 break-words leading-tight" style={{ color: item.tone.text }}>{item.value}</p>
              <p className="text-xs mt-2 leading-snug" style={{ color: item.tone.body }}>{item.meaning}</p>
              <p className="text-[11px] mt-auto pt-2 leading-snug" style={{ color: item.tone.note }}>{item.effect}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: 'rgb(var(--accent))', backgroundColor: 'rgb(var(--accent-soft))' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--accent-txt))' }}>What To Do First</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--accent-txt))' }}>{reportDecision.summary}</p>
        </div>
      </div>

      <div className="card p-6 animate-fade-in">
        {activeTab === 'summary'    && <ReportsGuide onOpen={setActiveTab} />}
        {activeTab === 'promotion'  && <PromotionReadinessTab reportFilters={reportFilters} />}
        {activeTab === 'competency'     && <CompetencyScoresTab reportFilters={reportFilters} />}
        {activeTab === 'gap'            && <GapAnalysisTab reportFilters={reportFilters} />}
        {activeTab === 'result-sheet' && <EmployeeResultSheetTab reportFilters={reportFilters} />}
      </div>
    </div>
  );
};
