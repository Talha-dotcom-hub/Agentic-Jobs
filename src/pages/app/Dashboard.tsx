import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { JobCardSkeleton } from '../../components/common/Skeleton';
import {
  Sparkles,
  Compass,
  Bookmark,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  HelpCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { isQualifyingMatchScore } from '../../../shared/matchThreshold';
import { useSelectedJob } from '../../hooks/useSelectedJob';

const AnimatedStat: React.FC<{ value: number; disabled: boolean }> = ({ value, disabled }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);

  useEffect(() => {
    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      displayValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = displayValueRef.current;
    if (startValue === value) return;

    const startedAt = performance.now();
    const duration = 360;
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(startValue + (value - startValue) * eased);
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [disabled, value]);

  return <>{displayValue}</>;
};

export const Dashboard: React.FC = () => {
  const {
    jobs,
    savedJobIds,
    applications,
    schedule,
    sources,
    setActiveView,
    runScanNow,
    user,
    isDemoMode,
  } = useApp();

  const { selectedJob, selectJob, closeJob } = useSelectedJob(jobs, 'dashboard');

  const recommendedJobs = jobs.filter((j) => isQualifyingMatchScore(j.matchScore));
  const appliedApps = applications.filter((a) => a.status === 'Applied');
  const interviewApps = applications.filter((a) => a.status === 'Interview');
  const offerApps = applications.filter((a) => a.status === 'Offer');
  const rejectedApps = applications.filter((a) => a.status === 'Rejected');

  // Application conversion metrics
  const totalApps = applications.length || 1;
  const appliedPct = Math.round((appliedApps.length / totalApps) * 100);
  const interviewPct = Math.round((interviewApps.length / totalApps) * 100);
  const offerPct = Math.round((offerApps.length / totalApps) * 100);
  const rejectedPct = Math.round((rejectedApps.length / totalApps) * 100);

  // Check for follow-up reminders (>5 days in Applied status)
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
  const overdueFollowups = appliedApps.filter(
    (app) => new Date(app.appliedDate) < fiveDaysAgo
  );
  const lastScanDate = schedule.lastScanTime ? new Date(schedule.lastScanTime) : null;
  const lastScanLabel = lastScanDate && Number.isFinite(lastScanDate.getTime())
    ? lastScanDate.toLocaleString()
    : 'No completed scan recorded';
  const scanStatusLabel = schedule.status === 'running'
    ? 'A scan is running'
    : schedule.status === 'error'
      ? 'The last scan encountered an error'
      : `Scheduled scanning is ${schedule.enabled ? 'on' : 'off'}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Welcome Header */}
      <div className="p-4 sm:p-6 rounded-xl bg-surface-container border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline-lg text-lg sm:text-2xl font-bold text-on-surface">
              Welcome back, {user.name}
            </h1>
          </div>
          <p className="font-code-meta text-xs text-on-surface-variant">
            {scanStatusLabel} · Last scan: {lastScanLabel}
          </p>
        </div>

        <div className="flex w-full flex-row items-stretch gap-2 sm:w-auto sm:items-center sm:gap-2.5 shrink-0 relative z-10">
          <button
            onClick={runScanNow}
            disabled={schedule.status === 'running'}
            className="flex-1 px-2.5 py-2 rounded-[6px] bg-surface-container-high hover:bg-surface-container-highest border border-[#27272A] text-[11px] sm:flex-auto sm:px-3.5 sm:text-xs font-label-md font-medium text-on-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${schedule.status === 'running' ? 'animate-spin text-primary' : 'text-primary'}`} />
            <span>{schedule.status === 'running' ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
          <button
            onClick={() => setActiveView('discover')}
            className="flex-1 px-2.5 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-[11px] sm:flex-auto sm:px-3.5 sm:text-xs font-label-md font-semibold text-on-primary shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Discover Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Follow-up Reminder Banner */}
      {overdueFollowups.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="font-body-sm">
              <strong className="font-semibold text-amber-200">Follow-Up Recommended ({overdueFollowups.length}): </strong>
              <span className="hidden sm:inline">
                You submitted applications over 5 days ago for {overdueFollowups.map(a => a.jobTitle).join(', ')}.
              </span>
              <span className="sm:hidden">
                {overdueFollowups.length} applications have been in Applied for more than 5 days.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('applications')}
            className="px-3 py-1.5 rounded-[6px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-label-md font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            View Applications
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveView('discover')}
          className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-[#27272A] card-hover-effect space-y-1.5 group min-w-0 h-full"
        >
          <div className="flex items-center justify-between text-on-surface-variant font-label-md">
            <span className="truncate">Jobs Found</span>
            <Compass className="w-4 h-4 text-primary shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-code-score font-bold text-on-surface tabular-nums">
            <AnimatedStat value={jobs.length} disabled={isDemoMode} />
          </div>
          <div className="text-[11px] font-code-meta text-on-surface-variant">Available listings</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('recommended')}
          className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-[#27272A] card-hover-effect space-y-1.5 group min-w-0 h-full"
        >
          <div className="flex items-center justify-between text-on-surface-variant font-label-md">
            <span className="truncate">High Matches</span>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-code-score font-bold text-primary tabular-nums">
            <AnimatedStat value={recommendedJobs.length} disabled={isDemoMode} />
          </div>
          <div className="text-[11px] font-code-meta text-on-surface-variant truncate">≥85% match score</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('saved')}
          className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-[#27272A] card-hover-effect space-y-1.5 group min-w-0 h-full"
        >
          <div className="flex items-center justify-between text-on-surface-variant font-label-md">
            <span className="truncate">Saved Jobs</span>
            <Bookmark className="w-4 h-4 text-secondary shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-code-score font-bold text-on-surface tabular-nums">
            <AnimatedStat value={savedJobIds.length} disabled={isDemoMode} />
          </div>
          <div className="text-[11px] font-code-meta text-on-surface-variant truncate">Bookmarked pipeline</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('applications')}
          className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-[#27272A] card-hover-effect space-y-1.5 group min-w-0 h-full"
        >
          <div className="flex items-center justify-between text-on-surface-variant font-label-md">
            <span className="truncate">Applications</span>
            <Briefcase className="w-4 h-4 text-tertiary shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-code-score font-bold text-on-surface tabular-nums">
            <AnimatedStat value={applications.length} disabled={isDemoMode} />
          </div>
          <div className="text-[11px] font-code-meta text-on-surface-variant">
            {appliedApps.length} Applied · {interviewApps.length} Interview
          </div>
        </button>
      </div>

      {/* Application Tracking Visualization Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-headline-sm font-semibold text-on-surface flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary shrink-0" />
            <span>Application Pipeline Analytics</span>
          </div>
          <button
            onClick={() => setActiveView('applications')}
            className="text-[11px] font-label-md text-primary hover:underline font-medium"
          >
            Manage Pipeline
          </button>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-2.5 rounded-[4px] bg-surface-container-lowest flex overflow-hidden border border-[#27272A]">
          <div style={{ width: `${appliedPct}%` }} className="bg-primary h-full transition-all" title={`Applied: ${appliedApps.length}`} />
          <div style={{ width: `${interviewPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Interview: ${interviewApps.length}`} />
          <div style={{ width: `${offerPct}%` }} className="bg-tertiary h-full transition-all" title={`Offer: ${offerApps.length}`} />
          <div style={{ width: `${rejectedPct}%` }} className="bg-error h-full transition-all" title={`Rejected: ${rejectedApps.length}`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-code-meta text-on-surface-variant pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-primary" />
            <span>Applied: <strong className="text-on-surface tabular-nums">{appliedApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-emerald-500" />
            <span>Interview: <strong className="text-on-surface tabular-nums">{interviewApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-tertiary" />
            <span>Offer: <strong className="text-on-surface tabular-nums">{offerApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[2px] bg-error" />
            <span>Rejected: <strong className="text-on-surface tabular-nums">{rejectedApps.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Top Matches + Source Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended High Matches (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm font-semibold text-on-surface flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Recommended High Match Opportunities</span>
            </h2>
            <button
              onClick={() => setActiveView('recommended')}
              className="text-xs font-label-md text-primary hover:underline font-medium"
            >
              View All ({recommendedJobs.length})
            </button>
          </div>

          <div className="space-y-3">
            {schedule.status === 'running' ? (
              <>
                <JobCardSkeleton />
                <JobCardSkeleton />
              </>
            ) : (
              recommendedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  onClick={() => selectJob(job)}
                  className="p-3.5 sm:p-4 rounded-xl bg-surface-container-low border border-[#27272A] cursor-pointer card-hover-effect flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-code-meta text-[11px] sm:text-xs text-on-surface-variant flex-wrap">
                      <span className="font-semibold text-on-surface uppercase">{job.source}</span>
                      <span>·</span>
                      <span>{job.company}</span>
                      <span>·</span>
                      <span>{job.location}</span>
                    </div>
                    <h3 className="font-headline-sm text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                      {job.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/20 text-primary font-code-score text-[11px] sm:text-xs tabular-nums">
                      {job.matchScore === null ? 'Not scored' : `${job.matchScore}% Match`}
                    </span>
                    <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors hidden xs:block" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Source Health & Scan Status Sidebar */}
        <div className="space-y-4">
          <h2 className="font-headline-sm font-semibold text-on-surface flex items-center gap-2">
            <Database className="w-4 h-4 text-secondary" />
            <span>Source Health Summary</span>
          </h2>

          <div className="p-4 rounded-xl bg-surface-container-low border border-[#27272A] space-y-3 text-xs">
            {sources.length === 0 ? (
              <p className="py-2 font-body-sm text-on-surface-variant">No source health data is available yet.</p>
            ) : sources.map((src) => (
              <div key={src.id} className="flex items-center justify-between py-1.5 border-b border-[#27272A] last:border-none">
                <div>
                  <div className="font-label-md text-on-surface font-medium">{src.name}</div>
                  <div className="text-[10px] font-code-meta text-on-surface-variant">Checked {src.lastCheckTime} · {src.jobsIndexedCount} jobs</div>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] font-code-meta text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary">
                  {src.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Helpful First-Use Guidance Card */}
      <div className="p-5 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs font-label-md">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span>Operational Guidance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body-sm text-xs text-on-surface-variant">
          <div>
            <strong className="text-on-surface block mb-0.5 font-label-md">1. Upload Resume</strong>
            Navigate to <button onClick={() => setActiveView('resume')} className="text-primary underline hover:text-primary-fixed">My Resume</button> to compare your resume with job requirements and review AI match estimates.
          </div>
          <div>
            <strong className="text-on-surface block mb-0.5 font-label-md">2. Set Scan Schedule</strong>
            Configure automated discovery intervals under <button onClick={() => setActiveView('schedule')} className="text-primary underline hover:text-primary-fixed">Search Schedule</button>.
          </div>
          <div>
            <strong className="text-on-surface block mb-0.5 font-label-md">3. Track Applications</strong>
            Log your manual applications under <button onClick={() => setActiveView('applications')} className="text-primary underline hover:text-primary-fixed">Applications</button> to review application status and follow-up reminders.
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <JobDetailDrawer job={selectedJob} onClose={closeJob} />
    </div>
  );
};
