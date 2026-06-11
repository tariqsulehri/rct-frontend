import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell, LabelList, PieChart, Pie, Legend, ComposedChart, Line } from 'recharts';
import { usePromotionReadiness } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { DataTable, Empty, InfoTip, Loading, PromotionRow, Stars, TR, View, ViewToggle } from '../shared';

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

export const PromotionReadinessTab: React.FC = () => {
  const { data, isLoading, isError } = usePromotionReadiness();
  const c = useChartColors();
  const [view, setView] = useState<View>('chart');
  const rows: PromotionRow[] = data ?? [];

  if (isLoading) return <Loading />;
  if (isError) return <Empty msg="Failed to load promotion readiness data." />;
  if (rows.length === 0) return <Empty msg="No employees found." />;

  const shortName = (name: string) => name.split(' ').slice(0, 2).join(' ');
  const sortedRows = [...rows].sort((a, b) => b.overall_score - a.overall_score);
  const readyCount = rows.filter(r => r.promotion_ready).length;
  const readinessRate = Math.round((readyCount / rows.length) * 100);
  const avgScore = Math.round((rows.reduce((sum, r) => sum + r.overall_score, 0) / rows.length) * 100);
  const avgNeeded = rows.some(r => r.avg_threshold > 0)
    ? Math.round((rows.filter(r => r.avg_threshold > 0).reduce((sum, r) => sum + r.avg_threshold, 0) / rows.filter(r => r.avg_threshold > 0).length) * 100)
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
    score: Math.round(r.overall_score * 100),
    meets: r.total_competencies === 0 ? 'N/A' : `${r.meets_count}/${r.total_competencies}`,
    ready: r.promotion_ready,
  }));

  const donutData = [
    { name: 'Ready', value: readyCount, fill: c.success },
    { name: 'Near Ready', value: nearReadyCount, fill: c.warning },
    { name: 'Not Ready', value: rows.length - readyCount - nearReadyCount, fill: c.danger },
  ].filter(d => d.value > 0);

  const scoreBuckets = [
    { range: '0-20', min: 0.0, max: 0.2, color: c.danger },
    { range: '20-40', min: 0.2, max: 0.4, color: '#f97316' },
    { range: '40-60', min: 0.4, max: 0.6, color: c.warning },
    { range: '60-80', min: 0.6, max: 0.8, color: '#22c55e' },
    { range: '80-100', min: 0.8, max: 1.01, color: c.success },
  ].map(bucket => ({
    ...bucket,
    employees: rows.filter(r => r.overall_score >= bucket.min && r.overall_score < bucket.max).length,
    share: Math.round((rows.filter(r => r.overall_score >= bucket.min && r.overall_score < bucket.max).length / rows.length) * 100),
    containsTarget: avgNeeded > 0 && avgNeeded / 100 >= bucket.min && avgNeeded / 100 < bucket.max,
  }));

  const gradeSummary = Object.entries(
    rows.reduce((acc, r) => {
      const key = r.current_grade;
      if (!acc[key]) acc[key] = { grade: key, ready: 0, notReady: 0, total: 0, scoreSum: 0, thresholdSum: 0, thresholdCount: 0 };
      acc[key].total += 1;
      acc[key].scoreSum += r.overall_score;
      if (r.avg_threshold > 0) {
        acc[key].thresholdSum += r.avg_threshold;
        acc[key].thresholdCount += 1;
      }
      if (r.promotion_ready) acc[key].ready += 1;
      else acc[key].notReady += 1;
      return acc;
    }, {} as Record<string, { grade: string; ready: number; notReady: number; total: number; scoreSum: number; thresholdSum: number; thresholdCount: number }>),
  )
    .map(([, v]) => ({
      grade: v.grade,
      ready: v.ready,
      notReady: v.notReady,
      total: v.total,
      readinessRate: Math.round((v.ready / Math.max(1, v.total)) * 100),
      avgScore: Math.round((v.scoreSum / Math.max(1, v.total)) * 100),
      avgNeeded: v.thresholdCount > 0 ? Math.round((v.thresholdSum / v.thresholdCount) * 100) : avgNeeded,
    }))
    .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }));

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
  const pipelineMax = Math.max(...notReadyPipeline.map(r => r.overall_score), 0.05);

  const ScoreBarTooltip = ({ active, payload }: ScoreBarTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={tooltipStyle(c)}>
        <p className="font-semibold text-xs mb-1" style={{ color: d.ready ? c.success : c.warning }}>{d.fullName}</p>
        <p style={{ color: c.text }}>Grade: {d.grade}</p>
        <p style={{ color: c.text }}>Meets: {d.meets}</p>
        <p className="font-bold" style={{ color: d.ready ? c.success : c.warning }}>{d.score}%</p>
      </div>
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          { label: 'People', value: rows.length,         sub: `${rows.length} checked`,          color: 'rgb(var(--text-1))', bg: 'rgb(var(--surface-2))' },
          { label: 'Ready',     value: readyCount,          sub: `${readinessRate}% of team`,        color: 'rgb(var(--success))', bg: 'rgb(var(--success-soft))' },
          { label: 'Readiness', value: `${readinessRate}%`, sub: avgNeeded > 0 ? `Needed score: ${avgNeeded}%` : 'No needed score set', color: 'rgb(var(--success))', bg: 'rgb(var(--surface-2))' },
          { label: 'Needs Attention', value: needsAttentionCount, sub: `${rows.length - readyCount} below target`, color: 'rgb(var(--danger))', bg: 'rgb(var(--danger-soft))' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-3 border" style={{ borderColor: 'rgb(var(--border))', backgroundColor: kpi.bg }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1 leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>{kpi.sub}</p>
          </div>
        ))}

        {/* Avg Score — Achieved / Needed */}
        <div className="rounded-xl p-3 border" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--accent-soft))' }}>
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Avg Current / Needed</p>
            <InfoTip text="Current is the score now. Needed is the score expected for the grade." />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold leading-none"
              style={{ color: avgNeeded > 0 ? (avgScore >= avgNeeded ? 'rgb(var(--success))' : 'rgb(var(--danger))') : 'rgb(var(--accent))' }}>
              {avgScore}%
            </span>
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-3))' }}>/</span>
            <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>
              {avgNeeded > 0 ? `${avgNeeded}%` : 'N/A'}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>Current / Needed</p>
        </div>
      </div>

      {view === 'chart' ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Highest Current Scores
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                People with the highest scores and their readiness status.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(340, scoreBarData.length * 28)}>
                <BarChart data={scoreBarData} layout="vertical" margin={{ left: 6, right: 40, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ScoreBarTooltip />} cursor={{ fill: c.grid, opacity: 0.25 }} />
                  {avgNeeded > 0 && (
                    <ReferenceLine
                      x={avgNeeded}
                      stroke={c.warning}
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: `Needed: ${avgNeeded}%`, position: 'insideTopRight', fill: c.warning, fontSize: 9, fontWeight: 600 }}
                    />
                  )}
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {scoreBarData.map((d, i) => <Cell key={`${d.id}-${i}`} fill={d.ready ? c.success : c.warning} />)}
                    <LabelList dataKey="score" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: c.text }} />
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
                  <Tooltip formatter={(value: number, name: string) => [`${value} people`, name]} contentStyle={tooltipStyle(c)} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: c.text, fontSize: 11 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgb(var(--surface-2))', color: c.text }}>
                    <span className="font-semibold">Near Ready:</span> {nearReadyCount}
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgb(var(--surface-2))', color: c.text }}>
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
                    const scorePct  = Math.round(r.overall_score * 100);
                    const barWidthPct = (r.overall_score / pipelineMax) * 100;
                    const thrPos    = avgNeeded > 0 ? Math.min((avgNeeded / 100 / pipelineMax) * 100, 100) : 0;
                    return (
                      <div key={r.employee_id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="truncate pr-2" style={{ color: 'rgb(var(--text-1))' }}>{shortName(r.full_name)}</span>
                          <span style={{ color: scorePct >= avgNeeded ? 'rgb(var(--success))' : c.text }}>{scorePct}%{avgNeeded > 0 ? ` / ${avgNeeded}%` : ''}</span>
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
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs" style={{ color: d.color }}>{d.range}%</p>
                          <p style={{ color: c.text }}>{d.employees} people</p>
                          <p style={{ color: c.text }}>{d.share}% of team</p>
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
                    <LabelList dataKey="employees" position="top" style={{ fontSize: 10, fill: c.text }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Grade-wise Readiness
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                Ready vs not-ready people by current grade, with readiness-rate trend.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={gradeSummary} margin={{ top: 12, right: 14, bottom: 0, left: -12 }} barCategoryGap="36%">
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="count" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = gradeSummary.find(g => g.grade === label);
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>Grade {label}</p>
                          <p style={{ color: c.success }}>Ready: {d?.ready ?? 0}</p>
                          <p style={{ color: c.warning }}>Not Ready: {d?.notReady ?? 0}</p>
                          <p style={{ color: c.text }}>Readiness: {d?.readinessRate ?? 0}%</p>
                          <p style={{ color: c.text }}>Avg Score: {d?.avgScore ?? 0}%</p>
                          <p style={{ color: c.warning }}>Avg Needed: {d?.avgNeeded ?? 0}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v === 'readinessRate' ? 'Readiness %' : v}</span>} />
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
                  <XAxis dataKey="star" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = starReadiness.find(s => s.star === label);
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{label}</p>
                          <p style={{ color: c.success }}>Ready: {d?.ready ?? 0}</p>
                          <p style={{ color: c.warning }}>Not Ready: {d?.notReady ?? 0}</p>
                          <p style={{ color: c.text }}>Readiness: {d?.readinessRate ?? 0}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="ready" name="Ready" stackId="star" fill={c.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="notReady" name="Not Ready" stackId="star" fill={c.warning} radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="total" position="top" style={{ fontSize: 10, fill: c.text }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: 'rgb(var(--border))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Achieved vs Needed by Grade
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-3))' }}>
                Average achieved score compared with the required threshold for each grade group.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={gradeSummary} margin={{ top: 12, right: 14, bottom: 0, left: -12 }} barCategoryGap="36%">
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.2 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = gradeSummary.find(g => g.grade === label);
                      const gap = (d?.avgScore ?? 0) - (d?.avgNeeded ?? 0);
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>Grade {label}</p>
                          <p style={{ color: c.text }}>Avg Current: {d?.avgScore ?? 0}%</p>
                          <p style={{ color: c.warning }}>Avg Needed: {d?.avgNeeded ?? 0}%</p>
                          <p style={{ color: gap >= 0 ? c.success : c.danger }}>Gap: {gap >= 0 ? '+' : ''}{gap}%</p>
                          <p style={{ color: c.text }}>People: {d?.total ?? 0}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="avgScore" name="Avg Current" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="avgScore" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: c.text }} />
                  </Bar>
                  <Line type="monotone" dataKey="avgNeeded" name="Avg Needed" stroke={c.warning} strokeWidth={2} dot={{ r: 3, fill: c.warning }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <DataTable headers={['Name', 'Code', 'Grade', 'Achieved', 'Required', 'Gap', 'Meets', 'Rating', 'Status']}>
          {sortedRows.map(r => {
            const achieved = Math.round(r.overall_score * 100);
            const required = r.avg_threshold > 0 ? Math.round(r.avg_threshold * 100) : null;
            const gap = required !== null ? achieved - required : null;
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
                <td className="px-4 py-3">
                  <span
                    className="badge"
                    title={r.promotion_ready
                      ? 'Ready because every needed target-grade skill is met.'
                      : `Not ready because ${Math.max(0, r.total_competencies - r.meets_count)} needed goal-grade skills are still below threshold.`}
                    style={r.promotion_ready
                      ? { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' }
                      : { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' }}
                  >
                    {r.promotion_ready ? '✓ Ready' : '⚠ Not Ready'}
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
