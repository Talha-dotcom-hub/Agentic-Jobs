import React from 'react';
import {
  Bell,
  Briefcase,
  Clock3,
  FileText,
  HelpCircle,
  LockKeyhole,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { useApp, ActiveView } from '../../context/AppContext';

export const More: React.FC = () => {
  const { setActiveView, notifications } = useApp();
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const workspaceLinks: Array<{
    view: ActiveView;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { view: 'recommended', label: 'Recommended jobs', description: 'Review roles that meet your match threshold.', icon: Sparkles },
    { view: 'applications', label: 'Applications', description: 'Track statuses, notes, and follow-ups.', icon: Briefcase },
    { view: 'schedule', label: 'Search schedule', description: 'Manage automated scan preferences.', icon: Clock3 },
    { view: 'notifications', label: 'Notifications', description: 'Review in-app alerts and scan updates.', icon: Bell, badge: unreadCount },
    { view: 'settings', label: 'Settings', description: 'Manage your account and integrations.', icon: SettingsIcon },
  ];
  const publicLinks: Array<{ view: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { view: 'privacy', label: 'Privacy policy', icon: LockKeyhole },
    { view: 'cookie', label: 'Cookie policy', icon: HelpCircle },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-accent)]">Workspace</p>
        <h1 className="text-2xl font-semibold text-on-surface">More</h1>
        <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant">
          Access the rest of your job-search tools, account settings, and privacy information.
        </p>
      </header>

      <section aria-labelledby="more-workspace-heading" className="space-y-3">
        <h2 id="more-workspace-heading" className="text-sm font-semibold text-on-surface">Workspace tools</h2>
        <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-surface-container">
          {workspaceLinks.map(({ view, label, description, icon: Icon, badge }, index) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary ${
                index > 0 ? 'border-t border-[#27272A]' : ''
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(199,255,90,0.16)] bg-[rgba(199,255,90,0.07)] text-[var(--app-accent)]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <span className="rounded-full bg-[rgba(199,255,90,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-accent)]">
                      {badge} unread
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-on-surface-variant">{description}</span>
              </span>
              <span aria-hidden="true" className="text-lg text-on-surface-variant">›</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="more-privacy-heading" className="space-y-3">
        <h2 id="more-privacy-heading" className="text-sm font-semibold text-on-surface">Privacy and help</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {publicLinks.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-surface-container px-4 py-2.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <Icon className="h-4 w-4 text-[var(--app-accent)]" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('agentic_open_cookie_preferences'))}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-surface-container px-4 py-2.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <LockKeyhole className="h-4 w-4 text-[var(--app-accent)]" />
            Cookie preferences
          </button>
        </div>
      </section>
    </div>
  );
};
