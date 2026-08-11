import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useGapAnalysis, usePromotionReadiness, useCompetencyScores } from '@/hooks/useReports';
import { useLatestCommAssessment } from '@/hooks/useCommunication';
import { Empty, GapResult, InfoTip, Loading } from '../shared';
import { toPct, toPctNullable } from '@/lib/formatters';
import { DEFAULT_REPORT_FILTERS, type ReportFilters } from '../reportFilters';

// ─────────────────────────────────────────────────────────────────────────────
// ── Person Result Sheet PDF ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export const EmployeeResultSheetTab: React.FC<{ reportFilters?: ReportFilters }> = ({ reportFilters = DEFAULT_REPORT_FILTERS }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: gapData, isLoading: gapLoading, isError: gapError } = useGapAnalysis(selectedId);
  const { data: promoData, isLoading: promoLoading } = usePromotionReadiness();
  const { data: compData, isLoading: compLoading } = useCompetencyScores();

  const personOptions = useMemo(() => {
    const people = new Map<string, { emp_code: string; full_name: string; department?: string; current_grade?: string; target_grade?: string }>();
    const promoByCode = new Map((promoData ?? []).map((row) => [row.emp_code, row]));
    const compByCode = new Map((compData ?? []).map((row) => [row.emp_code, row]));
    for (const row of promoData ?? []) {
      people.set(row.emp_code, {
        emp_code: row.emp_code,
        full_name: row.full_name,
        department: row.department,
        current_grade: row.current_grade,
        target_grade: row.target_grade,
      });
    }
    for (const row of compData ?? []) {
      if (!people.has(row.emp_code)) {
        people.set(row.emp_code, {
          emp_code: row.emp_code,
          full_name: row.full_name,
          department: row.department,
          current_grade: row.current_grade,
          target_grade: row.target_grade,
        });
      }
    }
    const q = reportFilters.search.trim().toLowerCase();
    return [...people.values()]
      .filter((person) => {
        const promo = promoByCode.get(person.emp_code);
        const comp = compByCode.get(person.emp_code);
        const isReady = Boolean(promo?.promotion_ready);
        const nearReady = Boolean(
          promo &&
          !promo.promotion_ready &&
          promo.total_competencies > 0 &&
          promo.meets_count / promo.total_competencies >= 0.75
        );
        const matchesSearch = !q || `${person.full_name} ${person.emp_code}`.toLowerCase().includes(q);
        const matchesDepartment = reportFilters.department === 'all' || person.department === reportFilters.department;
        const matchesCurrent = reportFilters.currentGrade === 'all' || person.current_grade === reportFilters.currentGrade;
        const matchesTarget = reportFilters.targetGrade === 'all' || person.target_grade === reportFilters.targetGrade;
        const matchesSkillArea = reportFilters.skillArea === 'all' || comp?.domain_scores?.[reportFilters.skillArea] !== undefined;
        const matchesReadiness =
          reportFilters.readiness === 'all' ||
          (reportFilters.readiness === 'ready' && isReady) ||
          (reportFilters.readiness === 'near-ready' && nearReady) ||
          (reportFilters.readiness === 'not-ready' && !isReady && !nearReady);
        return matchesSearch && matchesDepartment && matchesCurrent && matchesTarget && matchesSkillArea && matchesReadiness;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [compData, promoData, reportFilters]);

  useEffect(() => {
    if (promoLoading || compLoading || !selectedId) return;
    if (!personOptions.some((person) => person.emp_code === selectedId)) {
      setSelectedId(null);
    }
  }, [compLoading, personOptions, promoLoading, selectedId]);

  const gapResult = gapData as GapResult | undefined;
  const promoRow = (promoData ?? []).find(r => r.emp_code === selectedId);
  const compRow = (compData ?? []).find(r => r.emp_code === selectedId);
  const { data: commData } = useLatestCommAssessment(selectedId);

  const isTechReady = Boolean(promoRow?.promotion_ready);
  const commLevel = commData?.evaluation?.overallCefr ?? (commData?.ratings?.length ? 'B2' : 'B1');
  const commExpected = commData?.evaluation?.expectedCefr ?? 'B2';
  const isCommReady = Boolean(
    commData?.evaluation?.communicationReady ??
    (commData?.status === 'approved' && commLevel >= commExpected)
  );

  let combinedStatusText = 'NOT READY';
  let combinedBadgeStyle = { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' };

  if (isTechReady && isCommReady) {
    combinedStatusText = 'PROMOTION READY';
    combinedBadgeStyle = { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' };
  } else if (isTechReady && !isCommReady) {
    combinedStatusText = 'CEFR GATED';
    combinedBadgeStyle = { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' };
  } else if (!isTechReady && isCommReady) {
    combinedStatusText = 'TECH GAP';
    combinedBadgeStyle = { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' };
  }

  const domainRows = Object.entries(compRow?.domain_scores ?? {})
    .filter(([domain]) => reportFilters.skillArea === 'all' || domain === reportFilters.skillArea)
    .map(([domain, score]) => ({ domain, score: Math.round(score * 100) }))
    .sort((a, b) => b.score - a.score);

  const visibleGaps = (gapResult?.gaps ?? [])
    .filter(g => reportFilters.skillArea === 'all' || g.domain_name === reportFilters.skillArea);

  const topGaps = visibleGaps
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const overallScorePct = toPct(promoRow?.overall_score ?? gapResult?.overall_score ?? 0);
  const meetsCheckedPct = promoRow && promoRow.total_competencies > 0
    ? Math.round((promoRow.meets_count / promoRow.total_competencies) * 100)
    : gapResult && gapResult.total_competencies > 0
      ? Math.round((gapResult.meets_count / gapResult.total_competencies) * 100)
      : 0;
  const thresholdPct = toPctNullable(promoRow?.avg_threshold);

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
    const department = esc(gapResult.employee.department);
    const gradeText = esc(`${gapResult.employee.current_grade} -> ${gapResult.employee.target_grade}`);
    const generatedOn = esc(new Date().toLocaleString());
    // Use same source as the preview: promoRow (domain-level avg) with gapResult as fallback
    const overallScore = toPct(promoRow?.overall_score ?? gapResult.overall_score);
    const meetsText = gapResult.total_competencies === 0 ? 'N/A' : `${gapResult.meets_count}/${gapResult.total_competencies}`;
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

    const gapRowsHtml = visibleGaps.length > 0
      ? visibleGaps
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
              <div class="item"><div class="label">Department</div><div class="value">${department}</div></div>
              <div class="item"><div class="label">Grade Path</div><div class="value">${gradeText}</div></div>
              <div class="item"><div class="label">Technical Target</div><div class="value">${isTechReady ? 'Met' : 'Pending'}</div></div>
              <div class="item"><div class="label">CEFR Level</div><div class="value">${commLevel} (${commExpected} Target)</div></div>
              <div class="item"><div class="label">CEFR Status</div><div class="value">${isCommReady ? 'Certified' : 'Gated'}</div></div>
              <div class="item"><div class="label">Promotion Readiness</div><div class="value"><span class="badge" style="background:${isTechReady && isCommReady ? '#dcfce7' : isTechReady ? '#fef3c7' : '#fee2e2'};color:${isTechReady && isCommReady ? '#166534' : isTechReady ? '#92400e' : '#991b1b'};">${combinedStatusText}</span></div></div>
            </div>
          </div>

          <div class="section">
            <h3>Pillar Evaluation Summary</h3>
            <table>
              <tr><th>Technical Score</th><th>Technical Target</th><th>CEFR Level</th><th>CEFR Benchmark</th><th>Combined Status</th></tr>
              <tr>
                <td style="font-weight:700;">${overallScore}%</td>
                <td>${isTechReady ? 'Met' : 'Gap'} (${meetsText})</td>
                <td style="font-weight:700;">${commLevel}</td>
                <td>${commExpected} (${isCommReady ? 'Certified' : 'Gated'})</td>
                <td><strong style="color:${isTechReady && isCommReady ? '#166534' : isTechReady ? '#92400e' : '#991b1b'};">${combinedStatusText}</strong></td>
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
                {person.department ? ` - ${person.department}` : ''}
                {person.current_grade && person.target_grade ? ` - ${person.current_grade} -> ${person.target_grade}` : ''}
              </option>
            ))}
          </select>
          {!promoLoading && !compLoading && personOptions.length === 0 && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              No people match the current report filters.
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
                {gapResult.employee.emp_code} • {gapResult.employee.department} • {gapResult.employee.current_grade} {'->'} {gapResult.employee.target_grade}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge" style={combinedBadgeStyle}>{combinedStatusText}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>CEFR Proficiency</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold leading-none" style={{ color: isCommReady ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
                  {commLevel}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'rgb(var(--text-3))' }}>/ {commExpected} Target</span>
              </div>
              <p className="text-xs mt-1 font-medium" style={{ color: isCommReady ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
                {isCommReady ? '✓ Certified' : '⚠ Benchmark Deficit'}
              </p>
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
            {/* 1. Result Snapshot */}
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Result Snapshot & Score Gauge
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Overall score and competencies passed against the target requirement
                </p>
              </div>

              {/* Achieved Score Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Overall Achieved Score</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{overallScorePct}%</span>
                </div>
                <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, overallScorePct)}%` }}
                  />
                  {thresholdPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      style={{ left: `${Math.min(100, thresholdPct)}%` }}
                      title={`Target Required Score: ${thresholdPct}%`}
                    />
                  )}
                </div>
                {thresholdPct !== null && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>0%</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Target Threshold: {thresholdPct}%
                    </span>
                    <span>100%</span>
                  </div>
                )}
              </div>

              {/* Skills Met Ratio Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Competencies Passed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {gapResult.meets_count} / {gapResult.total_competencies} ({meetsCheckedPct}%)
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, meetsCheckedPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Skill Area Scores */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skill Area Scores (Ranked)
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Technology domains ordered by current mastery
                </p>
              </div>

              {domainChartData.length === 0 ? (
                <p className="text-xs py-8 text-center text-slate-400">No domain score data available.</p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {domainChartData.map((d) => {
                    const meets = thresholdPct !== null && d.score >= thresholdPct;

                    return (
                      <div key={d.fullDomain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {d.fullDomain}
                          </span>
                          <span className={`font-bold shrink-0 ${meets ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {d.score}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              meets
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                            }`}
                            style={{ width: `${Math.min(100, d.score)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. Top Skill Gaps (Current vs Required) */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top Skill Gaps (Current vs Target Requirement)
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Priority development areas ranked by required growth
              </p>
            </div>

            {gapChartData.length === 0 ? (
              <p className="text-xs py-6 text-center text-emerald-600 font-medium">
                ✓ No open gaps. This person meets all target skill requirements!
              </p>
            ) : (
              <div className="space-y-3">
                {gapChartData.map((g) => (
                  <div key={g.fullSkill} className="p-2.5 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {g.fullSkill}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500 text-[11px]">
                          Current: <strong className="text-amber-600">{g.score}%</strong> / Target: <strong className="text-indigo-600">{g.target}%</strong>
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200">
                          Gap: -{g.gap}%
                        </span>
                      </div>
                    </div>

                    {/* Dual Track Bar */}
                    <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      {/* Target Indicator Fill */}
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-indigo-200 dark:bg-indigo-900/60 rounded-full"
                        style={{ width: `${Math.min(100, g.target)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, g.score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
