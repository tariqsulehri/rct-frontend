import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, Legend, ReferenceLine } from 'recharts';
import { useGapAnalysis, usePromotionReadiness, useCompetencyScores } from '@/hooks/useReports';
import { useChartColors, tooltipStyle } from '@/lib/chartColors';
import { Empty, GapResult, InfoTip, Loading } from '../shared';

// ─────────────────────────────────────────────────────────────────────────────
// ── Person Result Sheet PDF ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export const EmployeeResultSheetTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: gapData, isLoading: gapLoading, isError: gapError } = useGapAnalysis(selectedId);
  const { data: promoData, isLoading: promoLoading } = usePromotionReadiness();
  const { data: compData, isLoading: compLoading } = useCompetencyScores();
  const c = useChartColors();

  const personOptions = useMemo(() => {
    const people = new Map<string, { emp_code: string; full_name: string; current_grade?: string; target_grade?: string }>();
    for (const row of promoData ?? []) {
      people.set(row.emp_code, {
        emp_code: row.emp_code,
        full_name: row.full_name,
        current_grade: row.current_grade,
        target_grade: row.target_grade,
      });
    }
    for (const row of compData ?? []) {
      if (!people.has(row.emp_code)) {
        people.set(row.emp_code, {
          emp_code: row.emp_code,
          full_name: row.full_name,
          current_grade: row.current_grade,
          target_grade: row.target_grade,
        });
      }
    }
    return [...people.values()].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [compData, promoData]);

  const gapResult = gapData as GapResult | undefined;
  const promoRow = (promoData ?? []).find(r => r.emp_code === selectedId);
  const compRow = (compData ?? []).find(r => r.emp_code === selectedId);

  const domainRows = Object.entries(compRow?.domain_scores ?? {})
    .map(([domain, score]) => ({ domain, score: Math.round(score * 100) }))
    .sort((a, b) => b.score - a.score);

  const topGaps = (gapResult?.gaps ?? [])
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const overallScorePct = Math.round((promoRow?.overall_score ?? gapResult?.overall_score ?? 0) * 100);
  const meetsCheckedPct = promoRow && promoRow.total_competencies > 0
    ? Math.round((promoRow.meets_count / promoRow.total_competencies) * 100)
    : gapResult && gapResult.total_competencies > 0
      ? Math.round((gapResult.meets_count / gapResult.total_competencies) * 100)
      : 0;
  const thresholdPct = promoRow && promoRow.avg_threshold > 0
    ? Math.round(promoRow.avg_threshold * 100)
    : null;

  const summaryChartData = [
    { label: 'Overall Score', value: overallScorePct, fill: c.accent },
    { label: 'Meets Checked', value: meetsCheckedPct, fill: c.success },
    { label: 'Needed Score', value: thresholdPct ?? 0, fill: c.warning },
  ];

  const domainChartData = domainRows.slice(0, 10).map((d) => ({
    domain: d.domain.length > 14 ? `${d.domain.slice(0, 14)}…` : d.domain,
    fullDomain: d.domain,
    score: d.score,
  }));

  const gapChartData = topGaps.slice(0, 8).map((g) => ({
    skill: g.competency_name.length > 16 ? `${g.competency_name.slice(0, 16)}…` : g.competency_name,
    fullSkill: g.competency_name,
    score: Math.round(g.score * 100),
    target: Math.round(g.threshold * 100),
    gap: Math.round(g.gap * 100),
  }));

  const statusText = promoRow?.promotion_ready ? 'Ready for Next Grade' : 'Not Ready';
  const statusStyle = promoRow?.promotion_ready
    ? { backgroundColor: 'rgb(var(--success-soft))', color: 'rgb(var(--success))' }
    : { backgroundColor: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' };

  const starsText = (n: number) => `${'★'.repeat(Math.max(0, Math.min(5, n)))}${'☆'.repeat(Math.max(0, 5 - Math.min(5, n)))}`;
  const esc = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handleDownloadPdf = () => {
    if (!gapResult || !selectedId) return;

    const employeeName = esc(gapResult.employee.full_name);
    const empCode = esc(gapResult.employee.emp_code);
    const gradeText = esc(`${gapResult.employee.current_grade} -> ${gapResult.employee.target_grade}`);
    const generatedOn = esc(new Date().toLocaleString());
    // Use same source as the preview: promoRow (domain-level avg) with gapResult as fallback
    const overallScore = Math.round((promoRow?.overall_score ?? gapResult.overall_score) * 100);
    const meetsText = gapResult.total_competencies === 0 ? 'N/A' : `${gapResult.meets_count}/${gapResult.total_competencies}`;
    const rating = promoRow ? starsText(promoRow.star_rating) : 'N/A';
    const domainBarsHtml = domainRows.length > 0
      ? domainRows
          .slice(0, 8)
          .map(d => `
            <div class="bar-row">
              <div class="bar-head"><span>${esc(d.domain)}</span><span>${d.score}%</span></div>
              <div class="bar-track"><div class="bar-fill domain" style="width:${Math.min(100, d.score)}%"></div></div>
            </div>
          `)
          .join('')
      : `<p class="bar-empty">No domain data found</p>`;

    const gapBarsHtml = topGaps.length > 0
      ? topGaps
          .slice(0, 8)
          .map(g => {
            const gapPct = Math.round(g.gap * 100);
            return `
              <div class="bar-row">
                <div class="bar-head"><span>${esc(g.competency_name)}</span><span>${gapPct}% gap</span></div>
                <div class="bar-track"><div class="bar-fill gap" style="width:${Math.min(100, gapPct)}%"></div></div>
                <div class="bar-sub">${Math.round(g.score * 100)}% current vs ${Math.round(g.threshold * 100)}% target</div>
              </div>
            `;
          })
          .join('')
      : `<p class="bar-empty">No open skill gaps</p>`;

    const domainRowsHtml = domainRows.length > 0
      ? domainRows
          .map(d => `
            <tr>
              <td>${esc(d.domain)}</td>
              <td style="text-align:right;font-weight:700;">${d.score}%</td>
            </tr>
          `)
          .join('')
      : `<tr><td colspan="2" style="text-align:center;color:#64748b;">No domain data found</td></tr>`;

    const gapRowsHtml = gapResult.gaps.length > 0
      ? gapResult.gaps
          .map(g => `
            <tr>
              <td>${esc(g.domain_name)}</td>
              <td>${esc(g.competency_name)}${g.is_critical ? ' (Critical)' : ''}</td>
              <td style="text-align:right;">${Math.round(g.score * 100)}%</td>
              <td style="text-align:right;">${Math.round(g.threshold * 100)}%</td>
              <td style="text-align:right;font-weight:700;color:${g.gap > 0 ? '#dc2626' : '#15803d'};">${g.gap > 0 ? `${Math.round(g.gap * 100)}%` : '0%'}</td>
              <td style="text-align:center;">${g.meets_grade ? 'Meets' : 'Gap'}</td>
            </tr>
          `)
          .join('')
      : `<tr><td colspan="6" style="text-align:center;color:#64748b;">No gap entries found</td></tr>`;

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Person Result Sheet - ${employeeName}</title>
        <style>
          :root { color-scheme: light; }
          body { font-family: "Segoe UI", "Noto Sans", sans-serif; margin: 24px; color: #0f172a; }
          .sheet { max-width: 1000px; margin: 0 auto; }
          .header { border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px 18px; background: linear-gradient(135deg, #eef2ff, #f8fafc); }
          .title { font-size: 24px; font-weight: 800; margin: 0; }
          .subtitle { margin-top: 4px; font-size: 12px; color: #475569; }
          .meta { margin-top: 14px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
          .meta .item { background: #ffffff; border: 1px solid #dbeafe; border-radius: 10px; padding: 10px; }
          .meta .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .03em; }
          .meta .value { font-size: 15px; font-weight: 700; margin-top: 2px; color: #1e293b; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
          .section { margin-top: 18px; }
          .section h3 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: .03em; color: #475569; }
          .bars-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .bar-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #ffffff; }
          .bar-card h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color: #475569; }
          .bar-row { margin-bottom: 8px; }
          .bar-row:last-child { margin-bottom: 0; }
          .bar-head { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: #334155; margin-bottom: 3px; }
          .bar-track { height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 999px; }
          .bar-fill.domain { background: linear-gradient(90deg, #4f46e5, #6366f1); }
          .bar-fill.gap { background: linear-gradient(90deg, #dc2626, #f97316); }
          .bar-sub { margin-top: 2px; font-size: 10px; color: #64748b; }
          .bar-empty { font-size: 11px; color: #64748b; margin: 0; padding: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 7px 8px; }
          th { background: #f8fafc; text-align: left; color: #334155; }
          .footer { margin-top: 14px; font-size: 11px; color: #64748b; text-align: right; }
          @media print { body { margin: 10px; } .sheet { max-width: none; } }
          @media (max-width: 760px) { .meta { grid-template-columns: repeat(2, minmax(0, 1fr)); } .bars-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h1 class="title">Person Result Sheet</h1>
            <p class="subtitle">Created on ${generatedOn}</p>
            <div class="meta">
              <div class="item"><div class="label">Person</div><div class="value">${employeeName}</div></div>
              <div class="item"><div class="label">Person Code</div><div class="value">${empCode}</div></div>
              <div class="item"><div class="label">Grade Path</div><div class="value">${gradeText}</div></div>
              <div class="item"><div class="label">Status</div><div class="value"><span class="badge" style="background:${promoRow?.promotion_ready ? '#dcfce7' : '#fef3c7'};color:${promoRow?.promotion_ready ? '#166534' : '#92400e'};">${promoRow?.promotion_ready ? 'Ready' : 'Not Ready'}</span></div></div>
            </div>
          </div>

          <div class="section">
            <h3>Summary</h3>
            <table>
              <tr><th>Overall Score</th><th>Skills Met</th><th>Rating</th><th>Ready For Next Grade</th></tr>
              <tr>
                <td style="font-weight:700;">${overallScore}%</td>
                <td>${meetsText}</td>
                <td>${esc(rating)}</td>
                <td>${promoRow?.promotion_ready ? 'Ready' : 'Not Ready'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>Visual Insights</h3>
            <div class="bars-grid">
              <div class="bar-card">
                <h4>Skill Area Scores</h4>
                ${domainBarsHtml}
              </div>
              <div class="bar-card">
                <h4>Top Skill Gaps</h4>
                ${gapBarsHtml}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Skill Area Scores</h3>
            <table>
              <tr><th>Skill Area</th><th style="text-align:right;">Score</th></tr>
              ${domainRowsHtml}
            </table>
          </div>

          <div class="section">
            <h3>Skill Gap Details</h3>
            <table>
              <tr>
                <th>Skill Area</th>
                <th>Skill</th>
                <th style="text-align:right;">Score</th>
                <th style="text-align:right;">Required</th>
                <th style="text-align:right;">Gap</th>
                <th style="text-align:center;">Status</th>
              </tr>
              ${gapRowsHtml}
            </table>
          </div>

          <p class="footer">DevOps Skills & Readiness Platform • Person Result Sheet</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) {
      window.alert('Popup was blocked. Please allow popups and try again.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 350);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[230px]">
          <label className="field-label">Select Person</label>
          <select
            className="field max-w-md"
            value={selectedId ?? ''}
            onChange={e => setSelectedId(e.target.value || null)}
            disabled={promoLoading || compLoading}
          >
            <option value="">— Select a person —</option>
            {personOptions.map(person => (
              <option key={person.emp_code} value={person.emp_code}>
                {person.full_name} ({person.emp_code})
                {person.current_grade && person.target_grade ? ` - ${person.current_grade} -> ${person.target_grade}` : ''}
              </option>
            ))}
          </select>
          {!promoLoading && !compLoading && personOptions.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              No people are available in your manager scope.
            </p>
          )}
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={!gapResult || gapLoading || promoLoading || compLoading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Download size={14} />
          Print / Save Result Sheet
        </button>
      </div>

      {!selectedId && <Empty msg="Select an employee to generate their result sheet." />}
      {selectedId && (gapLoading || promoLoading || compLoading) && <Loading />}
      {selectedId && gapError && <Empty msg="Failed to load result sheet details for this employee." />}

      {gapResult && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{gapResult.employee.full_name}</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
                {gapResult.employee.emp_code} • {gapResult.employee.current_grade} {'->'} {gapResult.employee.target_grade}
              </p>
            </div>
            <span className="badge" style={statusStyle}>{statusText}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Overall Score</p>
                <InfoTip text="Current achieved score compared with the required score." />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold leading-none"
                  style={{ color: thresholdPct !== null ? (overallScorePct >= thresholdPct ? 'rgb(var(--success))' : 'rgb(var(--danger))') : 'rgb(var(--accent))' }}>
                  {overallScorePct}%
                </span>
                {thresholdPct !== null && (
                  <>
                    <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-3))' }}>/</span>
                    <span className="text-sm font-semibold" style={{ color: 'rgb(var(--text-2))' }}>{thresholdPct}%</span>
                  </>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>{thresholdPct !== null ? 'Achieved / Required' : 'Needed score: N/A'}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Skills Met</p>
              <p className="text-2xl font-bold mt-1" style={{ color: gapResult.total_competencies > 0 && gapResult.meets_count === gapResult.total_competencies ? 'rgb(var(--success))' : 'rgb(var(--text-1))' }}>
                {gapResult.total_competencies === 0 ? 'N/A' : `${gapResult.meets_count}/${gapResult.total_competencies}`}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>skills met</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Rating</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#f59e0b' }}>{promoRow ? starsText(promoRow.star_rating) : 'N/A'}</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>performance rating</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>Skills Below Target</p>
              <p className="text-2xl font-bold mt-1" style={{ color: topGaps.length === 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>{topGaps.length}</p>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>skills below target</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Result Snapshot
              </p>
              <p className="text-xs mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                Overall score and skills completed against the required score
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summaryChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle(c)} formatter={(value: number) => [`${value}%`, 'Value']} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={48}>
                    {summaryChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    <LabelList dataKey="value" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: c.text }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
                Skill Area Scores
              </p>
              <p className="text-xs mb-2" style={{ color: 'rgb(var(--text-3))' }}>
                Top skill areas ranked by current score
              </p>
              {domainChartData.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: 'rgb(var(--text-3))' }}>No domain score data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={domainChartData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 8 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="domain" width={120} tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const thr = thresholdPct ?? 0;
                        const meets = thresholdPct !== null && d.score >= thresholdPct;
                        return (
                          <div style={tooltipStyle(c)}>
                            <p className="font-semibold text-xs mb-1" style={{ color: c.accent }}>{d.fullDomain}</p>
                            <p style={{ color: c.text }}>Score: {d.score}%</p>
                            {thresholdPct !== null && <p style={{ color: meets ? c.success : c.danger }}>Needed: {thr}% ({meets ? '✓ Meets' : '✗ Below'})</p>}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={18}>
                      {domainChartData.map((d, i) => {
                        const meets = thresholdPct !== null && d.score >= thresholdPct;
                        return <Cell key={`domain-bar-${i}`} fill={meets ? c.success : c.accent} />;
                      })}
                    </Bar>
                    {thresholdPct !== null && (
                      <ReferenceLine
                        x={thresholdPct}
                        stroke={c.warning}
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        label={{
                          value: `${thresholdPct}%`,
                          position: 'insideTopRight',
                          fill: c.warning,
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-2))' }}>
              Top Skill Gaps (Current vs Required)
            </p>
            <p className="text-xs mb-2" style={{ color: 'rgb(var(--text-3))' }}>
              Where development effort is most needed
            </p>
            {gapChartData.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: 'rgb(var(--success))' }}>No open gaps. This person meets the target skills.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={gapChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="18%">
                  <XAxis dataKey="skill" tick={{ fontSize: 9, fill: c.text }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.text }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: c.grid, opacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle(c)}>
                          <p className="font-semibold text-xs mb-1" style={{ color: c.warning }}>{d.fullSkill}</p>
                          <p style={{ color: c.text }}>Current: {d.score}%</p>
                          <p style={{ color: c.text }}>Needed: {d.target}%</p>
                          <p style={{ color: c.danger }}>Gap: {d.gap}%</p>
                        </div>
                      );
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: c.text, fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="score" name="Current Score %" fill={c.warning} radius={[4, 4, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="target" name="Target Score %" fill={c.success} radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-2))' }}>Skill Area Scores</p>
              {domainRows.length === 0 ? (
                <p className="text-xs py-2" style={{ color: 'rgb(var(--text-3))' }}>No skill area score data available.</p>
              ) : (
                <div className="space-y-2">
                  {domainRows.map(row => {
                    const domThreshold = thresholdPct ?? 0;
                    const meetsThreshold = thresholdPct !== null && row.score >= thresholdPct;
                    return (
                      <div key={row.domain}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: 'rgb(var(--text-1))' }}>{row.domain}</span>
                          <span style={{ color: meetsThreshold ? 'rgb(var(--success))' : domThreshold > 0 ? 'rgb(var(--danger))' : 'rgb(var(--text-2))' }}>
                            {row.score}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full relative" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(row.score, 100)}%`,
                              backgroundColor: meetsThreshold ? 'rgb(var(--success))' : 'rgb(var(--accent))',
                            }}
                          />
                          {thresholdPct !== null && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 rounded-full"
                              style={{
                                left: `${domThreshold}%`,
                                backgroundColor: c.warning,
                                transform: 'translateX(-50%)',
                              }}
                              title={`Needed: ${domThreshold}%`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgb(var(--text-2))' }}>Top Skill Gaps</p>
              {topGaps.length === 0 ? (
                <p className="text-xs py-2" style={{ color: 'rgb(var(--success))' }}>No open gaps. This person meets the target skills.</p>
              ) : (
                <div className="space-y-2">
                  {topGaps.slice(0, 8).map(g => (
                    <div key={g.competency_id} className="rounded-md px-2 py-1.5" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
                      <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-1))' }}>
                        {g.competency_name}
                        {g.is_critical && <span className="ml-1" style={{ color: 'rgb(var(--danger))' }}>(Critical)</span>}
                      </p>
                      <p className="text-[11px]" style={{ color: 'rgb(var(--text-3))' }}>
                        {g.domain_name} • Gap {Math.round(g.gap * 100)}% ({Math.round(g.score * 100)}% vs {Math.round(g.threshold * 100)}%)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
