import React from 'react';
import { Save, Search } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { TableShell, TD, TR } from '../ConfigTable';
import {
  ConfigLineManagerAssignment,
  ConfigUser,
} from '@/hooks/useConfig';
import {
  AccessTableState,
  AssignmentStatusFilter,
  F,
  L,
  LineManagerBulkAccessForm,
  LineManagerResourceRow,
  ResourceStatusFilter,
  SelectOption,
  formatEmployeeLabel,
  formatUserLabel,
  toDateInput,
} from './accessUtils';

type LineManagerAccessPanelProps = {
  assignedEmployeeCount: number;
  unassignedEmployeeCount: number;
  activeLineAssignments: ConfigLineManagerAssignment[];
  selectedLineManager?: ConfigUser;
  selectedManagerActiveAssignments: ConfigLineManagerAssignment[];
  newlySelectedResourceCount: number;
  visibleResourceRows: LineManagerResourceRow[];
  visibleSelectableResourceIds: string[];
  selectedLineBulkEmployees: LineManagerResourceRow[];
  lineBulkForm: LineManagerBulkAccessForm;
  setLineBulkForm: React.Dispatch<React.SetStateAction<LineManagerBulkAccessForm>>;
  lineManagerOptions: SelectOption[];
  resourceDepartmentFilter: string;
  setResourceDepartmentFilter: React.Dispatch<React.SetStateAction<string>>;
  resourceDepartmentOptions: string[];
  resourceGradeFilter: string;
  setResourceGradeFilter: React.Dispatch<React.SetStateAction<string>>;
  resourceGradeOptions: string[];
  resourceStatusFilter: ResourceStatusFilter;
  setResourceStatusFilter: React.Dispatch<React.SetStateAction<ResourceStatusFilter>>;
  lineEmployeeSearch: string;
  setLineEmployeeSearch: React.Dispatch<React.SetStateAction<string>>;
  hasLineBulkChanges: boolean;
  syncLineAssignmentsPending: boolean;
  saveError: string | null;
  lineStatusFilter: AssignmentStatusFilter;
  setLineStatusFilter: React.Dispatch<React.SetStateAction<AssignmentStatusFilter>>;
  lineState: AccessTableState<ConfigLineManagerAssignment>;
  lineLoading: boolean;
  lineError: boolean;
  statusBadge: (active: boolean) => React.ReactNode;
  loadLineBulkManager: (managerUserId: string) => void;
  saveLineBulkAssignments: () => void;
  toggleLineBulkEmployee: (employeeId: string) => void;
  onEditLine: (assignment: ConfigLineManagerAssignment) => void;
  onDeactivateLine: (assignment: ConfigLineManagerAssignment) => Promise<void>;
  onReactivateLine: (assignment: ConfigLineManagerAssignment) => Promise<void>;
};

