import React from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { Sparkles } from 'lucide-react';
import { isQualifyingMatchScore } from '../../../shared/matchThreshold';
import { useSelectedJob } from '../../hooks/useSelectedJob';

export const RecommendedJobs: React.FC = () => {
  const { jobs } = useApp();
  const { selectedJob, selectJob, closeJob } = useSelectedJob(jobs, 'recommended');

  const recommendedJobs = jobs
    .filter((job) => isQualifyingMatchScore(job.matchScore))
    .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/20 text-xs font-code-meta font-medium text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Recommended Matches (≥85%)</span>
          </div>
          <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface">Recommended Opportunities</h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Opportunities with an estimated match score of at least 85%, based on available resume and job-listing evidence.
          </p>
        </div>
      </div>

      {recommendedJobs.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-surface-container border border-[#27272A] rounded-xl">
          <p className="font-body-sm text-on-surface-variant text-xs">No opportunities currently meet the 85% or higher match threshold.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {recommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={selectJob} />
          ))}
        </div>
      )}

      <JobDetailDrawer job={selectedJob} onClose={closeJob} />
    </div>
  );
};
