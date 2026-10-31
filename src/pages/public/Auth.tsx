import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Lock, Mail, User, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

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
    'w-full pl-9 pr-3.5 py-2.5 bg-[#0A0A0B] border border-[#27272A] rounded-[6px] text-[#FAFAFA] text-xs placeholder:text-[#52525B] focus:outline-none focus:border-[#84CC16] transition-colors';

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16">
      <div className="p-6 sm:p-8 rounded-xl bg-[#141416] border border-[#27272A] shadow-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center text-[#84CC16] mx-auto">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#FAFAFA]">
            {mode === 'login' && 'Sign in to Agentic Jobs'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'verify' && 'Check your inbox'}
          </h2>
          <p className="text-xs text-[#71717A]">
            {mode === 'login' && 'Access job discovery, AI matching, and application tracking'}
            {mode === 'signup' && 'Connect resume intelligence and automated job scans'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            {mode === 'verify' && 'A confirmation email has been dispatched'}
          </p>
        </div>

        {/* Verify state */}
        {mode === 'verify' ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#FAFAFA]">Verification Link Sent</p>
              <p className="text-xs text-[#A1A1AA]">
                A verification link was sent to{' '}
                <strong className="text-[#FAFAFA]">{email}</strong>. Check your inbox or spam folder
                and click the link to activate your account.
              </p>
            </div>
            <button
              onClick={() => setMode('login')}
              className="w-full py-2.5 rounded-[6px] bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-semibold text-xs border border-[#3F3F46] transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[#A1A1AA] font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#52525B] absolute left-3 top-2.5" />
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

            {/* Email */}
            <div>
              <label className="block text-[#A1A1AA] font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#52525B] absolute left-3 top-2.5" />
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

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#A1A1AA] font-medium">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-[#84CC16] hover:text-[#9ee939] transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#52525B] absolute left-3 top-2.5" />
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-[6px] bg-[#84CC16] hover:bg-[#9ee939] text-[#0A0A0B] font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Footer Toggle */}
        {mode !== 'verify' && (
          <div className="pt-4 border-t border-[#27272A] text-center text-xs text-[#71717A]">
            {mode === 'login' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-[#84CC16] font-semibold hover:text-[#9ee939] transition-colors"
                >
                  Sign Up
                </button>
              </span>
            ) : mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-[#84CC16] font-semibold hover:text-[#9ee939] transition-colors"
                >
                  Log In
                </button>
              </span>
            ) : (
              <button
                onClick={() => setMode('login')}
                className="text-[#84CC16] font-semibold hover:text-[#9ee939] transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
