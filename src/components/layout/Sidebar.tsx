import React, { useState } from 'react';
import { useApp, ActiveView } from '../../context/AppContext';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Bookmark,
  FileText,
  Briefcase,
  Clock,
  Bell,
  Settings,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, savedJobIds, notifications, schedule, runScanNow } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const formatScanTime = (value: string) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
  };

  const navItems: { view: ActiveView; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'discover', label: 'Discover Jobs', icon: <Compass className="w-4 h-4" /> },
    { view: 'recommended', label: 'Recommended', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, badge: '>85%' },
    { view: 'saved', label: 'Saved Jobs', icon: <Bookmark className="w-4 h-4" />, badge: savedJobIds.length > 0 ? savedJobIds.length : undefined },
    { view: 'resume', label: 'My Resume', icon: <FileText className="w-4 h-4" /> },
    { view: 'applications', label: 'Applications', icon: <Briefcase className="w-4 h-4" /> },
    { view: 'schedule', label: 'Search Schedule', icon: <Clock className="w-4 h-4" /> },
    { view: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
    { view: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`app-sidebar shrink-0 hidden lg:block border-r min-h-[calc(100vh-4rem)] p-3 space-y-5 transition-all duration-300 relative ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-10"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Auto-Scan Status Quick Panel (Hidden when collapsed) */}
      {!collapsed && (
        <div className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Auto-Scan</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                schedule.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {schedule.enabled ? `Every ${schedule.frequencyValue}${schedule.frequencyType === 'hourly' ? 'h' : 'd'}` : 'Off'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between gap-2">
              <span>Last Scan:</span>
              <span className="text-slate-200 text-right">{formatScanTime(schedule.lastScanTime)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Next Scan:</span>
              <span className="text-slate-200 text-right">
                {schedule.enabled && schedule.nextScanTime ? formatScanTime(schedule.nextScanTime) : 'Not scheduled'}
              </span>
            </div>
          </div>
          <button
            onClick={runScanNow}
            disabled={schedule.status === 'running'}
            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${schedule.status === 'running' ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{schedule.status === 'running' ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-violet-600/15 border border-violet-500/30 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-violet-400' : 'text-slate-400'}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    typeof item.badge === 'string'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-violet-500/20 text-violet-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security Info Card */}
      {!collapsed && (
        <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>RLS &amp; Private Storage</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Resumes &amp; credentials secured with user-level authorization.
          </p>
        </div>
      )}
    </aside>
  );
};
