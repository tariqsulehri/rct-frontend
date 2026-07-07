import React from 'react';
import { TableShell, TD, TR } from '../ConfigTable';
import { ConfigAccessAuditLog } from '@/hooks/useConfig';
import { AccessTableState, formatUserLabel } from './accessUtils';

type AccessAuditPanelProps = {
  auditState: AccessTableState<ConfigAccessAuditLog>;
  loading: boolean;
  error: boolean;
};

export const AccessAuditPanel: React.FC<AccessAuditPanelProps> = ({
  auditState,
  loading,
  error,
}) => (
  <TableShell tabKey="access-audit" title="Recent Access Audit" headers={['Time', 'Actor', 'Target', 'Action', 'Entity']}
    loading={loading} error={error}
    q={auditState.q} onSearch={auditState.onSearch} page={auditState.page} total={auditState.filtered.length} onPage={auditState.setPage}>
    {auditState.paged.map((log, idx) => (
      <TR key={log.id} idx={idx}>
        <TD small>{new Date(log.created_at).toLocaleString()}</TD>
        <TD small>{formatUserLabel(log.actor_user)}</TD>
        <TD small muted>{log.target_user ? formatUserLabel(log.target_user) : '-'}</TD>
        <TD mono small>{log.action}</TD>
        <TD small>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</TD>
        <td className="px-4 py-3" />
      </TR>
    ))}
  </TableShell>
);
