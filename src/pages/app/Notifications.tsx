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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-cyan-400" />
            <span>Notifications Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            In-app alerts, high match opportunity notifications, and 5-day follow-up reminders.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Browser / PWA Push Notification Permission Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-violet-400" />
              <span>Browser &amp; PWA Push Notifications</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              On supported browsers and operating systems, receive alerts for high-match jobs and application follow-ups. Delivery requires browser permission, a registered server subscription, and an available backend; background delivery varies by device and OS settings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pushPermission === 'granted' && pushSubscriptionRegistered ? (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Push Registered</span>
              </button>
            ) : pushPermission === 'unsupported' ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
                Push is not supported in this browser
              </div>
            ) : pushPermission === 'denied' ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                Permission Blocked in Browser Settings
              </div>
            ) : (
              <button
                type="button"
                onClick={requestPushPermission}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-md shadow-violet-600/20 flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{pushPermission === 'granted' ? 'Retry Push Setup' : 'Enable Push Notifications'}</span>
              </button>
            )}
          </div>
        </div>

        {pushPermission === 'denied' && (
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 text-slate-400 text-[11px] leading-relaxed">
            <span className="font-semibold text-amber-300">How to unblock:</span> Notifications have been denied in your browser settings. To receive job match alerts, click the padlock icon in your address bar and reset permission to "Allow".
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/30 border border-slate-800 rounded-2xl">
            You have no unread notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 text-xs ${
                notif.read
                  ? 'bg-slate-900/30 border-slate-800/60 opacity-70'
                  : 'bg-slate-900/70 border-violet-500/30 font-medium'
              }`}
            >
              <div className="flex items-start gap-3">
                {notif.type === 'match' && <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
                {notif.type === 'followup' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                {notif.type === 'scan' && <Clock className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}

                <div className="space-y-1">
                  <div className="font-bold text-white">{notif.title}</div>
                  <div className="text-slate-300 leading-relaxed">{notif.message}</div>
                  <div className="text-[10px] text-slate-500">{notif.timestamp}</div>
                </div>
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1" title="Unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
