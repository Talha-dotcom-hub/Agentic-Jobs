import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { JobCardSkeleton } from '../../components/common/Skeleton';
import { TiltCard } from '../../components/common/TiltCard';
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

  const [selectedJob, setSelectedJob] = useState<any | null>(null);

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
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              Welcome back, {user.name} 👋
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {scanStatusLabel} · Last scan: {lastScanLabel}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={runScanNow}
            disabled={schedule.status === 'running'}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${schedule.status === 'running' ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{schedule.status === 'running' ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
          <button
            onClick={() => setActiveView('discover')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:from-violet-500 hover:to-cyan-500 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Discover Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Follow-up Reminder Banner */}
      {overdueFollowups.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="font-semibold text-amber-100">Follow-Up Recommended ({overdueFollowups.length}): </strong>
              You submitted applications over 5 days ago for {overdueFollowups.map(a => a.jobTitle).join(', ')}.
            </div>
          </div>
          <button
            onClick={() => setActiveView('applications')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            View Applications
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <TiltCard>
          <button
            type="button"
            onClick={() => setActiveView('discover')}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-1 group min-w-0 h-full card-hover-effect"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate">Matches Found</span>
              <Compass className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums"><AnimatedStat value={jobs.length} disabled={isDemoMode} /></div>
            <div className="text-[10px] text-slate-500 truncate">Source status depends on backend checks</div>
          </button>
        </TiltCard>

        <TiltCard>
          <button
            type="button"
            onClick={() => setActiveView('recommended')}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-1 group min-w-0 h-full card-hover-effect"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate">High Matches</span>
              <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 tabular-nums"><AnimatedStat value={recommendedJobs.length} disabled={isDemoMode} /></div>
            <div className="text-[10px] text-slate-500 truncate">&gt;85% match score</div>
          </button>
        </TiltCard>

        <TiltCard>
          <button
            type="button"
            onClick={() => setActiveView('saved')}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-1 group min-w-0 h-full card-hover-effect"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate">Saved Jobs</span>
              <Bookmark className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-violet-300 tabular-nums"><AnimatedStat value={savedJobIds.length} disabled={isDemoMode} /></div>
            <div className="text-[10px] text-slate-500 truncate">Bookmarked jobs</div>
          </button>
        </TiltCard>

        <TiltCard>
          <button
            type="button"
            onClick={() => setActiveView('applications')}
            className="w-full text-left p-3.5 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-1 group min-w-0 h-full card-hover-effect"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate">Applications</span>
              <Briefcase className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 tabular-nums"><AnimatedStat value={applications.length} disabled={isDemoMode} /></div>
            <div className="text-[10px] text-slate-500 truncate">
              {appliedApps.length} Applied · {interviewApps.length} Interview
            </div>
          </button>
        </TiltCard>
      </div>

      {/* Application Tracking Visualization Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Application Pipeline Analytics</span>
          </div>
          <button
            onClick={() => setActiveView('applications')}
            className="text-[11px] text-violet-400 hover:text-violet-300 font-medium"
          >
            Manage Pipeline
          </button>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
          <div style={{ width: `${appliedPct}%` }} className="bg-violet-500 h-full" title={`Applied: ${appliedApps.length}`} />
          <div style={{ width: `${interviewPct}%` }} className="bg-cyan-500 h-full" title={`Interview: ${interviewApps.length}`} />
          <div style={{ width: `${offerPct}%` }} className="bg-emerald-500 h-full" title={`Offer: ${offerApps.length}`} />
          <div style={{ width: `${rejectedPct}%` }} className="bg-rose-500 h-full" title={`Rejected: ${rejectedApps.length}`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span>Applied: <strong className="text-slate-200">{appliedApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Interview: <strong className="text-slate-200">{interviewApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Offer: <strong className="text-slate-200">{offerApps.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Rejected: <strong className="text-slate-200">{rejectedApps.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Top Matches + Source Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended High Matches (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Recommended High Match Opportunities</span>
            </h2>
            <button
              onClick={() => setActiveView('recommended')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
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
                <TiltCard key={job.id}>
                  <div
                    onClick={() => setSelectedJob(job)}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-violet-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group card-hover-effect"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 flex-wrap">
                        <span className="font-semibold text-slate-300">{job.source}</span>
                        <span>·</span>
                        <span>{job.company}</span>
                        <span>·</span>
                        <span>{job.location}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] sm:text-xs">
                        {job.matchScore === null ? 'Not scored' : `${job.matchScore}% Match`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-300 transition-colors hidden xs:block" />
                    </div>
                  </div>
                </TiltCard>
              ))
            )}
          </div>
        </div>

        {/* Source Health & Scan Status Sidebar */}
        <TiltCard>
          <div className="space-y-4 h-full card-hover-effect">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              <span>Source Health Summary</span>
            </h2>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3 text-xs h-full">
              {sources.length === 0 ? (
                <p className="py-2 text-slate-400">No source health data is available yet.</p>
              ) : sources.map((src) => (
                <div key={src.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-none">
                  <div>
                    <div className="font-semibold text-slate-200">{src.name}</div>
                    <div className="text-[10px] text-slate-400">Checked {src.lastCheckTime} · {src.jobsIndexedCount} jobs</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {src.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Helpful First-Use Guidance Card */}
      <TiltCard>
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 space-y-3 card-hover-effect">
          <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Helpful First-Use Guidance</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div>
              <strong className="text-white block mb-0.5">1. Upload Resume</strong>
              Go to <button onClick={() => setActiveView('resume')} className="text-violet-400 underline hover:text-violet-300">My Resume</button> to upload your PDF/Text resume for Gemini scoring.
            </div>
            <div>
              <strong className="text-white block mb-0.5">2. Set Scan Schedule</strong>
              Configure automated discovery intervals under <button onClick={() => setActiveView('schedule')} className="text-violet-400 underline hover:text-violet-300">Search Schedule</button>.
            </div>
            <div>
              <strong className="text-white block mb-0.5">3. Track Applications</strong>
              Log your manual applications under <button onClick={() => setActiveView('applications')} className="text-violet-400 underline hover:text-violet-300">Applications</button> for 5-day follow-up alerts.
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Detail Drawer */}
      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};
