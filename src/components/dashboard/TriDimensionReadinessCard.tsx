import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Cpu, MessageSquare, Award } from 'lucide-react';

export interface TriDimensionReadinessCardProps {
  technicalReady?: boolean | null;
  communicationReady?: boolean | null;
  behavioralReady?: boolean | null;
  currentGrade?: string;
  targetGrade?: string;
}

export const TriDimensionReadinessCard: React.FC<TriDimensionReadinessCardProps> = ({
  technicalReady = false,
  communicationReady = false,
  behavioralReady = false,
  currentGrade = 'G14',
  targetGrade = 'G15',
}) => {
  const isOverallReady =
    technicalReady === true && communicationReady === true && behavioralReady === true;

  return (
    <div className="rounded-2xl p-6 border shadow-card transition-all"
         style={{ backgroundColor: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b"
           style={{ borderColor: 'rgb(var(--border))' }}>
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" style={{ color: 'rgb(var(--accent))' }} />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'rgb(var(--text-1))' }}>
              Role Promotion Readiness Overview
            </h3>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-2))' }}>
            Evaluating career progression from <strong style={{ color: 'rgb(var(--text-1))' }}>{currentGrade}</strong> to{' '}
            <strong style={{ color: 'rgb(var(--accent))' }}>{targetGrade}</strong> across all 3 gating dimensions
          </p>
        </div>

        {/* Overall Status Pill */}
        <div>
          {isOverallReady ? (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-wider uppercase rounded-full border shadow-2xs"
                  style={{
                    backgroundColor: 'rgb(var(--success-soft))',
                    borderColor: 'rgb(var(--success) / 0.4)',
                    color: 'rgb(var(--success))',
                  }}>
              <CheckCircle2 className="w-4 h-4" />
              PROMOTION READY (3/3)
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-wider uppercase rounded-full border shadow-2xs"
                  style={{
                    backgroundColor: 'rgb(var(--danger-soft))',
                    borderColor: 'rgb(var(--danger) / 0.4)',
                    color: 'rgb(var(--danger))',
                  }}>
              <XCircle className="w-4 h-4" />
              GATED (REQUIRES ALL 3)
            </span>
          )}
        </div>
      </div>

      {/* 3 Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dimension 1: Technical Skills */}
        <div className="p-4 rounded-xl border space-y-3 transition-all"
             style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2" style={{ color: 'rgb(var(--accent))' }}>
              <Cpu className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Technical Skills
              </span>
            </div>
            {technicalReady === true ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className="text-sm font-semibold">
            {technicalReady === true ? (
              <span className="text-emerald-600 dark:text-emerald-400">Score & Matrix Ready</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">Gap Below Grade Bar</span>
            )}
          </div>
          <p className="text-[11.5px]" style={{ color: 'rgb(var(--text-3))' }}>
            Evaluates domain weights, skill levels, and grade threshold matrices.
          </p>
        </div>

        {/* Dimension 2: CEFR Communication */}
        <div className="p-4 rounded-xl border space-y-3 transition-all"
             style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-2" style={{ color: 'rgb(var(--accent))' }}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              2. Communication
            </span>
          </div>
          <div className="text-sm font-semibold">
            {communicationReady === true ? (
              <span className="text-emerald-600 dark:text-emerald-400">CEFR Targets Met</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">Below CEFR Threshold</span>
            )}
          </div>
          <p className="text-[11.5px]" style={{ color: 'rgb(var(--text-3))' }}>
            6 communication competencies evaluated against CEFR bands (A1-C2).
          </p>
        </div>

        {/* Dimension 3: Behavioral Competencies */}
        <div className="p-4 rounded-xl border space-y-3 transition-all"
             style={{ backgroundColor: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
          <div className="flex items-center gap-2" style={{ color: 'rgb(var(--accent))' }}>
            <Award className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              3. Behavioral Engine
            </span>
          </div>
          <div className="text-sm font-semibold">
            {behavioralReady === true ? (
              <span className="text-emerald-600 dark:text-emerald-400">Behavior & Integrity OK</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">Behavior / Integrity Gate</span>
            )}
          </div>
          <p className="text-[11.5px]" style={{ color: 'rgb(var(--text-3))' }}>
            11 competencies (L1-L5). Gated at every grade; Integrity hard-blocks.
          </p>
        </div>
      </div>
    </div>
  );
};
