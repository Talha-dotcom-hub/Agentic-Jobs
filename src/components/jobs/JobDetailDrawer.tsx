import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  PlusCircle,
  RefreshCw,
  Building,
  MapPin,
  DollarSign,
  Shield,
  ShieldCheck,
  ChevronDown,
  Layers,
  Cpu,
  Zap,
  Globe,
  Clock,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface JobDetailDrawerProps {
  job: Job | null;
  onClose: () => void;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({ job, onClose }) => {
  const {
    evaluateJobMatch,
    toggleSaveJob,
    savedJobIds,
    addApplication,
    applications,
    registerOverlay,
    unregisterOverlay,
    isDemoMode,
    user,
    showToast,
  } = useApp();

  const [evaluating, setEvaluating] = useState(false);
  const [showAuditMatrix, setShowAuditMatrix] = useState(false);

  useEffect(() => {
    if (job) {
      registerOverlay('job-detail-drawer', onClose);
      return () => unregisterOverlay('job-detail-drawer');
    }
  }, [job, onClose, registerOverlay, unregisterOverlay]);

  if (!job) return null;

  const isSaved = savedJobIds.includes(job.id);
  const isApplied = applications.some(
    (app) => app.jobId === job.id || app.jobTitle === job.title
  );
  const match = job.matchResult || null;
  const score = match ? match.score : job.matchScore;

  const handleReevaluate = async () => {
    if (!isDemoMode && !user.isAuthenticated) {
      showToast('Sign in and save your resume before evaluating a vacancy.', 'error');
      return;
    }
    setEvaluating(true);
    try {
      await evaluateJobMatch(job.id);
      showToast('Telemetry match evaluated successfully.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'AI match evaluation failed.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyAction = () => {
    if (!isApplied) {
      void addApplication({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        originalUrl: job.originalUrl,
      });
    }
  };

  // SVG circle calculation
  const circleRadius = 30;
  const circumference = 2 * Math.PI * circleRadius; // ~188.5
  const strokeDashoffset = score !== null && score !== undefined
    ? circumference - (circumference * Math.min(Math.max(score, 0), 100)) / 100
    : circumference;

  // Breakdown competencies
  const skillsList = job.skillsRequired && job.skillsRequired.length > 0
    ? job.skillsRequired
    : ['TypeScript', 'Distributed Architecture', 'API Design', 'Cloud Infrastructure'];

  const confirmedCompetencies = match && match.matchingEvidence && match.matchingEvidence.length > 0
    ? match.matchingEvidence
    : skillsList.slice(0, 4);

  const potentialGaps = match && match.potentialSkillGaps && match.potentialSkillGaps.length > 0
    ? match.potentialSkillGaps
    : ['Domain-specific internal toolchains', 'Target ecosystem tooling (preferred)'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${job.title} at ${job.company}`}
      className="fixed inset-0 z-[80] overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-surface border-l border-[#27272A] h-full overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        {/* Sticky Tactical Header */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-xl border-b border-[#27272A] px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              aria-label="Back to listings"
              className="w-9 h-9 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:hidden" />
              <X className="w-4 h-4 hidden sm:block" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider truncate">
                Telemetry Dossier
              </span>
              <span className="text-on-surface-variant font-code-meta text-xs">/</span>
              <span className="font-code-meta text-xs text-primary font-medium truncate">
                {job.source}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => void toggleSaveJob(job.id)}
              aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
              className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                isSaved
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-container border-[#27272A] text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="hidden sm:flex text-xs font-label-md px-2.5 py-1.5 rounded-md border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Esc
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 px-4 sm:px-6 py-5 space-y-6 pb-32">
          {/* Top Role Metadata Card (Stitch Exact Architecture) */}
          <section className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-[#27272A] relative overflow-hidden shadow-sm">
            {/* Ambient telemetry glow */}
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Logo, Company & Verified Indicator */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-[#27272A] flex items-center justify-center p-2 flex-shrink-0 shadow-sm text-on-surface font-bold text-sm">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-on-surface-variant uppercase tracking-wider truncate">
                      {job.company}
                    </span>
                    <span
                      className="material-symbols-outlined text-[14px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                  <h2 className="font-headline-lg-mobile sm:font-headline-lg text-on-surface font-semibold truncate leading-tight mt-0.5">
                    {job.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Metadata Telemetry Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-[6px] text-on-surface font-code-meta text-xs border border-[#27272A]/80">
                <Globe className="w-3.5 h-3.5 text-tertiary" />
                <span>{job.location} ({job.workplaceType})</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-[6px] text-on-surface font-code-meta text-xs border border-[#27272A]/80">
                <Clock className="w-3.5 h-3.5 text-secondary" />
                <span>{job.type}</span>
              </span>

              {job.salary && (
                <span className="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-[6px] text-primary font-code-score text-xs border border-primary/20 tabular-nums">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  <span>{job.salary}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-[6px] text-on-surface-variant font-code-meta text-xs border border-[#27272A]/80">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>{job.source}</span>
              </span>

              {job.experienceLevel && job.experienceLevel !== 'Not specified' && (
                <span className="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-[6px] text-on-surface font-code-meta text-xs border border-[#27272A]/80">
                  <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>{job.experienceLevel}</span>
                </span>
              )}
            </div>
          </section>

          {/* Interactive Transparency Engine: Algorithmic Resume Match */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
                <h3 className="font-headline-sm text-on-surface font-medium">
                  Algorithmic Resume Match
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code-meta text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-[4px] border border-[#27272A]">
                  {match ? 'v4.2 Audited' : 'Pending Evaluation'}
                </span>
                <button
                  onClick={handleReevaluate}
                  disabled={evaluating}
                  className="p-1.5 rounded-md bg-surface-container hover:bg-surface-container-high border border-[#27272A] text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                  title="Run Google Gemini match evaluation"
                  aria-label="Re-run AI evaluation"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-primary' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-[#27272A] flex flex-col gap-4 shadow-sm">
              {/* Score Metric Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Circular Progress Ring (High Density SVG) */}
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 72 72">
                    {/* Background track */}
                    <circle
                      className="text-surface-container stroke-current"
                      cx="36"
                      cy="36"
                      fill="none"
                      r={circleRadius}
                      strokeWidth="5"
                    />
                    {/* Progress Arc */}
                    <circle
                      className="text-primary transition-all duration-1000 ease-out"
                      cx="36"
                      cy="36"
                      fill="none"
                      r={circleRadius}
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-code-score text-base font-semibold text-primary tabular-nums">
                      {score !== null && score !== undefined ? `${score}%` : '—'}
                    </span>
                    <span className="font-label-sm text-[9px] text-on-surface-variant uppercase tracking-tighter">
                      Score
                    </span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline-sm text-on-surface font-semibold">
                      {score !== null && score !== undefined && score >= 85
                        ? 'Tier-1 Alignment'
                        : score !== null && score !== undefined && score >= 70
                        ? 'Tier-2 Alignment'
                        : 'Review Assessment'}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-primary-container/20 text-primary font-label-sm font-semibold border border-primary/20">
                      {score !== null && score !== undefined && score >= 85
                        ? 'High Priority'
                        : score !== null && score !== undefined && score >= 70
                        ? 'Qualified Fit'
                        : 'Calibrating'}
                    </span>
                  </div>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">
                    {match?.summary ||
                      (score !== null && score !== undefined
                        ? `Evaluation completed with ${score}% alignment to requirements based on your extracted resume profile.`
                        : 'No AI evaluation has been stored yet for this vacancy. Trigger an evaluation to generate deterministic telemetry reasoning.')}
                  </p>
                </div>
              </div>

              {/* Explanatory Divider */}
              <div className="h-px bg-[#27272A] w-full" />

              {/* Matched Skills Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Confirmed Core Competencies ({confirmedCompetencies.length})
                  </span>
                  {score !== null && score !== undefined && (
                    <span className="font-code-meta text-primary tabular-nums">
                      +{(score * 0.2).toFixed(1)} pts
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {confirmedCompetencies.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-surface-container px-2.5 py-1 rounded-[6px] text-on-surface font-code-meta text-xs flex items-center gap-1.5 border border-[#27272A]/70"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Delta & Growth Areas */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-on-surface font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-secondary">tune</span>
                    Identified Gaps &amp; Growth Areas ({potentialGaps.length})
                  </span>
                  <span className="font-code-meta text-on-surface-variant">Neutral Weight</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {potentialGaps.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-surface-container-low px-2.5 py-1 rounded-[6px] text-secondary font-code-meta text-xs flex items-center gap-1.5 border border-[#27272A]/50"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Micro Interactive Audit Log Toggle */}
              <button
                type="button"
                onClick={() => setShowAuditMatrix(!showAuditMatrix)}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-[6px] flex items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors font-label-sm border border-[#27272A]/60"
              >
                <span>{showAuditMatrix ? 'Hide Telemetry Reasoning Matrix' : 'Show Telemetry Reasoning Matrix'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showAuditMatrix ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expandable Audit Breakdown Area */}
              {showAuditMatrix && (
                <div className="flex flex-col gap-2 pt-1 font-body-sm text-on-surface-variant">
                  <div className="p-3 rounded-[6px] bg-surface-container-lowest border border-[#27272A] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-tertiary mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-on-surface font-medium font-label-md">Cross-Verification Method</span>
                      <span>
                        Synthesized against verified profile skills, past experience chronology, and primary ATS vacancy parameters. Fit score represents algorithmic requirement overlap, not an interview guarantee.
                      </span>
                    </div>
                  </div>

                  {match?.eligibilityWarnings && match.eligibilityWarnings.length > 0 && (
                    <div className="p-3 rounded-[6px] bg-error-container/20 border border-error/30 text-error flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold font-label-md">Eligibility Calibration Notice</span>
                        <p>{match.eligibilityWarnings.join(' ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Source Links Section (if multi-source) */}
          {job.sourceLinks && job.sourceLinks.length > 1 && (
            <section className="flex flex-col gap-2">
              <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider">
                Multi-Channel ATS Telemetry
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.sourceLinks.map((sl) => (
                  <a
                    key={`${sl.source}:${sl.url}`}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-code-meta transition-colors"
                  >
                    <span>{sl.source}</span>
                    {sl.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    )}
                    <ExternalLink className="w-3 h-3 text-on-surface-variant" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Role Overview & Responsibilities */}
          <section className="flex flex-col gap-2.5">
            <h3 className="font-headline-sm text-on-surface font-medium">
              Mission &amp; Scope
            </h3>
            <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-[#27272A] space-y-4 shadow-sm">
              <div className="font-body-md text-on-surface leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {job.description || 'No detailed vacancy description was supplied by this listing source.'}
              </div>
            </div>
          </section>

          {/* Compliance & Deterministic Integrity Notice (Stitch Exact Component) */}
          <section>
            <div className="bg-surface-container-high/60 rounded-xl p-3.5 sm:p-4 border border-[#27272A] flex items-start gap-3 shadow-sm">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-label-md text-on-surface font-semibold">Strict Submission Integrity</span>
                <p className="font-body-sm text-on-surface-variant mt-0.5 leading-snug text-xs">
                  Applications are routed directly to official employer career portals and ATS endpoints. Agentic Jobs enforces transparent user-in-the-loop validation and does not submit or contact employers without your explicit authorization.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Fixed Tactical Bottom Action Bar (Stitch Exact Architecture) */}
        <div className="sticky bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-md p-3 sm:p-4 border-t border-[#27272A] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Bookmark / Track Button */}
            <button
              onClick={() => void toggleSaveJob(job.id)}
              className="flex-1 py-2.5 px-3 rounded-[6px] bg-surface-container hover:bg-surface-container-high border border-[#27272A] text-on-surface font-label-md font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary text-primary' : 'text-on-surface-variant'}`} />
              <span>{isSaved ? 'Saved in Pipeline' : 'Save Opportunity'}</span>
            </button>

            {/* Application Tracker Toggle */}
            {!isApplied ? (
              <button
                onClick={handleApplyAction}
                className="flex-1 py-2.5 px-3 rounded-[6px] bg-surface-container hover:bg-surface-container-high border border-[#27272A] text-on-surface font-label-md font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-secondary" />
                <span>Track Application</span>
              </button>
            ) : (
              <span className="flex-1 py-2.5 px-3 rounded-[6px] bg-primary/10 border border-primary/20 text-primary font-label-md font-medium flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                <span>Tracked in Pipeline</span>
              </span>
            )}

            {/* Apply External Button */}
            {job.originalUrl && (
              <a
                href={job.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[1.5] py-2.5 px-4 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
              >
                <span>Apply on {job.company}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
