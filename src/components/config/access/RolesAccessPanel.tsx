import React from 'react';
import { TableShell, TD, TR } from '../ConfigTable';
import { ConfigRole } from '@/hooks/useConfig';
import { AccessTableState } from './accessUtils';

type RolesAccessPanelProps = {
  roleState: AccessTableState<ConfigRole>;
  loading: boolean;
  error: boolean;
  statusBadge: (active: boolean) => React.ReactNode;
  onEditRole: (role: ConfigRole) => void;
};

export const RolesAccessPanel: React.FC<RolesAccessPanelProps> = ({
  roleState,
  loading,
  error,
  statusBadge,
  onEditRole,
}) => (
  <TableShell tabKey="roles" title="Roles" headers={['Role', 'Code', 'Description', 'Permissions', 'Status']}
    loading={loading} error={error}
    q={roleState.q} onSearch={roleState.onSearch} page={roleState.page} total={roleState.filtered.length} onPage={roleState.setPage}>
    {roleState.paged.map((role, idx) => (
      <TR key={role.id} idx={idx}>
        <TD><span className="font-semibold">{role.name}</span></TD>
        <TD mono>{role.code}</TD>
        <TD muted small>{role.description ?? '-'}</TD>
        <TD small>
          <span className="badge">{role.role_permissions?.length ?? 0} permissions</span>
        </TD>
        <TD>{statusBadge(role.is_active)}</TD>
        <td className="px-4 py-3">
          <button onClick={() => onEditRole(role)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
        </td>
      </TR>
    ))}
  </TableShell>
);
