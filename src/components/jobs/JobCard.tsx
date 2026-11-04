import React from 'react';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import { Bookmark, ExternalLink, CheckCircle, PlusCircle, Copy, Building, BarChart3 } from 'lucide-react';
import { isQualifyingMatchScore } from '../../../shared/matchThreshold';

interface JobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob }) => {
  const { savedJobIds, toggleSaveJob, addApplication, applications, showToast } = useApp();

  const isSaved = savedJobIds.includes(job.id);
  const isAlreadyApplied = applications.some(
    (app) => app.jobId === job.id || app.jobTitle === job.title
  );

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.originalUrl) {
      showToast('No original job URL is available for this listing.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(job.originalUrl);
      showToast('Original job link copied to clipboard!', 'success');
    } catch {
      showToast('Clipboard access was unavailable. Open the job to copy its URL.', 'error');
    }
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null || !Number.isFinite(score)) {
      return 'text-on-surface-variant bg-surface-container border-[#27272A]';
    }
    if (score >= 85 || isQualifyingMatchScore(score)) {
      return 'text-primary bg-primary/10 border-primary/30';
    }
    if (score >= 70) {
      return 'text-secondary bg-secondary-container/20 border-secondary/30';
    }
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  };

  return (
    <div className="group min-w-0 p-4 sm:p-5 rounded-xl bg-surface-container-low border border-[#27272A] card-hover-effect flex flex-col justify-between gap-4 h-full shadow-none relative">
      <div className="min-w-0 space-y-3">
        {/* Top Meta Line: Source & Match Score */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 font-code-meta text-xs text-on-surface-variant flex-wrap">
            <span className="font-semibold text-on-surface uppercase tracking-wider">{job.source}</span>
            {job.foundInLatestScan && (
              <span className="rounded-[4px] border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Found in scan
              </span>
            )}
            {job.seenScanCount && job.seenScanCount > 1 && (
              <span className="text-[10px] text-on-surface-variant">· {job.seenScanCount} scans</span>
            )}
            <span aria-hidden="true">·</span>
            <span>{job.workplaceType}</span>
            <span aria-hidden="true">·</span>
            <span>{job.experienceLevel}</span>
          </div>

          {/* Match score badge (Monospace tabular figure as per Stitch DESIGN.md) */}
          <button
            onClick={() => onSelectJob(job)}
            className={`px-2.5 py-1 rounded-[6px] border text-xs font-code-score font-semibold flex items-center gap-1.5 transition-colors tabular-nums ${getScoreBadgeClass(
              job.matchScore
            )}`}
            title={
              job.matchScore === null
                ? 'No match evaluation exists yet'
                : 'Click to view available resume match details'
            }
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{job.matchScore === null ? 'Not scored' : `${job.matchScore}% Match`}</span>
          </button>
        </div>

        {/* Title & Company */}
        <div>
          <h3
            onClick={() => onSelectJob(job)}
            className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface group-hover:text-primary transition-colors cursor-pointer leading-snug"
          >
            {job.title}
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1 font-medium break-words flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
            <span>{job.company}</span>
            <span className="text-on-surface-variant/50">·</span>
            <span>{job.location}</span>
          </p>
        </div>

        {/* Salary & Type Chips */}
        <div className="flex flex-wrap items-center gap-2 font-code-meta text-xs text-on-surface">
          {job.salary && (
            <span className="font-code-score font-semibold text-primary tabular-nums px-2 py-0.5 bg-surface-container rounded-[4px] border border-primary/20">
              {job.salary}
            </span>
          )}
          <span className="px-2 py-0.5 bg-surface-container rounded-[4px] border border-[#27272A] text-on-surface-variant">
            {job.type}
          </span>
        </div>

        {/* Required Skills Inline List */}
        <div className="font-body-sm text-xs text-on-surface-variant leading-normal line-clamp-2">
          <strong className="text-on-surface font-medium font-label-sm">Key Requirements: </strong>
          {job.skillsRequired.length
            ? job.skillsRequired.join(' · ')
            : 'Requirements synthesized from employer ATS specification.'}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-[#27272A] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Save button */}
          <button
            onClick={() => toggleSaveJob(job.id)}
            className={`p-2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-[6px] border transition-colors ${
              isSaved
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
            title={isSaved ? 'Saved in pipeline' : 'Save opportunity'}
            aria-label={isSaved ? 'Saved' : 'Save opportunity'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-primary' : ''}`} />
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            title="Copy original job link"
            aria-label="Copy job link"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* View match details */}
          <button
            onClick={() => onSelectJob(job)}
            className="px-2.5 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-sm"
          >
            AI Analysis
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {/* Track application button */}
          {isAlreadyApplied ? (
            <span className="px-2.5 py-1.5 rounded-[6px] bg-primary/10 border border-primary/20 text-primary font-label-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Applied
            </span>
          ) : (
            <button
              onClick={() =>
                addApplication({
                  jobId: job.id,
                  jobTitle: job.title,
                  company: job.company,
                  originalUrl: job.originalUrl,
                })
              }
              className="px-2.5 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center gap-1 font-label-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-secondary" /> Track
            </button>
          )}

          {/* External original job post link */}
          {job.originalUrl && (
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-sm shadow-sm transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
