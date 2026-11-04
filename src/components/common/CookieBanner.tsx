import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Sliders, Lock } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('agentic_jobs_cookie_consent_v1');
    if (!stored) {
      setIsOpen(true);
    } else {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object' || !('choice' in parsed)) setIsOpen(true);
      } catch {
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

  const saveConsent = () => {
    const consentPayload = {
      choice: 'essential_only',
      version: '1.0',
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
      personalization: false,
    };

    localStorage.setItem('agentic_jobs_cookie_consent_v1', JSON.stringify(consentPayload));
    setIsOpen(false);
    setShowCustomize(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)] shadow-2xl space-y-4 text-xs text-[var(--app-text-muted)]">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
          <div className="font-bold text-[var(--app-text)] flex items-center gap-2 text-sm">
            <ShieldCheck className="w-5 h-5 text-[var(--app-accent)]" />
            <span>Privacy &amp; Cookie Preferences</span>
          </div>
          <button
            onClick={saveConsent}
            className="text-[var(--app-text-muted)] hover:text-[var(--app-text)] p-1 rounded-lg"
            title="Close & Keep Essential Storage Only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!showCustomize ? (
          <>
            <p className="text-xs leading-relaxed text-[var(--app-text-muted)]">
              Agentic Jobs uses browser storage for sign-in and essential application preferences. Optional analytics, telemetry, and advertising cookies are not currently used.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-[var(--app-border)]">
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="px-4 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] hover:border-[var(--app-border-hover)] text-[var(--app-text)] font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Preferences</span>
              </button>
              <button
                type="button"
                onClick={saveConsent}
                className="px-5 py-2 rounded-xl bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[#101820] font-semibold text-xs transition-colors text-center"
              >
                Continue with Essential Storage
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 pt-1">
            <p className="text-[11px] text-[var(--app-text-muted)]">
              Review the browser storage used by Agentic Jobs. Only required storage is active.
            </p>

            <div className="space-y-3">
              {/* Essential */}
              <div className="p-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                    <span>Essential Browser Storage</span>
                  </div>
                  <p className="text-[11px] text-[var(--app-text-muted)]">Required browser storage for sign-in and core application functionality.</p>
                </div>
                <span className="self-start shrink-0 text-[10px] uppercase font-bold text-[var(--app-accent)] bg-[var(--app-surface)] border border-[var(--app-border)] px-2 py-0.5 rounded">Always Active</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--app-text)]">Usage &amp; Telemetry</div>
                  <p className="text-[11px] text-[var(--app-text-muted)]">Optional analytics are not currently collected.</p>
                </div>
                <span className="self-start shrink-0 text-[10px] uppercase font-bold text-[var(--app-text-muted)] bg-[var(--app-surface)] border border-[var(--app-border)] px-2 py-0.5 rounded">Not in use</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-[var(--app-text)]">Personalized Recommendations</div>
                  <p className="text-[11px] text-[var(--app-text-muted)]">Job recommendations do not use optional cookie tracking.</p>
                </div>
                <span className="self-start shrink-0 text-[10px] uppercase font-bold text-[var(--app-text-muted)] bg-[var(--app-surface)] border border-[var(--app-border)] px-2 py-0.5 rounded">No cookie tracking</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="px-3.5 py-2 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text)] text-xs hover:border-[var(--app-border-hover)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveConsent}
                className="px-5 py-2 rounded-xl bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[#101820] font-semibold text-xs"
              >
                Save Essential-Only Preference
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
