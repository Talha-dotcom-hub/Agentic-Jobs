import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Lock, Mail, User, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

export const Auth: React.FC = () => {
  const { activeView, setActiveView, loginUser, signUpUser, resetUserPassword, showToast } = useApp();

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

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16">
      <div className="p-5 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-600/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' && 'Sign in to Agentic Jobs'}
            {mode === 'signup' && 'Create your Agentic Jobs account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'verify' && 'Check your email inbox'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Access job discovery, AI matching, and applications'}
            {mode === 'signup' && 'Connect resume intelligence and automated job scans'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
            {mode === 'verify' && 'Confirmation email has been dispatched'}
          </p>
        </div>

        {mode === 'verify' ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Verification Link Sent</p>
              <p className="text-xs text-slate-300">
                A verification link has been sent to <strong className="text-white">{email}</strong>. Please check your inbox or spam folder and click the link to confirm your account.
              </p>
            </div>
            <button
              onClick={() => setMode('login')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="M Talha Iftikhar"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-violet-400 hover:text-violet-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Recovery Link'}
              </span>
            </button>
          </form>
        )}

        {/* Footer Toggle */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-violet-400 font-semibold hover:text-violet-300">
                Sign Up
              </button>
            </span>
          ) : mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-violet-400 font-semibold hover:text-violet-300">
                Log In
              </button>
            </span>
          ) : (
            <button
              onClick={() => setMode('login')}
              className="text-violet-400 font-semibold hover:text-violet-300 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
