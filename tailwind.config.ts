import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      /* ── Theme-aware color tokens (RGB CSS vars) ─────────────────────── */
      colors: {
        bg:         'rgb(var(--bg) / <alpha-value>)',
        surface:    'rgb(var(--surface) / <alpha-value>)',
        'surface-2':'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3':'rgb(var(--surface-3) / <alpha-value>)',
        border:     'rgb(var(--border) / <alpha-value>)',
        'border-2': 'rgb(var(--border-2) / <alpha-value>)',
        'text-1':   'rgb(var(--text-1) / <alpha-value>)',
        'text-2':   'rgb(var(--text-2) / <alpha-value>)',
        'text-3':   'rgb(var(--text-3) / <alpha-value>)',
        accent:     'rgb(var(--accent) / <alpha-value>)',
        'accent-h': 'rgb(var(--accent-h) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        'accent-txt':  'rgb(var(--accent-txt) / <alpha-value>)',
        success:    'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        warning:    'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        danger:     'rgb(var(--danger) / <alpha-value>)',
        'danger-soft':  'rgb(var(--danger-soft) / <alpha-value>)',

        /* Legacy HSL tokens (keep old shadcn-style code working) */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },

      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },

      maxWidth: {
        '6xl': '85rem',
      },

      spacing: {
        '6': '0.6rem',
      },

      /* ── Shadows ─────────────────────────────────────────────────────── */
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover':'0 4px 16px 0 rgb(0 0 0 / 0.12), 0 2px 4px -1px rgb(0 0 0 / 0.08)',
        elevated:   '0 8px 24px -4px rgb(0 0 0 / 0.15), 0 2px 8px -2px rgb(0 0 0 / 0.1)',
        glow:       '0 0 20px -4px rgb(var(--accent) / 0.5)',
        'glow-sm':  '0 0 10px -2px rgb(var(--accent) / 0.4)',
      },

      /* ── Keyframes & Animations ──────────────────────────────────────── */
      keyframes: {
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:    { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer:    'shimmer 1.5s infinite',
      },

      /* ── Backdrop blur extras ────────────────────────────────────────── */
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
} satisfies Config;
