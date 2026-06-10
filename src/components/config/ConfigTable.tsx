import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { getConfigTablePageSize, HEADER_GRADIENTS } from './ConfigTableState';
import { PanelHeader } from '@/components/ui/PanelHeader';

const Pagination: React.FC<{ page: number; total: number; pageSize: number; onChange: (p: number) => void }> = ({
  page, total, pageSize, onChange,
}) => {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
      <span className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce<(number | string)[]>((acc, p, i, arr) => {
            if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) => p === '...' ? (
            <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs"
              style={{ color: 'rgb(var(--text-3))' }}>...</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className="w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: p === page ? 'rgb(var(--accent))' : 'transparent',
                color: p === page ? 'white' : 'rgb(var(--text-2))',
              }}>
              {p}
            </button>
          ))}
        <button
          onClick={() => onChange(page + 1)} disabled={page === pages}
          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export const TableShell: React.FC<{
  tabKey: string;
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  q: string;
  onSearch: (v: string) => void;
  page: number;
  total: number;
  onPage: (p: number) => void;
}> = ({ tabKey, title, onAdd, addLabel, headers, children, loading, error, q, onSearch, page, total, onPage }) => (
  <div className="card p-0 overflow-hidden">
    <PanelHeader
      title={title}
      background={HEADER_GRADIENTS[tabKey]}
      dense
      highContrast
      action={onAdd && addLabel ? (
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}>
          <Plus size={13} /> {addLabel}
        </button>
      ) : undefined}
    />

    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgb(var(--border))' }}>
      <Search size={14} style={{ color: 'rgb(var(--text-3))' }} />
      <input
        value={q}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search..."
        className="bg-transparent text-sm outline-none flex-1"
        style={{ color: 'rgb(var(--text-1))' }}
      />
      {q && (
        <button onClick={() => onSearch('')} className="text-xs px-1.5 py-0.5 rounded"
          style={{ color: 'rgb(var(--text-3))' }}>x</button>
      )}
    </div>

    {loading && <p className="text-sm py-10 text-center" style={{ color: 'rgb(var(--text-2))' }}>Loading...</p>}
    {error && <p className="text-sm py-10 text-center" style={{ color: 'rgb(var(--danger))' }}>Failed to load data.</p>}
    {!loading && !error && (
      <>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr style={{ borderBottom: '2px solid rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
                {headers.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'rgb(var(--text-2))' }}>
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'rgb(var(--text-2))' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={getConfigTablePageSize()} onChange={onPage} />
      </>
    )}
  </div>
);

export const TR: React.FC<{ children: React.ReactNode; idx: number }> = ({ children, idx }) => (
  <tr
    style={{
      borderBottom: '1px solid rgb(var(--border))',
      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)',
    }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--accent-soft) / 0.35)')}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgb(var(--surface-2) / 0.4)')}
  >
    {children}
  </tr>
);

export const TD: React.FC<{ children: React.ReactNode; mono?: boolean; muted?: boolean; small?: boolean }> = ({
  children, mono, muted, small,
}) => (
  <td className={`px-4 py-3 ${small ? 'text-xs' : 'text-sm'} ${mono ? 'font-mono' : ''}`}
    style={{ color: muted ? 'rgb(var(--text-2))' : 'rgb(var(--text-1))' }}>
    {children}
  </td>
);

export const ActionBtns: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <td className="px-4 py-3">
    <div className="flex gap-1.5">
      <button onClick={onEdit} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
      <button onClick={onDelete} className="px-2.5 py-1 text-xs rounded-lg font-medium transition-colors"
        style={{ color: 'rgb(var(--danger))' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--danger-soft))')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
        Delete
      </button>
    </div>
  </td>
);
