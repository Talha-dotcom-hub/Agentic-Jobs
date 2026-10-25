import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg transition-all hover:border-cyan-500/50 hover:shadow-cyan-500/20 active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span className="inline">Install</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-lg transition-all hover:border-violet-500/50 hover:shadow-violet-500/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span className="inline">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-xs rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-white">Install on iPhone</h3>
              <p className="mt-2 text-xs text-slate-400">
                1. Tap the <strong>Share</strong> button in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-slate-800 py-2 text-xs font-medium text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
