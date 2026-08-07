import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useCommConfig, useUpdateCommConfig } from '@/hooks/useCommunication';
import { toast } from '@/lib/toast';

export const CefrPromotionGatingTab: React.FC = () => {
  const { data: config, isLoading } = useCommConfig();
  const updateMutation = useUpdateCommConfig();

  const [gateFromOrdinal, setGateFromOrdinal] = useState<number>(3);
  const [gatePolicy, setGatePolicy] = useState<'overall' | 'all_competencies'>('overall');
  const [roundDecimals, setRoundDecimals] = useState<number>(2);
  const [initialState, setInitialState] = useState<string>('');

  useEffect(() => {
    if (!config) return;
    const policy = (config as any).policy || {};
    const state = {
      gateFromOrdinal: policy.gateFromOrdinal ?? 3,
      gatePolicy: policy.gatePolicy ?? 'overall',
      roundDecimals: policy.roundDecimals ?? 2,
    };

    setGateFromOrdinal(state.gateFromOrdinal);
    setGatePolicy(state.gatePolicy);
    setRoundDecimals(state.roundDecimals);
    setInitialState(JSON.stringify(state));
  }, [config]);

  const currentState = {
    gateFromOrdinal,
    gatePolicy,
    roundDecimals,
  };

  const hasUnsavedChanges = initialState && JSON.stringify(currentState) !== initialState;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        policy: {
          ...((config as any)?.policy || {}),
          gateFromOrdinal,
          gatePolicy,
          roundDecimals,
          roundingMode: 'half_up',
        } as any,
      });

      setInitialState(JSON.stringify(currentState));
      toast.success('Promotion gating and CEFR policies updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Save Failed');
    }
  };

  if (isLoading) {
    return (
      <div className="card p-8 text-center animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto"></div>
        <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Promotion Gating & Rule Governance</span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
            Define mandatory threshold rules where CEFR communication readiness gates promotion eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending || !hasUnsavedChanges}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs border border-indigo-500 transition-all disabled:opacity-40 self-start sm:self-auto"
        >
          <Save size={14} />
          {updateMutation.isPending ? 'Saving...' : 'Save Policies'}
        </button>
      </div>

      {/* Rules Form Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: Gating Activation Threshold */}
        <div className="p-5 space-y-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Lock size={14} className="text-amber-500" />
              Gating Activation Grade
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Rule R9
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            Specify the career grade at which communication becomes a hard promotion gating requirement. Grades below this threshold use CEFR purely for developmental tracking.
          </p>

          <select
            value={gateFromOrdinal}
            onChange={(e) => setGateFromOrdinal(Number(e.target.value))}
            className="w-full text-xs font-bold p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value={1}>G13 (Associate and above — Gated everywhere)</option>
            <option value={2}>G14 (Engineer and above)</option>
            <option value={3}>G15 (Senior Engineer and above — Standard Default)</option>
            <option value={4}>G16 (Tech Lead / Principal and above)</option>
            <option value={5}>G17 (Engineering Manager and above)</option>
          </select>
        </div>

        {/* Rule 2: Gating Policy Mode */}
        <div className="p-5 space-y-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              Promotion Evaluation Strategy
            </h4>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              Rule R10
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            Choose whether promotion requires overall weighted score meeting the grade threshold, or every single individual competency.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="radio"
                name="gatePolicy"
                value="overall"
                checked={gatePolicy === 'overall'}
                onChange={() => setGatePolicy('overall')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Overall Weighted Score (Recommended)
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Allows strong areas to compensate for slight gaps as long as average reaches role target (e.g. 0.67 for Senior).
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="radio"
                name="gatePolicy"
                value="all_competencies"
                checked={gatePolicy === 'all_competencies'}
                onChange={() => setGatePolicy('all_competencies')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Strict Zero Deficit (All 6 Competencies)
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Every competency must meet or exceed the grade benchmark without exception.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Summary Alert */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-xs text-zinc-700 dark:text-zinc-200 shadow-2xs">
        <AlertTriangle size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Governance Impact:</strong> These policies directly govern the promotion readiness flags on individual scorecards and manager talent review dashboards. When an employee is in a gated grade, failing to meet the CEFR target flags the assessment with a <span className="text-rose-600 dark:text-rose-400 font-black">GATED</span> status.
        </div>
      </div>
    </div>
  );
};
