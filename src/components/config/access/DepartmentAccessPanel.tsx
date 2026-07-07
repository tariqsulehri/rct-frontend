import React from 'react';
import { ActionBtns, TableShell, TD, TR } from '../ConfigTable';
import { ConfigDepartmentAssignment } from '@/hooks/useConfig';
import { AccessTableState, formatUserLabel, toDateInput } from './accessUtils';

type DepartmentAccessPanelProps = {
  deptState: AccessTableState<ConfigDepartmentAssignment>;
  loading: boolean;
  error: boolean;
  statusBadge: (active: boolean) => React.ReactNode;
  onAdd: () => void;
  onEdit: (assignment: ConfigDepartmentAssignment) => void;
  onDelete: (assignment: ConfigDepartmentAssignment) => void;
};

export const DepartmentAccessPanel: React.FC<DepartmentAccessPanelProps> = ({
  deptState,
  loading,
  error,
  statusBadge,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <TableShell tabKey="department-access" title="Department Access" onAdd={onAdd} addLabel="Assign Departments"
    headers={['User', 'Department', 'Type', 'Permissions', 'Dates', 'Status']}
    loading={loading} error={error}
    q={deptState.q} onSearch={deptState.onSearch} page={deptState.page} total={deptState.filtered.length} onPage={deptState.setPage}>
    {deptState.paged.map((assignment, idx) => (
      <TR key={assignment.id} idx={idx}>
        <TD><span className="font-semibold">{formatUserLabel(assignment.user)}</span></TD>
        <TD>{assignment.department?.name ?? `#${assignment.department_id}`}</TD>
        <TD mono>{assignment.assignment_type}</TD>
        <TD small>{assignment.can_view ? 'View' : 'No view'} / {assignment.can_manage ? 'Manage' : 'No manage'}</TD>
        <TD small muted>{toDateInput(assignment.starts_at) || '-'} to {toDateInput(assignment.ends_at) || 'Open'}</TD>
        <TD>{statusBadge(assignment.is_active)}</TD>
        <ActionBtns onEdit={() => onEdit(assignment)} onDelete={() => onDelete(assignment)} />
      </TR>
    ))}
  </TableShell>
);
