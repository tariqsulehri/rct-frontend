import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Plus,
  CheckCircle,
  EyeOff,
  AlertTriangle,
  X,
} from 'lucide-react';
import { CefrLevelCode, CompetencyKey } from '@/types/communication';
import { useCommConfig, useUpdateCommConfig } from '@/hooks/useCommunication';
import { useConfigGrades } from '@/hooks/useConfig';
import { toast } from '@/lib/toast';
import { CEFR_COLORS } from '../../communication/CefrLevelBadge';

const CEFR_LEVELS: CefrLevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_WEIGHT_MAP: Record<
  CefrLevelCode,
  { weight: number; range: string; minScore: number }
> = {
  A1: { weight: 0.17, range: '0.00–0.24', minScore: 0.17 },
  A2: { weight: 0.33, range: '0.25–0.41', minScore: 0.33 },
  B1: { weight: 0.50, range: '0.42–0.57', minScore: 0.50 },
  B2: { weight: 0.67, range: '0.58–0.74', minScore: 0.67 },
  C1: { weight: 0.83, range: '0.75–0.91', minScore: 0.83 },
  C2: { weight: 1.00, range: '0.92–1.00', minScore: 1.00 },
};

interface GradeRowConfig {
  key: string;
  label: string;
  gradeCode: string;
  level: number;
  isActive: boolean;
  defaultCefr: CefrLevelCode;
  overrides: Partial<Record<CompetencyKey, CefrLevelCode>>;
  isGated?: boolean;
}

const DEFAULT_ORG_ROWS: GradeRowConfig[] = [
  {
    key: 'associate',
    label: 'Associate DevOps Engineer',
    gradeCode: 'G13',
    level: 1,
    isActive: true,
    defaultCefr: 'B1',
    overrides: { presentation: 'A2', stakeholder_exec: 'A2' },
    isGated: false,
  },
  {
    key: 'engineer',
    label: 'DevOps Engineer',
    gradeCode: 'G14',
    level: 2,
    isActive: true,
    defaultCefr: 'B1',
    overrides: {},
    isGated: false,
  },
  {
    key: 'senior',
    label: 'Senior DevOps Engineer',
    gradeCode: 'G15',
    level: 3,
    isActive: true,
    defaultCefr: 'B2',
    overrides: {},
    isGated: true,
  },
  {
    key: 'lead',
    label: 'Principal DevOps Engineer / Tech Lead',
    gradeCode: 'G16',
    level: 4,
    isActive: true,
    defaultCefr: 'B2',
    overrides: { written_clarity: 'C1', stakeholder_exec: 'C1' },
    isGated: true,
  },
  {
    key: 'manager',
    label: 'Associate Architect / Engineering Manager',
    gradeCode: 'G17',
    level: 5,
    isActive: true,
    defaultCefr: 'C1',
    overrides: {},
    isGated: true,
  },
  {
    key: 'senior_mgr',
    label: 'Architect / Senior Manager',
    gradeCode: 'G18',
    level: 6,
    isActive: true,
    defaultCefr: 'C1',
    overrides: {},
    isGated: true,
  },
  {
    key: 'director',
    label: 'Senior Architect / Director',
    gradeCode: 'G19',
    level: 7,
    isActive: true,
    defaultCefr: 'C2',
    overrides: {},
    isGated: true,
  },
  {
    key: 'vp',
    label: 'VP of Engineering',
    gradeCode: 'G20',
    level: 8,
    isActive: true,
    defaultCefr: 'C2',
    overrides: {},
    isGated: true,
  },
  {
    key: 'c_level',
    label: 'C-Level Executive (CTO / CIO)',
    gradeCode: 'EXEC',
    level: 9,
    isActive: true,
    defaultCefr: 'C2',
    overrides: {},
    isGated: true,
  },
];

