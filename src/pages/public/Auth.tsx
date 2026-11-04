import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Lock, Mail, User, ArrowRight, CheckCircle2, ArrowLeft, Search, Sparkles, ClipboardList } from 'lucide-react';

export const Auth: React.FC = () => {
  const { activeView, loginUser, signUpUser, resetUserPassword } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>(
    activeView === 'signup' ? 'signup' : activeView === 'forgot' ? 'forgot' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password, name);
      } else if (mode === 'signup') {
        const res = await signUpUser(email, password, name);
        if (res && res.confirmationRequired) {
          setMode('verify');
        }
      } else if (mode === 'forgot') {
        await resetUserPassword(email);
        setMode('login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3.5 py-2.5 bg-[var(--app-elevated)] border border-[var(--app-border)] rounded-[10px] text-[var(--app-text)] text-xs placeholder:text-[var(--app-text-muted)] focus:outline-none focus:border-[var(--app-accent)] transition-colors';

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 sm:py-16">
      <div className="grid lg:grid-cols-[1.08fr_1fr] gap-8 items-center">
        <div className="max-w-lg mx-auto w-full p-6 sm:p-8 rounded-[26px] bg-[var(--app-surface)] border border-[var(--app-border)] shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[rgba(199,255,90,0.12)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-accent)] mx-auto">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              {mode === 'login' && 'Sign in to Agentic Jobs'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'verify' && 'Check your inbox'}
            </h2>
            <p className="text-xs text-[var(--app-text-muted)]">
              {mode === 'login' && 'Access job discovery, AI matching, and application tracking'}
              {mode === 'signup' && 'Connect resume intelligence and automated job scans'}
              {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
              {mode === 'verify' && 'A confirmation email has been dispatched'}
            </p>
          </div>

          {mode === 'verify' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-[rgba(199,255,90,0.14)] border border-[var(--app-border)] text-[var(--app-accent)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--app-text)]">Verification Link Sent</p>
                <p className="text-xs text-[var(--app-text-muted)]">
                  A verification link was sent to{' '}
                  <strong className="text-[var(--app-text)]">{email}</strong>. Check your inbox or spam folder
                  and click the link to activate your account.
                </p>
              </div>
              <button
                onClick={() => setMode('login')}
                className="w-full py-2.5 rounded-[10px] bg-[var(--app-elevated)] hover:bg-[var(--app-hover)] text-[var(--app-text)] font-semibold text-xs border border-[var(--app-border)] transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[var(--app-text-muted)] font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--app-text-muted)] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[var(--app-text-muted)] font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--app-text-muted)] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[var(--app-text-muted)] font-medium">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--app-text-muted)] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-[10px] bg-[linear-gradient(180deg,#d4ff6d,#b7ed46)] hover:brightness-105 text-[#0c1500] font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(199,255,90,0.22)]"
              >
                <span>
                  {isSubmitting
                    ? 'Processing…'
                    : mode === 'login'
                    ? 'Sign In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Recovery Link'}
                </span>
                {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          )}

          {mode !== 'verify' && (
            <div className="pt-4 border-t border-[var(--app-border)] text-center text-xs text-[var(--app-text-muted)]">
              {mode === 'login' ? (
                <span>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-[var(--app-accent)] font-semibold hover:text-[var(--app-accent-hover)] transition-colors"
                  >
                    Sign Up
                  </button>
                </span>
              ) : mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-[var(--app-accent)] font-semibold hover:text-[var(--app-accent-hover)] transition-colors"
                  >
                    Log In
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setMode('login')}
                  className="text-[var(--app-accent)] font-semibold hover:text-[var(--app-accent-hover)] transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                </button>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:flex min-h-[560px] items-center justify-center">
          <div
            className="relative w-full max-w-[540px] aspect-[1.08] rounded-[28px] border border-[var(--app-border)] shadow-[0_30px_80px_rgba(0,0,0,0.18)] overflow-hidden"
            style={{ background: 'radial-gradient(circle at top, color-mix(in srgb, var(--app-accent) 12%, transparent), var(--app-bg) 70%)' }}
          >
            <div className="absolute inset-0 opacity-60" style={{backgroundImage:'linear-gradient(color-mix(in srgb, var(--app-border) 35%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--app-border) 35%, transparent) 1px, transparent 1px)', backgroundSize:'26px 26px'}} />

            <div className="absolute inset-x-8 top-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(199,255,90,0.12)] border border-[var(--app-border)] text-[var(--app-accent)] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--app-text-muted)]">Agentic Jobs</div>
                  <div className="text-[clamp(1.1rem,1.7vw,1.8rem)] font-semibold text-[var(--app-text)]">Career intelligence</div>
                </div>
              </div>
              <div className="rounded-full border border-[var(--app-border)] bg-[rgba(199,255,90,0.08)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--app-accent)]">
                Product flow
              </div>
            </div>

            <div className="absolute inset-x-8 top-28 bottom-8 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">Resume profile</div>
                  <div className="mt-3 text-xs font-medium text-[var(--app-text)]">Skills · experience · preferences</div>
                </div>
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">Job requirements</div>
                  <div className="mt-3 text-xs font-medium text-[var(--app-text)]">Role · skills · location</div>
                </div>
              </div>
              <div className="flex-1 rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 backdrop-blur-sm">
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-text-muted)]">Career workflow</div>
                  <div className="mt-1 text-sm font-medium text-[var(--app-text)]">From discovery to follow-up</div>
                </div>
                <div className="space-y-2">
                  {[
                    { title: 'Discover opportunities', copy: 'Search supported job sources', Icon: Search },
                    { title: 'Review match estimates', copy: 'Compare roles with resume information', Icon: Sparkles },
                    { title: 'Track applications', copy: 'Organize stages and follow-ups', Icon: ClipboardList },
                  ].map(({ title, copy, Icon }) => (
                    <div key={title} className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(199,255,90,0.1)] text-[var(--app-accent)]">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[var(--app-text)]">{title}</div>
                        <div className="mt-0.5 text-[10px] leading-relaxed text-[var(--app-text-muted)]">{copy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
