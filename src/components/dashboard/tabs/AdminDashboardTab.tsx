import React from 'react';
import { Users, ClipboardCheck, Settings2, Target, ChevronRight } from 'lucide-react';
import {
  useConfigAssessmentLevels,
  useConfigAssessmentProjects,
  useConfigAssessmentStatuses,
  useConfigAssessmentTypes,
  useConfigCompetencies,
  useConfigDepartments,
  useConfigEmployees,
  useConfigGrades,
  useConfigSkillDomains,
  useConfigTechnologies,
  useConfigUsers,
} from '@/hooks/useConfig';
import { InfoTip } from '../layout/InfoTip';
import { TabType } from '../types';

export interface AdminDashboardTabProps {
  onNavigate: (t: TabType) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigate }) => {
  const { data: users, isLoading: usersLoading, isError: usersError } = useConfigUsers();
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useConfigEmployees();
  const { data: departments, isLoading: departmentsLoading, isError: departmentsError } = useConfigDepartments();
  const { data: grades, isLoading: gradesLoading, isError: gradesError } = useConfigGrades();
  const { data: skillDomains, isLoading: domainsLoading, isError: domainsError } = useConfigSkillDomains();
  const { data: competencies, isLoading: competenciesLoading, isError: competenciesError } = useConfigCompetencies();
  const { data: technologies, isLoading: technologiesLoading, isError: technologiesError } = useConfigTechnologies();
  const { data: assessmentTypes, isLoading: typesLoading, isError: typesError } = useConfigAssessmentTypes();
  const { data: assessmentLevels, isLoading: levelsLoading, isError: levelsError } = useConfigAssessmentLevels();
  const { data: assessmentStatuses, isLoading: statusesLoading, isError: statusesError } = useConfigAssessmentStatuses();
  const { data: assessmentProjects, isLoading: projectsLoading, isError: projectsError } = useConfigAssessmentProjects();

  const loading =
    usersLoading ||
    employeesLoading ||
    departmentsLoading ||
    gradesLoading ||
    domainsLoading ||
    competenciesLoading ||
    technologiesLoading ||
    typesLoading ||
    levelsLoading ||
    statusesLoading ||
    projectsLoading;

  const hasError =
    usersError ||
    employeesError ||
    departmentsError ||
    gradesError ||
    domainsError ||
    competenciesError ||
    technologiesError ||
    typesError ||
    levelsError ||
    statusesError ||
    projectsError;

  const activeUsers = (users ?? []).filter((user) => user.is_active).length;
  const inactiveUsers = Math.max(0, (users?.length ?? 0) - activeUsers);
  const unassignedEmployees = (employees ?? []).filter((employee) => !employee.department_id).length;
  const scoringRows =
    (assessmentTypes?.length ?? 0) +
    (assessmentLevels?.length ?? 0) +
    (assessmentStatuses?.length ?? 0) +
    (assessmentProjects?.length ?? 0);

  const statCards = [
    {
      label: 'Active Users',
      value: String(activeUsers),
      detail: `${inactiveUsers} not active`,
      help: 'People who can sign in right now. If someone is inactive, they may exist in employee records but cannot use the app until activated.',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Employees',
      value: String(employees?.length ?? 0),
      detail: `${unassignedEmployees} without a department`,
      help: 'Employee records used for grade, department, manager, and assessment reporting. Missing departments can make team reports incomplete.',
      icon: ClipboardCheck,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Departments',
      value: String(departments?.length ?? 0),
      detail: 'team groups',
      help: 'Company teams or departments used to group people in dashboards, reports, and manager views.',
      icon: Settings2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Scoring Rules',
      value: String(scoringRows),
      detail: 'score settings',
      help: 'Assessment types, levels, statuses, and projects that tell the system how to organize and interpret skill assessments.',
      icon: Target,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const setupGroups = [
    {
      label: 'People Setup',
      value: `${users?.length ?? 0} users / ${employees?.length ?? 0} employees`,
      help: 'Ready means the app has both login users and employee profiles. Both are needed to identify a person and show their grade, role, and assessments.',
      ready: (users?.length ?? 0) > 0 && (employees?.length ?? 0) > 0,
    },
    {
      label: 'Company Setup',
      value: `${departments?.length ?? 0} departments / ${grades?.length ?? 0} grades`,
      help: 'Ready means departments and grade levels exist, so reports can show where people belong and what promotion level they are working toward.',
      ready: (departments?.length ?? 0) > 0 && (grades?.length ?? 0) > 0,
    },
    {
      label: 'Skill Setup',
      value: `${skillDomains?.length ?? 0} areas / ${competencies?.length ?? 0} skills / ${technologies?.length ?? 0} tools`,
      help: 'Ready means skill areas and competencies exist. These are the actual skills people are measured against.',
      ready: (skillDomains?.length ?? 0) > 0 && (competencies?.length ?? 0) > 0,
    },
    {
      label: 'Score Setup',
      value: `${scoringRows} rows set`,
      help: 'Ready means the scoring reference data exists, so assessments can be categorized, scored, and tracked consistently.',
      ready: scoringRows > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="section-title">Admin Dashboard</h2>
          <p className="section-desc">Check setup status and open common admin tasks.</p>
        </div>
        <button type="button" onClick={() => onNavigate('config')} className="btn-primary text-sm">
          Open Setup <ChevronRight size={14} />
        </button>
      </div>

      {hasError && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}
        >
          Some setup data could not load. Please check the backend setup APIs and database changes.
        </div>
      )}

      {loading && (
        <div className="card p-5 flex items-center gap-3">
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgb(var(--accent))', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'rgb(var(--text-2))' }}>
            Loading setup data...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, detail, help, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} color="white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgb(var(--text-3))' }}>
                  {label}
                </p>
                <InfoTip text={help} />
              </div>
              <p className="text-2xl font-bold leading-tight mt-0.5" style={{ color: 'rgb(var(--text-1))' }}>
                {value}
              </p>
              <p className="text-xs mt-1 truncate" style={{ color: 'rgb(var(--text-2))' }}>
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                Setup Checklist
              </h3>
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
                What must be ready before the app works well.
              </p>
            </div>
            <span className="badge badge-accent">
              {setupGroups.filter((group) => group.ready).length} / {setupGroups.length} ready
            </span>
          </div>
          <div className="space-y-3">
            {setupGroups.map((group) => (
              <div
                key={group.label}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                      {group.label}
                    </p>
                    <InfoTip text={group.help} />
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgb(var(--text-2))' }}>
                    {group.value}
                  </p>
                </div>
                <span className={group.ready ? 'badge badge-success' : 'badge'}>
                  {group.ready ? 'Ready' : 'Needs setup'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'rgb(var(--text-1))' }}>
            Admin Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {[
              { title: 'Users and Roles', desc: 'Add users and choose what they can access.' },
              { title: 'Employees and Departments', desc: 'Update people, grades, managers, and departments.' },
              { title: 'Skill Setup', desc: 'Update skill areas, skills, and tools.' },
              { title: 'Score Rules', desc: 'Update how scores are counted.' },
            ].map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={() => onNavigate('config')}
                className="rounded-xl border p-3 text-left transition-all hover:scale-[1.01]"
                style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>
                  {item.title}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
                  {item.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
