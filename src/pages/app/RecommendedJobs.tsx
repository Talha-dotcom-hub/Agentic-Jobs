import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { Job } from '../../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const RecommendedJobs: React.FC = () => {
  const { jobs } = useApp();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter to estimated match scores >= 85%
  const recommendedJobs = jobs
    .filter((job) => job.matchScore >= 85)
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>High Precision Candidates</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Recommended Opportunities (&gt;85% Match)</h1>
          <p className="text-xs text-slate-400">
            Opportunities scoring over 85% based on Google Gemini resume analysis.
          </p>
        </div>
      </div>

      {recommendedJobs.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-xs">No opportunities currently score above 85%.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={(j) => setSelectedJob(j)} />
          ))}
        </div>
      )}

      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};
