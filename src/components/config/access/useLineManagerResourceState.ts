import { useMemo } from 'react';
import {
  ConfigEmployee,
  ConfigLineManagerAssignment,
  ConfigUser,
} from '@/hooks/useConfig';
import {
  AssignmentStatusFilter,
  LineManagerBulkAccessForm,
  ResourceStatusFilter,
  formatUserLabel,
} from './accessUtils';

type UseLineManagerResourceStateInput = {
  users?: ConfigUser[];
  employees?: ConfigEmployee[];
  lineAssignments?: ConfigLineManagerAssignment[];
  lineFormManagerUserId: string;
  lineBulkForm: LineManagerBulkAccessForm;
  lineStatusFilter: AssignmentStatusFilter;
  resourceStatusFilter: ResourceStatusFilter;
  resourceDepartmentFilter: string;
  resourceGradeFilter: string;
  lineEmployeeSearch: string;
};

export function useLineManagerResourceState({
  users,
  employees,
  lineAssignments,
  lineFormManagerUserId,
  lineBulkForm,
  lineStatusFilter,
  resourceStatusFilter,
  resourceDepartmentFilter,
  resourceGradeFilter,
  lineEmployeeSearch,
}: UseLineManagerResourceStateInput) {
  const safeUsers = users ?? [];
  const safeEmployees = employees ?? [];
  const safeLineAssignments = lineAssignments ?? [];

  return useMemo(() => {
    const selectedLineManagerUserIds = new Set([lineFormManagerUserId, lineBulkForm.manager_user_id].filter(Boolean));
    const lineManagerOptions = safeUsers
      .filter(user => user.is_active || selectedLineManagerUserIds.has(String(user.id)))
      .map(user => ({
        value: String(user.id),
        label: formatUserLabel(user),
        sub: user.role,
      }));

    const selectedBulkManagerEmployeeId = safeUsers.find(user => String(user.id) === lineBulkForm.manager_user_id)?.employee_id;
    const activeLineAssignments = safeLineAssignments.filter(assignment => assignment.is_active);
    const activeAssignedEmployeeIds = new Set(activeLineAssignments.map(assignment => assignment.employee_id));
    const assignedEmployeeCount = activeAssignedEmployeeIds.size;
    const unassignedEmployeeCount = Math.max(safeEmployees.length - assignedEmployeeCount, 0);
    const filteredLineAssignments = safeLineAssignments.filter(assignment => {
      if (lineStatusFilter === 'active') return assignment.is_active;
      if (lineStatusFilter === 'inactive') return !assignment.is_active;
      return true;
    });
    const selectedLineManager = safeUsers.find(user => String(user.id) === lineBulkForm.manager_user_id);
    const selectedLineBulkEmployeeIds = new Set(lineBulkForm.employee_ids);
    const selectedManagerActiveAssignments = activeLineAssignments.filter(assignment =>
      String(assignment.manager_user_id) === lineBulkForm.manager_user_id &&
      assignment.relationship_type === lineBulkForm.relationship_type,
    );
    const selectedManagerActiveEmployeeIds = new Set(selectedManagerActiveAssignments.map(assignment => String(assignment.employee_id)));
    const hasLineBulkChanges =
      selectedManagerActiveEmployeeIds.size !== selectedLineBulkEmployeeIds.size ||
      Array.from(selectedLineBulkEmployeeIds).some(employeeId => !selectedManagerActiveEmployeeIds.has(employeeId));
    const activeLineAssignmentByEmployeeId = new Map(
      activeLineAssignments
        .filter(assignment => assignment.relationship_type === lineBulkForm.relationship_type)
        .map(assignment => [assignment.employee_id, assignment]),
    );
    const resourceDepartmentOptions = Array.from(new Set(safeEmployees
      .map(employee => employee.dept?.name ?? employee.department)
      .filter((name): name is string => Boolean(name)))).sort();
    const resourceGradeOptions = Array.from(new Set(safeEmployees
      .map(employee => employee.current_grade?.code)
      .filter((code): code is string => Boolean(code)))).sort();
    const resourceRows = safeEmployees.map(employee => {
      const activeAssignment = activeLineAssignmentByEmployeeId.get(employee.id);
      const assignedToSelectedManager = String(activeAssignment?.manager_user_id) === String(lineBulkForm.manager_user_id);
      const assignedElsewhere = Boolean(activeAssignment && !assignedToSelectedManager);
      const managerLabel = activeAssignment?.manager_user ? formatUserLabel(activeAssignment.manager_user) : '';
      const department = employee.dept?.name ?? employee.department;
      const grade = employee.current_grade?.code ?? '';
      const targetGrade = employee.target_grade?.code ?? '';
      const checked = selectedLineBulkEmployeeIds.has(String(employee.id));
      const newlySelected = checked && !assignedToSelectedManager;
      const disabled = !lineBulkForm.manager_user_id || employee.id === selectedBulkManagerEmployeeId || assignedElsewhere;
      return { employee, activeAssignment, assignedToSelectedManager, assignedElsewhere, managerLabel, department, grade, targetGrade, checked, newlySelected, disabled };
    });
    const visibleResourceRows = resourceRows.filter(row => {
      const query = lineEmployeeSearch.trim().toLowerCase();
      if (row.employee.id === selectedBulkManagerEmployeeId) return false;
      if (resourceStatusFilter === 'assignable' && (row.assignedElsewhere || row.assignedToSelectedManager)) return false;
      if (resourceStatusFilter === 'assigned' && !row.assignedToSelectedManager) return false;
      if (resourceDepartmentFilter && row.department !== resourceDepartmentFilter) return false;
      if (resourceGradeFilter && row.grade !== resourceGradeFilter) return false;
      if (!query) return true;
      return [
        row.employee.emp_code,
        row.employee.full_name,
        row.department,
        row.grade,
        row.targetGrade,
        row.managerLabel,
      ].some(value => (value ?? '').toLowerCase().includes(query));
    });
    const visibleSelectableResourceIds = visibleResourceRows
      .filter(row => !row.disabled)
      .map(row => String(row.employee.id));
    const selectedLineBulkEmployees = resourceRows.filter(row => row.checked);
    const newlySelectedResourceCount = resourceRows.filter(row => row.newlySelected).length;

    return {
      lineManagerOptions,
      activeLineAssignments,
      assignedEmployeeCount,
      unassignedEmployeeCount,
      filteredLineAssignments,
      selectedLineManager,
      selectedManagerActiveAssignments,
      hasLineBulkChanges,
      resourceDepartmentOptions,
      resourceGradeOptions,
      resourceRows,
      visibleResourceRows,
      visibleSelectableResourceIds,
      selectedLineBulkEmployees,
      newlySelectedResourceCount,
    };
  }, [
    safeUsers,
    safeEmployees,
    safeLineAssignments,
    lineFormManagerUserId,
    lineBulkForm,
    lineStatusFilter,
    resourceStatusFilter,
    resourceDepartmentFilter,
    resourceGradeFilter,
    lineEmployeeSearch,
  ]);
}
