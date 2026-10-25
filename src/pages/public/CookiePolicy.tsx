import React from 'react';
import { ShieldCheck, Sliders } from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  const reopenPreferences = () => {
    window.dispatchEvent(new Event('agentic_open_cookie_preferences'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          <span>Cookie &amp; Local Storage Policy</span>
        </h1>
        <button
          onClick={reopenPreferences}
          className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 hover:bg-violet-600/30 text-violet-200 font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manage Cookie Preferences</span>
        </button>
      </div>

      <p>
        Agentic Jobs uses essential session cookies and local storage strictly required for authentication, saved preference persistence, and security verification.
      </p>

      <h2 className="text-sm font-bold text-white pt-2">Essential Functional Storage</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Authentication tokens and user session validation (Supabase Auth)</li>
        <li>Active UI preferences (saved job filters, schedule configurations)</li>
        <li>Browser push notification subscription token state</li>
      </ul>

      <h2 className="text-sm font-bold text-white pt-2">Optional Analytics &amp; Telemetry</h2>
      <p>
        Aggregated usage telemetry helps us monitor server endpoint health and multi-source scan rate limits. You can accept or reject optional telemetry at any time using the preferences control.
      </p>

      <p className="text-slate-400 pt-2 border-t border-slate-800/80">
        We do not sell personal data or utilize third-party cross-site advertising cookies.
      </p>
    </div>
  );
};
