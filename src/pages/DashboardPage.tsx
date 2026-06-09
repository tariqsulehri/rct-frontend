import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Users, ClipboardCheck, BarChart2,
  Settings2, ChevronLeft, ChevronRight,
  Sun, Moon, Zap, LogOut, Bell, Search,
  TrendingUp, Activity, Info,
  Bot, Sparkles, Clock3, Target, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Legend,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, Theme } from '@/store/themeStore';
import { TeamRoster } from '@/components/TeamRoster';
import { BulkAssessmentTable } from '@/components/BulkAssessmentTable';
import { ConfigSection } from '@/components/config/ConfigSection';
import { ReportsSection } from '@/components/reports/ReportsSection';
import { usePromotionReadiness, useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { queryClient } from '@/lib/queryClient';

/* ── Types ──────────────────────────────────────────────────────────────── */

type TabType = 'overview' | 'team' | 'assessments' | 'ai' | 'reports' | 'config';

const NAV: Array<{ id: TabType; label: string; icon: React.ElementType; roles: string[] }> = [
  { id: 'overview',    label: 'Overview',     icon: LayoutDashboard, roles: ['ADMIN','MANAGER','ENGINEER'] },
  { id: 'team',        label: 'Team Roster',  icon: Users,           roles: ['ADMIN','MANAGER'] },
  { id: 'assessments', label: 'Assessments',  icon: ClipboardCheck,  roles: ['ADMIN','MANAGER','ENGINEER'] },
  { id: 'ai',          label: 'AI Insights',   icon: Bot,             roles: ['ADMIN','MANAGER'] },
  { id: 'reports',     label: 'Reports',      icon: BarChart2,       roles: ['ADMIN','MANAGER'] },
  { id: 'config',      label: 'Configuration',icon: Settings2,       roles: ['ADMIN'] },
];

const THEMES: Array<{ id: Theme; label: string; icon: React.ElementType; desc: string }> = [
  { id: 'light',    label: 'Light',    icon: Sun,  desc: 'Clean & bright' },
  { id: 'dark',     label: 'Dark',     icon: Moon, desc: 'Easy on the eyes' },
  { id: 'midnight', label: 'Midnight', icon: Zap,  desc: 'DevOps terminal' },
];

const ROLE_GRADIENT: Record<string, string> = {
  ADMIN:    'from-violet-500 to-purple-600',
  MANAGER:  'from-blue-500 to-indigo-600',
  ENGINEER: 'from-emerald-500 to-teal-600',
};

const CURRENT_ORGANIZATION = {
  name: 'tkxel',
  logoUrl: '/assets/organizations/tkxel-logo.svg',
  baseUrl: 'https://tkxel.com',
};

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <button
    type="button"
    className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
    title={text}
    aria-label={text}
  >
    <Info size={13} />
  </button>
);

