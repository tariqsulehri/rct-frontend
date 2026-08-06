import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { usePromotionReadiness, useCompetencyScores } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export interface TeamHealthChartsProps {
  onNavigate: (t: TabType) => void;
}

export const TeamHealthCharts: React.FC<TeamHealthChartsProps> = ({ onNavigate }) => {
  const { data: promoData } = usePromotionReadiness();
  const { data: compData } = useCompetencyScores();
  const c = useChartColors();
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const allRows = promoData ?? [];
  const allCompRows = compData ?? [];

  const hasData = allRows.some((r) => r.overall_score > 0) || allCompRows.some((r) => r.overall_score > 0);

  if (!hasData) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-1))' }}>
          No assessment data yet
        </p>
        <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-2))' }}>
          Start assessing team members in Team Roster. Charts populate automatically.
        </p>
        <button onClick={() => onNavigate('team')} className="btn-primary text-sm">
          Go to Team Roster →
        </button>
      </div>
    );
  }

  const gradeOptions = Array.from(new Set(allRows.map((r) => r.current_grade).filter(Boolean))).sort((a, b) => {
    const an = Number.parseInt(a.replace(/\D+/g, ''), 10);
    const bn = Number.parseInt(b.replace(/\D+/g, ''), 10);
    if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
    return a.localeCompare(b);
  });

  const employeeOptions = [...allRows]
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((r) => ({
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

  const hasFilteredData = rows.some((r) => r.overall_score > 0) || compRows.some((r) => r.overall_score > 0);

  // ── Derived analytics data ───────────────────────────────────────────────
  const readyCount = rows.filter((r) => r.promotion_ready).length;
  const notReady = rows.length - readyCount;

  const donutData = [
    { name: 'Ready', value: readyCount, fill: c.success },
    { name: 'Not Ready', value: notReady, fill: c.warning },
  ];

  const domains = compRows.length > 0 ? Object.keys(compRows[0].domain_scores) : [];
  const domainBars = domains
    .map((d, i) => ({
      domain: d,
      short: d.length > 10 ? d.slice(0, 10) + '…' : d,
      avg: Math.round((compRows.reduce((s, r) => s + (r.domain_scores[d] ?? 0), 0) / compRows.length) * 100),
      max: Math.round(Math.max(...compRows.map((r) => r.domain_scores[d] ?? 0)) * 100),
      color: c.domains[i % c.domains.length],
    }))
    .sort((a, b) => b.avg - a.avg);

  const domainMax = Math.max(...domainBars.map((d) => d.max), 10);
  const domainAxisMax = Math.ceil((domainMax * 1.25) / 5) * 5;

  const promoMap = new Map(allRows.map((r) => [r.employee_id, r]));

  const topPerformers = [...rows]
    .filter((r) => r.overall_score > 0)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 8)
    .map((r, i) => {
      const promo = promoMap.get(r.employee_id);
      return {
        rank: i + 1,
        name: r.full_name.split(' ').slice(0, 2).join(' '),
        grade: r.current_grade,
        targetGrade: promo?.target_grade ?? r.target_grade,
        score: Math.round(r.overall_score * 100),
        required: promo?.avg_threshold ? Math.round(promo.avg_threshold * 100) : null,
        ready: promo?.promotion_ready ?? false,
        meets: promo?.meets_count ?? 0,
        total: promo?.total_competencies ?? 0,
      };
    });

  const perfMax = Math.max(...topPerformers.map((d) => d.score), 5);

  const activeFilterText =
    selectedEmployeeId !== 'all'
      ? `Resource ${selectedEmployeeId}`
      : selectedGrade !== 'all'
        ? `Grade ${selectedGrade}`
        : 'All people';

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
              View Data For
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
              Showing results for:{' '}
              <span className="font-semibold" style={{ color: 'rgb(var(--accent))' }}>
                {activeFilterText}
              </span>
            </p>
          </div>
          <button
            type="button"
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
            <label
              className="text-xs font-semibold uppercase tracking-wide mb-1 block"
              style={{ color: 'rgb(var(--text-3))' }}
            >
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
              style={{
                backgroundColor: 'rgb(var(--surface-2))',
                borderColor: 'rgb(var(--border))',
                color: 'rgb(var(--text-1))',
              }}
            >
              <option value="all">All Grades</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wide mb-1 block"
              style={{ color: 'rgb(var(--text-3))' }}
            >
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
              style={{
                backgroundColor: 'rgb(var(--surface-2))',
                borderColor: 'rgb(var(--border))',
                color: 'rgb(var(--text-1))',
              }}
            >
              <option value="all">All People</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasFilteredData && (
        <div className="card p-8 text-center">
          <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(var(--text-1))' }}>
            No data for selected filter
          </p>
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
                  <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                    Skill Areas
                  </p>
                  <InfoTip text="A skill area groups related skills, such as Cloud, SRE, Security, or AI Ops." />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-3))' }}>
                  Average team score by skill area. Best score shows the strongest individual result.
                </p>
              </div>
              <button type="button" onClick={() => onNavigate('reports')} className="btn-ghost text-xs py-1 px-2">
                Details →
              </button>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={domainBars} margin={{ top: 20, right: 16, bottom: 4, left: 0 }} barCategoryGap="25%">
                <XAxis dataKey="short" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, domainAxisMax]}
                  tick={{ fontSize: 10, fill: c.text }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = domainBars.find((x) => x.short === label);
                    return (
                      <div style={tooltipStyle(c)}>
                        <p className="font-bold text-xs mb-1.5" style={{ color: d?.color ?? c.accent }}>
                          {d?.domain ?? label}
                        </p>
                        <p style={{ color: c.text }}>
                          Team avg: <b style={{ color: d?.color }}>{payload[0]?.value}%</b>
                        </p>
                        <p style={{ color: c.text }}>
                          Best score: <b style={{ color: c.success }}>{payload[1]?.value}%</b>
                        </p>
                      </div>
                    );
                  }}
                  cursor={{ fill: c.grid, opacity: 0.25 }}
                />
                <Bar dataKey="avg" name="Team Avg" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {domainBars.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.85} />
                  ))}
                  <LabelList
                    dataKey="avg"
                    position="top"
                    fontSize={10}
                    fontWeight={600}
                    formatter={(v: number) => (v > 0 ? `${v}%` : '')}
                    style={{ fill: c.text }}
                  />
                </Bar>
                <Bar dataKey="max" name="Best" radius={[5, 5, 0, 0]} maxBarSize={48} fillOpacity={0.25}>
                  {domainBars.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                  <LabelList
                    dataKey="max"
                    position="top"
                    fontSize={10}
                    fontWeight={600}
                    formatter={(v: number) => (v > 0 ? `${v}%` : '')}
                    style={{ fill: c.success }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Color legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
              {domainBars.map((d) => (
                <div key={d.domain} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="text-xs" style={{ color: c.text }}>
                    {d.domain} <b style={{ color: d.color }}>{d.avg}%</b>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 2: 3-column ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Readiness donut */}
            <div className="card p-5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                  Ready For Next Grade
                </p>
                <InfoTip text="A person is ready when all required skills for their target grade are met." />
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                {rows.length} people total
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${v} people`, n]} contentStyle={tooltipStyle(c)} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-1">
                <div className="text-center">
                  <p className="text-2xl font-bold leading-none" style={{ color: c.success }}>
                    {readyCount}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: c.text }}>
                    Ready
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold leading-none" style={{ color: c.warning }}>
                    {notReady}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: c.text }}>
                    Not Ready
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Leaderboard */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>
                    Team Progress
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                    Current score, needed score, and skills met for each person.
                  </p>
                </div>
                <InfoTip text="Achieved is the current score from approved assessments. Required is the target score. Met is how many required skills are complete." />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
                <span
                  className="rounded-md px-2 py-1"
                  style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}
                >
                  Achieved: current score
                </span>
                <span
                  className="rounded-md px-2 py-1"
                  style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}
                >
                  Required: target score
                </span>
                <span
                  className="rounded-md px-2 py-1"
                  style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}
                >
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
                      {p.rank <= 3 ? (
                        RANK_MEDALS[p.rank - 1]
                      ) : (
                        <span style={{ color: c.text, fontSize: 11 }}>{p.rank}</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--text-1))' }}>
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="text-xs font-bold" style={{ color: p.ready ? c.success : c.warning }}>
                            Achieved {p.score}%
                          </span>
                          {p.required !== null && (
                            <>
                              <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                                /
                              </span>
                              <span className="text-xs font-semibold" style={{ color: c.text }}>
                                Required {p.required}%
                              </span>
                            </>
                          )}
                          {p.total > 0 && (
                            <>
                              <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                                /
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color:
                                    p.meets === p.total
                                      ? c.success
                                      : p.meets >= p.total * 0.75
                                        ? c.warning
                                        : c.danger,
                                }}
                              >
                                Met {p.meets}/{p.total}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                      >
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
              <p className="text-sm font-bold mb-0.5" style={{ color: 'rgb(var(--text-1))' }}>
                Score Spread
              </p>
              <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
                How many people are in each score range.
              </p>
              {(() => {
                const buckets = [
                  { range: '0–10%', min: 0, max: 0.1, color: c.danger },
                  { range: '10–20%', min: 0.1, max: 0.2, color: c.warning },
                  { range: '20–30%', min: 0.2, max: 0.3, color: '#f59e0b' },
                  { range: '30–50%', min: 0.3, max: 0.5, color: c.accent },
                  { range: '50–75%', min: 0.5, max: 0.75, color: '#22d3ee' },
                  { range: '75–100%', min: 0.75, max: 1.01, color: c.success },
                ].map((b) => ({
                  ...b,
                  count: rows.filter((r) => r.overall_score >= b.min && r.overall_score < b.max).length,
                }));
                return (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 10, fill: c.text }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: c.text }}
                        axisLine={false}
                        tickLine={false}
                        width={20}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={tooltipStyle(c)}>
                              <p style={{ color: d.color }} className="font-bold text-xs">
                                {d.range}
                              </p>
                              <p style={{ color: c.text }}>
                                {d.count} engineer{d.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          );
                        }}
                        cursor={{ fill: c.grid, opacity: 0.25 }}
                      />
                      <Bar dataKey="count" name="People" radius={[5, 5, 0, 0]} maxBarSize={48}>
                        {buckets.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {/* Closest to target */}
            <div className="card p-5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                  Closest To Target
                </p>
                <InfoTip text="Shows people who are below target but closest to meeting their required score." />
              </div>
              <p className="text-xs mb-4" style={{ color: 'rgb(var(--text-3))' }}>
                People below target, sorted by smallest remaining gap.
              </p>
              {(() => {
                const notReadyRows = [...rows]
                  .map((r) => ({
                    ...r,
                    pct: Math.round(r.overall_score * 100),
                    requiredPct: Math.round((r.avg_threshold ?? 0) * 100),
                    gapPct: Math.max(0, Math.round(((r.avg_threshold ?? 0) - r.overall_score) * 100)),
                  }))
                  .filter((r) => !r.promotion_ready && r.overall_score > 0 && r.requiredPct > 0)
                  .sort((a, b) => a.gapPct - b.gapPct)
                  .slice(0, 8);
                const pipeMax = Math.max(...notReadyRows.map((r) => r.pct), 5);
                return (
                  <div className="space-y-2">
                    {notReadyRows.length === 0 ? (
                      <p className="text-sm text-center py-6" style={{ color: c.text }}>
                        No checked people are below target.
                      </p>
                    ) : (
                      notReadyRows.map((r) => (
                        <div key={r.employee_id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium truncate" style={{ color: 'rgb(var(--text-1))' }}>
                                {r.full_name.split(' ').slice(0, 2).join(' ')}
                              </span>
                              <span className="text-xs ml-2 shrink-0" style={{ color: c.text }}>
                                {r.pct}% / {r.requiredPct}%
                              </span>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'rgb(var(--surface-3))' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(r.pct / pipeMax) * 100}%`,
                                  background: `linear-gradient(90deg, ${c.accent}, ${c.success})`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono shrink-0" style={{ color: c.danger }}>
                            Gap {r.gapPct}%
                          </span>
                        </div>
                      ))
                    )}
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
