import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, LabelList, PieChart, Pie, Legend, ComposedChart, Line } from 'recharts';
import type { LabelProps } from 'recharts';
import { toPct } from '@/lib/formatters';
import { usePromotionReadiness } from '@/hooks/useReports';
import { useChartTheme, getChartTooltipStyle } from '@/hooks/useChartTheme';
import { DataTable, Empty, InfoTip, Loading, PromotionRow, Stars, TR, View, ViewToggle } from '../shared';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

// ─────────────────────────────────────────────────────────────────────────────
// ── Promotion Readiness ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
interface ScoreBarPoint {
  fullName: string;
  ready: boolean;
  grade: string;
  meets: string;
  score: number;
}

interface ScoreBarTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScoreBarPoint }>;
}

export const PromotionReadinessTab: React.FC<{ reportFilters?: ReportFilters }> = ({ reportFilters = DEFAULT_REPORT_FILTERS }) => {
  const { data, isLoading, isError } = usePromotionReadiness();
  const c = useChartTheme();
  const [view, setView] = useState<View>('chart');
  const allRows: PromotionRow[] = data ?? [];
  const q = reportFilters.search.trim().toLowerCase();
  const rows: PromotionRow[] = allRows.filter((row) => {
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

  if (isLoading) return <Loading />;
  if (isError) return <Empty msg="Failed to load promotion readiness data." />;
  if (allRows.length === 0) return <Empty msg="No employees found." />;
  if (rows.length === 0) return <Empty msg="No people match the current report filters." />;

  const shortName = (name: string) => name.split(' ').slice(0, 2).join(' ');

  const sortedRows = [...rows].sort((a, b) => toPct(b.overall_score) - toPct(a.overall_score));
  const readyCount = rows.filter(r => r.promotion_ready).length;
  const readinessRate = Math.round((readyCount / Math.max(1, rows.length)) * 100);
  const avgScore = Math.round(rows.reduce((sum, r) => sum + toPct(r.overall_score), 0) / Math.max(1, rows.length));
  const avgNeeded = rows.some(r => r.avg_threshold > 0)
    ? Math.round(rows.filter(r => r.avg_threshold > 0).reduce((sum, r) => sum + toPct(r.avg_threshold), 0) / Math.max(1, rows.filter(r => r.avg_threshold > 0).length))
    : 0;
  const needsAttentionCount = rows.filter(r => !r.promotion_ready).length;
  const nearReadyCount = rows.filter(r => !r.promotion_ready && r.total_competencies > 0 && (r.meets_count / r.total_competencies) >= 0.75).length;
  const meetsRate = Math.round(
    (rows.reduce((sum, r) => sum + r.meets_count, 0) / Math.max(1, rows.reduce((sum, r) => sum + r.total_competencies, 0))) * 100,
  );

  const scoreBarData = sortedRows.slice(0, 15).map(r => ({
    id: r.employee_id,
    name: shortName(r.full_name),
    fullName: r.full_name,
    grade: `${r.current_grade} -> ${r.target_grade}`,
    score: toPct(r.overall_score),
    meets: r.total_competencies === 0 ? 'N/A' : `${r.meets_count}/${r.total_competencies}`,
    ready: r.promotion_ready,
  }));

  const donutData = [
    { name: 'Ready', value: readyCount, fill: c.success },
    { name: 'Near Ready', value: nearReadyCount, fill: c.warning },
    { name: 'Not Ready', value: rows.length - readyCount - nearReadyCount, fill: c.danger },
  ].filter(d => d.value > 0);

  const scoreBuckets = [
    { range: '0-20', min: 0, max: 20, color: c.danger },
    { range: '20-40', min: 20, max: 40, color: c.warning },
    { range: '40-60', min: 40, max: 60, color: c.warning },
    { range: '60-80', min: 60, max: 80, color: c.accent },
    { range: '80-100', min: 80, max: 101, color: c.success },
  ].map(bucket => ({
    ...bucket,
    employees: rows.filter(r => toPct(r.overall_score) >= bucket.min && toPct(r.overall_score) < bucket.max).length,
    share: Math.round((rows.filter(r => toPct(r.overall_score) >= bucket.min && toPct(r.overall_score) < bucket.max).length / Math.max(1, rows.length)) * 100),
    containsTarget: avgNeeded > 0 && avgNeeded >= bucket.min && avgNeeded < bucket.max,
  }));

  const gradeSummary = Object.entries(
    rows.reduce((acc, r) => {
      const key = `${r.department}||${r.current_grade}`;
      if (!acc[key]) acc[key] = { department: r.department, grade: r.current_grade, ready: 0, notReady: 0, total: 0, scoreSum: 0, thresholdSum: 0, thresholdCount: 0 };
      acc[key].total += 1;
      acc[key].scoreSum += toPct(r.overall_score);
      if (r.avg_threshold > 0) {
        acc[key].thresholdSum += toPct(r.avg_threshold);
        acc[key].thresholdCount += 1;
      }
      if (r.promotion_ready) acc[key].ready += 1;
      else acc[key].notReady += 1;
      return acc;
    }, {} as Record<string, { department: string; grade: string; ready: number; notReady: number; total: number; scoreSum: number; thresholdSum: number; thresholdCount: number }>),
  )
    .map(([, v]) => ({
      label: `${v.department} / ${v.grade}`,
      department: v.department,
      grade: v.grade,
      ready: v.ready,
      notReady: v.notReady,
      total: v.total,
      readinessRate: Math.round((v.ready / Math.max(1, v.total)) * 100),
      avgScore: Math.round(v.scoreSum / Math.max(1, v.total)),
      avgNeeded: v.thresholdCount > 0 ? Math.round(v.thresholdSum / v.thresholdCount) : avgNeeded,
    }))
    .sort((a, b) => a.department.localeCompare(b.department) || a.grade.localeCompare(b.grade, undefined, { numeric: true }));

  const starReadiness = [1, 2, 3, 4, 5].map((star) => {
    const ready = rows.filter(r => r.star_rating === star && r.promotion_ready).length;
    const notReady = rows.filter(r => r.star_rating === star && !r.promotion_ready).length;
    const total = ready + notReady;
    return {
      star: `${star} Star`,
      ready,
      notReady,
      total,
      readinessRate: total > 0 ? Math.round((ready / total) * 100) : 0,
    };
  });

  const notReadyPipeline = sortedRows.filter(r => !r.promotion_ready).slice(0, 8);
  const pipelineMax = Math.max(...notReadyPipeline.map(r => toPct(r.overall_score)), 1);

  const ScoreBarTooltip = ({ active, payload }: ScoreBarTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={getChartTooltipStyle(c)}>
        <p className="font-semibold text-xs mb-1" style={{ color: d.ready ? c.success : c.warning }}>{d.fullName}</p>
        <p style={{ color: c.tooltipText }}>Grade: {d.grade}</p>
        <p style={{ color: c.tooltipText }}>Meets: {d.meets}</p>
        <p className="font-bold" style={{ color: d.ready ? c.success : c.warning }}>{d.score}%</p>
      </div>
    );
  };

  const ScoreValueLabel = (props: LabelProps) => {
    const { x, y, width, height, value } = props;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null;
    const score = Number(value);
    if (!Number.isFinite(score)) return null;
    const closeToNeeded = avgNeeded > 0 && Math.abs(score - avgNeeded) <= 3;
    const labelX = closeToNeeded ? x + Math.max(width - 8, 26) : x + width + 8;
    return (
      <text
        x={labelX}
        y={y + height / 2}
        dy={4}
        textAnchor={closeToNeeded ? 'end' : 'start'}
        fontSize={10}
        fontWeight={700}
        fill={closeToNeeded ? '#111827' : c.axisColor}
      >
        {score}%
      </text>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>Next Grade Readiness</p>
            <InfoTip text="Shows who is ready for their target grade and who still needs work." />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            Simple view of current score, needed score, and readiness for {rows.length} people.
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          {
            label: 'People',
            value: rows.length,
            sub: `${rows.length} checked`,
            meaning: 'Employees included after the selected filters.',
            effect: 'This is the group used for every readiness number here.',
            color: 'rgb(var(--text-1))',
            bg: 'rgb(var(--surface-2))',
          },
          {
            label: 'Ready',
            value: readyCount,
            sub: `${readinessRate}% of team`,
            meaning: 'People meeting all measured requirements for their target grade.',
            effect: 'They should need less training before promotion review.',
            color: 'rgb(var(--success))',
            bg: 'rgb(var(--success-soft))',
          },
          {
            label: 'Readiness',
            value: `${readinessRate}%`,
            sub: avgNeeded > 0 ? `Target: ${avgNeeded}%` : 'No target set',
            meaning: 'The share of people ready for the next grade.',
            effect: 'Low readiness means the team needs focused skill work first.',
            color: 'rgb(var(--success))',
            bg: 'rgb(var(--surface-2))',
          },
          {
            label: 'Needs Attention',
            value: needsAttentionCount,
            sub: `${rows.length - readyCount} below target`,
            meaning: 'People who are not ready because one or more required skills are below target.',
            effect: 'Review these people first for coaching, training, or reassessment.',
            color: 'rgb(var(--danger))',
            bg: 'rgb(var(--danger-soft))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-3 border min-h-[154px] flex flex-col"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: kpi.bg }}
            title={`${kpi.label}: ${kpi.meaning} ${kpi.effect}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase" style={{ color: 'rgb(var(--text-3))', letterSpacing: 0 }}>{kpi.label}</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0" style={{ color: kpi.color, backgroundColor: 'rgb(var(--surface))' }}>
                {kpi.sub}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2 leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs mt-3 leading-snug" style={{ color: 'rgb(var(--text-2))' }}>{kpi.meaning}</p>
            <p className="text-[11px] mt-auto pt-2 leading-snug" style={{ color: 'rgb(var(--text-3))' }}>{kpi.effect}</p>
          </div>
        ))}

        <div
          className="rounded-xl p-3 border min-h-[154px] flex flex-col"
          style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--accent-soft))' }}
          title="Avg Current / Needed: Current is the average score now. Needed is the average target score expected for the next grade."
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase" style={{ color: 'rgb(var(--text-3))', letterSpacing: 0 }}>Avg Current / Needed</p>
            <InfoTip text="Current is the score now. Needed is the score expected for the grade." />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold leading-none"
              style={{ color: avgNeeded > 0 ? (avgScore >= avgNeeded ? 'rgb(var(--success))' : 'rgb(var(--danger))') : 'rgb(var(--accent))' }}>
              {avgScore}%
            </span>
            {avgNeeded > 0 && (
              <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-3))' }}>
                / {avgNeeded}%
              </span>
            )}
          </div>
          <p className="text-xs mt-3 leading-snug" style={{ color: 'rgb(var(--text-2))' }}>
            Current average compared with the target threshold.
          </p>
          <p className="text-[11px] mt-auto pt-2 leading-snug" style={{ color: 'rgb(var(--text-3))' }}>
            {avgNeeded > 0
              ? avgScore >= avgNeeded
                ? 'Average score meets the next grade expectation.'
                : 'Average score is still below the next grade expectation.'
              : 'No minimum threshold configured for this group.'}
          </p>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Highest Current Scores
              </p>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                  People with the highest scores and their readiness status.
                </p>
                {avgNeeded > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md shrink-0" style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}>
                    Needed target: {avgNeeded}%
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={Math.max(340, scoreBarData.length * 28)}>
                <BarChart data={scoreBarData} layout="vertical" margin={{ left: 6, right: 64, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: c.axisColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ScoreBarTooltip />} cursor={{ fill: c.gridColor, opacity: 0.25 }} />
                  {avgNeeded > 0 && (
                    <ReferenceLine
                      x={avgNeeded}
                      stroke={c.warning}
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                    />
                  )}
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {scoreBarData.map((d, i) => <Cell key={`${d.id}-${i}`} fill={d.ready ? c.success : c.warning} />)}
                    <LabelList dataKey="score" content={<ScoreValueLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgb(var(--text-2))' }}>
                  Readiness Split
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={3} dataKey="value">
                      {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} people`, name]} contentStyle={getChartTooltipStyle(c)} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: c.legendColor, fontSize: 11 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgb(var(--surface-2))', color: c.legendColor }}>
                    <span className="font-semibold">Near Ready:</span> {nearReadyCount}
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgb(var(--surface-2))', color: c.legendColor }}>
                    <span className="font-semibold">Meets Rate:</span> {meetsRate}%
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgb(var(--text-2))' }}>
                  Closest To Ready
                </p>
                <div className="space-y-2">
                  {notReadyPipeline.length === 0 ? (
                    <p className="text-xs py-3 text-center" style={{ color: 'rgb(var(--text-3))' }}>All assessed people are ready.</p>
                  ) : notReadyPipeline.map((r) => {
                    const scorePct = toPct(r.overall_score);
                    const barWidthPct = Math.min((scorePct / Math.max(1, pipelineMax)) * 100, 100);
                    const thrPos = avgNeeded > 0 ? Math.min((avgNeeded / Math.max(1, pipelineMax)) * 100, 100) : 0;
                    return (
                      <div key={r.employee_id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="truncate pr-2" style={{ color: 'rgb(var(--text-1))' }}>{shortName(r.full_name)}</span>
                          <span style={{ color: scorePct >= avgNeeded ? 'rgb(var(--success))' : c.axisColor }}>{scorePct}%{avgNeeded > 0 ? ` / ${avgNeeded}%` : ''}</span>
                        </div>
                        <div className="h-2 rounded-full relative" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${barWidthPct}%`, background: `linear-gradient(90deg, ${c.warning}, ${c.success})` }}
                          />
                          {thrPos > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 rounded-full"
                              style={{ left: `${thrPos}%`, backgroundColor: c.warning, transform: 'translateX(-50%)' }}
                              title={`Needed: ${avgNeeded}%`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                    Score Distribution
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                    Resource count by achieved overall-score band. Highlight marks the required-score band.
                  </p>
                </div>
                {avgNeeded > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md shrink-0"
                    style={{ color: c.warning, backgroundColor: 'rgb(var(--warning-soft))' }}>
                    Needed {avgNeeded}%
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreBuckets} margin={{ top: 12, right: 10, bottom: 0, left: -12 }} barCategoryGap="34%">
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: c.gridColor, opacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={getChartTooltipStyle(c)}>
                          <p className="font-semibold text-xs" style={{ color: d.color }}>{d.range}%</p>
                          <p style={{ color: c.tooltipText }}>{d.employees} people</p>
                          <p style={{ color: c.tooltipText }}>{d.share}% of team</p>
                          {d.containsTarget && <p style={{ color: c.warning }}>Needed target band</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="employees" radius={[4, 4, 0, 0]} maxBarSize={26}>
                    {scoreBuckets.map((b, i) => (
                      <Cell
                        key={i}
                        fill={b.color}
                        stroke={b.containsTarget ? c.warning : b.color}
                        strokeWidth={b.containsTarget ? 2 : 0}
                      />
                    ))}
                    <LabelList dataKey="employees" position="top" style={{ fontSize: 10, fill: c.axisColor }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                    Department-wise Grade Readiness
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                    Ready vs not-ready people by department and current grade.
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={gradeSummary} margin={{ top: 12, right: 14, bottom: 42, left: -12 }} barCategoryGap="36%">
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.axisColor }} angle={-25} textAnchor="end" height={48} interval={0} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="count" tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: c.axisColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: c.gridColor, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = gradeSummary.find(g => g.label === label);
                      return (
                        <div style={getChartTooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{d?.department ?? 'Department'}</p>
                          <p style={{ color: c.tooltipText }}>Grade: {d?.grade ?? label}</p>
                          <p style={{ color: c.success }}>Ready: {d?.ready ?? 0}</p>
                          <p style={{ color: c.warning }}>Not Ready: {d?.notReady ?? 0}</p>
                          <p style={{ color: c.tooltipText }}>Readiness: {d?.readinessRate ?? 0}%</p>
                          <p style={{ color: c.tooltipText }}>Avg Score: {d?.avgScore ?? 0}%</p>
                          <p style={{ color: c.warning }}>Avg Needed: {d?.avgNeeded ?? 0}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.legendColor, fontSize: 11 }}>{v === 'readinessRate' ? 'Readiness %' : v}</span>} />
                  <Bar yAxisId="count" dataKey="ready" stackId="grade" name="Ready" fill={c.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="count" dataKey="notReady" stackId="grade" name="Not Ready" fill={c.warning} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="rate" type="monotone" dataKey="readinessRate" name="readinessRate" stroke={c.accent} strokeWidth={2} dot={{ r: 3, fill: c.accent }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Rating Readiness Pattern
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                Readiness outcome by star rating. Empty ratings remain visible for comparison.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={starReadiness} margin={{ top: 12, right: 10, bottom: 0, left: -12 }} barCategoryGap="36%">
                  <XAxis dataKey="star" tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: c.axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: c.gridColor, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = starReadiness.find(s => s.star === label);
                      return (
                        <div style={getChartTooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{label}</p>
                          <p style={{ color: c.success }}>Ready: {d?.ready ?? 0}</p>
                          <p style={{ color: c.warning }}>Not Ready: {d?.notReady ?? 0}</p>
                          <p style={{ color: c.tooltipText }}>Readiness: {d?.readinessRate ?? 0}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.legendColor, fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="ready" name="Ready" stackId="star" fill={c.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="notReady" name="Not Ready" stackId="star" fill={c.warning} radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="total" position="top" style={{ fontSize: 10, fill: c.axisColor }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Achieved vs Needed by Grade
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                Average achieved score compared with the required threshold for each department and grade group.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={gradeSummary} margin={{ top: 12, right: 14, bottom: 42, left: -12 }} barCategoryGap="36%">
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.axisColor }} angle={-25} textAnchor="end" height={48} interval={0} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.axisColor }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: c.gridColor, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = gradeSummary.find(g => g.label === label);
                      const gap = (d?.avgScore ?? 0) - (d?.avgNeeded ?? 0);
                      return (
                        <div style={getChartTooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{d?.department ?? 'Department'}</p>
                          <p style={{ color: c.tooltipText }}>Grade: {d?.grade ?? label}</p>
                          <p style={{ color: c.tooltipText }}>Avg Current: {d?.avgScore ?? 0}%</p>
                          <p style={{ color: c.warning }}>Avg Needed: {d?.avgNeeded ?? 0}%</p>
                          <p style={{ color: gap >= 0 ? c.success : c.danger }}>Gap: {gap >= 0 ? '+' : ''}{gap}%</p>
                          <p style={{ color: c.tooltipText }}>People: {d?.total ?? 0}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.legendColor, fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="avgScore" name="Avg Current" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="avgScore" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: c.axisColor }} />
                  </Bar>
                  <Line type="monotone" dataKey="avgNeeded" name="Avg Needed" stroke={c.warning} strokeWidth={2} dot={{ r: 3, fill: c.warning }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <DataTable headers={['Name', 'Code', 'Grade', 'Achieved', 'Required', 'Gap', 'Meets', 'Rating', 'CEFR Level', 'Status']}>
          {sortedRows.map(r => {
            const achieved = toPct(r.overall_score);
            const required = r.avg_threshold > 0 ? toPct(r.avg_threshold) : null;
            const gap = required !== null ? achieved - required : null;

            const isTechReady = r.promotion_ready;
            const isCefrGated = r.is_cefr_gated ?? false;
            const isFullyReady = isTechReady && !isCefrGated;

            let badgeText = '⚠ Not Ready';
            let badgeStyle = { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' };

            if (isFullyReady) {
              badgeText = '✓ Ready';
              badgeStyle = { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' };
            } else if (isTechReady && isCefrGated) {
              badgeText = '🔒 CEFR Gated';
              badgeStyle = { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' };
            }

            return (
              <TR key={r.employee_id}>
                <td className="px-4 py-3 font-medium text-sm" style={{ color: 'rgb(var(--text-1))' }}>{r.full_name}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: 'rgb(var(--accent))' }}>{r.emp_code}</span></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgb(var(--text-2))' }}>{r.current_grade} → {r.target_grade}</td>
                <td className="px-4 py-3 font-bold text-sm" style={{ color: required !== null ? (achieved >= required ? 'rgb(var(--success))' : 'rgb(var(--danger))') : 'rgb(var(--accent))' }}>
                  {achieved}%
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'rgb(var(--warning))' }}>
                  {required !== null ? `${required}%` : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: gap === null ? 'rgb(var(--text-3))' : gap >= 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>
                  {gap === null ? '—' : gap >= 0 ? `+${gap}%` : `${gap}%`}
                </td>
                <td
                  className="px-4 py-3 text-xs"
                  style={{ color: 'rgb(var(--text-2))' }}
                  title={r.total_competencies === 0
                    ? 'No target-grade requirements are configured.'
                    : `${r.meets_count} of ${r.total_competencies} needed goal-grade skills are met.`}
                >
                  {r.total_competencies === 0 ? 'N/A' : `${r.meets_count}/${r.total_competencies}`}
                </td>
                <td className="px-4 py-3"><Stars n={r.star_rating} /></td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                  {r.cefr_level ?? 'B2'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="badge"
                    title={isFullyReady
                      ? 'Ready because technical target and CEFR communication benchmark are met.'
                      : isTechReady && isCefrGated
                        ? 'Technical target met, but blocked by CEFR communication benchmark gating.'
                        : 'Technical skills are still below threshold.'}
                    style={badgeStyle}
                  >
                    {badgeText}
                  </span>
                </td>
              </TR>
            );
          })}
        </DataTable>
      )}
    </div>
  );
};
