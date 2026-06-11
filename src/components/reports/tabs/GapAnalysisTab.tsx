import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, ComposedChart, CartesianGrid, Line } from 'recharts';
import { useGapMatrix, type GapMatrixEmployee, type GapMatrixResult } from '@/hooks/useReports';
import { useAuthStore } from '@/store/authStore';
import { isLeaderRole } from '@/types/rbac';
import { Empty, InfoTip, Loading } from '../shared';
import { starRatingDisplay } from '../reportDisplay';

// ─────────────────────────────────────────────────────────────────────────────
// ── Gap Analysis ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function gapLevel(score: number): string {
  if (score >= 0.95) return 'L5';
  if (score >= 0.75) return 'L4';
  if (score >= 0.60) return 'L3';
  if (score >= 0.40) return 'L2';
  return 'L1';
}
function gapStars(score: number): number {
  if (score >= 0.95) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.60) return 3;
  if (score >= 0.40) return 2;
  return 1;
}
function gapColor(gap: number): React.CSSProperties {
  if (gap >= 0)    return { color: 'rgb(var(--success))' };
  if (gap >= -0.2) return { color: 'rgb(var(--warning))' };
  return { color: 'rgb(var(--danger))' };
}
function gapCellBg(gap: number): React.CSSProperties {
  if (gap >= 0)    return { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' };
  if (gap >= -0.2) return { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' };
  return { backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' };
}

interface GapHeader {
  label: string;
  w: number;
}

export const GapAnalysisTab: React.FC = () => {
  const { data, isLoading, isError } = useGapMatrix();
  const user = useAuthStore((s) => s.user);
  const isManager = isLeaderRole(user?.role);

  const [gradeFilter,     setGradeFilter]     = useState<string>('all');
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>('all');
  const [resourceSearch,  setResourceSearch]  = useState<string>('');
  const [breakdownView,   setBreakdownView]   = useState<'domain-resource' | 'skill-resource' | 'domain' | 'skill'>('skill-resource');
  const [downloading,     setDownloading]     = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch('/api/v1/reports/gap-report/download', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'gap_report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !data) return <Empty msg="Failed to load gap analysis." />;

  const { employees: allEmployees, domains, competencies } = data as GapMatrixResult;
  const grades = ['all', ...Array.from(new Set(allEmployees.map((e) => e.current_grade))).sort()];

  const visibleEmps: GapMatrixEmployee[] = allEmployees.filter((e) => {
    if (!isManager) return true;
    if (gradeFilter !== 'all' && e.current_grade !== gradeFilter) return false;
    if (selectedEmpCode !== 'all' && e.emp_code !== selectedEmpCode) return false;
    if (resourceSearch && !`${e.full_name} ${e.emp_code}`.toLowerCase().includes(resourceSearch.toLowerCase())) return false;
    return true;
  });

  // ── KPI summary ──────────────────────────────────────────────────────────────
  const avgScore     = visibleEmps.length > 0 ? visibleEmps.reduce((s, e) => s + e.overall_score, 0) / visibleEmps.length : 0;
  const avgThreshold = visibleEmps.length > 0 ? visibleEmps.reduce((s, e) => s + e.overall_threshold, 0) / visibleEmps.length : 0;
  const avgGap       = avgScore - avgThreshold;
  const readyCount   = visibleEmps.filter((e) => e.promotion_ready).length;

  // ── Chart: avg score vs threshold per domain ──────────────────────────────
  const domainChartData = domains.map((dn) => {
    const scored = visibleEmps.filter((e) => e.domain_gaps[dn]);
    const avgS = scored.length > 0 ? scored.reduce((s, e) => s + (e.domain_gaps[dn]?.score ?? 0), 0) / scored.length : 0;
    const avgT = scored.length > 0 ? scored.reduce((s, e) => s + (e.domain_gaps[dn]?.threshold ?? 0), 0) / scored.length : 0;
    return { name: dn.length > 14 ? dn.slice(0, 14) + '…' : dn, fullName: dn, score: Math.round(avgS * 100), target: Math.round(avgT * 100), gap: Math.round((avgS - avgT) * 100) };
  }).filter((d) => d.score > 0 || d.target > 0);

  const compChartData = competencies.map((comp) => {
    const scored = visibleEmps.filter((e) => e.competency_gaps[comp.name]);
    const avgS = scored.length > 0 ? scored.reduce((s, e) => s + (e.competency_gaps[comp.name]?.score ?? 0), 0) / scored.length : 0;
    const avgT = scored.length > 0 ? scored.reduce((s, e) => s + (e.competency_gaps[comp.name]?.threshold ?? 0), 0) / scored.length : 0;
    return { name: comp.name.length > 18 ? comp.name.slice(0, 18) + '…' : comp.name, fullName: comp.name, domain: comp.domain, score: Math.round(avgS * 100), target: Math.round(avgT * 100), gap: Math.round((avgS - avgT) * 100), is_critical: comp.is_critical };
  }).filter((d) => d.score > 0 || d.target > 0);

  // ── Grouped table: Domain → Grade → employees ────────────────────────────
  type EmpRow = {
    emp: GapMatrixEmployee;
    area: string;       // domain name (domain view) or skill name (comp view)
    score: number;
    threshold: number;
    gap: number;
    meets: boolean;
    is_critical?: boolean;
    domain?: string;    // only in skill view
  };

  // Build nested structure: domain → grade → rows
  type GradeGroup  = { grade: string; rows: EmpRow[]; avgScore: number; avgTarget: number; avgGap: number; metCount: number };
  type DomainGroup = { domain: string; grades: GradeGroup[] };

  const buildGroups = (): DomainGroup[] => {
    const isDomainMode = breakdownView === 'domain' || breakdownView === 'domain-resource';
    // Collect all rows flat
    const flat: EmpRow[] = [];
    for (const emp of visibleEmps) {
      if (isDomainMode) {
        for (const dn of domains) {
          const dg = emp.domain_gaps[dn];
          if (!dg) continue;
          flat.push({ emp, area: dn, score: dg.score, threshold: dg.threshold, gap: dg.gap, meets: dg.meets });
        }
      } else {
        for (const comp of competencies) {
          const cg = emp.competency_gaps[comp.name];
          if (!cg) continue;
          flat.push({ emp, area: comp.name, score: cg.score, threshold: cg.threshold, gap: cg.gap, meets: cg.meets, is_critical: cg.is_critical, domain: cg.domain });
        }
      }
    }

    // Domain order: from `domains` list (already sorted)
    const domainOrder = isDomainMode ? domains : Array.from(new Set(competencies.map(c => c.domain))).sort();

    const result: DomainGroup[] = [];
    for (const dn of domainOrder) {
      const domainRows = flat.filter(r => (isDomainMode ? r.area : r.domain) === dn);
      if (!domainRows.length) continue;

      // Group by grade (sorted)
      const gradeMap = new Map<string, EmpRow[]>();
      for (const row of domainRows) {
        const g = row.emp.current_grade;
        if (!gradeMap.has(g)) gradeMap.set(g, []);
        gradeMap.get(g)!.push(row);
      }

      const grades: GradeGroup[] = [];
      for (const [grade, rows] of Array.from(gradeMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
        const withTarget = rows.filter(r => r.threshold > 0);
        const scoreRows = withTarget.length > 0 ? withTarget : rows.filter(r => r.score > 0);
        const avgScore  = scoreRows.length  > 0 ? scoreRows.reduce((s, r) => s + r.score, 0) / scoreRows.length : 0;
        const avgTarget = withTarget.length > 0 ? withTarget.reduce((s, r) => s + r.threshold, 0) / withTarget.length : 0;
        grades.push({ grade, rows, avgScore, avgTarget, avgGap: avgScore - avgTarget, metCount: withTarget.filter(r => r.meets).length });
      }
      result.push({ domain: dn, grades });
    }
    return result;
  };

  const groupedData = buildGroups();
  const isSkillMode = breakdownView === 'skill' || breakdownView === 'skill-resource';
  const showPeople    = breakdownView === 'domain-resource' || breakdownView === 'skill-resource';
  const totalCols        = showPeople
    ? (isSkillMode ? 10 : 9)
    : (isSkillMode ? 8 : 7);

  return (
    <div className="space-y-5">

      {/* Filter bar — Manager/Admin only */}
      {isManager && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: 'rgb(var(--text-2))' }}>Filter People</p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
              <b style={{ color: 'rgb(var(--text-1))' }}>{visibleEmps.length}</b> of {allEmployees.length} people
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setSelectedEmpCode('all'); setResourceSearch(''); }}
              className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}>
              <option value="all">All Grades</option>
              {grades.filter((g) => g !== 'all').map((g) => <option key={g} value={g}>Grade: {g}</option>)}
            </select>
            <select value={selectedEmpCode} onChange={(e) => { setSelectedEmpCode(e.target.value); setGradeFilter('all'); setResourceSearch(''); }}
              className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))', minWidth: 200 }}>
              <option value="all">All People</option>
              {allEmployees.slice().sort((a, b) => a.full_name.localeCompare(b.full_name)).map((e) => (
                <option key={e.emp_code} value={e.emp_code}>{e.full_name} ({e.emp_code})</option>
              ))}
            </select>
            <input type="text" value={resourceSearch}
              onChange={(e) => { setResourceSearch(e.target.value); setSelectedEmpCode('all'); setGradeFilter('all'); }}
              placeholder="Search by name or ID…" className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))', minWidth: 180 }} />
            {(gradeFilter !== 'all' || selectedEmpCode !== 'all' || resourceSearch) && (
              <button onClick={() => { setGradeFilter('all'); setSelectedEmpCode('all'); setResourceSearch(''); }}
                className="px-3 py-1.5 text-xs rounded-lg border"
                style={{ borderColor: 'rgb(var(--danger))', color: 'rgb(var(--danger))', backgroundColor: 'rgb(var(--danger-soft))' }}>
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI cards + Download */}
      <div className="flex flex-wrap gap-3 items-stretch">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
          {[
            { label: 'People',   value: `${visibleEmps.length}`,              sub: `of ${allEmployees.length} total`,               color: 'rgb(var(--accent))' },
            { label: 'Team Score',  value: `${Math.round(avgScore * 100)}%`,     sub: `Needed: ${Math.round(avgThreshold * 100)}%`, color: avgScore >= avgThreshold ? 'rgb(var(--success))' : 'rgb(var(--warning))' },
            { label: 'Avg Gap',     value: `${avgGap >= 0 ? '+' : ''}${Math.round(avgGap * 100)}%`, sub: avgGap >= 0 ? 'On target' : 'Below target', color: avgGap >= 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' },
            { label: 'Ready',       value: `${readyCount} / ${visibleEmps.length}`, sub: 'Meets all needed skills',                  color: 'rgb(var(--success))' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>{label}</p>
              <p className="text-lg font-bold truncate" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-3))' }}>{sub}</p>
            </div>
          ))}
        </div>
        {isManager && (
          <button onClick={handleDownload} disabled={downloading}
            className="card p-4 flex flex-col items-center justify-center gap-2 min-w-[100px] transition-all"
            style={{ borderColor: 'rgb(var(--accent))', cursor: downloading ? 'wait' : 'pointer',
                     backgroundColor: downloading ? 'rgb(var(--surface-2))' : 'rgb(var(--accent-soft))' }}>
            <Download size={20} style={{ color: 'rgb(var(--accent))' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgb(var(--accent))' }}>
              {downloading ? 'Generating…' : 'Download Excel'}
            </span>
          </button>
        )}
      </div>

      {/* Parallel charts — Domain (left) + Skill (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {([
          { title: 'Achieved vs Needed — by Skill Area', subtitle: `${domainChartData.length} skill areas`, data: domainChartData,  yWidth: 122, gradId: 'grad-domain' },
          { title: 'Achieved vs Needed — by Skill',      subtitle: `${compChartData.length} skills`,       data: compChartData,    yWidth: 192, gradId: 'grad-comp'   },
        ] as const).map(({ title, subtitle, data, yWidth, gradId }) => {
          const chartH = Math.max(280, data.length * 34);
          return (
            <div key={title} className="card p-0 overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-bold" style={{ color: '#ffffff' }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9db0c8' }}>
                  Avg across <span style={{ color: '#f5c518', fontWeight: 600 }}>{visibleEmps.length}</span> people · {subtitle}
                </p>
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 14, height: 4, background: '#3b82f6', borderRadius: 2 }} />
                    <span style={{ fontSize: 10, color: '#9db0c8' }}>Achieved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 14, height: 0, borderTop: '2px dashed #f5c518' }} />
                    <span style={{ fontSize: 10, color: '#f5c518' }}>Needed score</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="px-2 py-2">
                <ResponsiveContainer width="100%" height={chartH}>
                  <ComposedChart data={data} layout="vertical"
                    barCategoryGap="30%" margin={{ left: 4, right: 54, top: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#1e40af" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" domain={[0, 100]}
                      tick={{ fontSize: 9, fill: '#5a7090' }} tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis type="category" dataKey="fullName" width={yWidth}
                      tick={{ fontSize: 9, fill: '#c8d8ea', fontWeight: 400 }}
                      axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        const gap = d.score - d.target;
                        return (
                          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', minWidth: 176 }}>
                            <p style={{ color: '#f5c518', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{d.fullName}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                                <span style={{ color: '#9db0c8', fontSize: 11 }}>Achieved</span>
                                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 11 }}>{d.score}%</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                                <span style={{ color: '#9db0c8', fontSize: 11 }}>Required</span>
                                <span style={{ color: '#f5c518', fontWeight: 700, fontSize: 11 }}>{d.target}%</span>
                              </div>
                              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '3px 0' }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                                <span style={{ color: '#9db0c8', fontSize: 11 }}>Gap</span>
                                <span style={{ fontWeight: 700, fontSize: 11, color: gap >= 0 ? '#34d399' : '#f87171' }}>
                                  {gap >= 0 ? '+' : ''}{gap}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* Current score bar. The needed score is shown by the dashed yellow line. */}
                    <Bar dataKey="score" name="Achieved" fill={`url(#${gradId})`}
                      radius={[0, 3, 3, 0]} maxBarSize={20}
                      background={{ fill: 'rgba(255,255,255,0.04)', radius: 3 }}
                    />
                    {/* Target dashed line */}
                    <Line dataKey="target" name="Target" stroke="#f5c518" strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={{ r: 3, fill: '#f5c518', stroke: '#0a0a0a', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#f5c518' }} label={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail table — with By Skill / By Skill Area toggle */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>Gap Details</p>
            <InfoTip text="Gap = Current score - needed score. Positive means above target. Negative means below target." />
          </div>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
            {([
              { v: 'skill-resource',     label: 'By Skill & Person'          },
              { v: 'domain-resource',    label: 'By Skill Area & Person'     },
              { v: 'skill',              label: 'By Skill'                   },
              { v: 'domain',             label: 'By Skill Area'              },
            ] as const).map(({ v, label }) => (
              <button key={v} onClick={() => setBreakdownView(v)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ backgroundColor: breakdownView === v ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))', color: breakdownView === v ? 'white' : 'rgb(var(--text-2))' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgb(var(--surface-3))', borderBottom: '2px solid rgb(var(--border))' }}>
                {[
                  showPeople ? { label: 'Person',       w: 160 } : null,
                  showPeople ? { label: 'Grade',        w: 60  } : null,
                  { label: 'Skill Area', w: isSkillMode ? 120 : 160 },
                  isSkillMode ? { label: 'Skill', w: 160 } : null,
                  !showPeople ? { label: 'Met', w: 72 } : null,
                  { label: 'Score',        w: 72  },
                  { label: 'Needed',       w: 72  },
                  { label: 'Level',        w: 52  },
                  { label: '★ Rating',     w: 90  },
                  { label: 'Gap',          w: 80  },
                  { label: 'Result',       w: 110 },
                ].filter((h): h is GapHeader => Boolean(h)).map((h) => (
                  <th key={h.label} className="px-3 py-2.5 text-left font-semibold"
                    style={{ color: 'rgb(var(--text-3))', minWidth: h.w, maxWidth: h.w }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.length === 0 && (
                <tr><td colSpan={totalCols} className="px-4 py-8 text-center text-xs" style={{ color: 'rgb(var(--text-3))' }}>No data to display.</td></tr>
              )}
              {groupedData.map((dg) => (
                <>
                  {/* ── Domain header row ── */}
                  <tr key={`dh-${dg.domain}`}
                    style={{ backgroundColor: '#0f2044', borderBottom: '2px solid rgb(var(--border))' }}>
                    <td colSpan={totalCols} className="px-4 py-2">
                      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: '#f5c518' }}>
                        {dg.domain}
                      </span>
                    </td>
                  </tr>

                  {dg.grades.map((gg) => (
                    <>
                      {/* ── Employee rows (resource tabs only) ── */}
                      {showPeople && gg.rows.map((row, ri) => (
                        <tr key={`${row.emp.emp_code}-${row.area}`}
                          style={{ borderBottom: '1px solid rgb(var(--border))', backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.3)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ri % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.3)')}>
                          {/* Resource */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="font-semibold text-[11px]" style={{ color: 'rgb(var(--text-1))' }}>{row.emp.full_name}</span>
                            <span className="ml-1 font-mono text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>- {row.emp.emp_code}</span>
                          </td>
                          {/* Grade */}
                          <td className="px-3 py-2 text-center">
                            <span className="badge badge-accent text-[10px] px-1.5 py-0.5">{row.emp.current_grade}</span>
                          </td>
                          {/* Skill Area */}
                          {isSkillMode && (
                            <td className="px-3 py-2 text-[10px]" style={{ color: 'rgb(var(--text-3))' }}>{row.domain}</td>
                          )}
                          {/* Skill or Skill Area */}
                          <td className="px-3 py-2">
                            <span className="font-medium" style={{ color: 'rgb(var(--text-1))' }}>{row.area}</span>
                            {row.is_critical && <span className="ml-1 text-[9px] font-bold" style={{ color: 'rgb(var(--danger))' }}>⚡</span>}
                          </td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: 'rgb(var(--accent))' }}>
                            {Math.round(row.score * 100)}%
                          </td>
                          <td className="px-3 py-2 text-center" style={{ color: 'rgb(var(--text-2))' }}>
                            {row.threshold > 0 ? `${Math.round(row.threshold * 100)}%` : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-[11px]" style={{ color: 'rgb(var(--text-2))' }}>
                              {row.score > 0 ? gapLevel(row.score) : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {row.score > 0 ? (
                              <div className="flex justify-center gap-px">{starRatingDisplay(gapStars(row.score))}</div>
                            ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                          </td>
                          <td className="px-3 py-2 text-center font-bold">
                            {row.threshold > 0 ? (
                              <span style={gapColor(row.gap)}>
                                {row.gap >= 0 ? '+' : ''}{Math.round(row.gap * 100)}%
                              </span>
                            ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {row.threshold > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                                style={row.meets
                                  ? { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' }
                                  : { backgroundColor: 'rgb(var(--danger-soft))',  color: 'rgb(var(--danger))' }}>
                                {row.meets ? '✓ Met' : '✗ Skills Gap'}
                              </span>
                            ) : <span style={{ color: 'rgb(var(--text-3))' }}>—</span>}
                          </td>
                        </tr>
                      ))}

                      {/* ── Group total row ── */}
                      <tr key={`gt-${dg.domain}-${gg.grade}`}
                        style={{ backgroundColor: '#000000', borderBottom: '2px solid #0f2044' }}>
                        {/* Label spans Resource + Grade cols when in resource view, else fills area col */}
                        {showPeople ? (
                          <>
                            <td className="px-3 py-2 font-bold text-[11px]" style={{ color: '#f5c518' }}>
                              {dg.domain} / {gg.grade} Total
                              <span className="ml-2 font-normal text-[10px]" style={{ color: '#a8b8d8' }}>
                                ({gg.rows.length} {gg.rows.length === 1 ? 'person' : 'people'})
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-[10px]" style={{ color: '#a8b8d8' }}>—</td>
                          </>
                        ) : (
                          <td className="px-3 py-2 font-bold text-[11px]" style={{ color: '#f5c518' }}>
                            {dg.domain} / {gg.grade} Total
                            <span className="ml-2 font-normal text-[10px]" style={{ color: '#a8b8d8' }}>
                              ({gg.rows.length} {gg.rows.length === 1 ? 'person' : 'people'})
                            </span>
                          </td>
                        )}
                        {isSkillMode ? (
                          <>
                            <td className="px-3 py-2 text-[10px] font-semibold" style={{ color: '#a8b8d8' }}>
                              {showPeople ? dg.domain : 'All skills'}
                            </td>
                            <td className="px-3 py-2 text-[10px] font-semibold" style={{ color: '#a8b8d8' }}>
                              {gg.metCount}/{gg.rows.filter(r => r.threshold > 0).length} met
                            </td>
                          </>
                        ) : (
                          <td className="px-3 py-2 text-[10px] font-semibold" style={{ color: '#a8b8d8' }}>
                            {gg.metCount}/{gg.rows.filter(r => r.threshold > 0).length} met
                          </td>
                        )}
                        {/* Avg Score */}
                        <td className="px-3 py-2 text-center font-bold" style={{ color: '#7ec8f0' }}>
                          {gg.avgScore > 0 ? `${Math.round(gg.avgScore * 100)}%` : '—'}
                        </td>
                        {/* Avg Target */}
                        <td className="px-3 py-2 text-center font-bold" style={{ color: '#a8b8d8' }}>
                          {gg.avgTarget > 0 ? `${Math.round(gg.avgTarget * 100)}%` : '—'}
                        </td>
                        {/* Level */}
                        <td className="px-3 py-2 text-center font-bold text-[11px]" style={{ color: '#f5c518' }}>
                          {gg.avgScore > 0 ? gapLevel(gg.avgScore) : '—'}
                        </td>
                        {/* Stars */}
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {gg.avgScore > 0 ? (
                            <div className="flex justify-center gap-px">{starRatingDisplay(gapStars(gg.avgScore))}</div>
                          ) : <span style={{ color: '#a8b8d8' }}>—</span>}
                        </td>
                        {/* Avg Gap */}
                        <td className="px-3 py-2 text-center font-bold">
                          {gg.avgTarget > 0 ? (
                            <span style={gapColor(gg.avgGap)}>
                              {gg.avgGap >= 0 ? '+' : ''}{Math.round(gg.avgGap * 100)}%
                            </span>
                          ) : <span style={{ color: '#a8b8d8' }}>—</span>}
                        </td>
                        {/* Status summary */}
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                            style={gg.avgGap >= 0
                              ? { backgroundColor: 'rgba(16,185,129,0.25)', color: '#34d399' }
                              : { backgroundColor: 'rgba(239,68,68,0.25)',   color: '#f87171' }}>
                            {gg.avgGap >= 0 ? '✓ On Track' : '✗ Below Target'}
                          </span>
                        </td>
                      </tr>
                    </>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t text-xs" style={{ borderColor: 'rgb(var(--border))' }}>
          <span className="font-semibold" style={{ color: 'rgb(var(--text-3))' }}>Gap legend:</span>
          <span style={{ color: 'rgb(var(--text-3))' }}>Gap = Achieved - Required.</span>
          {[
            { label: '≥ 0% Met',         style: gapCellBg(0.1)  },
            { label: '-20% to 0% Close', style: gapCellBg(-0.1) },
            { label: '< -20% Gap',       style: gapCellBg(-0.3) },
          ].map(({ label, style }) => (
            <span key={label} className="px-2 py-0.5 rounded font-bold" style={style}>{label}</span>
          ))}
          <span style={{ color: 'rgb(var(--text-3))' }}>⚡ Critical skill</span>
          <span className="ml-auto" style={{ color: 'rgb(var(--text-3))' }}>
            Level: L1 &lt;40% · L2 40–60% · L3 60–75% · L4 75–95% · L5 ≥95%
          </span>
        </div>
      </div>
    </div>
  );
};
