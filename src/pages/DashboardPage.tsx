import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, Users, ClipboardCheck, BarChart2,
  Settings2, ChevronLeft, ChevronRight,
  Sun, Moon, Zap, LogOut, Bell, Search,
  TrendingUp, Activity, Info,
  Bot, Sparkles, Clock3, Target, AlertTriangle, CheckCircle2,
  MessageSquare, Send, UserRound,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Legend,
} from 'recharts';
import { useAuthStore, type User } from '@/store/authStore';
import { useThemeStore, Theme } from '@/store/themeStore';
import { TeamRoster } from '@/components/TeamRoster';
import { BulkAssessmentTable } from '@/components/BulkAssessmentTable';
import { PendingApprovalsPanel } from '@/components/PendingApprovalsPanel';
import { ConfigSection } from '@/components/config/ConfigSection';
import { ReportsSection } from '@/components/reports/ReportsSection';
import { SkillAreaNameFilterSelect } from '@/components/filters/TaxonomyFilterSelects';
import { usePromotionReadiness, useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { useAiChat, useAiDashboard, type AiChatResponse, type AiFocus, type AiPriority } from '@/hooks/useAiDashboard';
import {
  useConfigAssessmentLevels,
  useConfigAssessmentProjects,
  useConfigAssessmentStatuses,
  useConfigAssessmentTypes,
  useConfigCompetencies,
  useConfigDepartments,
  useConfigEmployees,
  useConfigGrades,
  useConfigSkillDomains,
  useConfigTechnologies,
  useConfigUsers,
} from '@/hooks/useConfig';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { queryClient } from '@/lib/queryClient';
import apiClient from '@/lib/api';
import { hasPermission, isLeaderRole, type PermissionCode, type RoleCode } from '@/types/rbac';

/* ── Types ──────────────────────────────────────────────────────────────── */

type TabType = 'admin' | 'overview' | 'team' | 'assessments' | 'ai' | 'reports' | 'config';

const LEADERS: RoleCode[] = ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER'];

const NAV: Array<{ id: TabType; label: string; icon: React.ElementType; roles: RoleCode[]; permission?: PermissionCode }> = [
  { id: 'admin',       label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { id: 'overview',    label: 'Overview',     icon: LayoutDashboard, roles: ['TOP_MANAGEMENT','MANAGER','LINE_MANAGER','ENGINEER'] },
  { id: 'team',        label: 'Team Roster',  icon: Users,           roles: LEADERS },
  { id: 'assessments', label: 'Assessments',  icon: ClipboardCheck,  roles: ['ADMIN','TOP_MANAGEMENT','MANAGER','LINE_MANAGER','ENGINEER'] },
  { id: 'ai',          label: 'AI Dashboard',  icon: Bot,             roles: LEADERS },
  { id: 'reports',     label: 'Reports',      icon: BarChart2,       roles: LEADERS, permission: 'reports.view' },
  { id: 'config',      label: 'Setup',        icon: Settings2,       roles: ['ADMIN'] },
];

const THEMES: Array<{ id: Theme; label: string; icon: React.ElementType; desc: string }> = [
  { id: 'light',    label: 'Light',    icon: Sun,  desc: 'Clean & bright' },
  { id: 'dark',     label: 'Dark',     icon: Moon, desc: 'Easy on the eyes' },
  { id: 'midnight', label: 'Midnight', icon: Zap,  desc: 'DevOps terminal' },
];

const ROLE_GRADIENT: Record<string, string> = {
  ADMIN:    'from-violet-500 to-purple-600',
  TOP_MANAGEMENT: 'from-sky-500 to-blue-600',
  MANAGER:  'from-blue-500 to-indigo-600',
  LINE_MANAGER: 'from-cyan-500 to-teal-600',
  ENGINEER: 'from-emerald-500 to-teal-600',
};

const CURRENT_ORGANIZATION = {
  name: 'tkxel',
  logoUrl: '/assets/organizations/tkxel-logo.svg',
  baseUrl: 'https://tkxel.com',
};

const defaultDashboardTabForRole = (role?: string | null): TabType => (
  role === 'ADMIN' ? 'admin' : 'overview'
);

const InfoTip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
        title={text}
        aria-label={text}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 bottom-full z-30 mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border px-3 py-2 text-xs leading-relaxed shadow-lg"
          style={{
            borderColor: 'rgb(var(--border))',
            backgroundColor: 'rgb(var(--surface))',
            color: 'rgb(var(--text-2))',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

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

/* ── Team Health Charts (leader roles only) ─────────────────────────────── */

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
      : 'All people';

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
              <option value="all">All People</option>
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
          <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>{rows.length} people total</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                paddingAngle={4} dataKey="value" strokeWidth={0}>
                {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [`${v} people`, n]} contentStyle={tooltipStyle(c)} />
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
                Current score, needed score, and skills met for each person.
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
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>How many people are in each score range.</p>
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
                  <Bar dataKey="count" name="People" radius={[5,5,0,0]} maxBarSize={48}>
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
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>People below target, sorted by smallest remaining gap.</p>
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
                    No checked people are below target.
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

/* ── Admin Dashboard ────────────────────────────────────────────────────── */

const AdminDashboardTab: React.FC<{ onNavigate: (t: TabType) => void }> = ({ onNavigate }) => {
  const { data: users, isLoading: usersLoading, isError: usersError } = useConfigUsers();
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useConfigEmployees();
  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useConfigDepartments();
  const { data: grades, isLoading: gradesLoading, isError: gradesError } = useConfigGrades();
  const { data: skillDomains, isLoading: domainsLoading, isError: domainsError } = useConfigSkillDomains();
  const { data: competencies, isLoading: competenciesLoading, isError: competenciesError } = useConfigCompetencies();
  const { data: technologies, isLoading: technologiesLoading, isError: technologiesError } = useConfigTechnologies();
  const { data: assessmentTypes, isLoading: typesLoading, isError: typesError } = useConfigAssessmentTypes();
  const { data: assessmentLevels, isLoading: levelsLoading, isError: levelsError } = useConfigAssessmentLevels();
  const { data: assessmentStatuses, isLoading: statusesLoading, isError: statusesError } = useConfigAssessmentStatuses();
  const { data: assessmentProjects, isLoading: projectsLoading, isError: projectsError } = useConfigAssessmentProjects();

  const loading = usersLoading || employeesLoading || departmentsLoading || gradesLoading ||
    domainsLoading || competenciesLoading || technologiesLoading || typesLoading ||
    levelsLoading || statusesLoading || projectsLoading;
  const hasError = usersError || employeesError || departmentsError || gradesError ||
    domainsError || competenciesError || technologiesError || typesError ||
    levelsError || statusesError || projectsError;

  const activeUsers = (users ?? []).filter((user) => user.is_active).length;
  const inactiveUsers = Math.max(0, (users?.length ?? 0) - activeUsers);
  const unassignedEmployees = (employees ?? []).filter((employee) => !employee.department_id).length;
  const scoringRows = (assessmentTypes?.length ?? 0) + (assessmentLevels?.length ?? 0) +
    (assessmentStatuses?.length ?? 0) + (assessmentProjects?.length ?? 0);

  const statCards = [
    {
      label: 'Active Users',
      value: String(activeUsers),
      detail: `${inactiveUsers} not active`,
      help: 'People who can sign in right now. If someone is inactive, they may exist in employee records but cannot use the app until activated.',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Employees',
      value: String(employees?.length ?? 0),
      detail: `${unassignedEmployees} without a department`,
      help: 'Employee records used for grade, department, manager, and assessment reporting. Missing departments can make team reports incomplete.',
      icon: ClipboardCheck,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Departments',
      value: String(departments?.length ?? 0),
      detail: 'team groups',
      help: 'Company teams or departments used to group people in dashboards, reports, and manager views.',
      icon: Settings2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Scoring Rules',
      value: String(scoringRows),
      detail: 'score settings',
      help: 'Assessment types, levels, statuses, and projects that tell the system how to organize and interpret skill assessments.',
      icon: Target,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const setupGroups = [
    {
      label: 'People Setup',
      value: `${users?.length ?? 0} users / ${employees?.length ?? 0} employees`,
      help: 'Ready means the app has both login users and employee profiles. Both are needed to identify a person and show their grade, role, and assessments.',
      ready: (users?.length ?? 0) > 0 && (employees?.length ?? 0) > 0,
    },
    {
      label: 'Company Setup',
      value: `${departments?.length ?? 0} departments / ${grades?.length ?? 0} grades`,
      help: 'Ready means departments and grade levels exist, so reports can show where people belong and what promotion level they are working toward.',
      ready: (departments?.length ?? 0) > 0 && (grades?.length ?? 0) > 0,
    },
    {
      label: 'Skill Setup',
      value: `${skillDomains?.length ?? 0} areas / ${competencies?.length ?? 0} skills / ${technologies?.length ?? 0} tools`,
      help: 'Ready means skill areas and competencies exist. These are the actual skills people are measured against.',
      ready: (skillDomains?.length ?? 0) > 0 && (competencies?.length ?? 0) > 0,
    },
    {
      label: 'Score Setup',
      value: `${scoringRows} rows set`,
      help: 'Ready means the scoring reference data exists, so assessments can be categorized, scored, and tracked consistently.',
      ready: scoringRows > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="section-title">Admin Dashboard</h2>
          <p className="section-desc">
            Check setup status and open common admin tasks.
          </p>
        </div>
        <button onClick={() => onNavigate('config')} className="btn-primary text-sm">
          Open Setup <ChevronRight size={14} />
        </button>
      </div>

      {hasError && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}>
          Some setup data could not load. Please check the backend setup APIs and database changes.
        </div>
      )}

      {loading && (
        <div className="card p-5 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'rgb(var(--text-2))' }}>Loading setup data...</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, detail, help, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} color="white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>{label}</p>
                <InfoTip text={help} />
              </div>
              <p className="text-2xl font-bold leading-tight mt-0.5" style={{ color: 'rgb(var(--text-1))' }}>{value}</p>
              <p className="text-xs mt-1 truncate" style={{ color: 'rgb(var(--text-2))' }}>{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Setup Checklist</h3>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>What must be ready before the app works well.</p>
            </div>
            <span className="badge badge-accent">{setupGroups.filter((group) => group.ready).length} / {setupGroups.length} ready</span>
          </div>
          <div className="space-y-3">
            {setupGroups.map((group) => (
              <div key={group.label} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{group.label}</p>
                    <InfoTip text={group.help} />
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-2))' }}>{group.value}</p>
                </div>
                <span className={group.ready ? 'badge badge-success' : 'badge'}>{group.ready ? 'Ready' : 'Needs setup'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'rgb(var(--text-1))' }}>Admin Shortcuts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {[
              { title: 'Users and Roles', desc: 'Add users and choose what they can access.' },
              { title: 'Employees and Departments', desc: 'Update people, grades, managers, and departments.' },
              { title: 'Skill Setup', desc: 'Update skill areas, skills, and tools.' },
              { title: 'Score Rules', desc: 'Update how scores are counted.' },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => onNavigate('config')}
                className="rounded-xl border p-3 text-left transition-all hover:scale-[1.01]"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.title}</p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Overview Tab ───────────────────────────────────────────────────────── */

const OverviewTab: React.FC<{ user: User | null; onNavigate: (t: TabType) => void }> = ({ user, onNavigate }) => {
  const { data: overviewPromoData } = usePromotionReadiness();
  const { data: overviewCompData } = useCompetencyScores();
  const { data: overviewGapData } = useGapMatrix();
  const isLeader = isLeaderRole(user?.role);
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const displayName = user?.employeeName || user?.username || 'there';

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
        { label: 'Team Score',      value: leaderScore !== null ? `${leaderScore}%` : 'N/A', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', help: 'Average score for people with skill records.' },
        { label: 'Required Score',  value: leaderRequired !== null ? `${leaderRequired}%` : 'N/A', icon: Target,     color: 'from-amber-500 to-orange-600', help: 'Average score needed for the next grade.' },
        { label: 'Ready People',    value: `${readyCount}/${leaderRows.length || 0}`,         icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', help: 'People who have all needed skills for their next grade.' },
        { label: 'Needs Attention', value: String(needsAttention),                            icon: AlertTriangle, color: 'from-rose-500 to-red-600', help: 'People who still have skills below target.' },
      ]
    : [
        { label: 'My Score',       value: myScore !== null ? `${myScore}%` : 'N/A',       icon: TrendingUp, color: 'from-blue-500 to-indigo-600', help: 'Your score from approved skill checks.' },
        { label: 'Required Score', value: myRequired !== null ? `${myRequired}%` : 'N/A', icon: Target,     color: 'from-amber-500 to-orange-600', help: 'The score needed for your next grade.' },
        { label: 'Skills Met',     value: myTotal > 0 ? `${myMeets}/${myTotal}` : 'N/A',  icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', help: 'How many required skills are complete.' },
        { label: 'Status',         value: myGapRow?.promotion_ready ? 'Ready' : 'In Progress', icon: Activity, color: 'from-violet-500 to-purple-600', help: 'Ready means all target-grade skills are met.' },
      ];

  const featureItems: Array<{ id: TabType; icon: string; title: string; desc: string; roles: RoleCode[]; permission?: PermissionCode }> = [
    { id: 'team' as TabType,        icon: '👥', title: 'Team Roster',   desc: 'View people, grades, scores, and gaps.', roles: LEADERS },
    { id: 'ai' as TabType,          icon: '🤖', title: 'AI Dashboard',   desc: 'Find people and skills that need attention.', roles: LEADERS },
    { id: 'reports' as TabType,     icon: '📊', title: 'Reports',       desc: 'Answer who is ready, what is missing, and what to improve.', roles: LEADERS, permission: 'reports.view' },
    { id: 'assessments' as TabType, icon: '📝', title: 'Assessments',   desc: 'Review skill progress against the target grade.',   roles: ['ADMIN','TOP_MANAGEMENT','MANAGER','LINE_MANAGER','ENGINEER'] },
    { id: 'config' as TabType,      icon: '⚙️', title: 'Setup',         desc: 'Manage people, grades, skill groups, skills, and technologies.',       roles: ['ADMIN'] },
  ];
  const features = featureItems.filter(f =>
    !!user?.role &&
    f.roles.includes(user.role) &&
    (!f.permission || hasPermission(user.permissions, f.permission)),
  );

  const summaryItems = isLeader
    ? [
        {
          label: 'People',
          text: leaderRows.length > 0
            ? `${readyCount} of ${leaderRows.length} people are ready for their target grade.`
            : 'No people found yet.',
        },
        {
          label: 'Targets',
          text: leaderGap === null
            ? 'Required score data is not available yet.'
            : leaderGap >= 0
              ? `The team is ${leaderGap} points above the target.`
              : `The team is ${Math.abs(leaderGap)} points below the target.`,
        },
        {
          label: 'Action',
          text: needsAttention > 0
            ? `${needsAttention} people need attention before they are ready.`
            : 'No required skill gaps are shown now.',
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
              ? `You are ${myGap} points above the target.`
              : `You are ${Math.abs(myGap)} points below the target.`,
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
          {isLeader && canViewReports && (
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
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {displayName}! 👋</h2>
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

      {/* Team health charts — leader roles only */}
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
function RadarTick({ payload, x = 0, y = 0, cx = 0, cy = 0 }: {
  payload?: { value: string }; x?: number; y?: number; cx?: number; cy?: number;
}) {
  if (!payload) return null;
  const dx = x - (cx as number);
  const dy = y - (cy as number);
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const labelOffset = 14;
  const labelX = x + (dx / distance) * labelOffset;
  const labelY = y + (dy / distance) * labelOffset;
  const textAnchor = Math.abs(dx) < 12 ? 'middle' : dx > 0 ? 'start' : 'end';
  return (
    <text x={labelX} y={labelY} textAnchor={textAnchor} dominantBaseline="central" fill="rgb(var(--text-2))" fontSize={11}>
      {payload.value}
    </text>
  );
}

/* ── Assessments Tab ────────────────────────────────────────────────────── */

const AssessmentsTab: React.FC<{ user: User | null; onNavigate: (t: TabType) => void }> = ({ user, onNavigate }) => {
  const { data: compData, isLoading } = useCompetencyScores();
  const { data: promoData }           = usePromotionReadiness();
  const { data: gapData }             = useGapMatrix();
  const c = useChartColors();
  const isPrivileged = isLeaderRole(user?.role);
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
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

  const domains = Array.from(new Set([
    ...Object.keys(myRow?.domain_scores ?? {}),
    ...Object.keys(gapRow?.domain_gaps ?? {}),
    ...(gapData?.domains ?? []),
  ]));

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

  const barData = [...radarData].sort((a, b) => b.score - a.score || a.fullDomain.localeCompare(b.fullDomain));
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
        {isPrivileged && <PendingApprovalsPanel />}
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
      {isPrivileged && <PendingApprovalsPanel />}

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
              <div className="grid gap-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--accent-txt))' }}>From Grade:</span>
                  <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--warning))' }}>To Grade:</span>
                  <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="section-desc grid gap-1">
              <span>{formatEmployeeOption(myRow?.full_name, myRow?.emp_code)}</span>
              <div className="flex items-start gap-2">
                <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--accent-txt))' }}>From Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{fromGrade}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold shrink-0" style={{ color: 'rgb(var(--warning))' }}>To Grade:</span>
                <span style={{ color: 'rgb(var(--text-1))' }}>{toGrade}</span>
              </div>
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
          {isPrivileged && canViewReports && (
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
          <ResponsiveContainer width="100%" height={640}>
            <RadarChart data={radarData} outerRadius="82%" margin={{ top: 76, right: 126, bottom: 76, left: 126 }}>
              <PolarGrid stroke={c.radarGrid} />
              <PolarAngleAxis dataKey="fullDomain" tick={<RadarTick />} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.radarTick }}
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

        {/* Skill-area gap map */}
        <div className="card p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-2))' }}>
                  Score by Skill Area
                </p>
                <InfoTip text="Compares achieved score with the required target for each skill area." />
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                Gap map of skill-area strength against the required target.
              </p>
            </div>
            <div
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'rgb(var(--surface-3))', color: 'rgb(var(--text-1))' }}
            >
              {barData.length} areas
            </div>
          </div>

          <div className="mb-3 grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
            <span>Skill area</span>
            <div className="relative">
              <div className="absolute left-0">0</div>
              <div className="absolute left-1/4 -translate-x-1/2">25</div>
              <div className="absolute left-1/2 -translate-x-1/2">50</div>
              <div className="absolute left-3/4 -translate-x-1/2">75</div>
              <div className="absolute right-0">100</div>
            </div>
            <span className="text-right">Gap</span>
          </div>

          <div className="space-y-3">
            {barData.map((d) => {
              const gap = Math.max(0, d.threshold - d.score);
              const isNear = d.threshold > 0 && !d.meets && gap <= 10;
              const rowColor = d.threshold > 0
                ? (d.meets ? c.success : isNear ? c.warning : c.danger)
                : (d.score >= 75 ? c.success : d.score >= 40 ? c.warning : c.danger);
              const targetLabel = d.threshold > 0 ? `${d.threshold}% required` : 'No target set';
              const statusLabel = d.threshold > 0
                ? (d.meets ? 'Met' : isNear ? 'Near' : 'Below')
                : 'Score';

              return (
                <div
                  key={d.fullDomain}
                  className="grid grid-cols-[minmax(120px,0.9fr)_minmax(180px,1.6fr)_72px] items-center gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-snug" style={{ color: 'rgb(var(--text-1))' }}>
                      {d.fullDomain}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgb(var(--text-2))' }}>
                      {d.score}% achieved{d.threshold > 0 ? ` / ${d.threshold}% required` : ''}
                    </p>
                  </div>

                  <div
                    className="relative h-6"
                    title={`${d.fullDomain}: ${d.score}% achieved. ${targetLabel}.`}
                  >
                    <div
                      className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                      style={{ backgroundColor: 'rgb(var(--border))' }}
                    />
                    {[25, 50, 75].map((tick) => (
                      <div
                        key={tick}
                        className="absolute top-1/2 h-3 w-px -translate-y-1/2"
                        style={{ left: `${tick}%`, backgroundColor: 'rgb(var(--border))' }}
                      />
                    ))}
                    <div
                      className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, d.score))}%`, backgroundColor: rowColor }}
                    />
                    {d.threshold > 0 && (
                      <div
                        className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                        style={{
                          left: `calc(${Math.min(100, Math.max(0, d.threshold))}% - 1px)`,
                          backgroundColor: c.warning,
                          boxShadow: '0 0 0 2px rgb(var(--surface-1))',
                        }}
                      />
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className="inline-flex min-w-14 justify-center rounded-full px-2 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: `${rowColor}22`, color: rowColor }}
                    >
                      {d.threshold > 0 && !d.meets ? `${gap}%` : statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
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
                Full skill view for the selected person.
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
            <SkillAreaNameFilterSelect
              value={competencyDomainFilter}
              onChange={setCompetencyDomainFilter}
              skillAreas={competencyDomains}
            />
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
                  <th className="text-left text-xs font-semibold uppercase tracking-wide py-2 pr-3">Skill</th>
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
              Add or update your skills and tools. Your manager will set skill levels.
              Your saved rows appear as pending until approved.
            </p>
          </div>
          <button onClick={() => setShowSkillEditor(true)} className="btn-primary text-xs shrink-0">
            Manage My Skills
          </button>
        </div>
      )}

      {/* Skill editor modal for engineers */}
      {showSkillEditor && user?.empCode && typeof document !== 'undefined' && createPortal((
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
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
                employeeName={user.employeeName || user.username}
                readOnlyLevel
                onSuccess={() => {}}
                onClose={() => setShowSkillEditor(false)}
              />
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

/* ── AI Dashboard Tab ───────────────────────────────────────────────────── */

const priorityStyles = (priority: AiPriority, c: ReturnType<typeof useChartColors>) => {
  if (priority === 'critical') return { color: c.danger, bg: 'rgb(var(--danger-soft))', icon: AlertTriangle };
  if (priority === 'warning') return { color: c.warning, bg: 'rgb(var(--warning-soft))', icon: Target };
  if (priority === 'positive') return { color: c.success, bg: 'rgb(var(--success-soft))', icon: CheckCircle2 };
  return { color: c.accent, bg: 'rgb(var(--accent-soft))', icon: Sparkles };
};

const PRIORITY_MEANING: Record<AiPriority, { label: string; meaning: string; action: string }> = {
  critical: {
    label: 'Critical',
    meaning: 'Immediate risk. A person, skill, or team result is far below the needed target and can block readiness.',
    action: 'Assign an owner, review the listed resources, and plan intervention this week.',
  },
  warning: {
    label: 'Warning',
    meaning: 'Needs attention. The gap is meaningful but usually recoverable with focused coaching or training.',
    action: 'Schedule follow-up, track progress, and review again in the next cycle.',
  },
  positive: {
    label: 'Positive',
    meaning: 'Good signal. This area is healthy or improving and can be used as a benchmark for others.',
    action: 'Recognize it, keep it stable, and reuse the learning pattern where helpful.',
  },
  neutral: {
    label: 'Neutral',
    meaning: 'Informational signal. There is no immediate risk, but the item still adds context for planning.',
    action: 'Monitor it and use it to support balanced planning decisions.',
  },
};

type AiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AiChatResponse;
};

const AIInsightsTab: React.FC<{ user: User | null; onNavigate: (t: TabType) => void }> = ({ user, onNavigate }) => {
  const c = useChartColors();
  const [focus, setFocus] = useState<AiFocus>('executive');
  const [aiView, setAiView] = useState<'overview' | 'ask'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [showBlockers, setShowBlockers] = useState(false);
  const [blockerSearch, setBlockerSearch] = useState('');
  const [blockerDomain, setBlockerDomain] = useState('all');
  const [blockerSeverity, setBlockerSeverity] = useState<'all' | 'critical' | 'warning' | 'watch'>('all');
  const [selectedPriority, setSelectedPriority] = useState<AiPriority>('critical');
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const { data: analysis, isLoading, isFetching, isError, refetch } = useAiDashboard(focus);
  const aiChat = useAiChat();
  const generatedAt = analysis?.generatedAt
    ? new Date(analysis.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'not available';
  const maxSkill = Math.max(...(analysis?.skillAreas ?? []).map((d) => d.averagePct), 10);
  const readinessPct = analysis?.kpis.readinessRatePct ?? 0;
  const blockerSeverityFor = (gapPct: number): 'critical' | 'warning' | 'watch' => (
    gapPct >= 30 ? 'critical' : gapPct >= 12 ? 'warning' : 'watch'
  );
  const priorityMix = (['critical', 'warning', 'positive', 'neutral'] as AiPriority[]).map((priority) => ({
    priority,
    count: analysis?.recommendations.filter((item) => item.priority === priority).length ?? 0,
    ...priorityStyles(priority, c),
  }));
  const maxPriority = Math.max(...priorityMix.map((item) => item.count), 1);
  const selectedPriorityStyle = priorityStyles(selectedPriority, c);
  const SelectedPriorityIcon = selectedPriorityStyle.icon;
  const selectedPriorityMeta = PRIORITY_MEANING[selectedPriority];
  const selectedRecommendations = analysis?.recommendations.filter((item) => item.priority === selectedPriority) ?? [];
  const selectedSkillAreas = analysis?.skillAreas.filter((item) => item.priority === selectedPriority) ?? [];
  const selectedBlockers = (analysis?.blockers ?? []).filter((blocker) => {
    const severity = blockerSeverityFor(blocker.gapPct);
    if (selectedPriority === 'critical') return severity === 'critical';
    if (selectedPriority === 'warning') return severity === 'warning';
    if (selectedPriority === 'neutral') return severity === 'watch';
    return false;
  });
  const selectedPeople = (analysis?.riskPeople ?? []).filter((person) => {
    if (selectedPriority === 'critical') return person.gapPct >= 30;
    if (selectedPriority === 'warning') return person.gapPct >= 12 && person.gapPct < 30;
    if (selectedPriority === 'neutral') return person.gapPct < 12;
    return false;
  });
  const selectedStrengths = selectedPriority === 'positive' ? (analysis?.strengths ?? []) : [];
  const focusLabels: Record<AiFocus, string> = {
    executive: 'Executive command view',
    risk: 'Risk and intervention view',
    skills: 'Skill-area strategy view',
    readiness: 'Promotion readiness view',
  };
  const blockerDomains = Array.from(new Set((analysis?.blockers ?? []).map((blocker) => blocker.domain))).sort();
  const filteredBlockers = (analysis?.blockers ?? []).filter((blocker) => {
    const q = blockerSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      blocker.employee.toLowerCase().includes(q) ||
      blocker.competency.toLowerCase().includes(q) ||
      blocker.domain.toLowerCase().includes(q);
    const matchesDomain = blockerDomain === 'all' || blocker.domain === blockerDomain;
    const matchesSeverity = blockerSeverity === 'all' || blockerSeverityFor(blocker.gapPct) === blockerSeverity;
    return matchesSearch && matchesDomain && matchesSeverity;
  });

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

  if (isError || !analysis) {
    return (
      <div className="card p-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}>
            <AlertTriangle size={22} />
          </div>
          <p className="font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>AI dashboard could not load</p>
          <p className="text-sm mb-4" style={{ color: 'rgb(var(--text-2))' }}>
            The AI data could not load. Please check the backend report APIs and AI setup.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={() => refetch()}>Retry Analysis</button>
        </div>
      </div>
    );
  }

  const topWeakArea = analysis.skillAreas[0];
  const topRiskPerson = analysis.riskPeople[0];
  const topRecommendation = analysis.recommendations[0];
  const dynamicSuggestions = [
    analysis.kpis.criticalBlockerCount > 0 ? `Which ${analysis.kpis.criticalBlockerCount} critical gaps need action first?` : 'Where is the team strongest?',
    topWeakArea ? `Why is ${topWeakArea.domain} weak?` : 'Which skill areas should we watch?',
    topRiskPerson ? `How can we help ${topRiskPerson.name}?` : 'Who is closest to being ready?',
    `How can we improve readiness from ${readinessPct}%?`,
    topRecommendation ? `Explain: ${topRecommendation.title}` : 'What should leaders do this week?',
  ].filter(Boolean);

  const askAi = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const requestId = Date.now();
    setChatInput('');
    setChatMessages((messages) => [
      ...messages,
      { id: `user-${requestId}`, role: 'user', text: cleanQuestion },
    ]);

    try {
      const response = await aiChat.mutateAsync({ question: cleanQuestion, focus });
      setChatMessages((messages) => [
        ...messages,
        { id: `assistant-${requestId}`, role: 'assistant', text: response.answer, response },
      ]);
    } catch {
      setChatMessages((messages) => [
        ...messages,
        {
          id: `assistant-${requestId}`,
          role: 'assistant',
          text: 'I could not get the AI answer right now. Please try again after checking the backend AI service.',
        },
      ]);
    }
  };

  const visibleChatMessages = chatMessages.length > 0
    ? chatMessages
    : [{
        id: 'welcome',
        role: 'assistant' as const,
        text: 'Ask me about readiness, critical gaps, weak skill areas, people needing help, or what leaders should do next.',
      }];
  const latestChatResponse = [...chatMessages].reverse().find((message) => message.response)?.response;
  const currentSuggestions = latestChatResponse?.suggestedQuestions?.length ? latestChatResponse.suggestedQuestions : dynamicSuggestions;
  const toneStyle = (tone: 'danger' | 'warning' | 'success' | 'info' | 'neutral') => {
    if (tone === 'danger') return { color: c.danger, bg: 'rgb(var(--danger-soft))' };
    if (tone === 'warning') return { color: c.warning, bg: 'rgb(var(--warning-soft))' };
    if (tone === 'success') return { color: c.success, bg: 'rgb(var(--success-soft))' };
    if (tone === 'info') return { color: c.accent, bg: 'rgb(var(--accent-soft))' };
    return { color: 'rgb(var(--text-2))', bg: 'rgb(var(--surface-2))' };
  };
  const renderAssistantAnswer = (text: string, response?: AiChatResponse) => {
    if (response) {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>Answer</p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'rgb(var(--text-1))' }}>{response.answer}</p>
          </div>

          <div className="rounded-lg border px-3 py-2"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-xs leading-relaxed">{response.explanation}</p>
          </div>

          {response.evidence.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>Evidence</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {response.evidence.map((item, index) => {
                  const style = toneStyle(item.tone);
                  return (
                    <div key={`${item.label}-${index}`} className="rounded-lg px-3 py-2" style={{ backgroundColor: style.bg }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.label}</p>
                        <p className="text-xs font-bold shrink-0" style={{ color: style.color }}>{item.value}</p>
                      </div>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {response.actions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>Recommended Actions</p>
              <div className="space-y-2">
                {response.actions.map((item, index) => {
                  const style = priorityStyles(item.priority, c);
                  return (
                    <div key={`${item.title}-${index}`} className="rounded-lg border px-3 py-2" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: style.color }}>{item.title}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 capitalize" style={{ color: style.color, backgroundColor: style.bg }}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{item.detail}</p>
                      <p className="text-[11px] mt-2 font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                        {item.owner} · {item.timeframe}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(response.relatedPeople.length > 0 || response.relatedSkills.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {response.relatedPeople.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>People to Review</p>
                  <div className="space-y-1.5">
                    {response.relatedPeople.slice(0, 3).map((person) => (
                      <div key={`${person.empCode}-${person.name}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate" style={{ color: 'rgb(var(--text-2))' }}>{person.name}</span>
                        <span className="font-bold shrink-0" style={{ color: c.danger }}>{person.gapPct} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {response.relatedSkills.length > 0 && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-3))' }}>Skill Areas</p>
                  <div className="space-y-1.5">
                    {response.relatedSkills.slice(0, 3).map((skill) => (
                      <div key={skill.domain} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate" style={{ color: 'rgb(var(--text-2))' }}>{skill.domain}</span>
                        <span className="font-bold shrink-0" style={{ color: skill.priority === 'critical' ? c.danger : skill.priority === 'warning' ? c.warning : c.accent }}>{skill.averagePct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    const blocks = text.split('\n').filter((line) => line.trim().length > 0);

    return (
      <div className="space-y-2">
        {blocks.map((line, index) => {
          const lower = line.toLowerCase();
          const isAction = lower.startsWith('action:') || lower.includes('next step') || lower.includes('simple action') || lower.includes('suggested action');
          const isRisk = lower.includes('critical') || lower.includes('gap:') || lower.includes('short by') || lower.includes('weakest');
          const isMetric = lower.includes('readiness') || lower.includes('average score') || lower.includes('needed score') || lower.includes('ready.');
          const isOwner = lower.startsWith('owner:') || lower.startsWith('time:');
          const isListItem = line.includes(':') && (line.includes('points') || line.includes('short by'));
          const color = isAction ? c.success : isRisk ? c.danger : isMetric ? c.accent : isOwner ? c.warning : 'rgb(var(--text-1))';
          const bg = isAction
            ? 'rgb(var(--success-soft))'
            : isRisk
              ? 'rgb(var(--danger-soft))'
              : isMetric
                ? 'rgb(var(--accent-soft))'
                : isOwner
                  ? 'rgb(var(--warning-soft))'
                  : 'transparent';

          if (index === 0 && !isListItem) {
            return (
              <p key={`${line}-${index}`} className="text-sm font-semibold leading-relaxed" style={{ color }}>
                {line}
              </p>
            );
          }

          return (
            <div
              key={`${line}-${index}`}
              className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
              style={{
                borderColor: isAction || isRisk || isMetric || isOwner ? 'transparent' : 'rgb(var(--border))',
                backgroundColor: bg,
                color,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

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
              <p className="text-lg font-bold" style={{ color: 'rgb(var(--text-1))' }}>AI Dashboard</p>
              <p className="text-sm mt-1 max-w-2xl" style={{ color: 'rgb(var(--text-2))' }}>
                AI uses readiness, skills, and gaps to show risks, strengths, and next steps.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs flex-wrap" style={{ color: 'rgb(var(--text-3))' }}>
                <Clock3 size={13} />
                <span>Last analyzed {generatedAt}</span>
                <span>·</span>
                <span>{analysis.aiEnabled ? 'AI analysis ready' : 'Basic analysis ready'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary text-sm inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <Sparkles size={14} /> {isFetching ? 'Analyzing…' : 'Re-analyze'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'ask', label: 'Ask AI', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAiView(id as typeof aiView)}
            className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-2"
            style={{
              borderColor: aiView === id ? 'rgb(var(--accent))' : 'rgb(var(--border))',
              backgroundColor: aiView === id ? 'rgb(var(--accent-soft))' : 'rgb(var(--surface))',
              color: aiView === id ? 'rgb(var(--accent-txt))' : 'rgb(var(--text-2))',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {aiView === 'ask' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] gap-5">
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3 flex-wrap" style={{ borderColor: 'rgb(var(--border))' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Ask AI</p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Ask simple questions about readiness, gaps, and next actions.</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
                Uses current dashboard data
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="min-h-[320px] max-h-[460px] overflow-y-auto rounded-xl border p-4 space-y-3"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                {visibleChatMessages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}>
                        <Bot size={17} />
                      </div>
                    )}
                    <div className={`max-w-[88%] flex flex-col gap-1.5 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="text-[11px] font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div
                        className="rounded-xl px-4 py-3 text-sm"
                        style={{
                          backgroundColor: message.role === 'user' ? 'rgb(var(--accent))' : 'rgb(var(--surface))',
                          color: message.role === 'user' ? 'white' : 'rgb(var(--text-1))',
                          border: message.role === 'user' ? '1px solid rgb(var(--accent))' : '1px solid rgb(var(--border))',
                          boxShadow: message.role === 'assistant' ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {message.role === 'assistant' ? renderAssistantAnswer(message.text, message.response) : message.text}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgb(var(--accent))', color: 'white' }}>
                        <UserRound size={17} />
                      </div>
                    )}
                  </div>
                ))}
                {aiChat.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}>
                      <Bot size={17} />
                    </div>
                    <div className="rounded-xl px-4 py-3 text-sm border"
                      style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-2))' }}>
                      Building answer with evidence and actions...
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgb(var(--text-3))' }}>Suggested questions</p>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => askAi(question)}
                      className="rounded-full border px-3 py-1.5 text-xs text-left"
                      style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-2))' }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  askAi(chatInput);
                }}
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about gaps, readiness, weak areas, or next steps..."
                  disabled={aiChat.isPending}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))', color: 'rgb(var(--text-1))' }}
                />
                <button type="submit" disabled={aiChat.isPending} className="btn-primary px-3 py-2 inline-flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  <Send size={14} /> {aiChat.isPending ? 'Asking...' : 'Ask'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <p className="text-sm font-bold mb-3" style={{ color: 'rgb(var(--text-1))' }}>Live Data Snapshot</p>
              <div className="space-y-3">
                {[
                  {
                    label: 'Readiness',
                    value: `${readinessPct}%`,
                    color: c.success,
                    help: 'The share of people who meet the required skill level for their next grade. Higher means fewer people need immediate support.',
                  },
                  {
                    label: 'Ready People',
                    value: `${analysis.kpis.readyResources}/${analysis.kpis.totalResources}`,
                    color: c.success,
                    help: 'How many people are currently ready compared with everyone included in this dashboard view.',
                  },
                  {
                    label: 'Critical Gaps',
                    value: String(analysis.kpis.criticalBlockerCount),
                    color: c.danger,
                    help: 'High-priority missing skills that may block promotion readiness or delivery capability. These should be reviewed first.',
                  },
                  {
                    label: 'Average Score',
                    value: `${analysis.kpis.avgAchievedPct}%`,
                    color: c.accent,
                    help: 'The average current skill achievement across the selected people and assessed skills.',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                      {item.label}
                      <InfoTip text={item.help} />
                    </span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm font-bold mb-3" style={{ color: 'rgb(var(--text-1))' }}>Good Questions to Ask</p>
              <div className="space-y-2">
                {['Who needs help first?', 'What should we fix this week?', 'Which skill area is weakest?', 'How do we improve readiness?'].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => askAi(question)}
                    className="w-full rounded-lg border px-3 py-2 text-xs text-left"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] gap-5">
        <div className="rounded-xl border p-5 min-h-[260px] flex flex-col justify-between"
          style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>AI Command Brief</p>
                <p className="text-lg font-bold mt-1" style={{ color: 'rgb(var(--text-1))' }}>{focusLabels[focus]}</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: analysis.aiEnabled ? 'rgb(var(--success-soft))' : 'rgb(var(--warning-soft))',
                  color: analysis.aiEnabled ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                }}>
                {analysis.source === 'openai' ? 'Made by AI' : 'Basic analysis'}
              </span>
            </div>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'rgb(var(--text-1))' }}>{analysis.executiveNarrative}</p>
            <div className="rounded-lg p-4 border"
              style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1">Focus Answer</p>
              <p className="text-sm leading-relaxed">{analysis.focusAnswer}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Dataset</p>
                <InfoTip text="The number of people included in this AI dashboard view. All readiness and gap numbers are calculated from this group." />
              </div>
              <p className="text-sm font-bold mt-1" style={{ color: 'rgb(var(--text-1))' }}>{analysis.kpis.totalResources} people</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Analysis</p>
                <InfoTip text="Shows whether the explanation came from AI or from the built-in fallback rules. The numbers still come from live dashboard data." />
              </div>
              <p className="text-sm font-bold mt-1 truncate" style={{ color: 'rgb(var(--text-1))' }}>{analysis.aiEnabled ? 'AI ready' : 'Basic ready'}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Critical Gaps</p>
                <InfoTip text="Skills where the gap is serious enough to need leadership attention, coaching, training, or reassignment planning." />
              </div>
              <p className="text-sm font-bold mt-1" style={{ color: c.danger }}>{analysis.kpis.criticalBlockerCount} critical gaps</p>
            </div>
          </div>
        </div>

        <div className="card p-5 min-h-[260px]">
          <div className="mb-4">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Readiness Gauge</p>
              <InfoTip text="A quick health indicator for promotion readiness. Green progress means more people already meet their next-grade expectations." />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Promotion readiness across the current dataset.</p>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${c.success} ${readinessPct * 3.6}deg, rgb(var(--surface-3)) 0deg)`,
              }}
            >
              <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgb(var(--surface))' }}>
                <span className="text-3xl font-bold leading-none" style={{ color: c.success }}>{readinessPct}%</span>
                <span className="text-[11px] font-semibold mt-1" style={{ color: 'rgb(var(--text-3))' }}>READY</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'rgb(var(--text-3))' }}>Ready</p>
              <p className="text-xl font-bold" style={{ color: c.success }}>{analysis.kpis.readyResources}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'rgb(var(--text-3))' }}>Needs Action</p>
              <p className="text-xl font-bold" style={{ color: c.warning }}>{Math.max(0, analysis.kpis.totalResources - analysis.kpis.readyResources)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Avg Score',
            value: `${analysis.kpis.avgAchievedPct}%`,
            detail: 'Current score',
            color: c.accent,
            help: 'The average current assessment score. Think of it as where the team stands today.',
          },
          {
            label: 'Avg Required',
            value: analysis.kpis.avgRequiredPct > 0 ? `${analysis.kpis.avgRequiredPct}%` : 'N/A',
            detail: 'Needed score',
            color: c.warning,
            help: 'The average target score people need for their next grade or expected capability level.',
          },
          {
            label: 'Ready People',
            value: `${analysis.kpis.readyResources}/${analysis.kpis.totalResources}`,
            detail: `${readinessPct}% ready`,
            color: c.success,
            help: 'People who meet all measured expectations in this view. This number improves when skill gaps are closed.',
          },
          {
            label: 'Critical Gaps',
            value: analysis.kpis.criticalBlockerCount,
            detail: 'Immediate actions',
            color: c.danger,
            help: 'The number of serious skill gaps that need action first. Click the critical gap list below to see who and what is affected.',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border p-4 min-h-[112px]" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>{kpi.label}</p>
              <InfoTip text={kpi.help} />
            </div>
            <p className="text-2xl font-bold mt-1 leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs mt-2" style={{ color: 'rgb(var(--text-2))' }}>{kpi.detail}</p>
            <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, Number.parseInt(String(kpi.value), 10) || 18)}%`, backgroundColor: kpi.color }} />
            </div>
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
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>AI Recommendations</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>Most important notes from current data.</p>
            </div>
            {canViewReports && (
              <button type="button" onClick={() => onNavigate('reports')} className="btn-ghost text-xs px-3 py-2">
                Open Reports
              </button>
            )}
          </div>
          <div className="space-y-3">
            {analysis.recommendations.map((item) => {
              const style = priorityStyles(item.priority, c);
              const Icon = style.icon;
              return (
                <div key={item.title} className="rounded-xl border p-4 flex gap-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.title}</p>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{item.insight}</p>
                    <p className="text-sm mt-2 font-medium" style={{ color: style.color }}>{item.action}</p>
                    <p className="text-[11px] mt-2 uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                      {item.owner} · {item.timeframe}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>AI Query Console</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
            Choose a question to change the advice.
          </p>
          <div className="space-y-2">
            {analysis.suggestedQuestions.map((question, index) => {
              const ids: AiFocus[] = ['executive', 'risk', 'skills', 'readiness'];
              const prompt = { id: ids[index % ids.length], q: question };
              return (
              <button
                key={`${prompt.id}-${index}-${prompt.q}`}
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
            );})}
          </div>
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Priority Mix</p>
                <p className="text-xs mt-1 mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                  Select a priority to see meaning and related resources.
                </p>
              </div>
              <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'rgb(var(--text-3))' }} />
            </div>
            <div className="space-y-3">
              {priorityMix.map((item) => {
                const active = selectedPriority === item.priority;
                return (
                <button
                  key={item.priority}
                  type="button"
                  onClick={() => setSelectedPriority(item.priority)}
                  className="w-full text-left rounded-lg border p-2 transition-colors"
                  style={{
                    borderColor: active ? item.color : 'transparent',
                    backgroundColor: active ? item.bg : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold capitalize" style={{ color: item.color }}>{item.priority}</span>
                    <span style={{ color: 'rgb(var(--text-3))' }}>{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.count / maxPriority) * 100)}%`, backgroundColor: item.color }} />
                  </div>
                </button>
              );})}
            </div>
            <div
              className="mt-4 rounded-xl border p-3"
              style={{ borderColor: selectedPriorityStyle.color, backgroundColor: selectedPriorityStyle.bg }}
            >
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgb(var(--surface))', color: selectedPriorityStyle.color }}>
                  <SelectedPriorityIcon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                    {selectedPriorityMeta.label}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
                    {selectedPriorityMeta.meaning}
                  </p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: selectedPriorityStyle.color }}>
                    {selectedPriorityMeta.action}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {selectedRecommendations.slice(0, 3).map((item) => (
                  <div
                    key={`rec-${item.title}`}
                    className="w-full rounded-lg border px-3 py-2 text-left"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>{item.owner} · {item.timeframe}</p>
                  </div>
                ))}

                {selectedBlockers.slice(0, 3).map((item) => (
                  <button
                    key={`blocker-${item.employee}-${item.competency}`}
                    type="button"
                    onClick={() => {
                      setShowBlockers(true);
                      setBlockerSeverity(selectedPriority === 'critical' ? 'critical' : selectedPriority === 'warning' ? 'warning' : 'watch');
                      setBlockerSearch(item.employee);
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-left"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.employee}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>{item.competency} · {item.domain} · -{item.gapPct} pts</p>
                  </button>
                ))}

                {selectedSkillAreas.slice(0, 3).map((item) => (
                  <div
                    key={`skill-${item.domain}`}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{item.domain}</p>
                      <span className="text-[11px] font-bold" style={{ color: selectedPriorityStyle.color }}>{item.averagePct}%</span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>{item.recommendation}</p>
                  </div>
                ))}

                {selectedPeople.slice(0, 3).map((item) => (
                  <div
                    key={`person-${item.empCode}`}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{item.name}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                      ID {item.empCode} · {item.currentGrade} to {item.targetGrade} · -{item.gapPct} pts
                    </p>
                  </div>
                ))}

                {selectedStrengths.slice(0, 3).map((item) => (
                  <div
                    key={`strength-${item.domain}`}
                    className="rounded-lg border px-3 py-2"
                    style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{item.domain}</p>
                      <span className="text-[11px] font-bold" style={{ color: c.success }}>{item.averagePct}%</span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'rgb(var(--text-3))' }}>{item.recommendation}</p>
                  </div>
                ))}

                {selectedRecommendations.length === 0 &&
                  selectedBlockers.length === 0 &&
                  selectedSkillAreas.length === 0 &&
                  selectedPeople.length === 0 &&
                  selectedStrengths.length === 0 && (
                    <p className="text-xs py-3 text-center" style={{ color: 'rgb(var(--text-3))' }}>
                      No associated resources for this priority right now.
                    </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>Weakest Skill Areas</p>
          <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>Skill areas with the lowest scores.</p>
          <div className="space-y-3">
            {analysis.skillAreas.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>No skill area scores available yet.</p>
            ) : analysis.skillAreas.map((d) => (
              <div key={d.domain}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold truncate pr-2" style={{ color: 'rgb(var(--text-1))' }}>{d.domain}</span>
                  <span style={{ color: 'rgb(var(--text-2))' }}>{d.averagePct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, (d.averagePct / maxSkill) * 100)}%`, backgroundColor: d.priority === 'critical' ? c.danger : d.priority === 'warning' ? c.warning : c.accent }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>{d.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: 'rgb(var(--text-1))' }}>Critical Gaps</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>The biggest missing skills for the next grade.</p>
            </div>
            {analysis.blockers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBlockers((value) => !value)}
                className="btn-secondary text-xs px-3 py-2 shrink-0"
              >
                {showBlockers ? 'Hide Critical Gaps' : `View All Critical Gaps (${analysis.blockers.length})`}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {analysis.blockers.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>No critical gaps found.</p>
            ) : analysis.blockers.slice(0, showBlockers ? 3 : 6).map((b) => (
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
                  <span className="text-xs font-bold shrink-0" style={{ color: c.danger }}>-{b.gapPct} pts</span>
                </div>
                <p className="text-xs mt-1 truncate" style={{ color: 'rgb(var(--text-2))' }}>{b.employee} · {b.domain}</p>
                <p className="text-[11px] mt-1 font-semibold" style={{ color: 'rgb(var(--warning))' }}>{b.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBlockers && analysis.blockers.length > 0 && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Critical Gap Explorer</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                Full list of missing skills, people, gap size, and AI action.
              </p>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
              Showing {filteredBlockers.length} of {analysis.blockers.length} critical gaps
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_150px] gap-3 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-3))' }} />
              <input
                value={blockerSearch}
                onChange={(event) => setBlockerSearch(event.target.value)}
                placeholder="Search employee, skill, or skill area"
                className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none"
                style={{
                  borderColor: 'rgb(var(--border))',
                  backgroundColor: 'rgb(var(--surface-2))',
                  color: 'rgb(var(--text-1))',
                }}
              />
            </div>
            <SkillAreaNameFilterSelect
              value={blockerDomain}
              onChange={setBlockerDomain}
              skillAreas={blockerDomains}
            />
            <select
              value={blockerSeverity}
              onChange={(event) => setBlockerSeverity(event.target.value as typeof blockerSeverity)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: 'rgb(var(--border))',
                backgroundColor: 'rgb(var(--surface-2))',
                color: 'rgb(var(--text-1))',
              }}
            >
              <option value="all">All urgency</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="watch">Watch</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'rgb(var(--border))' }}>
            <table className="w-full min-w-[860px] text-sm">
              <thead style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                <tr>
                  {['Employee', 'Skill', 'Skill Area', 'Gap', 'Urgency', 'AI Action'].map((header) => (
                    <th key={header} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBlockers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>
                      No critical gaps match the selected filters.
                    </td>
                  </tr>
                ) : filteredBlockers.map((blocker) => {
                  const severity = blockerSeverityFor(blocker.gapPct);
                  const sevColor = severity === 'critical' ? c.danger : severity === 'warning' ? c.warning : c.accent;
                  const sevBg = severity === 'critical'
                    ? 'rgb(var(--danger-soft))'
                    : severity === 'warning'
                      ? 'rgb(var(--warning-soft))'
                      : 'rgb(var(--accent-soft))';
                  return (
                    <tr key={`${blocker.employee}-${blocker.competency}-${blocker.domain}`} className="border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{blocker.employee}</td>
                      <td className="px-4 py-3" style={{ color: 'rgb(var(--text-2))' }}>{blocker.competency}</td>
                      <td className="px-4 py-3" style={{ color: 'rgb(var(--text-2))' }}>{blocker.domain}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: c.danger }}>-{blocker.gapPct} pts</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold capitalize" style={{ color: sevColor, backgroundColor: sevBg }}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[320px]" style={{ color: 'rgb(var(--text-2))' }}>{blocker.action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analysis.riskPeople.length > 0 && (
        <div className="card p-5">
          <div className="mb-4">
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>People Needing Attention</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>People who may need help next.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {analysis.riskPeople.map((person) => (
              <div key={`${person.empCode}-${person.name}`} className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'rgb(var(--text-1))' }}>{person.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>{person.currentGrade} → {person.targetGrade} · {person.meets} met</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: c.danger }}>{person.gapPct} pts</span>
                </div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>{person.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.strengths.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-bold mb-4" style={{ color: 'rgb(var(--text-1))' }}>Strengths to Reuse</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {analysis.strengths.map((d) => (
              <div key={d.domain} className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--success-soft))' }}>
                <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>{d.domain}</p>
                <p className="text-xl font-bold mt-1" style={{ color: c.success }}>{d.averagePct}%</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>{d.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────────────────────── */

export const DashboardPage: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>(() => defaultDashboardTabForRole(user?.role));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const visibleNav = NAV.filter(n =>
    user?.role &&
    n.roles.includes(user.role) &&
    (!n.permission || hasPermission(user.permissions, n.permission)),
  );

  useEffect(() => {
    let cancelled = false;

    apiClient.get<{ user: User }>('/auth/me')
      .then((response) => {
        if (cancelled) return;
        const freshUser = response.data.user;
        const roleChanged = user?.role && user.role !== freshUser.role;
        setUser({ ...freshUser, permissions: freshUser.permissions ?? [] });
        if (roleChanged) {
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          queryClient.invalidateQueries({ queryKey: ['ai'] });
          queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
          queryClient.invalidateQueries({ queryKey: ['assessments'] });
        }
      })
      .catch(() => {
        // Global API interceptor handles expired sessions.
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, user?.role]);

  useEffect(() => {
    const canSeeActiveTab = visibleNav.some((item) => item.id === activeTab);
    if (!canSeeActiveTab) setActiveTab(defaultDashboardTabForRole(user?.role));
  }, [activeTab, user?.permissions, user?.role, visibleNav]);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    window.location.href = '/login';
  };

  const displayName = user?.employeeName || user?.username || 'Unknown User';
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Unknown Role';
  const gradeLine = user?.currentGrade && user?.targetGrade
    ? `${user.currentGrade} -> ${user.targetGrade}`
    : 'Grade not assigned';
  const identityLine = [user?.empCode ? `ID ${user.empCode}` : null, roleLabel, gradeLine].filter(Boolean).join(' | ');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '??';
  const gradient = ROLE_GRADIENT[user?.role ?? ''] ?? 'from-gray-500 to-gray-600';
  const isTeamTab = activeTab === 'team' && isLeaderRole(user?.role);

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
                {displayName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                {identityLine}
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
                    {displayName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>
                    {identityLine}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <main className={`flex-1 ${isTeamTab ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={isTeamTab ? 'h-full w-full p-6' : 'max-w-6xl mx-auto p-6'}>

            {activeTab === 'admin' && user?.role === 'ADMIN' && (
              <AdminDashboardTab onNavigate={setActiveTab} />
            )}

            {activeTab === 'overview' && (
              <OverviewTab user={user} onNavigate={setActiveTab} />
            )}

            {activeTab === 'team' && isLeaderRole(user?.role) && (
              <div className="card p-6 h-full w-full animate-slide-up flex flex-col overflow-hidden">
                <TeamRoster />
              </div>
            )}

            {activeTab === 'assessments' && <AssessmentsTab user={user} onNavigate={setActiveTab} />}

            {activeTab === 'ai' && isLeaderRole(user?.role) && (
              <AIInsightsTab user={user} onNavigate={setActiveTab} />
            )}

            {activeTab === 'reports' && canViewReports && (
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
