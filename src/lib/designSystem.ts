/**
 * Unified Design System & Semantic Color Tokens
 * Standardizes color semantics ("colors that speak for themselves") across the app.
 */

export const SEMANTIC_COLORS = {
  // 🔵 Contextual Help & Guidance
  help: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/80',
    text: 'text-sky-900 dark:text-sky-200',
    icon: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  },

  // 🟣 Core Rules, Logic & Navigation
  primary: {
    bg: 'bg-indigo-600',
    softBg: 'bg-indigo-500/10',
    border: 'border-indigo-500',
    softBorder: 'border-indigo-200 dark:border-indigo-800/80',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  },

  // 🟡 Overrides, Thresholds & Warnings (OVR)
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/80',
  },

  // 🟢 Success, Met Expectations & Promotion Ready
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80',
  },

  // 🔴 Gated, Deficits & Blockers
  danger: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80',
  },
} as const;

export type StatusType = 'MEETS' | 'ABOVE' | 'BELOW' | 'GATED' | 'READY' | 'OVR' | 'INFO';

export function getStatusBadgeStyle(status: StatusType): string {
  switch (status) {
    case 'MEETS':
    case 'ABOVE':
    case 'READY':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 font-bold';
    case 'BELOW':
    case 'GATED':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 font-bold';
    case 'OVR':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 font-bold';
    case 'INFO':
    default:
      return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80 font-bold';
  }
}
