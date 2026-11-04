import React from 'react';
import { ShieldCheck, Sliders } from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  const reopenPreferences = () => {
    window.dispatchEvent(new Event('agentic_open_cookie_preferences'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-[var(--app-text-muted)] leading-relaxed">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
        <h1 className="text-3xl font-bold text-[var(--app-text)] flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[var(--app-accent)]" />
          <span>Cookie &amp; Local Storage Policy</span>
        </h1>
        <button
          onClick={reopenPreferences}
          className="px-4 py-2 rounded-xl bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[#101820] font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manage Cookie Preferences</span>
        </button>
      </div>

      <p>
        Agentic Jobs stores authentication session data, essential application preferences, and your cookie preference in browser storage. Required application storage is always active.
      </p>

      <h2 className="text-sm font-bold text-[var(--app-text)] pt-2">Required Browser Storage</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Supabase Auth session state used to keep your account signed in.</li>
        <li>Application preferences such as the selected theme.</li>
        <li>Your cookie preference, stored locally in this browser.</li>
      </ul>

      <h2 className="text-sm font-bold text-[var(--app-text)] pt-2">Optional Analytics &amp; Advertising</h2>
      <p>
        Agentic Jobs does not currently integrate an analytics or telemetry service, or use third-party advertising cookies. Saving your preference records your choice locally; it does not enable tracking.
      </p>

      <p className="text-[var(--app-text-muted)] pt-2 border-t border-[var(--app-border)]">
        We do not sell personal data or utilize third-party cross-site advertising cookies.
      </p>
    </div>
  );
};
