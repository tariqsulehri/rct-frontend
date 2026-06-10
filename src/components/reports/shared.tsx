import React from 'react';
import { Table2, PieChart as PieIcon, Info } from 'lucide-react';
import { Stars as StarMeter } from '@/components/ui/Stars';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PromotionRow { employee_id: number; emp_code: string; full_name: string; current_grade: string; target_grade: string; overall_score: number; avg_threshold: number; meets_count: number; total_competencies: number; promotion_ready: boolean; star_rating: number; }
export interface CompetencyRow { employee_id: number; full_name: string; emp_code: string; current_grade: string; target_grade: string; domain_scores: Record<string, number>; overall_score: number; }
export interface GapRow { competency_id: number; competency_name: string; domain_name: string; score: number; threshold: number; gap: number; meets_grade: boolean; is_critical: boolean; }
export interface GapResult { employee: { id: number; emp_code: string; full_name: string; current_grade: string; target_grade: string; }; overall_score: number; promotion_ready: boolean; total_competencies: number; meets_count: number; gaps: GapRow[]; }

export function Stars({ n }: { n: number }) {
  return <StarMeter count={n} emptyColor="rgb(var(--surface-3))" />;
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'rgb(var(--text-2))' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }} />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

export function Empty({ msg }: { msg: string }) {
  return <p className="text-sm text-center py-12" style={{ color: 'rgb(var(--text-2))' }}>{msg}</p>;
}

export const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <button
    type="button"
    className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
    title={text}
    aria-label={text}
  >
    <Info size={13} />
  </button>
);

// ── Table shell ────────────────────────────────────────────────────────────────
export const DataTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'rgb(var(--border))' }}>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ backgroundColor: 'rgb(var(--surface-2))', borderBottom: '1px solid rgb(var(--border))' }}>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: 'rgb(var(--text-2))' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const TR: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr style={{ borderBottom: '1px solid rgb(var(--border))' }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--surface-2))')}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
    {children}
  </tr>
);

// ── View toggle ────────────────────────────────────────────────────────────────
export type View = 'chart' | 'table';
export const ViewToggle: React.FC<{ view: View; onChange: (v: View) => void }> = ({ view, onChange }) => (
  <div className="flex rounded-lg border overflow-hidden shrink-0" style={{ borderColor: 'rgb(var(--border))' }}>
    {(['chart','table'] as View[]).map(v => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          backgroundColor: view === v ? 'rgb(var(--accent))' : 'rgb(var(--surface-2))',
          color: view === v ? 'white' : 'rgb(var(--text-2))',
        }}
      >
        {v === 'chart' ? <PieIcon size={11} /> : <Table2 size={11} />}
        {v.charAt(0).toUpperCase() + v.slice(1)}
      </button>
    ))}
  </div>
);
