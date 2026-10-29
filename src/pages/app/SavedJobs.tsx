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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-violet-400" />
          <span>Saved Opportunities ({savedJobsList.length})</span>
        </h1>
        <p className="text-xs text-slate-400">
          Bookmarked opportunities saved for later application and tracking.
        </p>
      </div>

      {savedJobsList.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs">You have no saved jobs yet.</p>
          <button
            onClick={() => setActiveView('discover')}
            className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white hover:bg-violet-500 font-medium"
          >
            Discover Opportunities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedJobsList.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={selectJob} />
          ))}
        </div>
      )}

      <JobDetailDrawer job={selectedJob} onClose={closeJob} />
    </div>
  );
};
