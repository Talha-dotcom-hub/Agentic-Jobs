import React, { useEffect, useRef, useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!showGuide) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowGuide(false);
      if (event.key === 'Tab') {
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [showGuide]);

  if (isInstalled) return null;

  if (isInstallable) {
    const promptInstall = async () => {
      const accepted = await install();
      if (!accepted) setShowGuide(true);
    };
    return (
      <button
        type="button"
        onClick={() => { void promptInstall(); }}
        aria-label="Install Agentic Jobs"
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg transition-all hover:border-cyan-500/50 hover:shadow-cyan-500/20 active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>Install</span>
      </button>
    );
  }

  const heading = platform === 'ios'
    ? 'Add to Home Screen on iPhone or iPad'
    : platform === 'android'
      ? 'Install Agentic Jobs on Android'
      : 'Install in your browser';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        aria-label={heading}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg transition-all hover:border-violet-500/50 active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-violet-400" />
        <span>Install</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGuide(false);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-heading"
            aria-describedby="pwa-install-instructions"
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="pwa-install-heading" className="text-sm font-semibold text-white">{heading}</h2>
                <p id="pwa-install-instructions" className="mt-2 text-xs leading-relaxed text-slate-300">
                  {platform === 'ios'
                    ? <>Open this page in <strong>Safari</strong>, tap <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Share" /> <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</>
                    : platform === 'android'
                      ? <>In supported browsers such as Chrome, open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, if shown. This adds the website as a PWA; it does not download an APK.</>
                      : <>In Chrome or Edge, open the browser menu and choose <strong>Install Agentic Jobs</strong> or use the install icon in the address bar, if available. Other desktop browsers may not offer app installation.</>}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Installation availability depends on your browser, site connection, and device settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-800 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </>
  );
};
