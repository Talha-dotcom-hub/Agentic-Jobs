import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, Sliders, Lock } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('agentic_jobs_cookie_consent_v1');
    if (!stored) {
      setIsOpen(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.analytics) setAnalyticsEnabled(true);
        if (parsed.personalization !== undefined) setPersonalizationEnabled(parsed.personalization);
      } catch (e) {
        setIsOpen(true);
      }
    }

    const handleOpen = () => {
      setIsOpen(true);
      setShowCustomize(true);
    };

    window.addEventListener('agentic_open_cookie_preferences', handleOpen);
    return () => window.removeEventListener('agentic_open_cookie_preferences', handleOpen);
  }, []);

  const saveConsent = (choice: 'all' | 'essential_only' | 'custom', customAnalytics = false, customPersonalization = true) => {
    const consentPayload = {
      choice,
      version: '1.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: choice === 'all' ? true : choice === 'custom' ? customAnalytics : false,
      personalization: choice === 'all' ? true : choice === 'custom' ? customPersonalization : false,
    };

    localStorage.setItem('agentic_jobs_cookie_consent_v1', JSON.stringify(consentPayload));
    setIsOpen(false);
    setShowCustomize(false);

    // Disable non-essential tracking window variables if rejected
    if (!consentPayload.analytics) {
      (window as any)._disableAnalytics = true;
    } else {
      delete (window as any)._disableAnalytics;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 shadow-2xl space-y-4 text-xs text-slate-300">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="font-bold text-white flex items-center gap-2 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Privacy &amp; Cookie Preferences</span>
          </div>
          <button
            onClick={() => saveConsent('essential_only')}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            title="Close & Accept Essential Only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!showCustomize ? (
          <>
            <p className="text-xs leading-relaxed text-slate-300">
              Agentic Jobs uses necessary cookies and secure browser storage required for account authentication sessions, state persistence, and security protection. We also request permission for optional telemetry to refine job recommendation accuracy.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Preferences</span>
              </button>
              <button
                type="button"
                onClick={() => saveConsent('essential_only')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors text-center"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={() => saveConsent('all')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept All</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-[11px] text-slate-400">
              Manage your consent choices for different categories below:
            </p>

            <div className="space-y-3">
              {/* Essential */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Essential &amp; Security Cookies</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Required for sign-in sessions, CSRF safety, and saved job states.</p>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Always Active</span>
              </div>

              {/* Analytics */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Usage &amp; Telemetry</div>
                  <p className="text-[11px] text-slate-400">Aggregated usage metrics to monitor API endpoint health.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    analyticsEnabled ? 'bg-violet-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${analyticsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Personalization */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Personalized Recommendations</div>
                  <p className="text-[11px] text-slate-400">Stores preferred job categories for faster search responses.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonalizationEnabled(!personalizationEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    personalizationEnabled ? 'bg-violet-600' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${personalizationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => saveConsent('custom', analyticsEnabled, personalizationEnabled)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-xs shadow-md shadow-violet-600/20"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
