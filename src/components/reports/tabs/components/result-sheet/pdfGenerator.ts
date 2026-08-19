import { roundPct, fractionToPct, clampPct } from '@/lib/formatters';

const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const generateResultSheetPdf = (data: {
  gapResult: any;
  selectedId: string | null;
  promoRow: any;
  domainRows: { domain: string; score: number }[];
  topGaps: any[];
  visibleGaps: any[];
  isTechReady: boolean;
  commLevel: string;
  commExpected: string;
  isCommReady: boolean;
  combinedStatusText: string;
}) => {
  const {
    gapResult,
    selectedId,
    promoRow,
    domainRows,
    topGaps,
    visibleGaps,
    isTechReady,
    commLevel,
    commExpected,
    isCommReady,
    combinedStatusText,
  } = data;

  if (!gapResult || !selectedId) return;

  const employeeName = esc(gapResult.employee.full_name);
  const empCode = esc(gapResult.employee.emp_code);
  const department = esc(gapResult.employee.department || '');
  const gradeText = esc(`${gapResult.employee.current_grade} -> ${gapResult.employee.target_grade}`);
  const generatedOn = esc(new Date().toLocaleString());
  const overallScore = promoRow
    ? roundPct(promoRow.overall_score)
    : fractionToPct(gapResult.overall_score);
  const meetsText = gapResult.total_competencies === 0 ? 'N/A' : `${gapResult.meets_count}/${gapResult.total_competencies}`;

  const domainBarsHtml = domainRows.length > 0
    ? domainRows
        .slice(0, 8)
        .map(d => `
          <div class="bar-row">
            <div class="bar-head"><span>${esc(d.domain)}</span><span>${d.score}%</span></div>
            <div class="bar-track"><div class="bar-fill domain" style="width:${clampPct(d.score)}%"></div></div>
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
              <div class="bar-track"><div class="bar-fill gap" style="width:${clampPct(gapPct)}%"></div></div>
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
