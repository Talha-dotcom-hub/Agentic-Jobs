import React from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { Bookmark } from 'lucide-react';
import { useSelectedJob } from '../../hooks/useSelectedJob';

export const SavedJobs: React.FC = () => {
  const { jobs, savedJobIds, setActiveView } = useApp();
  const { selectedJob, selectJob, closeJob } = useSelectedJob(jobs, 'saved');

  const savedJobsList = jobs.filter((job) => savedJobIds.includes(job.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <span>Saved Opportunities ({savedJobsList.length})</span>
        </h1>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          Bookmarked opportunities saved for direct application and pipeline review.
        </p>
      </div>

      {savedJobsList.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-surface-container border border-[#27272A] rounded-xl">
          <Bookmark className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="font-body-sm text-on-surface-variant text-xs">You have no saved jobs yet.</p>
          <button
            onClick={() => setActiveView('discover')}
            className="px-3.5 py-1.5 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold font-label-md transition-colors"
          >
            Discover Opportunities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {savedJobsList.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={selectJob} />
          ))}
        </div>
      )}

      <JobDetailDrawer job={selectedJob} onClose={closeJob} />
    </div>
  );
};
