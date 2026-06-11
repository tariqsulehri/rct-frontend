import React, { useState } from 'react';
import { BarChart2, Table2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, LabelList, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { useCompetencyMatrix, useGapMatrix, type CompetencyMatrixEmployee, type CompetencyMatrixResult } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { useAuthStore } from '@/store/authStore';
import { isLeaderRole } from '@/types/rbac';
import { Empty, InfoTip, Loading } from '../shared';

// ─────────────────────────────────────────────────────────────────────────────
// ── Competency Matrix (Scores) ────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// Score cell colour helper
function cellBg(score: number): React.CSSProperties {
  if (score <= 0)   return { backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-3))' };
  if (score >= 0.6) return { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' };
  if (score >= 0.4) return { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' };
  return { backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' };
}

const rotatedHeaderTextStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'normal',
  overflowWrap: 'normal',
  hyphens: 'none',
  lineHeight: 1.18,
  letterSpacing: '0.1px',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

interface RadarTickProps {
  payload?: { value: string };
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  index?: number;
}

export const CompetencyScoresTab: React.FC = () => {
  const { data, isLoading, isError } = useCompetencyMatrix();
  const { data: gapData } = useGapMatrix();
  const c = useChartColors();
  const user = useAuthStore((s) => s.user);
  const isManager = isLeaderRole(user?.role);

  const [domainFilter,    setDomainFilter]    = useState<string>('All');
  const [gradeFilter,     setGradeFilter]     = useState<string>('all');
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>('all');
  const [resourceSearch,  setResourceSearch]  = useState<string>('');
  const [view, setView]                       = useState<'heatmap' | 'charts'>('heatmap');
  const [selectedEmp, setSelectedEmp]         = useState<string | null>(null);

  const competencyData: CompetencyMatrixResult = data ?? { employees: [], competencies: [] };
  const allEmployees: CompetencyMatrixEmployee[] = competencyData.employees;
  const allComps = competencyData.competencies;

  // Derived domains + grades
  const domains = ['All', ...Array.from(new Set(allComps.map((c) => c.domain))).sort()];
  const grades  = ['all', ...Array.from(new Set(allEmployees.map((e) => e.current_grade))).sort()];

  // Filtered lists
  const visibleComps = domainFilter === 'All'
    ? allComps
    : allComps.filter((c) => c.domain === domainFilter);

  const visibleEmps = allEmployees.filter((e) => {
    if (!isManager) return true;
    if (gradeFilter !== 'all' && e.current_grade !== gradeFilter) return false;
    if (selectedEmpCode !== 'all' && e.emp_code !== selectedEmpCode) return false;
    if (resourceSearch && !`${e.full_name} ${e.emp_code}`.toLowerCase().includes(resourceSearch.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <Loading />;
  if (isError || !data) return <Empty msg="Failed to load competency matrix." />;

  // Summary stats
  const avgScore = allEmployees.length > 0
    ? allEmployees.reduce((s, e) => s + e.overall_score, 0) / allEmployees.length
    : 0;

  const compAvgs = allComps.map((comp) => {
    const scores = allEmployees.map((e: CompetencyMatrixEmployee) => e.competency_scores[comp.name]?.score ?? 0);
    const assessed = scores.filter((s) => s > 0);
    return {
      name: comp.name,
      domain: comp.domain,
      is_critical: comp.is_critical,
      avg: assessed.length > 0 ? assessed.reduce((a, b) => a + b, 0) / assessed.length : 0,
      coverage: Math.round((assessed.length / allEmployees.length) * 100),
    };
  }).sort((a, b) => b.avg - a.avg);

  const bestComp  = compAvgs[0];
  const worstComp = compAvgs[compAvgs.length - 1];
  const zeroComps = compAvgs.filter((c) => c.avg === 0).length;

  // Domain-grouped competency averages (for cards + charts)
  const domainGroups = domains.filter((d) => d !== 'All').map((domain, di) => {
    const comps = compAvgs.filter((c) => c.domain === domain);
    const domAvg = comps.length > 0 ? comps.reduce((s: number, c) => s + c.avg, 0) / comps.length : 0;
    return { domain, comps, domAvg, color: c.domains[di % c.domains.length] };
  });

  const visibleEmpCodes = new Set(visibleEmps.map((e) => e.emp_code));
  const visibleGapRows = (gapData?.employees ?? []).filter((e) => visibleEmpCodes.has(e.emp_code));
  const avgDomainThresholdPct = (domain: string) => {
    const thresholds = visibleGapRows
      .map((e) => e.domain_gaps[domain]?.threshold ?? 0)
      .filter((threshold) => threshold > 0);
    return thresholds.length > 0
      ? Math.round((thresholds.reduce((sum, threshold) => sum + threshold, 0) / thresholds.length) * 100)
      : 0;
  };
  const avgCompetencyThresholdPct = (competency: string) => {
    const thresholds = visibleGapRows
      .map((e) => e.competency_gaps[competency]?.threshold ?? 0)
      .filter((threshold) => threshold > 0);
    return thresholds.length > 0
      ? Math.round((thresholds.reduce((sum, threshold) => sum + threshold, 0) / thresholds.length) * 100)
      : 0;
  };
  const domainRadarData = domainGroups.map((dg) => {
    const score = Math.round(dg.domAvg * 100);
    const required = avgDomainThresholdPct(dg.domain);
    return { domain: dg.domain, score, required, meets: required > 0 && score >= required, color: dg.color };
  });

  // Chart data: bar chart of all competency team averages
  const barData = (domainFilter === 'All' ? compAvgs : compAvgs.filter((c) => c.domain === domainFilter))
    .map((comp) => ({
      name: comp.name.length > 16 ? comp.name.slice(0, 16) + '…' : comp.name,
      fullName: comp.name,
      avg: Math.round(comp.avg * 100),
      coverage: comp.coverage,
      domain: comp.domain,
      is_critical: comp.is_critical,
      color: domainGroups.find((d) => d.domain === comp.domain)?.color ?? c.accent,
    }))
    .sort((a, b) => a.avg - b.avg); // ascending for horizontal bar

  // Selected employee for individual radar
  const selectedEmpData = selectedEmp
    ? allEmployees.find((e) => e.emp_code === selectedEmp)
    : null;

  const radarData = visibleComps.map((comp) => ({
    comp: comp.name,   // full name — rendered by custom tick
    fullName: comp.name,
    team: Math.round((compAvgs.find((c) => c.name === comp.name)?.avg ?? 0) * 100),
    selected: selectedEmpData
      ? Math.round((selectedEmpData.competency_scores[comp.name]?.score ?? 0) * 100)
      : undefined,
    required: avgCompetencyThresholdPct(comp.name),
    color: domainGroups.find((d) => d.domain === comp.domain)?.color ?? c.accent,
  }));

  return (
    <div className="space-y-5">

      {/* Filter bar */}
      <div className="space-y-2">
        {/* Domain pills — always visible */}
        <div className="flex flex-wrap gap-1.5 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: domainFilter === d ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
                  color:           domainFilter === d ? 'white'              : 'rgb(var(--text-2))',
                  border: '1px solid ' + (domainFilter === d ? 'rgb(var(--accent))' : 'rgb(var(--border))'),
                }}
              >
                {d}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
            {(['charts', 'heatmap'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ backgroundColor: view === v ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))', color: view === v ? 'white' : 'rgb(var(--text-2))' }}
              >
                {v === 'charts' ? <BarChart2 size={11} /> : <Table2 size={11} />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Resource filters — Manager/Admin only */}
        {isManager && (
          <div className="rounded-xl border p-3 flex flex-wrap gap-2 items-center" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
            <span className="text-xs font-semibold mr-1" style={{ color: 'rgb(var(--text-3))' }}>Filter:</span>
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setSelectedEmpCode('all'); setResourceSearch(''); }}
              className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
            >
              <option value="all">All Grades</option>
              {grades.filter((g) => g !== 'all').map((g) => (
                <option key={g} value={g}>Grade: {g}</option>
              ))}
            </select>
            <select
              value={selectedEmpCode}
              onChange={(e) => { setSelectedEmpCode(e.target.value); setGradeFilter('all'); setResourceSearch(''); }}
              className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))', minWidth: 200 }}
            >
              <option value="all">All Resources</option>
              {allEmployees.slice().sort((a, b) => a.full_name.localeCompare(b.full_name)).map((e) => (
                <option key={e.emp_code} value={e.emp_code}>{e.full_name} ({e.emp_code})</option>
              ))}
            </select>
            <input
              type="text"
              value={resourceSearch}
              onChange={(e) => { setResourceSearch(e.target.value); setSelectedEmpCode('all'); setGradeFilter('all'); }}
              placeholder="Search by name or ID…"
              className="rounded-lg px-3 py-1.5 text-xs border"
              style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))', minWidth: 180 }}
            />
            {(gradeFilter !== 'all' || selectedEmpCode !== 'all' || resourceSearch) && (
              <button
                onClick={() => { setGradeFilter('all'); setSelectedEmpCode('all'); setResourceSearch(''); }}
                className="px-3 py-1.5 text-xs rounded-lg border"
                style={{ borderColor: 'rgb(var(--danger))', color: 'rgb(var(--danger))', backgroundColor: 'rgb(var(--danger-soft))' }}
              >
                Reset
              </button>
            )}
            <span className="text-xs ml-auto" style={{ color: 'rgb(var(--text-3))' }}>
              <b style={{ color: 'rgb(var(--text-1))' }}>{visibleEmps.length}</b> of {allEmployees.length} resources
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Resources',   value: `${visibleEmps.length}`,                   sub: `of ${allEmployees.length} total`,                                                   color: 'rgb(var(--accent))' },
          { label: 'Team Score',  value: `${Math.round(avgScore * 100)}%`,           sub: `${visibleComps.length} skills`,                                                     color: avgScore >= 0.6 ? 'rgb(var(--success))' : avgScore >= 0.4 ? 'rgb(var(--warning))' : 'rgb(var(--danger))' },
          { label: 'Best',        value: bestComp?.name ?? '—',                      sub: `${Math.round((bestComp?.avg ?? 0) * 100)}% avg`,                                   color: 'rgb(var(--success))' },
          { label: 'Needs Focus', value: worstComp?.name ?? '—',                     sub: `${Math.round((worstComp?.avg ?? 0) * 100)}% avg · ${zeroComps} no data`,           color: 'rgb(var(--danger))' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>{label}</p>
            <p className="text-lg font-bold truncate" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-3))' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts view */}
      {view === 'charts' && (
        <div className="space-y-5">

          {/* Team average per competency — horizontal bar */}
          <div className="card p-5">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Team Average by Skill</p>
              <InfoTip text="Average current score for each skill across the selected resources." />
            </div>
            <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
              Avg score across {allEmployees.length} resources · {domainFilter !== 'All' ? domainFilter : 'All skill areas'}
            </p>
            <ResponsiveContainer width="100%" height={Math.max(280, barData.length * 28)}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 60, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }}
                  tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130}
                  tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle(c)}>
                        <p className="font-bold text-xs mb-1" style={{ color: d.color }}>{d.fullName}</p>
                        <p style={{ color: c.text }}>Skill Area: {d.domain}</p>
                        <p style={{ color: c.text }}>Team avg: <b style={{ color: d.color }}>{d.avg}%</b></p>
                        <p style={{ color: c.text }}>Coverage: <b>{d.coverage}%</b> of resources</p>
                        {d.is_critical && <p style={{ color: 'rgb(var(--danger))' }}>Important skill</p>}
                      </div>
                    );
                  }}
                  cursor={{ fill: c.grid, opacity: 0.25 }}
                />
                <Bar dataKey="avg" radius={[0, 5, 5, 0]} maxBarSize={20}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  <LabelList dataKey="avg" position="right" formatter={(v: number) => v > 0 ? `${v}%` : ''}
                    style={{ fontSize: 10, fill: c.text }} />
                </Bar>
                <ReferenceLine
                  x={60}
                  stroke={c.warning}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: 'Min Expected (60%)', position: 'insideTopRight', fill: c.warning, fontSize: 9, fontWeight: 600 }}
                />
                <ReferenceLine
                  x={80}
                  stroke={c.success}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: 'Strong (80%)', position: 'insideTopLeft', fill: c.success, fontSize: 9, fontWeight: 600 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Row 2: Domain Radar + Top Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Domain-level radar — 12 spokes, clean overview */}
            <div className="card p-5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Skill Area Coverage</p>
                <InfoTip text="Team average score for each skill area." />
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>Team average score per skill area</p>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart
                  data={domainRadarData}
                  outerRadius="62%" margin={{ top: 28, right: 90, bottom: 28, left: 90 }}>
                  <PolarGrid stroke={c.radarGrid} />
                  <PolarAngleAxis dataKey="domain"
                    tick={(props: RadarTickProps) => {
                      const { payload, x = 0, y = 0, cx = 0 } = props;
                      const dx = x - cx;
                      const anchor = dx > 10 ? 'start' : dx < -10 ? 'end' : 'middle';
                      const dg = domainGroups.find((d) => d.domain === payload?.value);
                      const col = dg?.color ?? '#d1d5db';
                      return (
                        <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
                          fontSize={11} fontWeight={600} fill={col}>
                          {payload?.value ?? ''}
                        </text>
                      );
                    }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: c.radarTick }} tickFormatter={(v) => `${v}%`} angle={30} />
                  <Radar name="Score" dataKey="score" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2} />
                  {domainRadarData.some((d) => d.required > 0) && (
                    <Radar name="Required" dataKey="required" stroke={c.warning} fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
                  )}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: d.color }}>{d.domain}</p>
                          <p style={{ color: c.text }}>Score: <b>{d.score}%</b></p>
                          {d.required > 0 && (
                            <p style={{ color: d.meets ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>
                              Required: {d.required}% ({d.meets ? 'Meets' : 'Below'})
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  {domainRadarData.some((d) => d.required > 0) && (
                    <Legend formatter={(v) => <span style={{ color: '#d1d5db', fontSize: 12 }}>{v}</span>} />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom 12 competencies by team avg */}
            <div className="card p-5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Lowest Skill Scores</p>
                <InfoTip text="The lowest team-average skills. These are good focus areas for improvement." />
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>12 lowest team-average skills — priority focus areas</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={[...compAvgs].sort((a, b) => a.avg - b.avg).slice(0, 12).map((c2) => ({
                    name: c2.name.length > 22 ? c2.name.slice(0, 22) + '…' : c2.name,
                    fullName: c2.name,
                    avg: Math.round(c2.avg * 100),
                    color: domainGroups.find((d) => d.domain === c2.domain)?.color ?? c.accent,
                  }))}
                  layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }} barCategoryGap="18%">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={160}
                    tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: d.color }}>{d.fullName}</p>
                          <p style={{ color: '#d1d5db' }}>Team avg: <b>{d.avg}%</b></p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {[...compAvgs].sort((a, b) => a.avg - b.avg).slice(0, 12).map((entry, i) => (
                      <Cell key={i} fill={domainGroups.find((d) => d.domain === entry.domain)?.color ?? c.accent} />
                    ))}
                    <LabelList dataKey="avg" position="right" formatter={(v: number) => `${v}%`}
                      style={{ fontSize: 10, fill: '#94a3b8' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Full Competency Radar */}
          <div className="grid grid-cols-1 gap-5">

            {/* Team radar */}
            <div className="card p-5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>Skill Comparison Radar</p>
                <InfoTip text="Compares team average skill scores. You can also compare one person against the team." />
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                {selectedEmpData ? `Comparing ${selectedEmpData.full_name.split(' ')[0]} vs team` : 'Team average across all skills'}
              </p>
              <div className="mb-2">
                <select
                  value={selectedEmp ?? ''}
                  onChange={(e) => setSelectedEmp(e.target.value || null)}
                  className="w-full rounded-lg px-3 py-1.5 text-xs border"
                  style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))', color: 'rgb(var(--text-1))' }}
                >
                  <option value="">Team average only</option>
                  {allEmployees.map((e) => (
                    <option key={e.emp_code} value={e.emp_code}>{e.full_name} ({e.emp_code})</option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={900}>
                <RadarChart data={radarData} outerRadius="59%"
                  margin={{ top: 24, right: 190, bottom: 40, left: 190 }}>
                  <PolarGrid stroke={c.radarGrid} />
                  <PolarAngleAxis dataKey="comp"
                    tick={(props: RadarTickProps) => {
                      const { payload, x = 0, y = 0, cx = 0, cy = 0, index = 0 } = props;
                      const dx = x - cx;
                      const dy = y - cy;
                      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                      const ux = dx / dist;
                      const uy = dy / dist;

                      // Domain colour for this competency
                      const labelColor = radarData[index]?.color ?? '#d1d5db';

                      // 3-tier stagger keeps dense labels readable around the radar.
                      // Every 3 adjacent labels spread across 3 distinct radial rings
                      const RINGS = [20, 65, 110];
                      const textOffset = RINGS[index % 3];
                      const lx = cx + ux * (dist + textOffset);
                      const ly = cy + uy * (dist + textOffset);

                      // Hairline in matching domain colour
                      const lineX1 = cx + ux * (dist + 3);
                      const lineY1 = cy + uy * (dist + 3);
                      const lineX2 = cx + ux * (dist + textOffset - 6);
                      const lineY2 = cy + uy * (dist + textOffset - 6);

                      const anchor = dx > 10 ? 'start' : dx < -10 ? 'end' : 'middle';
                      return (
                        <g>
                          <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2}
                            stroke={labelColor} strokeWidth={0.9} strokeOpacity={0.7} />
                          <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                            fontFamily={`"Arial Narrow", "Roboto Condensed", "Inter Tight", Arial, sans-serif`}
                            fontSize={12} fontWeight={700} letterSpacing={0}
                            paintOrder="stroke" stroke="rgba(2, 6, 23, 0.72)" strokeWidth={2.5}
                            fill={labelColor}>
                            {payload?.value ?? ''}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 11, fill: c.radarTick }}
                    tickFormatter={(v) => `${v}%`} angle={30} />
                  <Radar name="Team Avg" dataKey="team" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2.5} />
                  {radarData.some((d) => d.required > 0) && (
                    <Radar name="Required" dataKey="required" stroke={c.warning} fill="none" strokeWidth={1.5} strokeDasharray="5 3" />
                  )}
                  {selectedEmpData && (
                    <Radar name={selectedEmpData.full_name.split(' ')[0]} dataKey="selected"
                      stroke={c.success} fill={c.success} fillOpacity={0.18} strokeWidth={2} strokeDasharray="4 2" />
                  )}
                  <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} contentStyle={tooltipStyle(c)} />
                  {(selectedEmpData || radarData.some((d) => d.required > 0)) && (
                    <Legend
                      wrapperStyle={{ paddingTop: 8 }}
                      formatter={(v) => (
                        <span style={{ color: '#d1d5db', fontSize: 13, paddingRight: 28 }}>
                          {v}
                        </span>
                      )}
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      )}

      {/* Heatmap view */}
      {view === 'heatmap' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgb(var(--accent-soft))', borderBottom: '1px solid rgb(var(--accent))', height: 136 }}>
                  <th className="px-2 py-2 text-left sticky left-0 z-20"
                    style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))', minWidth: 132, maxWidth: 132, boxShadow: 'inset -1px 0 0 rgb(var(--accent))' }}>
                    Resource ({visibleEmps.length})
                  </th>
                  <th className="px-1 py-2 text-center"
                    style={{ color: 'rgb(var(--accent-txt))', minWidth: 44, maxWidth: 44, boxShadow: 'inset -1px 0 0 rgb(var(--accent))' }}>
                    Grade
                  </th>
                  {visibleComps.map((comp, ci) => (
                    <th key={comp.name} className="px-0 py-1 text-center font-semibold align-top"
                      style={{ color: 'rgb(var(--accent-txt))', minWidth: 58, maxWidth: 58, borderLeft: ci === 0 ? '2px solid rgb(var(--accent))' : '1px solid rgb(var(--accent) / 0.55)' }}>
                      <div className="flex h-full items-center justify-center" style={{ minHeight: 122 }}>
                        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center', whiteSpace: 'normal', width: 120, maxWidth: 120, textAlign: 'center', fontSize: 9.8, fontWeight: 850 }}>
                          <span style={rotatedHeaderTextStyle}>
                            <span style={{ color: comp.is_critical ? '#f59e0b' : 'rgb(var(--accent-txt))', fontWeight: 900 }}>
                              {comp.is_critical ? '⚡ ' : '• '}
                            </span>
                            {comp.name}
                          </span>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-bold"
                    style={{ color: 'rgb(var(--accent-txt))', borderLeft: '2px solid rgb(var(--accent))', minWidth: 58, maxWidth: 58 }}>
                    Overall
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Team Average row */}
                <tr style={{ backgroundColor: 'rgb(var(--accent-soft))', borderBottom: '2px solid rgb(var(--border))' }}>
                  <td className="px-2 py-2 font-bold sticky left-0 z-10"
                    style={{ backgroundColor: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent-txt))' }}>
                    Team Average
                  </td>
                  <td className="px-1 py-2 text-center" style={{ color: 'rgb(var(--text-3))' }}>—</td>
                  {visibleComps.map((comp, ci) => {
                    const assessed = visibleEmps.map((e) => e.competency_scores[comp.name]?.score ?? 0).filter((s) => s > 0);
                    const avg = assessed.length > 0 ? assessed.reduce((a, b) => a + b, 0) / assessed.length : 0;
                    return (
                      <td key={comp.name} className="px-0.5 py-2 text-center"
                        style={{ borderLeft: ci === 0 ? '2px solid rgb(var(--border))' : '1px solid rgb(var(--border))' }}>
                        <span className="inline-block px-0.5 py-0.5 rounded text-[10px] font-bold w-full text-center"
                          style={avg > 0 ? cellBg(avg) : { color: 'rgb(var(--text-3))' }}>
                          {avg > 0 ? `${Math.round(avg * 100)}%` : '—'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-1 py-2 text-center font-bold"
                    style={{ color: 'rgb(var(--accent))', borderLeft: '2px solid rgb(var(--border))' }}>
                    {visibleEmps.length > 0
                      ? `${Math.round((visibleEmps.reduce((s, e) => s + e.overall_score, 0) / visibleEmps.length) * 100)}%`
                      : '—'}
                  </td>
                </tr>
                {/* Employee rows */}
                {visibleEmps.map((emp, ri) => (
                  <tr key={emp.emp_code}
                    style={{ borderBottom: '1px solid rgb(var(--border))', backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.35)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ri % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.35)')}>
                    <td className="px-2 py-2 sticky left-0 z-10" style={{ backgroundColor: 'inherit', maxWidth: 132 }}>
                      <div className="truncate">
                        <span className="font-semibold text-[10px]" style={{ color: 'rgb(var(--text-1))' }}>{emp.full_name}</span>
                      </div>
                      <div className="font-mono text-[9px] truncate" style={{ color: 'rgb(var(--text-3))' }}>{emp.emp_code}</div>
                    </td>
                    <td className="px-1 py-2 text-center whitespace-nowrap">
                      <span className="badge badge-accent text-[9px] px-1 py-0.5">{emp.current_grade}</span>
                    </td>
                    {visibleComps.map((comp, ci) => {
                      const score = emp.competency_scores[comp.name]?.score ?? 0;
                      return (
                        <td key={comp.name} className="px-0.5 py-1 text-center"
                          style={{ borderLeft: ci === 0 ? '2px solid rgb(var(--border))' : '1px solid rgb(var(--border))' }}>
                          {score > 0 ? (
                            <span className="inline-block px-0.5 py-0.5 rounded text-[10px] font-bold w-full text-center" style={cellBg(score)}>
                              {Math.round(score * 100)}%
                            </span>
                          ) : (
                            <span className="text-[9px]" style={{ color: 'rgb(var(--text-3))' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-1 py-2 text-center font-bold"
                      style={{ color: 'rgb(var(--accent))', borderLeft: '2px solid rgb(var(--border))' }}>
                      {Math.round(emp.overall_score * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t flex-wrap" style={{ borderColor: 'rgb(var(--border))' }}>
            <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-3))' }}>Score legend:</span>
            <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>Blank means not assessed.</span>
            {[
              { label: '≥60% Strong',    style: cellBg(0.7) },
              { label: '40–60% Fair',    style: cellBg(0.5) },
              { label: '<40% Gap',       style: cellBg(0.2) },
              { label: '— Not assessed', style: { color: 'rgb(var(--text-3))' } as React.CSSProperties },
            ].map(({ label, style }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold" style={style}>{label}</span>
              </div>
            ))}
            <span className="text-xs ml-2" style={{ color: 'rgb(var(--text-3))' }}>Important skill</span>
          </div>
        </div>
      )}
    </div>
  );
};
