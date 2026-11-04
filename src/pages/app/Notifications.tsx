import React from 'react';
import { useApp } from '../../context/AppContext';
import { resolveNotificationDestination } from '../../lib/notificationNavigation';
import { Bell, CheckCircle2, AlertTriangle, Clock, Trash2, Shield, Radio } from 'lucide-react';

export const Notifications: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    pushPermission,
    pushSubscriptionRegistered,
    requestPushPermission,
    setActiveView,
  } = useApp();

  const handleNotificationClick = (notif: (typeof notifications)[number]) => {
    void markNotificationAsRead(notif.id);
    const targetView = resolveNotificationDestination(notif.link, notif.type);
    setActiveView(targetView);
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Notifications Center</span>
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            In-app match alerts, scan updates, and 5-day follow-up reminders.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="px-3 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-label-md transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Browser / PWA Push Notification Permission Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3 text-xs font-body-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-on-surface flex items-center gap-2 font-headline-sm">
              <Radio className="w-4 h-4 text-primary" />
              <span>Browser &amp; PWA Push Notifications</span>
            </div>
            <p className="text-on-surface-variant text-[11px] font-body-sm">
              On supported browsers and operating systems, receive alerts for high-match jobs and application follow-ups. Delivery requires browser permission and an active subscription.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pushPermission === 'granted' && pushSubscriptionRegistered ? (
              <div
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-label-md font-semibold bg-primary/10 border border-primary/20 text-primary flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Push Registered</span>
              </div>
            ) : pushPermission === 'unsupported' ? (
              <div className="px-3.5 py-1.5 rounded-[6px] bg-surface-container-high border border-[#27272A] text-on-surface-variant text-[11px] font-code-meta">
                Push not supported
              </div>
            ) : pushPermission === 'denied' ? (
              <div className="px-3.5 py-1.5 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-code-meta">
                Permission Blocked
              </div>
            ) : (
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-label-md font-semibold bg-primary hover:bg-primary-fixed text-on-primary shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{pushPermission === 'granted' ? 'Retry Push Setup' : 'Enable Push Notifications'}</span>
              </button>
            )}
          </div>
        </div>

        {pushPermission === 'denied' && (
          <div className="p-3 rounded-[6px] bg-surface-container-lowest border border-amber-500/20 text-on-surface-variant text-[11px] font-body-sm leading-relaxed">
            <span className="font-semibold text-amber-300">How to unblock:</span> Notifications have been denied in your browser settings. To receive job match alerts, click the padlock icon in your address bar and reset permission to &quot;Allow&quot;.
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-xs bg-surface-container border border-[#27272A] rounded-xl font-body-sm">
            You have no unread notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 text-xs ${
                notif.read
                  ? 'bg-surface-container-low border-[#27272A] opacity-75'
                  : 'bg-surface-container border-primary/30 font-medium'
              }`}
            >
              <div className="flex items-start gap-3">
                {notif.type === 'match' && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                {notif.type === 'followup' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                {notif.type === 'scan' && <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />}

                <div className="space-y-1">
                  <div className="font-bold text-on-surface font-headline-sm">{notif.title}</div>
                  <div className="text-on-surface-variant leading-relaxed font-body-sm">{notif.message}</div>
                  <div className="text-[10px] font-code-meta text-on-surface-variant/70 tabular-nums">{notif.timestamp}</div>
                </div>
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
