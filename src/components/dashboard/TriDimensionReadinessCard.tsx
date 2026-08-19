import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Cpu, MessageSquareText, Award, Zap } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';

export interface TriDimensionReadinessCardProps {
  technicalReady?: boolean | null;
  communicationReady?: boolean | null;
  behavioralReady?: boolean | null;
  currentGrade?: string;
  targetGrade?: string;
  technicalScore?: number;
  commBand?: string;
  targetCommBand?: string;
}

export const TriDimensionReadinessCard: React.FC<TriDimensionReadinessCardProps> = ({
  technicalReady = false,
  communicationReady = false,
  behavioralReady = false,
  currentGrade = 'G14',
  targetGrade = 'G15',
  technicalScore = 45,
  commBand = 'B1',
  targetCommBand = 'C1',
}) => {
  const isOverallReady =
    technicalReady === true && communicationReady === true && behavioralReady === true;

  const readyCount = [technicalReady, communicationReady, behavioralReady].filter(Boolean).length;

  return (
    <div
      className="rounded-2xl p-6 border shadow-elevated transition-all space-y-6"
      style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}
    >
      {/* Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b"
        style={{ borderColor: 'rgb(var(--border))' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <IconBadge icon={<ShieldCheck size={18} />} color={isOverallReady ? 'success' : 'accent'} size="md" />
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'rgb(var(--text-1))' }}>
              Role Promotion Readiness Overview
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'rgb(var(--text-2))' }}>
            Evaluating career progression from{' '}
            <strong className="font-bold" style={{ color: 'rgb(var(--text-1))' }}>
              {currentGrade}
            </strong>{' '}
            to{' '}
            <strong className="font-bold" style={{ color: 'rgb(var(--accent-txt))' }}>
              {targetGrade}
            </strong>{' '}
            across all 3 gating dimensions.
          </p>
        </div>

        {/* Overall Status Pill & Velocity Badge */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-2xs"
            style={{
              backgroundColor: 'rgb(var(--accent-soft))',
              borderColor: 'rgba(var(--accent), 0.3)',
              color: 'rgb(var(--accent-txt))',
            }}
          >
            <Zap size={13} className="text-amber-400 animate-pulse" />
            <span>Target Velocity: ~6 Weeks</span>
          </div>

          {isOverallReady ? (
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase rounded-full border shadow-sm"
              style={{
                backgroundColor: 'rgb(var(--success-soft))',
                borderColor: 'rgba(var(--success), 0.4)',
                color: 'rgb(var(--success))',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              PROMOTION READY ({readyCount}/3)
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase rounded-full border shadow-sm"
              style={{
                backgroundColor: 'rgb(var(--danger-soft))',
                borderColor: 'rgba(var(--danger), 0.4)',
                color: 'rgb(var(--danger))',
              }}
            >
              <XCircle className="w-4 h-4" />
              GATED ({readyCount}/3 PASSED)
            </span>
          )}
        </div>
      </div>

      {/* 3 Dimensions Neuromorphic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dimension 1: Technical Skills */}
        <div
          className="p-5 rounded-xl border space-y-3 transition-all hover:scale-[1.01]"
          style={{
            backgroundColor: 'rgb(var(--surface-2))',
            borderColor: technicalReady ? 'rgba(var(--success), 0.3)' : 'rgba(var(--danger), 0.3)',
            boxShadow: technicalReady ? '0 0 12px rgba(var(--success), 0.05)' : '0 0 12px rgba(var(--danger), 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={<Cpu size={14} />} color={technicalReady ? 'success' : 'danger'} size="sm" />
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'rgb(var(--text-1))' }}>
                1. Technical Skills
              </span>
            </div>
            {technicalReady ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'rgb(var(--danger))' }} />
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-extrabold">
              {technicalReady ? (
                <span style={{ color: 'rgb(var(--success))' }}>Matrix Threshold Met</span>
              ) : (
                <span style={{ color: 'rgb(var(--danger))' }}>Gap Below Target Bar</span>
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: 'rgb(var(--text-2))' }}>
              {technicalScore}% Avg
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-3))' }}>
            Evaluates domain weights, skill levels, and grade threshold matrices across 12 tech areas.
          </p>
        </div>

        {/* Dimension 2: CEFR Communication */}
        <div
          className="p-5 rounded-xl border space-y-3 transition-all hover:scale-[1.01]"
          style={{
            backgroundColor: 'rgb(var(--surface-2))',
            borderColor: communicationReady ? 'rgba(var(--success), 0.3)' : 'rgba(var(--danger), 0.3)',
            boxShadow: communicationReady ? '0 0 12px rgba(var(--success), 0.05)' : '0 0 12px rgba(var(--danger), 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={<MessageSquareText size={14} />} color={communicationReady ? 'success' : 'info'} size="sm" />
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'rgb(var(--text-1))' }}>
                2. Communication
              </span>
            </div>
            {communicationReady ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'rgb(var(--danger))' }} />
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-extrabold">
              {communicationReady ? (
                <span style={{ color: 'rgb(var(--success))' }}>CEFR Band Achieved</span>
              ) : (
                <span style={{ color: 'rgb(var(--danger))' }}>Below CEFR Target</span>
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: 'rgb(var(--text-2))' }}>
              {commBand} / {targetCommBand}
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-3))' }}>
            6 communication competencies evaluated against official CEFR bands (A1-C2).
          </p>
        </div>

        {/* Dimension 3: Behavioral Competencies */}
        <div
          className="p-5 rounded-xl border space-y-3 transition-all hover:scale-[1.01]"
          style={{
            backgroundColor: 'rgb(var(--surface-2))',
            borderColor: behavioralReady ? 'rgba(var(--success), 0.3)' : 'rgba(var(--danger), 0.3)',
            boxShadow: behavioralReady ? '0 0 12px rgba(var(--success), 0.05)' : '0 0 12px rgba(var(--danger), 0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={<Award size={14} />} color={behavioralReady ? 'success' : 'warning'} size="sm" />
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'rgb(var(--text-1))' }}>
                3. Behavioral Engine
              </span>
            </div>
            {behavioralReady ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: 'rgb(var(--success))' }} />
            ) : (
              <XCircle className="w-5 h-5" style={{ color: 'rgb(var(--danger))' }} />
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-extrabold">
              {behavioralReady ? (
                <span style={{ color: 'rgb(var(--success))' }}>Behavior & Integrity OK</span>
              ) : (
                <span style={{ color: 'rgb(var(--danger))' }}>Behavior / Integrity Gate</span>
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: 'rgb(var(--text-2))' }}>
              Level L3
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-3))' }}>
            11 competencies (L1-L5). Gated at every grade; Integrity hard-blocks promotion.
          </p>
        </div>
      </div>
    </div>
  );
};
