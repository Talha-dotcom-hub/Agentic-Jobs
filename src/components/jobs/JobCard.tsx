import React, { useState } from 'react';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import { Bookmark, ExternalLink, Sparkles, CheckCircle, PlusCircle, Share2, Copy } from 'lucide-react';
import { TiltCard } from '../common/TiltCard';

interface JobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob }) => {
  const { savedJobIds, toggleSaveJob, addApplication, applications, showToast } = useApp();

  const isSaved = savedJobIds.includes(job.id);
  const isAlreadyApplied = applications.some((app) => app.jobId === job.id || app.jobTitle === job.title);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.originalUrl) { showToast('No original job URL is available for this listing.', 'info'); return; }
    try {
      await navigator.clipboard.writeText(job.originalUrl);
      showToast('Original job link copied to clipboard!', 'success');
    } catch {
      showToast('Clipboard access was unavailable. Open the job to copy its URL.', 'error');
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null || !Number.isFinite(score)) return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
    if (score >= 90) return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
    if (score >= 85) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 75) return 'text-violet-300 bg-violet-500/10 border-violet-500/30';
    return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <TiltCard>
      <div className="group p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 card-hover-effect flex flex-col justify-between gap-4 h-full">
        <div className="space-y-3">
          {/* Top Meta Line: Source & Match Score */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Unboxed clean metadata text */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-300">{job.source}</span>
              <span aria-hidden="true">·</span>
              <span>{job.workplaceType}</span>
              <span aria-hidden="true">·</span>
              <span>{job.experienceLevel}</span>
            </div>

            {/* Match score badge */}
            <button
              onClick={() => onSelectJob(job)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 ${getScoreColor(job.matchScore)}`}
              title={job.matchScore === null ? 'No match evaluation exists yet' : 'Click to view the actual AI match evaluation'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{job.matchScore === null ? 'Not scored' : `${job.matchScore}% Match`}</span>
            </button>
          </div>

          {/* Title & Company */}
          <div>
            <h3
              onClick={() => onSelectJob(job)}
              className="text-sm sm:text-base font-semibold text-white group-hover:text-violet-300 transition-colors cursor-pointer leading-snug"
            >
              {job.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {job.company} <span className="text-slate-600">·</span> {job.location}
            </p>
          </div>

          {/* Salary & Type */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-300">
            {job.salary && <span className="font-semibold text-slate-200">{job.salary}</span>}
            {job.salary && <span aria-hidden="true" className="text-slate-600">·</span>}
            <span>{job.type}</span>
          </div>

          {/* Required Skills Inline List */}
          <div className="text-xs text-slate-400 leading-normal line-clamp-2">
            <strong className="text-slate-300 font-medium">Key Requirements: </strong>
            {job.skillsRequired.length ? job.skillsRequired.join(' · ') : 'Requirements not provided by source'}
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Save button */}
            <button
              onClick={() => toggleSaveJob(job.id)}
              className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                  : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isSaved ? 'Saved' : 'Save Job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-violet-400' : ''}`} />
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy post link"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* View match details */}
            <button
              onClick={() => onSelectJob(job)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px] sm:text-xs"
            >
              AI Analysis
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {/* Track application button */}
            {isAlreadyApplied ? (
              <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Applied
              </span>
            ) : (
              <button
                onClick={() => addApplication({ jobId: job.id, jobTitle: job.title, company: job.company, originalUrl: job.originalUrl })}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" /> Track
              </button>
            )}

            {/* External original job post link */}
            {job.originalUrl && (
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-[11px] sm:text-xs shadow-sm transition-all flex items-center gap-1 shrink-0"
            >
              <span>Apply</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            )}
          </div>
        </div>
      </div>
    </TiltCard>
  );
};