export const LineManagerAccessPanel: React.FC<LineManagerAccessPanelProps> = ({
  assignedEmployeeCount,
  unassignedEmployeeCount,
  activeLineAssignments,
  selectedLineManager,
  selectedManagerActiveAssignments,
  newlySelectedResourceCount,
  visibleResourceRows,
  visibleSelectableResourceIds,
  selectedLineBulkEmployees,
  lineBulkForm,
  setLineBulkForm,
  lineManagerOptions,
  resourceDepartmentFilter,
  setResourceDepartmentFilter,
  resourceDepartmentOptions,
  resourceGradeFilter,
  setResourceGradeFilter,
  resourceGradeOptions,
  resourceStatusFilter,
  setResourceStatusFilter,
  lineEmployeeSearch,
  setLineEmployeeSearch,
  hasLineBulkChanges,
  syncLineAssignmentsPending,
  saveError,
  lineStatusFilter,
  setLineStatusFilter,
  lineState,
  lineLoading,
  lineError,
  statusBadge,
  loadLineBulkManager,
  saveLineBulkAssignments,
  toggleLineBulkEmployee,
  onEditLine,
  onDeactivateLine,
  onReactivateLine,
}) => {
  const [activeTab, setActiveTab] = React.useState<'assign' | 'history'>('assign');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Assigned', value: assignedEmployeeCount, tone: 'rgb(var(--success))' },
          { label: 'Unassigned', value: unassignedEmployeeCount, tone: 'rgb(var(--warning))' },
          { label: 'Active Rows', value: activeLineAssignments.length, tone: 'rgb(var(--accent-txt))' },
        ].map(item => (
          <div key={item.label} className="rounded-lg border px-4 py-3"
            style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}>
            <p className="text-xs font-bold uppercase" style={{ color: 'rgb(var(--text-2))' }}>{item.label}</p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: item.tone }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-1.5 inline-flex gap-1.5 rounded-xl border flex-wrap" style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
        {[
          { id: 'assign' as const, label: '👥 Assign Resources' },
          { id: 'history' as const, label: '⚙️ Configure Assignments' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              style={{
                backgroundColor: isActive ? 'rgb(var(--accent))' : 'transparent',
                color: isActive ? '#ffffff' : 'rgb(var(--text-1))',
                boxShadow: isActive ? '0 2px 8px rgba(124, 58, 237, 0.35)' : 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'assign' && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface))' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
        style={{ borderColor: 'rgb(var(--border))', background: 'linear-gradient(135deg, #0f766e 0%, #7c3aed 100%)' }}>
        <div>
          <p className="text-sm font-extrabold text-white">Line Manager Resource Assignment</p>
          <p className="text-xs text-white/75">{selectedLineManager ? formatUserLabel(selectedLineManager) : 'Select a line manager to assign employee resources.'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-md px-2.5 py-1 text-xs font-bold bg-white/15 text-white">{selectedManagerActiveAssignments.length} assigned</span>
          {newlySelectedResourceCount > 0 && (
            <span className="rounded-md px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.26)', color: 'white' }}>
              {newlySelectedResourceCount} new
            </span>
          )}
          <span className="rounded-md px-2.5 py-1 text-xs font-bold bg-white/15 text-white">{visibleResourceRows.length} shown</span>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
            disabled={!lineBulkForm.manager_user_id || syncLineAssignmentsPending || !hasLineBulkChanges}
            onClick={saveLineBulkAssignments}>
            <Save size={13} /> Save Assignments
          </button>
        </div>
      </div>

      {saveError && <div className="mx-4 mt-3 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(127,29,29,0.20)', color: 'rgb(var(--danger))' }}>{saveError}</div>}

      <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
        <div className="lg:col-span-2">
          <label className={L}>Line Manager</label>
          <SearchableSelect value={lineBulkForm.manager_user_id} onChange={loadLineBulkManager} placeholder="Select line manager..." options={lineManagerOptions} />
        </div>
        <div><label className={L}>Role</label><input className={F} value={lineBulkForm.relationship_type} readOnly disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} /></div>
        <div><label className={L}>Start Date</label><input type="date" className={F} value={lineBulkForm.starts_at} onChange={e => setLineBulkForm({ ...lineBulkForm, starts_at: e.target.value })} /></div>
        <div><label className={L}>End Date</label><input type="date" className={F} value={lineBulkForm.ends_at} onChange={e => setLineBulkForm({ ...lineBulkForm, ends_at: e.target.value })} /></div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[280px] flex-1" style={{ backgroundColor: 'rgb(var(--surface-2))' }}>
            <Search size={15} style={{ color: 'rgb(var(--text-3))' }} />
            <input
              value={lineEmployeeSearch}
              onChange={event => setLineEmployeeSearch(event.target.value)}
              placeholder="Search employee code, name, department, grade, manager..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: 'rgb(var(--text-1))' }}
            />
            {lineEmployeeSearch && <button type="button" className="text-xs" style={{ color: 'rgb(var(--text-3))' }} onClick={() => setLineEmployeeSearch('')}>Clear</button>}
          </div>
          <div className="card p-1.5 flex gap-1">
            {[
              { id: 'assignable' as const, label: 'Assignable' },
              { id: 'assigned' as const, label: 'Assigned' },
              { id: 'all' as const, label: 'All' },
            ].map(item => (
              <button key={item.id} type="button" onClick={() => setResourceStatusFilter(item.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{
                  backgroundColor: resourceStatusFilter === item.id ? 'rgb(var(--accent))' : 'transparent',
                  color: resourceStatusFilter === item.id ? 'white' : 'rgb(var(--text-2))',
                }}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs rounded-lg font-medium"
              disabled={!lineBulkForm.manager_user_id || visibleSelectableResourceIds.length === 0}
              onClick={() => setLineBulkForm(current => ({ ...current, employee_ids: Array.from(new Set([...current.employee_ids, ...visibleSelectableResourceIds])) }))}>
              Select Visible
            </button>
            <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs rounded-lg font-medium"
              disabled={selectedLineBulkEmployees.length === 0}
              onClick={() => setLineBulkForm(current => ({ ...current, employee_ids: [] }))}>
              Clear Selection
            </button>
          </div>
        </div>

        {/* Filters Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
          <div>
            <SearchableSelect value={resourceDepartmentFilter} onChange={setResourceDepartmentFilter} placeholder="Filter by Department..." options={resourceDepartmentOptions.map(name => ({ value: name, label: name }))} />
          </div>
          <div>
            <SearchableSelect value={resourceGradeFilter} onChange={setResourceGradeFilter} placeholder="Filter by Resource Grade..." options={resourceGradeOptions.map(code => ({ value: code, label: code }))} />
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'rgb(var(--surface-2))', color: 'rgb(var(--text-2))' }}>
                <tr>
                  <th className="px-3 py-2 text-left w-12">Assign</th>
                  <th className="px-3 py-2 text-left">Employee Resource</th>
                  <th className="px-3 py-2 text-left">Department</th>
                  <th className="px-3 py-2 text-left">Grade</th>
                  <th className="px-3 py-2 text-left">Current Line Manager</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {!lineBulkForm.manager_user_id ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>Select a line manager first.</td></tr>
                ) : visibleResourceRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center" style={{ color: 'rgb(var(--text-3))' }}>No employee resources match the filters.</td></tr>
                ) : visibleResourceRows.map(row => (
                  <tr key={row.employee.id} className="border-t" style={{
                    borderColor: row.newlySelected ? 'rgba(34,197,94,0.55)' : 'rgb(var(--border))',
                    backgroundColor: row.newlySelected
                      ? 'rgba(22,163,74,0.18)'
                      : row.assignedToSelectedManager
                        ? 'rgb(var(--accent-soft))'
                        : 'transparent',
                  }}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        disabled={row.disabled}
                        onChange={() => toggleLineBulkEmployee(String(row.employee.id))}
                        style={{ accentColor: 'rgb(var(--accent))' }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{row.employee.emp_code} - {row.employee.full_name}</p>
                      <p className="text-xs" style={{ color: 'rgb(var(--text-3))' }}>{row.employee.email ?? 'No email'}</p>
                    </td>
                    <td className="px-3 py-2" style={{ color: 'rgb(var(--text-2))' }}>{row.department || '-'}</td>
                    <td className="px-3 py-2" style={{ color: 'rgb(var(--text-2))' }}>{row.grade || '-'}{row.targetGrade ? ` -> ${row.targetGrade}` : ''}</td>
                    <td className="px-3 py-2" style={{ color: 'rgb(var(--text-2))' }}>{row.managerLabel || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={row.newlySelected ? 'badge badge-success' : row.assignedToSelectedManager ? 'badge' : row.assignedElsewhere ? 'badge badge-warning' : 'badge'}>
                        {row.newlySelected ? 'New assignment' : row.assignedToSelectedManager ? 'Already assigned' : row.assignedElsewhere ? 'Assigned elsewhere' : 'Available'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="card p-1.5 inline-flex gap-1">
            {[
              { id: 'active' as const, label: 'Active Rows' },
              { id: 'inactive' as const, label: 'Removed History' },
              { id: 'all' as const, label: 'All History' },
            ].map(item => (
              <button key={item.id} type="button" onClick={() => setLineStatusFilter(item.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{
                  backgroundColor: lineStatusFilter === item.id ? 'rgb(var(--accent))' : 'transparent',
                  color: lineStatusFilter === item.id ? 'white' : 'rgb(var(--text-2))',
                }}>
                {item.label}
              </button>
            ))}
          </div>
          <TableShell tabKey="line-manager-access" title="Assignment Rows"
      headers={['Line Manager', 'Reporting Employee', 'Role', 'Permissions', 'Dates', 'Status']}
      loading={lineLoading} error={lineError}
      q={lineState.q} onSearch={lineState.onSearch} page={lineState.page} total={lineState.filtered.length} onPage={lineState.setPage}>
      {lineState.paged.map((assignment, idx) => (
        <TR key={assignment.id} idx={idx}>
          <TD><span className="font-semibold">{formatUserLabel(assignment.manager_user)}</span></TD>
          <TD>{formatEmployeeLabel(assignment.employee)}</TD>
          <TD mono>{assignment.relationship_type}{assignment.is_primary ? ' / PRIMARY' : ''}</TD>
          <TD small>{assignment.can_view ? 'View' : 'No view'} / {assignment.can_assess ? 'Assess' : 'No assess'}</TD>
          <TD small muted>{toDateInput(assignment.starts_at) || '-'} to {toDateInput(assignment.ends_at) || 'Open'}</TD>
          <TD>{statusBadge(assignment.is_active)}</TD>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => onEditLine(assignment)} className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium">Edit</button>
              {assignment.is_active ? (
                <button className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium" style={{ color: 'rgb(var(--danger))' }}
                  onClick={() => onDeactivateLine(assignment)}>
                  Unassign
                </button>
              ) : (
                <button className="btn-ghost px-2.5 py-1 text-xs rounded-lg font-medium" style={{ color: 'rgb(var(--success))' }}
                  onClick={() => onReactivateLine(assignment)}>
                  Reactivate
                </button>
              )}
            </div>
          </td>
        </TR>
      ))}
    </TableShell>
  </div>
)}
  </div>
  );
};
