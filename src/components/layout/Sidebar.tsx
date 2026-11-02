import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
  const prefersReducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('agentic-jobs-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('agentic-jobs-sidebar-collapsed', String(collapsed));
    } catch (error) {
      console.warn('Sidebar preference could not be saved:', error);
    }
  }, [collapsed]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const formatScanTime = (value: string) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
  };

  const navItems: { view: ActiveView; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'discover', label: 'Discover Jobs', icon: <Compass className="w-4 h-4" /> },
    { view: 'recommended', label: 'Recommended', icon: <Sparkles className="w-4 h-4" />, badge: '≥85%' },
    { view: 'saved', label: 'Saved Jobs', icon: <Bookmark className="w-4 h-4" />, badge: savedJobIds.length > 0 ? savedJobIds.length : undefined },
    { view: 'resume', label: 'My Resume', icon: <FileText className="w-4 h-4" /> },
    { view: 'applications', label: 'Applications', icon: <Briefcase className="w-4 h-4" /> },
    { view: 'schedule', label: 'Search Schedule', icon: <Clock className="w-4 h-4" /> },
    { view: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
    { view: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`app-sidebar desktop-sidebar sticky top-14 sm:top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto shrink-0 bg-surface p-3 space-y-5 transition-[width] duration-200 relative ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className="absolute right-2 top-4 w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-colors z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Auto-Scan Status Quick Panel (Hidden when collapsed) */}
      {!collapsed && (
        <div className="p-3 rounded-xl bg-surface-container-low space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-label-md text-on-surface-variant font-medium">Auto-Scan</span>
            <span
              className={`px-2 py-0.5 rounded-[4px] font-code-meta font-medium ${
                schedule.enabled ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {schedule.enabled ? `Every ${schedule.frequencyValue}${schedule.frequencyType === 'hourly' ? 'h' : 'd'}` : 'Off'}
            </span>
          </div>
          <div className="text-[11px] font-code-meta text-on-surface-variant space-y-1">
            <div className="flex justify-between gap-2">
              <span>Last Scan:</span>
              <span className="text-on-surface text-right tabular-nums">{formatScanTime(schedule.lastScanTime)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Next Scan:</span>
              <span className="text-on-surface text-right tabular-nums">
                {schedule.enabled && schedule.nextScanTime ? formatScanTime(schedule.nextScanTime) : 'Not scheduled'}
              </span>
            </div>
          </div>
          <button
            onClick={runScanNow}
            disabled={schedule.status === 'running'}
            className="w-full py-2 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${schedule.status === 'running' ? 'animate-spin text-primary' : 'text-primary'}`} />
            <span>{schedule.status === 'running' ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
        </div>
      )}

      {/* Main Navigation List */}
      <nav aria-label="Workspace navigation" className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActiveView(item.view)}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`relative isolate w-full min-h-10 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="desktop-sidebar-active-pill"
                  aria-hidden="true"
                  className="absolute inset-0 z-0 rounded-xl bg-primary shadow-[0_8px_24px_rgba(158,233,57,0.12)]"
                  transition={prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 520, damping: 38, mass: 0.72 }}
                />
              )}
              <span className="relative z-10 flex min-w-0 items-center gap-3">
                <span className={isActive ? 'text-on-primary' : 'text-on-surface-variant'}>{item.icon}</span>
                {!collapsed && <span className="font-body-sm truncate">{item.label}</span>}
              </span>
              {!collapsed && item.badge !== undefined && (
                <span className={`relative z-10 px-1.5 py-0.5 rounded-md font-code-meta text-[10px] font-semibold tabular-nums ${
                  isActive ? 'bg-on-primary/10 text-on-primary' : 'bg-primary/10 text-primary'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security Info Card */}
      {!collapsed && (
        <div className="p-3 rounded-xl bg-surface-container-low text-[11px] text-on-surface-variant space-y-1.5">
          <div className="flex items-center gap-1.5 text-on-surface font-medium font-label-md">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>RLS &amp; Private Storage</span>
          </div>
          <p className="font-body-sm text-[11px] text-on-surface-variant leading-normal">
            Resumes &amp; credentials secured with user-level authorization.
          </p>
        </div>
      )}
    </aside>
  );
};