export const CefrGradeMatrixTab: React.FC = () => {
  const { data: config } = useCommConfig();
  const { data: dbGrades } = useConfigGrades();
  const updateMutation = useUpdateCommConfig();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [matrixState, setMatrixState] = useState<GradeRowConfig[]>(DEFAULT_ORG_ROWS);
  const [initialJson, setInitialJson] = useState<string>(JSON.stringify(DEFAULT_ORG_ROWS));

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const competencies: Array<{ key: CompetencyKey; label: string }> = useMemo(
    () => [
      { key: 'written_clarity', label: 'Written' },
      { key: 'spoken_fluency', label: 'Spoken' },
      { key: 'presentation', label: 'Presentation' },
      { key: 'active_listening', label: 'Listening' },
      { key: 'stakeholder_exec', label: 'Stakeholder' },
      { key: 'cross_cultural', label: 'Cultural' },
    ],
    []
  );

  // Sync state when config or database grades load/update
  useEffect(() => {
    const mergedMap = new Map<string, GradeRowConfig>();

    DEFAULT_ORG_ROWS.forEach((row) => {
      mergedMap.set(row.gradeCode.toUpperCase(), { ...row });
    });

    if (dbGrades && dbGrades.length > 0) {
      dbGrades.forEach((g) => {
        const codeUpper = g.code.toUpperCase();
        const existing = mergedMap.get(codeUpper);

        if (existing) {
          existing.label = g.title || existing.label;
          existing.level = g.level ?? existing.level;
          existing.isActive = g.is_active ?? true;
        } else {
          const inferredCefr: CefrLevelCode =
            g.level >= 7 ? 'C2' : g.level >= 5 ? 'C1' : g.level >= 3 ? 'B2' : 'B1';

          mergedMap.set(codeUpper, {
            key: g.code.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            label: g.title,
            gradeCode: g.code,
            level: g.level,
            isActive: g.is_active ?? true,
            defaultCefr: inferredCefr,
            overrides: {},
            isGated: g.level >= 3,
          });
        }
      });
    }

    if (config?.orgLevels) {
      mergedMap.forEach((row) => {
        const orgDef = (config.orgLevels as any)?.[row.key];
        if (orgDef) {
          row.defaultCefr =
            (orgDef.expectedCefr || orgDef.benchmarkCefr || row.defaultCefr) as CefrLevelCode;
        }
        const overrides = (config.targetOverrides as any)?.[row.key];
        if (overrides) {
          row.overrides = { ...overrides };
        }
      });
    }

    const sortedRows = Array.from(mergedMap.values()).sort((a, b) => a.level - b.level);

    setMatrixState(sortedRows);
    setInitialJson(JSON.stringify(sortedRows));
  }, [config, dbGrades]);

  const hasUnsavedChanges = initialJson && JSON.stringify(matrixState) !== initialJson;

  const filteredRows = useMemo(() => {
    return matrixState.filter((row) => {
      if (statusFilter === 'active') return row.isActive;
      if (statusFilter === 'inactive') return !row.isActive;
      return true;
    });
  }, [matrixState, statusFilter]);

  const handleDefaultChange = (rowKey: string, newCefr: CefrLevelCode) => {
    setMatrixState((prev) =>
      prev.map((row) => {
        if (row.key !== rowKey) return row;
        return {
          ...row,
          defaultCefr: newCefr,
        };
      })
    );
  };

  const handleCellChange = (rowKey: string, compKey: CompetencyKey, newCefr: CefrLevelCode) => {
    setMatrixState((prev) =>
      prev.map((row) => {
        if (row.key !== rowKey) return row;
        const newOverrides = { ...row.overrides };
        if (newCefr === row.defaultCefr) {
          delete newOverrides[compKey];
        } else {
          newOverrides[compKey] = newCefr;
        }
        return {
          ...row,
          overrides: newOverrides,
        };
      })
    );
  };

  const handleOpenResetModal = () => {
    setConfirmText('');
    setShowResetModal(true);
  };

  const handleExecuteReset = async () => {
    if (confirmText.trim().toLowerCase() !== 'reset') return;

    try {
      setMatrixState(DEFAULT_ORG_ROWS);

      const updatedOrgLevels: Record<string, any> = {};
      const updatedOverrides: Record<string, any> = {};

      DEFAULT_ORG_ROWS.forEach((row) => {
        updatedOrgLevels[row.key] = {
          key: row.key,
          ordinal: row.level,
          name: row.label,
          expectedCefr: row.defaultCefr,
          benchmarkCefr: row.defaultCefr,
        };
        if (Object.keys(row.overrides).length > 0) {
          updatedOverrides[row.key] = row.overrides;
        }
      });

      await updateMutation.mutateAsync({
        orgLevels: updatedOrgLevels,
        targetOverrides: updatedOverrides,
      });

      setInitialJson(JSON.stringify(DEFAULT_ORG_ROWS));
      setShowResetModal(false);
      setConfirmText('');
      toast.success('Grade-wise CEFR benchmarks successfully reset to standard baseline.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Reset Failed');
    }
  };

  const handleSave = async () => {
    try {
      const updatedOrgLevels: Record<string, any> = { ...(config?.orgLevels || {}) };
      const updatedOverrides: Record<string, any> = {};

      matrixState.forEach((row) => {
        updatedOrgLevels[row.key] = {
          key: row.key,
          ordinal: row.level,
          name: row.label,
          expectedCefr: row.defaultCefr,
          benchmarkCefr: row.defaultCefr,
        };

        if (Object.keys(row.overrides).length > 0) {
          updatedOverrides[row.key] = row.overrides;
        }
      });

      await updateMutation.mutateAsync({
        orgLevels: updatedOrgLevels,
        targetOverrides: updatedOverrides,
      });

      setInitialJson(JSON.stringify(matrixState));
      toast.success('Grade-wise CEFR benchmark matrix saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message, 'Save Failed');
    }
  };

  const activeCount = matrixState.filter((r) => r.isActive).length;
  const inactiveCount = matrixState.length - activeCount;

  return (
    <div className="space-y-3">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Grade-Wise CEFR Benchmark Matrix</span>
            {hasUnsavedChanges && (
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                Unsaved Edits
              </span>
            )}
          </h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure baseline expectations and competency overrides per career grade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Pill Tabs */}
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              All ({matrixState.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCircle size={10} />
              Active ({activeCount})
            </button>
            {inactiveCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'inactive'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <EyeOff size={10} />
                Inactive ({inactiveCount})
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenResetModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-colors"
          >
            <RefreshCw size={11} />
            Reset Baseline...
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || !hasUnsavedChanges}
            className="inline-flex items-center gap-1 px-3.5 py-1 text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-all disabled:opacity-40"
          >
            <Save size={12} />
            {updateMutation.isPending ? 'Saving...' : 'Save Matrix'}
          </button>
        </div>
      </div>

      {/* Compact Threshold Reference Banner */}
      <div className="py-2 px-3 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>CEFR Score Bands:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          {CEFR_LEVELS.map((lvl) => {
            const info = CEFR_WEIGHT_MAP[lvl];
            const color = CEFR_COLORS[lvl];
            return (
              <span
                key={lvl}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono font-bold ${color.bg} ${color.text} ${color.border}`}
              >
                <span>{lvl}</span>
                <span className="text-[9px] opacity-75">
                  ({info.weight.toFixed(2)} | {info.range})
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* High-Density Matrix Table */}
      <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-visible">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[9.5px] tracking-wider">
              <th className="py-2 px-3 w-[25%]">Career Grade</th>
              <th className="py-2 px-2 w-[13%] text-center bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                Baseline
              </th>
              {competencies.map((comp) => (
                <th key={comp.key} className="py-2 px-1 w-[10.3%] text-center">
                  {comp.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filteredRows.map((row) => {
              const baseInfo = CEFR_WEIGHT_MAP[row.defaultCefr];

              return (
                <tr
                  key={row.key}
                  className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors ${
                    !row.isActive ? 'opacity-60 bg-zinc-50/40 dark:bg-zinc-900/40' : ''
                  }`}
                >
                  {/* Career Grade Info + Integrated Status */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {row.gradeCode}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11.5px] truncate leading-tight">
                          {row.label}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-0.5 font-bold ${
                              row.isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                row.isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                              }`}
                            />
                            {row.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span>•</span>
                          {row.isGated ? (
                            <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                              <ShieldCheck size={9} />
                              Gated
                            </span>
                          ) : (
                            <span>Formative</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Grade Baseline Selector */}
                  <td className="py-2.5 px-1 text-center bg-indigo-50/30 dark:bg-indigo-950/10">
                    <div className="inline-flex flex-col items-center">
                      <select
                        value={row.defaultCefr}
                        onChange={(e) =>
                          handleDefaultChange(row.key, e.target.value as CefrLevelCode)
                        }
                        className={`text-[11px] font-black rounded-md px-1.5 py-0.5 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          CEFR_COLORS[row.defaultCefr]?.bg || 'bg-indigo-50'
                        } ${CEFR_COLORS[row.defaultCefr]?.text || 'text-indigo-700'} ${
                          CEFR_COLORS[row.defaultCefr]?.border || 'border-indigo-200'
                        }`}
                      >
                        {CEFR_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl} className="text-zinc-900 bg-white">
                            {lvl} (≥{CEFR_WEIGHT_MAP[lvl].weight.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        ≥{baseInfo.weight.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* 6 Competency Columns with Detailed OVR Tooltip */}
                  {competencies.map((comp) => {
                    const hasOverride = row.overrides[comp.key] !== undefined;
                    const effectiveLevel = row.overrides[comp.key] || row.defaultCefr;
                    const compInfo = CEFR_WEIGHT_MAP[effectiveLevel];
                    const color = CEFR_COLORS[effectiveLevel] || CEFR_COLORS['B1'];
                    const delta = Number((compInfo.weight - baseInfo.weight).toFixed(2));

                    return (
                      <td key={comp.key} className="py-2.5 px-1 text-center relative">
                        <div className="inline-flex flex-col items-center">
                          <select
                            value={effectiveLevel}
                            onChange={(e) =>
                              handleCellChange(row.key, comp.key, e.target.value as CefrLevelCode)
                            }
                            className={`text-[11px] font-black rounded-md px-1 py-0.5 border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              color.bg
                            } ${color.text} ${
                              hasOverride
                                ? 'border-amber-500 ring-1 ring-amber-500 shadow-xs'
                                : color.border
                            }`}
                          >
                            {CEFR_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl} className="text-zinc-900 bg-white">
                                {lvl} {lvl === row.defaultCefr ? '★ (Baseline)' : ''}
                              </option>
                            ))}
                          </select>

                          {/* Score and OVR indicator */}
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className="text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                              {compInfo.weight.toFixed(2)}
                            </span>

                            {hasOverride && (
                              <div className="relative group/ovr inline-flex items-center">
                                <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 shadow-2xs cursor-help transition-all hover:scale-105">
                                  OVR
                                </span>

                                {/* Rich Tooltip on Hover showing Baseline vs Set Override */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/ovr:flex flex-col items-center z-50 pointer-events-none transition-all">
                                  <div className="bg-zinc-900/95 dark:bg-zinc-800 text-white text-[10px] p-2.5 rounded-xl shadow-2xl border border-zinc-700 whitespace-nowrap text-left space-y-1.5 min-w-[200px]">
                                    <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1">
                                      <span className="font-black text-amber-300">
                                        ⚡ Competency Override
                                      </span>
                                      <span className="text-[9px] font-bold text-zinc-400 font-mono">
                                        {row.gradeCode}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9.5px]">
                                      <span className="text-zinc-400">Grade Baseline:</span>
                                      <span className="font-bold text-zinc-200">
                                        {row.defaultCefr} (wt: {baseInfo.weight.toFixed(2)})
                                      </span>

                                      <span className="text-amber-300">Set Override:</span>
                                      <span className="font-bold text-amber-400">
                                        {effectiveLevel} (wt: {compInfo.weight.toFixed(2)})
                                      </span>
                                    </div>

                                    <div className="text-[9px] pt-1 border-t border-zinc-800 text-zinc-300">
                                      {delta > 0 ? (
                                        <span className="text-emerald-400 font-bold">
                                          ▲ Elevated target (+{delta.toFixed(2)}) above role baseline
                                        </span>
                                      ) : (
                                        <span className="text-amber-400 font-bold">
                                          ▼ Progressive target ({delta.toFixed(2)}) below role baseline
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-zinc-900/95 dark:bg-zinc-800 border-r border-b border-zinc-700 rotate-45 -mt-1" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-[11px] text-zinc-600 dark:text-zinc-400">
        <div className="flex items-start gap-2">
          <AlertCircle size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-900 dark:text-zinc-200">Dynamic Grade Sync:</strong> New grades created in <strong>Setup &gt; Grades</strong> will automatically synchronize into this matrix.
          </div>
        </div>

        <a
          href="#grades"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = 'grades';
            window.dispatchEvent(new CustomEvent('config-tab-change', { detail: 'grades' }));
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
        >
          <Plus size={11} />
          Add / Manage Grades
        </a>
      </div>

      {/* AWS-Style Type-to-Confirm Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-5 shadow-2xl space-y-3.5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    Reset All Grade CEFR Benchmarks?
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Overwrites all custom competency overrides and role targets with standard baseline defaults.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Warning Box */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ <strong>Warning:</strong> All custom grade mappings and competency overrides across all grades will be restored to factory defaults immediately.
            </div>

            {/* Type to Confirm Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded border border-rose-200 dark:border-rose-900">RESET</span> below:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type RESET to confirm"
                className="w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={confirmText.trim().toLowerCase() !== 'reset' || updateMutation.isPending}
                className="px-3.5 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={updateMutation.isPending ? 'animate-spin' : ''} />
                {updateMutation.isPending ? 'Resetting...' : 'Confirm Reset to Baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