/* ── Theme Switcher ─────────────────────────────────────────────────────── */

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find(t => t.id === theme)!;
  const Icon = current.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost w-9 h-9 p-0 rounded-lg flex items-center justify-center"
        title="Change theme"
      >
        <Icon size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-52 rounded-xl border shadow-elevated z-50 overflow-hidden animate-scale-in"
          style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
        >
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-3))' }}>
              Appearance
            </p>
          </div>
          {THEMES.map(({ id, label, icon: TIcon, desc }) => (
            <button
              key={id}
              onClick={() => { setTheme(id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
              style={{
                backgroundColor: theme === id ? 'rgb(var(--accent-soft))' : 'transparent',
                color: theme === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
              }}
              onMouseEnter={e => { if (theme !== id) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))'; }}
              onMouseLeave={e => { if (theme !== id) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <TIcon size={15} />
              <div>
                <p className="font-medium leading-none mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>{label}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>{desc}</p>
              </div>
              {theme === id && (
                <span className="ml-auto text-xs font-bold" style={{ color: 'rgb(var(--accent))' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Team Health Charts (ADMIN / MANAGER only) ─────────────────────────── */

const RANK_MEDALS = ['🥇','🥈','🥉'];

const TeamHealthCharts: React.FC<{ onNavigate: (t: TabType) => void }> = ({ onNavigate }) => {
  const { data: promoData } = usePromotionReadiness();
  const { data: compData  } = useCompetencyScores();
  const c = useChartColors();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const allRows = promoData ?? [];
  const allCompRows = compData ?? [];

  const hasData = allRows.some(r => r.overall_score > 0) || allCompRows.some(r => r.overall_score > 0);

  if (!hasData) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-1))' }}>No assessment data yet</p>
        <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-2))' }}>
          Start assessing team members in Team Roster. Charts populate automatically.
        </p>
        <button onClick={() => onNavigate('team')} className="btn-primary text-sm">Go to Team Roster →</button>
      </div>
    );
  }

  const gradeOptions = Array.from(new Set(allRows.map(r => r.current_grade).filter(Boolean)))
    .sort((a, b) => {
      const an = Number.parseInt(a.replace(/\D+/g, ''), 10);
      const bn = Number.parseInt(b.replace(/\D+/g, ''), 10);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      return a.localeCompare(b);
    });

  const employeeOptions = [...allRows]
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map(r => ({
      id: r.emp_code,
      label: `${r.full_name} (${r.emp_code})`,
    }));

  const rows = allRows.filter((r) => {
    if (selectedEmployeeId !== 'all') return r.emp_code === selectedEmployeeId;
    if (selectedGrade !== 'all') return r.current_grade === selectedGrade;
    return true;
  });

  const compRows = allCompRows.filter((r) => {
    if (selectedEmployeeId !== 'all') return r.emp_code === selectedEmployeeId;
    if (selectedGrade !== 'all') return r.current_grade === selectedGrade;
    return true;
  });

  const hasFilteredData = rows.some(r => r.overall_score > 0) || compRows.some(r => r.overall_score > 0);

  // ── derived data ─────────────────────────────────────────────────────────
  const readyCount = rows.filter(r => r.promotion_ready).length;
  const notReady   = rows.length - readyCount;

  const donutData = [
    { name: 'Ready',     value: readyCount, fill: c.success },
    { name: 'Not Ready', value: notReady,   fill: c.warning },
  ];

  const domains = compRows.length > 0 ? Object.keys(compRows[0].domain_scores) : [];
  const domainBars = domains
    .map((d, i) => ({
      domain:  d,
      short:   d.length > 10 ? d.slice(0,10)+'…' : d,
      avg:     Math.round((compRows.reduce((s, r) => s + (r.domain_scores[d] ?? 0), 0) / compRows.length) * 100),
      max:     Math.round(Math.max(...compRows.map(r => r.domain_scores[d] ?? 0)) * 100),
      color:   c.domains[i % c.domains.length],
    }))
    .sort((a, b) => b.avg - a.avg);

  const domainMax = Math.max(...domainBars.map(d => d.max), 10);
  const domainAxisMax = Math.ceil(domainMax * 1.25 / 5) * 5;

  const promoMap = new Map((allRows).map(r => [r.employee_id, r]));

  const topPerformers = [...rows]
    .filter(r => r.overall_score > 0)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 8)
    .map((r, i) => {
      const promo = promoMap.get(r.employee_id);
      return {
        rank:  i + 1,
        name:  r.full_name.split(' ').slice(0, 2).join(' '),
        grade: r.current_grade,
        targetGrade: promo?.target_grade ?? r.target_grade,
        score: Math.round(r.overall_score * 100),
        required: promo?.avg_threshold ? Math.round(promo.avg_threshold * 100) : null,
        ready: promo?.promotion_ready ?? false,
        meets: promo?.meets_count ?? 0,
        total: promo?.total_competencies ?? 0,
      };
    });

  const perfMax = Math.max(...topPerformers.map(d => d.score), 5);

  const activeFilterText = selectedEmployeeId !== 'all'
    ? `Resource ${selectedEmployeeId}`
    : selectedGrade !== 'all'
      ? `Grade ${selectedGrade}`
      : 'All resources';

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>View Data For</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
              Showing results for: <span className="font-semibold" style={{ color: 'rgb(var(--accent))' }}>{activeFilterText}</span>
            </p>
          </div>
          <button
            className="btn-ghost text-xs py-1.5 px-2.5"
            onClick={() => {
              setSelectedGrade('all');
              setSelectedEmployeeId('all');
            }}
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'rgb(var(--text-3))' }}>
              Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGrade(value);
                if (value !== 'all') setSelectedEmployeeId('all');
              }}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
            >
              <option value="all">All Grades</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'rgb(var(--text-3))' }}>
              Resource
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEmployeeId(value);
                if (value !== 'all') setSelectedGrade('all');
              }}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
            >
              <option value="all">All Resources</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasFilteredData && (
        <div className="card p-8 text-center">
          <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-1))' }}>No data for selected filter</p>
          <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
            Try a different grade or employee selection.
          </p>
        </div>
      )}

      {hasFilteredData && (
      <>

      {/* ── Row 1: Skill area averages (full width, multi-color) ───────── */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Skill Areas</p>
              <InfoTip text="A skill area groups related skills, such as Cloud, SRE, Security, or AI Ops." />
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
              Average team score by skill area. Best score shows the strongest individual result.
            </p>
          </div>
          <button onClick={() => onNavigate('reports')} className="btn-ghost text-xs py-1 px-2">
            Details →
          </button>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={domainBars} margin={{ top: 20, right: 16, bottom: 4, left: 0 }}
            barCategoryGap="25%">
            <XAxis dataKey="short" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, domainAxisMax]} tick={{ fontSize: 10, fill: c.text }}
              tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = domainBars.find(x => x.short === label);
                return (
                  <div style={tooltipStyle(c)}>
                    <p className="font-bold text-xs mb-1.5" style={{ color: d?.color ?? c.accent }}>{d?.domain ?? label}</p>
                    <p style={{ color: c.text }}>Team avg: <b style={{ color: d?.color }}>{payload[0]?.value}%</b></p>
                    <p style={{ color: c.text }}>Best score: <b style={{ color: c.success }}>{payload[1]?.value}%</b></p>
                  </div>
                );
              }}
              cursor={{ fill: c.grid, opacity: 0.25 }}
            />
            <Bar dataKey="avg" name="Team Avg" radius={[5,5,0,0]} maxBarSize={48}>
              {domainBars.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.85} />
              ))}
              <LabelList dataKey="avg" position="top" fontSize={10} fontWeight={600}
                formatter={(v: number) => v > 0 ? `${v}%` : ''}
                style={{ fill: c.text }} />
            </Bar>
            <Bar dataKey="max" name="Best" radius={[5,5,0,0]} maxBarSize={48} fillOpacity={0.25}>
              {domainBars.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
              <LabelList dataKey="max" position="top" fontSize={10} fontWeight={600}
                formatter={(v: number) => v > 0 ? `${v}%` : ''}
                style={{ fill: c.success }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Color legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
          {domainBars.map(d => (
            <div key={d.domain} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="text-xs" style={{ color: c.text }}>{d.domain} <b style={{ color: d.color }}>{d.avg}%</b></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: 3-column ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Readiness donut */}
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Ready For Next Grade</p>
            <InfoTip text="A person is ready when all required skills for their target grade are met." />
          </div>
          <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>{rows.length} resources total</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                paddingAngle={4} dataKey="value" strokeWidth={0}>
                {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [`${v} resources`, n]} contentStyle={tooltipStyle(c)} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-1">
            <div className="text-center">
              <p className="text-2xl font-bold leading-none" style={{ color: c.success }}>{readyCount}</p>
              <p className="text-xs mt-0.5" style={{ color: c.text }}>Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold leading-none" style={{ color: c.warning }}>{notReady}</p>
              <p className="text-xs mt-0.5" style={{ color: c.text }}>Not Ready</p>
            </div>
          </div>
        </div>

        {/* Performance Leaderboard — ranked list with inline bars */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Team Progress</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                Current score, required target, and required skills met for each resource.
              </p>
            </div>
            <InfoTip text="Achieved is the current score from approved assessments. Required is the target score. Met is how many required skills are complete." />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
            <span className="rounded-md px-2 py-1" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
              Achieved: current score
            </span>
            <span className="rounded-md px-2 py-1" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
              Required: target score
            </span>
            <span className="rounded-md px-2 py-1" style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
              Met: skills complete
            </span>
          </div>
          <div className="space-y-2">
            {topPerformers.map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-2"
                title={`${p.name}: ${p.score}% achieved, ${p.required ?? 0}% required, ${p.meets}/${p.total} target-grade skills met, ${p.grade} -> ${p.targetGrade}`}
              >
                <span className="text-sm w-5 shrink-0 text-center">
                  {p.rank <= 3 ? RANK_MEDALS[p.rank - 1] : <span style={{ color: c.text, fontSize: 11 }}>{p.rank}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{p.name}</span>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <span className="text-xs font-bold" style={{ color: p.ready ? c.success : c.warning }}>
                        Achieved {p.score}%
                      </span>
                      {p.required !== null && (
                        <>
                          <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>/</span>
                          <span className="text-xs font-semibold" style={{ color: c.text }}>
                            Required {p.required}%
                          </span>
                        </>
                      )}
                      {p.total > 0 && (
                        <>
                          <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>/</span>
                          <span className="text-xs font-semibold"
                            style={{ color: p.meets === p.total ? c.success : p.meets >= p.total * 0.75 ? c.warning : c.danger }}>
                            Met {p.meets}/{p.total}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(p.score / perfMax) * 100}%`,
                        backgroundColor: p.ready ? c.success : p.rank <= 3 ? c.accent : c.warning,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs shrink-0 font-mono" style={{ color: c.text }}>
                  {p.grade === p.targetGrade ? p.grade : `${p.grade}->${p.targetGrade}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Score distribution histogram + closest-to-target list ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Score distribution (bucket histogram) */}
        <div className="card p-5">
          <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Score Spread</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>How many resources fall into each score range.</p>
          {(() => {
            const buckets = [
              { range: '0–10%',   min: 0,   max: 0.10, color: c.danger  },
              { range: '10–20%',  min: 0.10, max: 0.20, color: c.warning },
              { range: '20–30%',  min: 0.20, max: 0.30, color: '#f59e0b' },
              { range: '30–50%',  min: 0.30, max: 0.50, color: c.accent  },
              { range: '50–75%',  min: 0.50, max: 0.75, color: '#22d3ee' },
              { range: '75–100%', min: 0.75, max: 1.01, color: c.success },
            ].map(b => ({
              ...b,
              count: rows.filter(r => r.overall_score >= b.min && r.overall_score < b.max).length,
            }));
            return (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle(c)}>
                          <p style={{ color: d.color }} className="font-bold text-xs">{d.range}</p>
                          <p style={{ color: c.text }}>{d.count} engineer{d.count !== 1 ? 's' : ''}</p>
                        </div>
                      );
                    }}
                    cursor={{ fill: c.grid, opacity: 0.25 }}
                  />
                  <Bar dataKey="count" name="Resources" radius={[5,5,0,0]} maxBarSize={48}>
                    {buckets.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Closest to target — how close each resource is to the required score */}
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Closest To Target</p>
            <InfoTip text="Shows people who are below target but closest to meeting their required score." />
          </div>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>Resources below target, sorted by smallest remaining gap.</p>
          {(() => {
            const notReadyRows = [...rows]
              .map(r => ({
                ...r,
                pct: Math.round(r.overall_score * 100),
                requiredPct: Math.round((r.avg_threshold ?? 0) * 100),
                gapPct: Math.max(0, Math.round(((r.avg_threshold ?? 0) - r.overall_score) * 100)),
              }))
              .filter(r => !r.promotion_ready && r.overall_score > 0 && r.requiredPct > 0)
              .sort((a, b) => a.gapPct - b.gapPct)
              .slice(0, 8);
            const pipeMax = Math.max(...notReadyRows.map(r => r.pct), 5);
            return (
              <div className="space-y-2">
                {notReadyRows.length === 0 ? (
                  <p className="text-sm text-center py-6" style={{ color: c.text }}>
                    No assessed resources are below target.
                  </p>
                ) : notReadyRows.map((r) => (
                  <div key={r.employee_id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate" style={{ color: 'rgb(var(--text-1))' }}>
                          {r.full_name.split(' ').slice(0,2).join(' ')}
                        </span>
                        <span className="text-xs ml-2 shrink-0" style={{ color: c.text }}>
                          {r.pct}% / {r.requiredPct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(r.pct / pipeMax) * 100}%`,
                            background: `linear-gradient(90deg, ${c.accent}, ${c.success})`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono shrink-0" style={{ color: c.danger }}>Gap {r.gapPct}%</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      </>
      )}
    </div>
  );
};

/* ── Overview Tab ───────────────────────────────────────────────────────── */

const OverviewTab: React.FC<{ user: any; onNavigate: (t: TabType) => void }> = ({ user, onNavigate }) => {
  const { data: overviewPromoData } = usePromotionReadiness();
  const { data: overviewCompData } = useCompetencyScores();
  const { data: overviewGapData } = useGapMatrix();
  const isLeader = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const leaderRows = overviewPromoData ?? [];
  const assessedLeaderRows = leaderRows.filter(r => r.overall_score > 0);
  const thresholdLeaderRows = leaderRows.filter(r => r.avg_threshold > 0);
  const leaderScore = assessedLeaderRows.length
    ? Math.round((assessedLeaderRows.reduce((sum, r) => sum + r.overall_score, 0) / assessedLeaderRows.length) * 100)
    : null;
  const leaderRequired = thresholdLeaderRows.length
    ? Math.round((thresholdLeaderRows.reduce((sum, r) => sum + r.avg_threshold, 0) / thresholdLeaderRows.length) * 100)
    : null;
  const readyCount = leaderRows.filter(r => r.promotion_ready).length;
  const needsAttention = leaderRows.filter(r => !r.promotion_ready && r.total_competencies > 0).length;
  const leaderGap = leaderScore !== null && leaderRequired !== null ? leaderScore - leaderRequired : null;

  const myCompRow = (overviewCompData ?? []).find(r => r.emp_code === user?.empCode);
  const myGapRow = (overviewGapData?.employees ?? []).find(r => r.emp_code === user?.empCode);
  const myScore = myCompRow ? Math.round(myCompRow.overall_score * 100) : null;
  const myRequired = myGapRow && myGapRow.overall_threshold > 0 ? Math.round(myGapRow.overall_threshold * 100) : null;
  const myTotal = myGapRow?.total_with_threshold ?? 0;
  const myMeets = myGapRow?.meets_count ?? 0;
  const myGap = myScore !== null && myRequired !== null ? myScore - myRequired : null;

  const stats = isLeader
    ? [
        { label: 'Team Score',      value: leaderScore !== null ? `${leaderScore}%` : 'N/A', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', help: 'Average achieved score for assessed resources.' },
        { label: 'Required Score',  value: leaderRequired !== null ? `${leaderRequired}%` : 'N/A', icon: Target,     color: 'from-amber-500 to-orange-600', help: 'Average target score expected from the selected resources.' },
        { label: 'Ready Resources', value: `${readyCount}/${leaderRows.length || 0}`,         icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', help: 'Resources that meet all required skills for their target grade.' },
        { label: 'Needs Attention', value: String(needsAttention),                            icon: AlertTriangle, color: 'from-rose-500 to-red-600', help: 'Resources with required skills still below target.' },
      ]
    : [
        { label: 'My Score',       value: myScore !== null ? `${myScore}%` : 'N/A',       icon: TrendingUp, color: 'from-blue-500 to-indigo-600', help: 'Your current score from approved skill assessments.' },
        { label: 'Required Score', value: myRequired !== null ? `${myRequired}%` : 'N/A', icon: Target,     color: 'from-amber-500 to-orange-600', help: 'The target score expected for your next grade.' },
        { label: 'Skills Met',     value: myTotal > 0 ? `${myMeets}/${myTotal}` : 'N/A',  icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', help: 'How many required skills are complete.' },
        { label: 'Status',         value: myGapRow?.promotion_ready ? 'Ready' : 'In Progress', icon: Activity, color: 'from-violet-500 to-purple-600', help: 'Ready means all target-grade skills are met.' },
      ];

  const features = [
    { id: 'team' as TabType,        icon: '👥', title: 'Team Roster',   desc: 'View people, grades, current score, required score, and gaps.', roles: ['ADMIN','MANAGER'] },
    { id: 'ai' as TabType,          icon: '🤖', title: 'AI Insights',    desc: 'Find people and skill areas that need management attention.', roles: ['ADMIN','MANAGER'] },
    { id: 'reports' as TabType,     icon: '📊', title: 'Reports',       desc: 'Answer who is ready, what is missing, and what to improve.', roles: ['ADMIN','MANAGER'] },
    { id: 'assessments' as TabType, icon: '📝', title: 'Assessments',   desc: 'Review skill progress against the target grade.',   roles: ['ADMIN','MANAGER','ENGINEER'] },
    { id: 'config' as TabType,      icon: '⚙️', title: 'Setup',         desc: 'Manage people, grades, skill groups, skills, and technologies.',       roles: ['ADMIN'] },
  ].filter(f => f.roles.includes(user?.role || ''));

  const summaryItems = isLeader
    ? [
        {
          label: 'People',
          text: leaderRows.length > 0
            ? `${readyCount} of ${leaderRows.length} resources are ready for their target grade.`
            : 'No resources found yet.',
        },
        {
          label: 'Targets',
          text: leaderGap === null
            ? 'Required score data is not available yet.'
            : leaderGap >= 0
              ? `The team is ${leaderGap} points above the required target.`
              : `The team is ${Math.abs(leaderGap)} points below the required target.`,
        },
        {
          label: 'Action',
          text: needsAttention > 0
            ? `${needsAttention} resources need attention before they are ready.`
            : 'No required skill gaps are currently flagged.',
        },
      ]
    : [
        {
          label: 'Progress',
          text: myScore !== null ? `Your current achieved score is ${myScore}%.` : 'Your achieved score is not available yet.',
        },
        {
          label: 'Target',
          text: myGap === null
            ? 'Your required target is not available yet.'
            : myGap >= 0
              ? `You are ${myGap} points above the required target.`
              : `You are ${Math.abs(myGap)} points below the required target.`,
        },
        {
          label: 'Action',
          text: myTotal > 0 ? `${myMeets} of ${myTotal} required skills are complete.` : 'No target-grade skill requirements are configured yet.',
        },
      ];

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {stats.map(({ label, value, icon: Icon, color, help }) => (
          <div key={label} className="card p-5 flex items-center gap-4 animate-slide-up">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} color="white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium uppercase tracking-wide truncate" style={{ color: 'rgb(var(--text-3))' }}>
                  {label}
                </p>
                <InfoTip text={help} />
              </div>
              <p className="text-lg font-bold mt-0.5 truncate" style={{ color: 'rgb(var(--text-1))' }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Management Summary</h3>
              <InfoTip text="A plain-language summary of people, targets, gaps, and next action." />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              People → Skills → Targets → Gaps → Action
            </p>
          </div>
          {isLeader && (
            <button onClick={() => onNavigate('reports')} className="btn-secondary text-xs">
              Open Reports <ChevronRight size={13} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl p-3 border" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>{item.label}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-1))' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-h)) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {user?.username}! 👋</h2>
            <p className="text-white/70 text-sm">
              See current scores, required targets, and where attention is needed.
            </p>
          </div>
          {isLeader && (
            <button
              onClick={() => onNavigate('team')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shrink-0"
            >
              View Team Roster <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Team health charts — ADMIN / MANAGER only */}
      {isLeader && <TeamHealthCharts onNavigate={onNavigate} />}

      {/* Feature nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
        {features.map(({ id, icon, title, desc }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="card-hover p-5 text-left group animate-slide-up"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: 'rgb(var(--accent-soft))' }}
            >
              {icon}
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--text-1))' }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Radar label tick: full text, position-aware alignment ─────────────── */
function RadarTick({ payload, x = 0, y = 0, cx = 0 }: {
  payload?: { value: string }; x?: number; y?: number; cx?: number; cy?: number;
}) {
  if (!payload) return null;
  const dx = x - (cx as number);
  const textAnchor = Math.abs(dx) < 12 ? 'middle' : dx > 0 ? 'start' : 'end';
  return (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill="#d1d5db" fontSize={11}>
      {payload.value}
    </text>
  );
}

/* ── Assessments Tab ────────────────────────────────────────────────────── */

const AssessmentsTab: React.FC<{ user: any; onNavigate: (t: TabType) => void }> = ({ user, onNavigate }) => {
  const { data: compData, isLoading } = useCompetencyScores();
  const { data: promoData }           = usePromotionReadiness();
  const { data: gapData }             = useGapMatrix();
  const c = useChartColors();
  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [showSkillEditor, setShowSkillEditor] = React.useState(false);
  const [competencySearch, setCompetencySearch] = React.useState('');
  const [competencyDomainFilter, setCompetencyDomainFilter] = React.useState('all');
  const [competencyStatusFilter, setCompetencyStatusFilter] = React.useState('all');
  const [competencyCriticalFilter, setCompetencyCriticalFilter] = React.useState('all');

  const rows = compData ?? [];
  const [selectedEmpCode, setSelectedEmpCode] = React.useState<string | null>(null);

  // Default to logged-in user; admin/manager can override via dropdown
  const effectiveEmpCode = selectedEmpCode ?? user?.empCode;
  const myRow   = rows.find(r => r.emp_code === effectiveEmpCode);
  const promoRow = (promoData ?? []).find(r => r.emp_code === effectiveEmpCode);
  const gapRow   = (gapData?.employees ?? []).find(r => r.emp_code === effectiveEmpCode);
  const formatGrade = (code?: string, title?: string) => [code, title].filter(Boolean).join(' - ') || 'N/A';
  const formatEmployeeOption = (name?: string, empCode?: string) => [name, empCode ? `ID ${empCode}` : undefined].filter(Boolean).join(' · ');
  const fromGrade = formatGrade(myRow?.current_grade, myRow?.current_grade_title);
  const toGrade = formatGrade(myRow?.target_grade, myRow?.target_grade_title);
  const selectedListRow = rows.find(r => r.emp_code === effectiveEmpCode);
  const selectedFromGrade = formatGrade(selectedListRow?.current_grade, selectedListRow?.current_grade_title);
  const selectedToGrade = formatGrade(selectedListRow?.target_grade, selectedListRow?.target_grade_title);

  const avgThreshold = promoRow && promoRow.avg_threshold > 0
    ? Math.round(promoRow.avg_threshold * 100)
    : 0;

  const domains = myRow ? Object.keys(myRow.domain_scores) : [];

  const radarData = domains.map((d, i) => {
    const score     = Math.round((myRow?.domain_scores[d] ?? 0) * 100);
    const domGap    = gapRow?.domain_gaps[d];
    const threshold = domGap && domGap.threshold > 0 ? Math.round(domGap.threshold * 100) : avgThreshold;
    return {
      domain:    d.length > 14 ? d.slice(0, 14) + '…' : d,
      fullDomain: d,
      score,
      threshold,
      meets:     threshold > 0 && score >= threshold,
      fill:      c.domains[i % c.domains.length],
    };
  });

  const barData = [...radarData].sort((a, b) => b.score - a.score);
  const competencyRows = (gapData?.competencies ?? [])
    .map((comp) => {
      const gap = gapRow?.competency_gaps?.[comp.name];
      const score = Math.round((gap?.score ?? 0) * 100);
      const threshold = Math.round((gap?.threshold ?? 0) * 100);
      const gapPct = Math.max(0, threshold - score);
      const meets = threshold > 0 && score >= threshold;

      return {
        name: comp.name,
        domain: gap?.domain ?? comp.domain,
        score,
        threshold,
        gap: gapPct,
        meets,
        hasRequirement: threshold > 0,
        isCritical: gap?.is_critical ?? comp.is_critical,
      };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name));
  const competencyDomains = Array.from(new Set(competencyRows.map(row => row.domain).filter(Boolean))).sort();
  const hasCompetencyFilters =
    competencySearch.trim() !== '' ||
    competencyDomainFilter !== 'all' ||
    competencyStatusFilter !== 'all' ||
    competencyCriticalFilter !== 'all';
  const filteredCompetencyRows = competencyRows.filter((row) => {
    const q = competencySearch.trim().toLowerCase();
    const matchesSearch = !q ||
      row.name.toLowerCase().includes(q) ||
      row.domain.toLowerCase().includes(q);
    const matchesDomain = competencyDomainFilter === 'all' || row.domain === competencyDomainFilter;
    const matchesStatus =
      competencyStatusFilter === 'all' ||
      (competencyStatusFilter === 'assessed' && row.score > 0) ||
      (competencyStatusFilter === 'unassessed' && row.score === 0) ||
      (competencyStatusFilter === 'meets' && row.hasRequirement && row.meets) ||
      (competencyStatusFilter === 'below' && row.hasRequirement && !row.meets) ||
      (competencyStatusFilter === 'no-target' && !row.hasRequirement);
    const matchesCritical =
      competencyCriticalFilter === 'all' ||
      (competencyCriticalFilter === 'critical' && row.isCritical) ||
      (competencyCriticalFilter === 'standard' && !row.isCritical);

    return matchesSearch && matchesDomain && matchesStatus && matchesCritical;
  });
  const filteredSkillDomainScores = Array.from(
    filteredCompetencyRows.reduce((acc, row) => {
      const current = acc.get(row.domain) ?? { scoreSum: 0, thresholdSum: 0, count: 0, requiredCount: 0, meetsCount: 0 };
      current.scoreSum += row.score;
      current.thresholdSum += row.threshold;
      current.count += 1;
      if (row.hasRequirement) {
        current.requiredCount += 1;
        if (row.meets) current.meetsCount += 1;
      }
      acc.set(row.domain, current);
      return acc;
    }, new Map<string, { scoreSum: number; thresholdSum: number; count: number; requiredCount: number; meetsCount: number }>()),
  ).map(([domain, value]) => ({
    domain,
    score: Math.round(value.scoreSum / value.count),
    threshold: value.requiredCount > 0 ? Math.round(value.thresholdSum / value.requiredCount) : 0,
    count: value.count,
    meetsCount: value.meetsCount,
    requiredCount: value.requiredCount,
  })).sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'rgb(var(--text-2))' }}>
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
        <span className="text-sm">Loading skill data…</span>
      </div>
    );
  }

  if (!myRow || domains.length === 0) {
    const selectedName = selectedEmpCode
      ? rows.find(r => r.emp_code === selectedEmpCode)?.full_name ?? `Resource ${selectedEmpCode}`
      : 'You';
    return (
      <div className="space-y-4 animate-slide-up">
        {isPrivileged && rows.length > 0 && (
          <div className="card p-4 flex items-center gap-3">
            <span className="text-sm font-medium shrink-0" style={{ color: 'rgb(var(--text-2))' }}>Viewing:</span>
            <div className="flex-1 min-w-0 space-y-1 sm:max-w-xl">
              <select
                className="w-full text-sm rounded-lg px-3 py-2 border outline-none"
                style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
                value={selectedEmpCode ?? user?.empCode ?? ''}
                onChange={e => setSelectedEmpCode(e.target.value)}
              >
                {rows.map(r => (
                  <option key={r.emp_code} value={r.emp_code}>
                    {formatEmployeeOption(r.full_name, r.emp_code)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="font-semibold" style={{ color: 'rgb(var(--accent-txt))' }}>From Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{selectedFromGrade}</span>
                <span style={{ color: 'rgb(var(--text-3))' }}>→</span>
                <span className="font-semibold" style={{ color: 'rgb(var(--warning))' }}>To Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{selectedToGrade}</span>
              </div>
            </div>
          </div>
        )}
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'rgb(var(--text-1))' }}>No Assessments Yet</h3>
          <p className="text-sm mb-5" style={{ color: 'rgb(var(--text-2))' }}>
            {selectedName} {selectedName === 'You' ? 'have' : 'has'} no skill assessments recorded yet.
          </p>
          {isPrivileged && (
            <button onClick={() => onNavigate('team')} className="btn-primary">
              Start Assessing Team →
            </button>
          )}
        </div>
      </div>
    );
  }

  const overallPct = Math.round((myRow?.overall_score ?? 0) * 100);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="card p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="section-title">
            {myRow?.emp_code === user?.empCode ? 'My Skill Progress' : 'Skill Progress'}
          </h2>
          <p className="section-desc mt-1">
            Current skill scores compared with the target grade.
          </p>
          {isPrivileged ? (
            <div className="flex flex-col gap-1 mt-1 w-full sm:max-w-xl">
              <select
                className="w-full text-sm rounded-lg px-3 py-1.5 border outline-none"
                style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
                value={selectedEmpCode ?? user?.empCode ?? ''}
                onChange={e => setSelectedEmpCode(e.target.value)}
              >
                {rows.map(r => (
                  <option key={r.emp_code} value={r.emp_code}>
                    {formatEmployeeOption(r.full_name, r.emp_code)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="font-semibold" style={{ color: 'rgb(var(--accent-txt))' }}>From Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
                <span style={{ color: 'rgb(var(--text-3))' }}>→</span>
                <span className="font-semibold" style={{ color: 'rgb(var(--warning))' }}>To Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
              </div>
            </div>
          ) : (
            <div className="section-desc flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{formatEmployeeOption(myRow?.full_name, myRow?.emp_code)}</span>
              <span style={{ color: 'rgb(var(--text-3))' }}>·</span>
              <span className="font-semibold" style={{ color: 'rgb(var(--accent-txt))' }}>From Grade:</span>
              <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
              <span style={{ color: 'rgb(var(--text-3))' }}>→</span>
              <span className="font-semibold" style={{ color: 'rgb(var(--warning))' }}>To Grade:</span>
              <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <p className="text-3xl font-bold" style={{ color: avgThreshold > 0 ? (overallPct >= avgThreshold ? 'rgb(var(--success))' : 'rgb(var(--danger))') : 'rgb(var(--accent))' }}>
                {overallPct}%
              </p>
              {avgThreshold > 0 && (
                <>
                  <span className="text-base font-medium" style={{ color: 'rgb(var(--text-3))' }}>/</span>
                  <span className="text-base font-semibold" style={{ color: 'rgb(var(--text-2))' }}>{avgThreshold}%</span>
                </>
              )}
            </div>
            <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
              {avgThreshold > 0 ? 'Achieved / Required' : 'Achieved Score'}
            </p>
          </div>
          {isPrivileged && (
            <button onClick={() => onNavigate('reports')} className="btn-secondary text-xs">
              Full Reports →
            </button>
          )}
        </div>
      </div>

      {/* KPI strip — status, meets, stars, required */}
      {promoRow && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Readiness</p>
              <InfoTip text="Ready means all required skills for the target grade are met." />
            </div>
            <p className="text-sm font-bold" style={{ color: promoRow.promotion_ready ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
              {promoRow.promotion_ready ? '✓ Ready' : '⟳ In Progress'}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Skills Met</p>
              <InfoTip text="How many required skills are complete for the target grade." />
            </div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
              {promoRow.total_competencies === 0 ? 'N/A' : `${promoRow.meets_count} / ${promoRow.total_competencies}`}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Rating</p>
              <InfoTip text="A quick visual rating based on the achieved score." />
            </div>
            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {'★'.repeat(promoRow.star_rating)}{'☆'.repeat(Math.max(0, 5 - promoRow.star_rating))}
            </p>
          </div>
          <div className="card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Target Score</p>
              <InfoTip text="The required score expected for the selected target grade." />
            </div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--warning))' }}>
              {avgThreshold > 0 ? `${avgThreshold}%` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="card p-6">
          <div className="mb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                Skill Area Coverage
              </p>
              <InfoTip text="Shows how strong this person is in each skill area." />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              How strong this person is in each skill area.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} outerRadius="68%" margin={{ top: 24, right: 110, bottom: 24, left: 110 }}>
              <PolarGrid stroke={c.grid} />
              <PolarAngleAxis dataKey="fullDomain" tick={<RadarTick />} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={v => `${v}%`} angle={30} />
              <Radar name="Score" dataKey="score" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2} />
              {avgThreshold > 0 && (
                <Radar name={`Required (${avgThreshold}%)`} dataKey="threshold"
                  stroke={c.warning} fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={tooltipStyle(c)}>
                      <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{d.fullDomain ?? d.domain}</p>
                      <p style={{ color: c.text }}>Score: {d.score}%</p>
                      {d.threshold > 0 && (
                        <p style={{ color: d.meets ? c.success : c.danger }}>
                          Required: {d.threshold}% ({d.meets ? '✓ Meets' : '✗ Below'})
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {avgThreshold > 0 && (
                <Legend iconType="circle" iconSize={10}
                  formatter={(v) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{v}</span>} />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar breakdown */}
        <div className="card p-5">
          <div className="mb-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                Score by Skill Area
              </p>
              <InfoTip text="Compares achieved score with the required target for each skill area." />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(260, barData.length * 34)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 52, top: 16, bottom: 0 }} barCategoryGap="30%">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: c.text }}
                tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="domain" width={110}
                tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={tooltipStyle(c)}>
                      <p className="font-semibold text-xs mb-1" style={{ color: d.meets ? c.success : (d.threshold > 0 ? c.danger : c.accent) }}>
                        {d.fullDomain ?? d.domain}
                      </p>
                      <p style={{ color: c.text }}>Achieved: <b>{d.score}%</b></p>
                      {d.threshold > 0 && (
                        <>
                          <p style={{ color: c.warning }}>Required: {d.threshold}%</p>
                          <p style={{ color: d.meets ? c.success : c.danger }}>
                            {d.meets ? '✓ Meets target' : `✗ Gap: ${d.threshold - d.score}%`}
                          </p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              {/* Achieved bar */}
              <Bar dataKey="score" name="Achieved" radius={[0, 5, 5, 0]} maxBarSize={10}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={
                    d.threshold > 0
                      ? (d.meets ? c.success : c.danger)
                      : (d.score >= 75 ? c.success : d.score >= 40 ? c.warning : c.danger)
                  } />
                ))}
                <LabelList dataKey="score" position="right" formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 10, fill: c.text }} />
              </Bar>
              {/* Required bar — thin amber bar when threshold data exists */}
              {avgThreshold > 0 && (
                <Bar dataKey="threshold" name="Required" radius={[0, 4, 4, 0]} maxBarSize={4} fill={c.warning} fillOpacity={0.55}>
                  <LabelList dataKey="threshold" position="right"
                    formatter={(v: number) => v > 0 ? `${v}%` : ''}
                    style={{ fontSize: 9, fill: c.warning }} />
                </Bar>
              )}
              {/* Dashed vertical line — label pinned above bars to avoid overlap */}
              {avgThreshold > 0 && (
                <ReferenceLine
                  x={avgThreshold}
                  stroke={c.warning}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: `Required: ${avgThreshold}%`, position: 'top', fill: c.warning, fontSize: 9, fontWeight: 600 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-2 justify-end flex-wrap">
            {(avgThreshold > 0
              ? [['Meets Required', c.success], ['Below Required', c.danger], ['Required', c.warning]] as [string, string][]
              : [['≥75% Proficient', c.success], ['≥40% Developing', c.warning], ['<40% Gap', c.danger]] as [string, string][]
            ).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs" style={{ color: c.text }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full competency progress */}
      {competencyRows.length > 0 && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                  All Competencies
                </p>
                <InfoTip text="Shows every competency for the selected target grade, including zero scores." />
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                Complete competency-level view for the selected resource.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
                style={{ color: 'rgb(var(--accent-txt))', backgroundColor: 'rgb(var(--accent-soft))' }}>
                {filteredCompetencyRows.length} / {competencyRows.length}
              </span>
              {promoRow && (
                <span className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
                  style={{ color: 'rgb(var(--success))', backgroundColor: 'rgb(var(--success-soft))' }}>
                  {promoRow.meets_count} / {promoRow.total_competencies} met
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 border"
              style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
              <Search size={14} style={{ color: 'rgb(var(--text-3))' }} />
              <input
                value={competencySearch}
                onChange={e => setCompetencySearch(e.target.value)}
                placeholder="Search competencies..."
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
                style={{ color: 'rgb(var(--text-1))' }}
              />
              {competencySearch && (
                <button onClick={() => setCompetencySearch('')} className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'rgb(var(--text-3))' }}>x</button>
              )}
            </div>
            <select
              value={competencyDomainFilter}
              onChange={e => setCompetencyDomainFilter(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 border outline-none"
              style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
            >
              <option value="all">All skill areas</option>
              {competencyDomains.map(domain => <option key={domain} value={domain}>{domain}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={competencyStatusFilter}
                onChange={e => setCompetencyStatusFilter(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border outline-none"
                style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
              >
                <option value="all">All statuses</option>
                <option value="assessed">Assessed</option>
                <option value="unassessed">Unassessed</option>
                <option value="meets">Meets</option>
                <option value="below">Below</option>
                <option value="no-target">No target</option>
              </select>
              <select
                value={competencyCriticalFilter}
                onChange={e => setCompetencyCriticalFilter(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border outline-none"
                style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
              >
                <option value="all">All types</option>
                <option value="critical">Critical</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>
          {hasCompetencyFilters && (
            <div className="flex justify-end mb-4">
              <button
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => {
                  setCompetencySearch('');
                  setCompetencyDomainFilter('all');
                  setCompetencyStatusFilter('all');
                  setCompetencyCriticalFilter('all');
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredSkillDomainScores.length > 0 && (
            <div className="mb-4 grid gap-2.5"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              {filteredSkillDomainScores.map((domainScore, idx) => {
                const meetsDomain = domainScore.threshold > 0 && domainScore.score >= domainScore.threshold;
                const nearDomain = domainScore.threshold > 0 && !meetsDomain && domainScore.threshold - domainScore.score <= 10;
                const color = domainScore.threshold > 0
                  ? (meetsDomain ? c.success : nearDomain ? c.warning : c.danger)
                  : c.domains[idx % c.domains.length];
                const statusLabel = domainScore.requiredCount > 0
                  ? `${domainScore.meetsCount}/${domainScore.requiredCount} met`
                  : `${domainScore.count} comp${domainScore.count !== 1 ? 's' : ''}`;
                const statusBg = domainScore.threshold > 0
                  ? (meetsDomain ? 'rgb(var(--success-soft))' : nearDomain ? 'rgb(var(--warning-soft))' : 'rgb(var(--danger-soft))')
                  : 'rgb(var(--surface-3))';
                return (
                  <div key={domainScore.domain} className="rounded-lg border px-3 py-2.5 min-h-[82px]"
                    style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xs font-semibold leading-snug min-w-0"
                        style={{
                          color: 'rgb(var(--text-1))',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={domainScore.domain}
                      >
                        {domainScore.domain}
                      </p>
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                        style={{ color, backgroundColor: statusBg }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold leading-none" style={{ color }}>
                          {domainScore.score}%
                        </span>
                        {domainScore.threshold > 0 && (
                          <>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>/</span>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
                              {domainScore.threshold}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium leading-snug">
                        <span style={{ color: 'rgb(var(--text-2))' }}>
                          {domainScore.threshold > 0 ? 'Achieved / Required' : 'Achieved'}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(domainScore.score, 100)}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr style={{ color: 'rgb(var(--text-3))' }}>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 pr-3">Competency</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 px-3">Skill Area</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Achieved</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Required</th>
                  <th className="text-right text-xs font-semibold uppercase tracking-wide py-2 px-3">Gap</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 pl-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetencyRows.map((row) => {
                  const rowColor = row.hasRequirement
                    ? (row.meets ? c.success : c.danger)
                    : c.text;
                  return (
                    <tr key={row.name} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                      <td className="py-3 pr-3 align-top">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate" style={{ color: 'rgb(var(--text-1))' }} title={row.name}>
                            {row.name}
                          </span>
                          {row.isCritical && (
                            <span className="text-[10px] font-bold uppercase rounded-full px-1.5 py-0.5 shrink-0"
                              style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}>
                              Critical
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(row.score, 100)}%`, backgroundColor: rowColor }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top" style={{ color: 'rgb(var(--text-2))' }}>
                        {row.domain}
                      </td>
                      <td className="py-3 px-3 text-right align-top font-semibold" style={{ color: rowColor }}>
                        {row.score}%
                      </td>
                      <td className="py-3 px-3 text-right align-top" style={{ color: row.hasRequirement ? c.warning : 'rgb(var(--text-3))' }}>
                        {row.hasRequirement ? `${row.threshold}%` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right align-top" style={{ color: row.gap > 0 ? c.danger : 'rgb(var(--text-3))' }}>
                        {row.hasRequirement ? `${row.gap}%` : 'N/A'}
                      </td>
                      <td className="py-3 pl-3 align-top">
                        <span className="text-xs font-semibold rounded-full px-2 py-1"
                          style={{
                            color: row.hasRequirement ? (row.meets ? c.success : c.danger) : 'rgb(var(--text-3))',
                            backgroundColor: row.hasRequirement
                              ? (row.meets ? 'rgb(var(--success-soft))' : 'rgb(var(--danger-soft))')
                              : 'rgb(var(--surface-2))',
                          }}>
                          {!row.hasRequirement ? 'No target' : row.meets ? 'Meets' : 'Below'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCompetencyRows.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: 'rgb(var(--text-3))' }}>
                No competencies match the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engineers: manage their own skill list */}
      {!isPrivileged && user?.empCode && (
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm" style={{ color: 'rgb(var(--text-1))' }}>My Skills</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
              Add or update your skills &amp; technologies. Your manager will set proficiency levels.
              Your saved rows appear as pending until approved.
            </p>
          </div>
          <button onClick={() => setShowSkillEditor(true)} className="btn-primary text-xs shrink-0">
            Manage My Skills
          </button>
        </div>
      )}

      {/* Skill editor modal for engineers */}
      {showSkillEditor && user?.empCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSkillEditor(false); }}
        >
          <div
            className="w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-elevated overflow-hidden flex flex-col"
            style={{ backgroundColor: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}
          >
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <BulkAssessmentTable
                employeeId={user.empCode}
                employeeName={user.username}
                readOnlyLevel
                onSuccess={() => {}}
                onClose={() => setShowSkillEditor(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── AI Insights Tab ────────────────────────────────────────────────────── */

type AiPriority = 'critical' | 'warning' | 'positive' | 'neutral';

const priorityStyles = (priority: AiPriority, c: ReturnType<typeof useChartColors>) => {
  if (priority === 'critical') return { color: c.danger, bg: 'rgb(var(--danger-soft))', icon: AlertTriangle };
  if (priority === 'warning') return { color: c.warning, bg: 'rgb(var(--warning-soft))', icon: Target };
  if (priority === 'positive') return { color: c.success, bg: 'rgb(var(--success-soft))', icon: CheckCircle2 };
  return { color: c.accent, bg: 'rgb(var(--accent-soft))', icon: Sparkles };
};

const AIInsightsTab: React.FC<{ onNavigate: (t: TabType) => void }> = ({ onNavigate }) => {
  const { data: promoData, isLoading: promoLoading } = usePromotionReadiness();
  const { data: compData, isLoading: compLoading } = useCompetencyScores();
  const { data: gapData, isLoading: gapLoading } = useGapMatrix();
  const c = useChartColors();
  const [focus, setFocus] = useState<'executive' | 'risk' | 'skills' | 'readiness'>('executive');
  const [analysisTime, setAnalysisTime] = useState(() => new Date());

  const rows = promoData ?? [];
  const compRows = compData ?? [];
  const gapRows = gapData?.employees ?? [];
  const isLoading = promoLoading || compLoading || gapLoading;

  const analysis = React.useMemo(() => {
    const assessedRows = rows.filter((r) => r.overall_score > 0);
    const readyCount = rows.filter((r) => r.promotion_ready).length;
    const avgAchieved = assessedRows.length
      ? assessedRows.reduce((sum, r) => sum + r.overall_score, 0) / assessedRows.length
      : 0;
    const thresholdRows = rows.filter((r) => r.avg_threshold > 0);
    const avgRequired = thresholdRows.length
      ? thresholdRows.reduce((sum, r) => sum + r.avg_threshold, 0) / thresholdRows.length
      : 0;
    const readinessRate = rows.length ? readyCount / rows.length : 0;

    const domainNames = compRows.length > 0 ? Object.keys(compRows[0].domain_scores) : [];
    const domainAverages = domainNames.map((domain, i) => {
      const values = compRows.map((r) => r.domain_scores[domain] ?? 0).filter((score) => score > 0);
      const avg = values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : 0;
      return { domain, avg, assessed: values.length, color: c.domains[i % c.domains.length] };
    }).sort((a, b) => a.avg - b.avg);

    const riskPeople = [...rows]
      .filter((r) => !r.promotion_ready && r.total_competencies > 0)
      .map((r) => ({
        ...r,
        gap: Math.max(0, (r.avg_threshold || 0) - r.overall_score),
        meetsRate: r.meets_count / Math.max(1, r.total_competencies),
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 5);

    const nearReady = [...rows]
      .filter((r) => !r.promotion_ready && r.total_competencies > 0)
      .map((r) => ({ ...r, meetsRate: r.meets_count / Math.max(1, r.total_competencies) }))
      .filter((r) => r.meetsRate >= 0.7)
      .sort((a, b) => b.meetsRate - a.meetsRate)
      .slice(0, 5);

    const blockers = gapRows.flatMap((employee) =>
      Object.entries(employee.competency_gaps ?? {})
        .filter(([, gap]) => gap.threshold > 0 && !gap.meets)
        .map(([competency, gap]) => ({
          employee: employee.full_name,
          competency,
          domain: gap.domain,
          gap: Math.abs(gap.gap),
          score: gap.score,
          threshold: gap.threshold,
        })),
    ).sort((a, b) => b.gap - a.gap).slice(0, 6);

    const suggestions: Array<{ title: string; body: string; priority: AiPriority }> = [];
    if (rows.length === 0) {
      suggestions.push({
        title: 'No team dataset available',
        body: 'Load readiness data before the AI panel can produce meaningful recommendations.',
        priority: 'neutral',
      });
    } else {
      suggestions.push({
        title: `${Math.round(readinessRate * 100)}% next-grade readiness`,
        body: `${readyCount} of ${rows.length} resources are ready. Average achieved is ${Math.round(avgAchieved * 100)}% against ${avgRequired > 0 ? `${Math.round(avgRequired * 100)}% required` : 'no configured required baseline'}.`,
        priority: readinessRate >= 0.75 ? 'positive' : readinessRate >= 0.45 ? 'warning' : 'critical',
      });
    }

    const weakestDomain = domainAverages.find((d) => d.assessed > 0);
    if (weakestDomain) {
      suggestions.push({
        title: `Lowest skill area: ${weakestDomain.domain}`,
        body: `Team average is ${Math.round(weakestDomain.avg * 100)}% across ${weakestDomain.assessed} assessed resources. Prioritize this area for enablement plans and project assignment.`,
        priority: weakestDomain.avg < 0.4 ? 'critical' : weakestDomain.avg < 0.6 ? 'warning' : 'neutral',
      });
    }

    if (riskPeople.length > 0) {
      const r = riskPeople[0];
      suggestions.push({
        title: `Highest readiness gap: ${r.full_name}`,
        body: `${r.full_name} is ${Math.round(r.gap * 100)} points below the current required benchmark and meets ${r.meets_count}/${r.total_competencies} required skills.`,
        priority: 'critical',
      });
    }

    if (nearReady.length > 0) {
      suggestions.push({
        title: `${nearReady.length} near-ready resources`,
        body: `These people already meet at least 70% of required skills. A focused plan can move them into ready status quickly.`,
        priority: 'positive',
      });
    }

    return {
      avgAchieved,
      avgRequired,
      readinessRate,
      readyCount,
      domainAverages,
      riskPeople,
      nearReady,
      blockers,
      suggestions,
    };
  }, [rows, compRows, gapRows, c.domains]);

  const lowDomains = analysis.domainAverages.filter((d) => d.assessed > 0).slice(0, 6);
  const highDomains = [...analysis.domainAverages].filter((d) => d.assessed > 0).sort((a, b) => b.avg - a.avg).slice(0, 4);
  const maxDomain = Math.max(...lowDomains.map((d) => d.avg), 0.1);

  if (isLoading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center py-12 gap-3" style={{ color: 'rgb(var(--text-2))' }}>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
          <span className="text-sm">Analyzing readiness data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}>
              <Bot size={22} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'rgb(var(--text-1))' }}>AI Insights Dashboard</p>
              <p className="text-sm mt-1 max-w-2xl" style={{ color: 'rgb(var(--text-2))' }}>
                Conversational analytics panel using readiness, skill area, and gap data to highlight risks, strengths, and next actions.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                <Clock3 size={13} />
                <span>Last analyzed {analysisTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary text-sm inline-flex items-center gap-2"
            onClick={() => setAnalysisTime(new Date())}
          >
            <Sparkles size={14} /> Re-analyze
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Avg Achieved', value: `${Math.round(analysis.avgAchieved * 100)}%`, color: c.accent },
          { label: 'Avg Required', value: analysis.avgRequired > 0 ? `${Math.round(analysis.avgRequired * 100)}%` : 'N/A', color: c.warning },
          { label: 'Ready Resources', value: `${analysis.readyCount}/${rows.length}`, color: c.success },
          { label: 'Near Ready', value: analysis.nearReady.length, color: c.warning },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1 leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['executive', 'Executive View'],
          ['risk', 'Risk'],
          ['skills', 'Skill Areas'],
          ['readiness', 'Readiness'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFocus(id as typeof focus)}
            className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              borderColor: focus === id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
              backgroundColor: focus === id ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
              color: focus === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>AI Suggestions</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Prioritized observations generated from current dashboard data.</p>
            </div>
            <button type="button" onClick={() => onNavigate('reports')} className="btn-ghost text-xs px-3 py-2">
              Open Reports
            </button>
          </div>
          <div className="space-y-3">
            {analysis.suggestions.map((item) => {
              const style = priorityStyles(item.priority, c);
              const Icon = style.icon;
              return (
                <div key={item.title} className="rounded-xl border p-4 flex gap-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.title}</p>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>Ask the Data</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
            Select an angle to change the recommendations.
          </p>
          <div className="space-y-2">
            {[
              { id: 'executive', q: 'What is the overall readiness story?' },
              { id: 'risk', q: 'Who needs immediate intervention?' },
              { id: 'skills', q: 'Which skill areas are weakest?' },
              { id: 'readiness', q: 'Who can become ready fastest?' },
            ].map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => setFocus(prompt.id as typeof focus)}
                className="w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors"
                style={{
                  borderColor: focus === prompt.id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                  backgroundColor: focus === prompt.id ? 'rgb(var(--accent-soft))' : 'transparent',
                  color: focus === prompt.id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                }}
              >
                {prompt.q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>Weakest Skill Areas</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>Lowest assessed skill area averages across the visible team.</p>
          <div className="space-y-3">
            {lowDomains.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>No skill area scores available yet.</p>
            ) : lowDomains.map((d) => (
              <div key={d.domain}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold truncate pr-2" style={{ color: 'rgb(var(--text-1))' }}>{d.domain}</span>
                  <span style={{ color: 'rgb(var(--text-2))' }}>{Math.round(d.avg * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, (d.avg / maxDomain) * 100)}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>Critical Gaps</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>Largest skill gaps against target-grade requirements.</p>
          <div className="space-y-3">
            {analysis.blockers.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>No critical blockers found.</p>
            ) : analysis.blockers.map((b) => (
              <div
                key={`${b.employee}-${b.competency}`}
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'rgba(248, 113, 113, 0.28)',
                  backgroundColor: 'rgba(127, 29, 29, 0.18)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{b.competency}</p>
                  <span className="text-xs font-bold shrink-0" style={{ color: c.danger }}>-{Math.round(b.gap * 100)} pts</span>
                </div>
                <p className="text-xs mt-1 truncate" style={{ color: 'rgb(var(--text-2))' }}>{b.employee} · {b.domain}</p>
                <p className="text-[11px] mt-1 font-semibold" style={{ color: 'rgb(var(--warning))' }}>
                  {Math.round(b.score * 100)}% current / {Math.round(b.threshold * 100)}% required
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {highDomains.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-bold mb-4" style={{ color: 'rgb(var(--text-1))' }}>Strengths to Reuse</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {highDomains.map((d) => (
              <div key={d.domain} className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--success-soft))' }}>
                <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{d.domain}</p>
                <p className="text-xl font-bold mt-1" style={{ color: c.success }}>{Math.round(d.avg * 100)}%</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>Use mentors from this area for weaker skill areas.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────────────────────── */

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role || ''));

  const handleLogout = () => {
    logout();
    queryClient.clear();
    window.location.href = '/login';
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const gradient = ROLE_GRADIENT[user?.role ?? ''] ?? 'from-gray-500 to-gray-600';
  const isTeamTab = activeTab === 'team' && (user?.role === 'ADMIN' || user?.role === 'MANAGER');

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg))' }}>

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
      <header
        className="glass shrink-0 z-40 border-b"
        style={{ borderColor: 'rgb(var(--border))' }}
      >
        <div className="flex items-center h-14 px-4 gap-3">

          {/* Sidebar toggle + brand */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="btn-ghost w-8 h-8 p-0 rounded-lg flex items-center justify-center"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <a
            href={CURRENT_ORGANIZATION.baseUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 mr-4 rounded-lg"
            title={CURRENT_ORGANIZATION.baseUrl}
          >
            <img
              src={CURRENT_ORGANIZATION.logoUrl}
              alt={`${CURRENT_ORGANIZATION.name} logo`}
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm" style={{ color: 'rgb(var(--text-1))' }}>
                {CURRENT_ORGANIZATION.name}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'rgb(var(--text-3))' }}>
                DevOps Skills Readiness
              </span>
            </div>
          </a>

          {/* Search bar */}
          <div
            className="flex-1 max-w-xs hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 border text-sm"
            style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}
          >
            <Search size={13} style={{ color: 'rgb(var(--text-3))' }} />
            <span style={{ color: 'rgb(var(--text-3))' }}>Search…</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="btn-ghost w-9 h-9 p-0 rounded-lg flex items-center justify-center relative">
              <Bell size={16} />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse-dot"
                style={{ backgroundColor: 'rgb(var(--accent))' }}
              />
            </button>

            <ThemeSwitcher />

            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold ml-1`}
            >
              {initials}
            </div>

            <div className="hidden sm:block ml-1">
              <p className="text-xs font-semibold leading-none" style={{ color: 'rgb(var(--text-1))' }}>
                {user?.username}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                {user?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost w-9 h-9 p-0 rounded-lg flex items-center justify-center ml-1"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside
          className="shrink-0 flex flex-col border-r overflow-hidden transition-all duration-200"
          style={{
            width: sidebarOpen ? '220px' : '60px',
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
          }}
        >
          <nav className="flex-1 p-2 space-y-0.5 pt-3">
            {visibleNav.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={!sidebarOpen ? label : undefined}
                  className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                  style={{
                    backgroundColor: active ? 'rgb(var(--accent-soft))' : 'transparent',
                    color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon
                    size={17}
                    style={{ color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-2))', flexShrink: 0 }}
                  />
                  {sidebarOpen && (
                    <span className="truncate" style={{ color: active ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))' }}>
                      {label}
                    </span>
                  )}
                  {active && sidebarOpen && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgb(var(--accent))' }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom profile */}
          <div
            className="p-2 border-t"
            style={{ borderColor: 'rgb(var(--border))' }}
          >
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
              style={{ backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {initials}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                    {user?.username}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>
                    {user?.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <main className={`flex-1 ${isTeamTab ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={isTeamTab ? 'h-full w-full p-6' : 'max-w-6xl mx-auto p-6'}>

            {activeTab === 'overview' && (
              <OverviewTab user={user} onNavigate={setActiveTab} />
            )}

            {activeTab === 'team' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="card p-6 h-full w-full animate-slide-up flex flex-col overflow-hidden">
                <TeamRoster />
              </div>
            )}

            {activeTab === 'assessments' && <AssessmentsTab user={user} onNavigate={setActiveTab} />}

            {activeTab === 'ai' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <AIInsightsTab onNavigate={setActiveTab} />
            )}

            {activeTab === 'reports' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="animate-slide-up">
                <ReportsSection />
              </div>
            )}

            {activeTab === 'config' && user?.role === 'ADMIN' && (
              <div className="animate-slide-up">
                <ConfigSection />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
