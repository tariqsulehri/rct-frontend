import React from 'react';
import { clsx } from 'clsx';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={clsx('data-table', className)}>{children}</table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>{children}</thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <tr className={clsx(className)}>{children}</tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={clsx('px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left', className)}
    style={{ color: 'rgb(var(--text-2))' }}>
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={clsx('px-4 py-3', className)}>{children}</td>
);
