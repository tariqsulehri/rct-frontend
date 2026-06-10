import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { getApiErrorMessage } from '@/lib/apiError';

const DEMO = [
  { role: 'Admin',    user: 'admin',     icon: '⚡', desc: 'Full platform access' },
  { role: 'Manager',  user: 'manager',   icon: '👥', desc: 'Team & reports access' },
  { role: 'Engineer', user: 'engineer1', icon: '🔧', desc: 'Personal assessments' },
];

const STATS = [
  { value: '28',  label: 'Engineers' },
  { value: '21',  label: 'Competencies' },
  { value: '9',   label: 'Career Levels' },
  { value: '266', label: 'Technologies' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // No useEffect redirect — PublicRoute wrapper handles auth→dashboard redirect
  // synchronously at render time, avoiding StrictMode double-fire issues.

  const fill = (username: string) => setForm({ username, password: 'password123' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', form);
      queryClient.clear();
      // Set token in localStorage + store, then set user (triggers isAuthenticated)
      setTokens(data.accessToken);
      setUser({
        id: data.user.id,
        empCode: data.user.empCode,
        username: data.user.username,
        role: data.user.role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand Panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 relative overflow-hidden p-10"
        style={{
          background: 'linear-gradient(135deg, #1e0a3c 0%, #3b0764 25%, #1d4ed8 60%, #0e7490 100%)',
        }}
      >
        {/* animated mesh overlay */}
        <div
          className="absolute inset-0 opacity-20 animate-gradient"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, #a855f7 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #06b6d4 0%, transparent 50%), radial-gradient(ellipse at 60% 30%, #7c3aed 0%, transparent 40%)',
            backgroundSize: '200% 200%',
          }}
        />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl">
              🚀
            </div>
            <span className="text-white font-bold text-lg tracking-tight">DevOps Skills & Promotion Readiness</span>
          </div>

          {/* Hero text */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Map your path to<br />
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                engineering excellence
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              Assess competencies, identify gaps, and track career progression across 21 DevOps skill areas.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-white/50 text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="rounded-xl p-4 border border-white/10 bg-white/5 backdrop-blur-sm">
            <p className="text-white/70 text-sm leading-relaxed italic">
              "The only way to do great work is to have a clear map of where you're going."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center text-xs">✦</div>
              <span className="text-white/40 text-xs">Skills & Promotion Readiness Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Sign-in Panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12" style={{ backgroundColor: 'rgb(var(--bg))' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="text-2xl">🚀</span>
          <span className="font-bold text-lg" style={{ color: 'rgb(var(--text-1))' }}>DevOps Skills Readiness</span>
        </div>

        <div className="w-full max-w-sm animate-slide-up">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'rgb(var(--text-1))' }}>
              Welcome back
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-2))' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username"
                disabled={loading}
                className="field"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                disabled={loading}
                className="field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg p-3 text-sm animate-scale-in"
                style={{ backgroundColor: 'rgb(var(--danger-soft))', color: 'rgb(var(--danger))' }}
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.username || !form.password}
              className="btn-primary w-full py-2.5 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
            <span className="text-xs font-medium" style={{ color: 'rgb(var(--text-3))' }}>DEMO ACCOUNTS</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgb(var(--border))' }} />
          </div>

          {/* Demo account cards */}
          <div className="space-y-2.5">
            {DEMO.map(({ role, user, icon, desc }) => (
              <button
                key={user}
                type="button"
                onClick={() => fill(user)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-all duration-150 hover:scale-[1.01] group"
                style={{
                  backgroundColor: 'rgb(var(--surface))',
                  borderColor: 'rgb(var(--border))',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgb(var(--accent))')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgb(var(--border))')}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: 'rgb(var(--accent-soft))' }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'rgb(var(--text-1))' }}>{role}</p>
                  <p className="text-xs truncate" style={{ color: 'rgb(var(--text-3))' }}>{desc}</p>
                </div>
                <div className="text-xs font-mono shrink-0" style={{ color: 'rgb(var(--text-3))' }}>
                  {user}
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs mt-4" style={{ color: 'rgb(var(--text-3))' }}>
            All demo accounts use password <code className="font-mono">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
