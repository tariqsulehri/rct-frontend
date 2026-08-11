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
    <div className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-black border border-indigo-500/20 rounded-2xl p-6 shadow-xl text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-black tracking-tight text-white">
              Role Promotion Readiness Overview
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Evaluating career progression from <strong className="text-zinc-200">{currentGrade}</strong> to{' '}
            <strong className="text-indigo-300">{targetGrade}</strong> across all 3 gating dimensions
          </p>
        </div>

        {/* Overall Status Pill */}
        <div>
          {isOverallReady ? (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black tracking-wider uppercase text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 rounded-full shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              PROMOTION READY (3/3)
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black tracking-wider uppercase text-rose-300 bg-rose-500/20 border border-rose-500/40 rounded-full shadow-lg shadow-rose-500/10">
              <XCircle className="w-4 h-4 text-rose-400" />
              GATED (REQUIRES ALL 3)
            </span>
          )}
        </div>
      </div>

      {/* 3 Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dimension 1: Technical Skills */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400">
              <Cpu className="w-5 h-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                1. Technical Skills
              </span>
            </div>
            {technicalReady === true ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="text-sm font-bold">
            {technicalReady === true ? (
              <span className="text-emerald-400">Score & Matrix Ready</span>
            ) : (
              <span className="text-rose-400">Gap Below Grade Bar</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            Evaluates domain weights, skill levels, and grade threshold matrices.
          </p>
        </div>

        {/* Dimension 2: CEFR Communication */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                2. Communication
              </span>
            </div>
            {communicationReady === true ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="text-sm font-bold">
            {communicationReady === true ? (
              <span className="text-emerald-400">CEFR Targets Met</span>
            ) : (
              <span className="text-rose-400">Below CEFR Threshold</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            6 communication competencies evaluated against CEFR bands (A1-C2).
          </p>
        </div>

        {/* Dimension 3: Behavioral Competencies */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Award className="w-5 h-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                3. Behavioral Engine
              </span>
            </div>
            {behavioralReady === true ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="text-sm font-bold">
            {behavioralReady === true ? (
              <span className="text-emerald-400">Behavior & Integrity OK</span>
            ) : (
              <span className="text-rose-400">Behavior / Integrity Gate</span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            11 competencies (L1-L5). Gated at every grade; Integrity hard-blocks.
          </p>
        </div>
      </div>
    </div>
  );
};
