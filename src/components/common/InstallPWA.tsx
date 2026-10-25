import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3 bg-slate-900/90 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-400">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white">Install App</h4>
          <p className="text-[10px] text-slate-400">Get faster access.</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={install}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
