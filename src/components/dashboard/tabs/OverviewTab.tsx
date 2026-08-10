import React from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { type User } from '@/store/authStore';
import { usePromotionReadiness, useCompetencyScores, useGapMatrix } from '@/hooks/useReports';
import { hasPermission, isLeaderRole, type PermissionCode, type RoleCode } from '@/types/rbac';
import { InfoTip } from '../layout/InfoTip';
import { TeamHealthCharts } from './TeamHealthCharts';
import { TabType, LEADERS } from '../types';

export interface OverviewTabProps {
  user: User | null;
  onNavigate: (t: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { data: overviewPromoData } = usePromotionReadiness();
  const { data: overviewCompData } = useCompetencyScores();
  const { data: overviewGapData } = useGapMatrix();
  const isLeader = isLeaderRole(user?.role);
  const canViewReports = hasPermission(user?.permissions, 'reports.view');
  const displayName = user?.employeeName || user?.username || 'there';

  const leaderRows = overviewPromoData ?? [];
  const assessedLeaderRows = leaderRows.filter((r) => r.overall_score > 0);
  const thresholdLeaderRows = leaderRows.filter((r) => r.avg_threshold > 0);
  const toPct = (val: number | null | undefined): number | null => {
    if (val == null || isNaN(val)) return null;
    return Math.round(val > 1 ? val : val * 100);
  };

  const rawLeaderScore = assessedLeaderRows.length
    ? assessedLeaderRows.reduce((sum, r) => sum + r.overall_score, 0) / assessedLeaderRows.length
    : null;
  const leaderScore = toPct(rawLeaderScore);

  const rawLeaderRequired = thresholdLeaderRows.length
    ? thresholdLeaderRows.reduce((sum, r) => sum + r.avg_threshold, 0) / thresholdLeaderRows.length
    : null;
  const leaderRequired = toPct(rawLeaderRequired);

  const readyCount = leaderRows.filter((r) => r.promotion_ready).length;
  const needsAttention = leaderRows.filter((r) => !r.promotion_ready && r.total_competencies > 0).length;
  const leaderGap = leaderScore !== null && leaderRequired !== null ? leaderScore - leaderRequired : null;

  const myCompRow = (overviewCompData ?? []).find((r) => r.emp_code === user?.empCode);
  const myGapRow = (overviewGapData?.employees ?? []).find((r) => r.emp_code === user?.empCode);
  const myScore = myCompRow ? toPct(myCompRow.overall_score) : null;
  const myRequired = myGapRow && myGapRow.overall_threshold > 0 ? toPct(myGapRow.overall_threshold) : null;
  const myTotal = myGapRow?.total_with_threshold ?? 0;
  const myMeets = myGapRow?.meets_count ?? 0;
  const myGap = myScore !== null && myRequired !== null ? myScore - myRequired : null;

  const stats = isLeader
    ? [
        {
          label: 'Team Score',
          value: leaderScore !== null ? `${leaderScore}%` : 'N/A',
          icon: TrendingUp,
          color: 'from-blue-500 to-indigo-600',
          help: 'Average score for people with skill records.',
        },
        {
          label: 'Required Score',
          value: leaderRequired !== null ? `${leaderRequired}%` : 'N/A',
          icon: Target,
          color: 'from-amber-500 to-orange-600',
          help: 'Average score needed for the next grade.',
        },
        {
          label: 'Ready People',
          value: `${readyCount}/${leaderRows.length || 0}`,
          icon: CheckCircle2,
          color: 'from-emerald-500 to-teal-600',
          help: 'People who have all needed skills for their next grade.',
        },
        {
          label: 'Needs Attention',
          value: String(needsAttention),
          icon: AlertTriangle,
          color: 'from-rose-500 to-red-600',
          help: 'People who still have skills below target.',
        },
      ]
    : [
        {
          label: 'My Score',
          value: myScore !== null ? `${myScore}%` : 'N/A',
          icon: TrendingUp,
          color: 'from-blue-500 to-indigo-600',
          help: 'Your score from approved skill checks.',
        },
        {
          label: 'Required Score',
          value: myRequired !== null ? `${myRequired}%` : 'N/A',
          icon: Target,
          color: 'from-amber-500 to-orange-600',
          help: 'The score needed for your next grade.',
        },
        {
          label: 'Skills Met',
          value: myTotal > 0 ? `${myMeets}/${myTotal}` : 'N/A',
          icon: CheckCircle2,
          color: 'from-emerald-500 to-teal-600',
          help: 'How many required skills are complete.',
        },
        {
          label: 'Status',
          value: myGapRow?.promotion_ready ? 'Ready' : 'In Progress',
          icon: Activity,
          color: 'from-violet-500 to-purple-600',
          help: 'Ready means all target-grade skills are met.',
        },
      ];

  const featureItems: Array<{
    id: TabType;
    icon: string;
    title: string;
    desc: string;
    roles: RoleCode[];
    permission?: PermissionCode;
  }> = [
    {
      id: 'approvals',
      icon: '✅',
      title: 'Pending Approvals',
      desc: 'Approve or reject competency submissions.',
      roles: LEADERS,
    },
    {
      id: 'team',
      icon: '👥',
      title: 'Team Roster',
      desc: 'View people, grades, scores, and gaps.',
      roles: LEADERS,
    },
    {
      id: 'ai',
      icon: '🤖',
      title: 'AI Dashboard',
      desc: 'Find people and skills that need attention.',
      roles: LEADERS,
    },
    {
      id: 'reports',
      icon: '📊',
      title: 'Reports',
      desc: 'Answer who is ready, what is missing, and what to improve.',
      roles: LEADERS,
      permission: 'reports.view',
    },
    {
      id: 'assessments',
      icon: '📝',
      title: 'Assessments',
      desc: 'Review skill progress against the target grade.',
      roles: ['ADMIN', 'TOP_MANAGEMENT', 'MANAGER', 'LINE_MANAGER', 'ENGINEER'],
    },
    {
      id: 'config',
      icon: '⚙️',
      title: 'Setup',
      desc: 'Manage people, grades, skill groups, skills, and technologies.',
      roles: ['ADMIN'],
    },
  ];

  const features = featureItems.filter(
    (f) => !!user?.role && f.roles.includes(user.role) && (!f.permission || hasPermission(user.permissions, f.permission))
  );

  const summaryItems = isLeader
    ? [
        {
          label: 'People',
          text:
            leaderRows.length > 0
              ? `${readyCount} of ${leaderRows.length} people are ready for their target grade.`
              : 'No people found yet.',
        },
        {
          label: 'Targets',
          text:
            leaderGap === null
              ? 'Required score data is not available yet.'
              : leaderGap >= 0
                ? `The team is ${leaderGap} points above the target.`
                : `The team is ${Math.abs(leaderGap)} points below the target.`,
        },
        {
          label: 'Action',
          text:
            needsAttention > 0
              ? `${needsAttention} people need attention before they are ready.`
              : 'No required skill gaps are shown now.',
        },
      ]
    : [
        {
          label: 'Progress',
          text:
            myScore !== null
              ? `Your current achieved score is ${myScore}%.`
              : 'Your achieved score is not available yet.',
        },
        {
          label: 'Target',
          text:
            myGap === null
              ? 'Your required target is not available yet.'
              : myGap >= 0
                ? `You are ${myGap} points above the target.`
                : `You are ${Math.abs(myGap)} points below the target.`,
        },
        {
          label: 'Action',
          text:
            myTotal > 0
              ? `${myMeets} of ${myTotal} required skills are complete.`
              : 'No target-grade skill requirements are configured yet.',
        },
      ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {stats.map(({ label, value, icon: Icon, color, help }) => (
          <div key={label} className="card p-5 flex items-center gap-4 animate-slide-up">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon size={18} color="white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p
                  className="text-xs font-medium uppercase tracking-wide truncate"
                  style={{ color: 'rgb(var(--text-3))' }}
                >
                  {label}
                </p>
                <InfoTip text={help} />
              </div>
              <p className="text-lg font-bold mt-0.5 truncate" style={{ color: 'rgb(var(--text-1))' }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold" style={{ color: 'rgb(var(--text-1))' }}>
                Management Summary
              </h3>
              <InfoTip text="A plain-language summary of people, targets, gaps, and next action." />
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-3))' }}>
              People → Skills → Targets → Gaps → Action
            </p>
          </div>
          {isLeader && canViewReports && (
            <button type="button" onClick={() => onNavigate('reports')} className="btn-secondary text-xs">
              Open Reports <ChevronRight size={13} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3 border"
              style={{ borderColor: 'rgb(var(--border))', backgroundColor: 'rgb(var(--surface-2))' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'rgb(var(--text-3))' }}>
                {item.label}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-1))' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-h)) 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {displayName}! 👋</h2>
            <p className="text-white/70 text-sm">
              See current scores, required targets, and where attention is needed.
            </p>
          </div>
          {isLeader && (
            <button
              type="button"
              onClick={() => onNavigate('team')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shrink-0"
            >
              View Team Roster <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Team health charts — leader roles only */}
      {isLeader && <TeamHealthCharts onNavigate={onNavigate} />}

      {/* Feature nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
        {features.map(({ id, icon, title, desc }) => (
          <button
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
            className="card-hover p-5 text-left group animate-slide-up"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: 'rgb(var(--accent-soft))' }}
            >
              {icon}
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'rgb(var(--text-1))' }}>
              {title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-2))' }}>
              {desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
