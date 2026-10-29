import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetailDrawer } from '../../components/jobs/JobDetailDrawer';
import { AddJobModal } from '../../components/jobs/AddJobModal';
import { useSelectedJob } from '../../hooks/useSelectedJob';
import { Search, Filter, Plus, SlidersHorizontal } from 'lucide-react';

export const DiscoverJobs: React.FC = () => {
  const { jobs } = useApp();

  const getFilterValue = (key: string, fallback: string) =>
    new URLSearchParams(window.location.search).get(key) || fallback;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkplace, setSelectedWorkplace] = useState(() => getFilterValue('workplace', 'All'));
  const [selectedLevel, setSelectedLevel] = useState(() => getFilterValue('level', 'All'));
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'title'>(() => {
    const value = getFilterValue('sort', 'match');
    return value === 'date' || value === 'title' ? value : 'match';
  });

  const { selectedJob, selectJob, closeJob } = useSelectedJob(jobs, 'discover');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const values: Record<string, string> = {
      workplace: selectedWorkplace,
      level: selectedLevel,
      sort: sortBy,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== 'All' && !(key === 'sort' && value === 'match')) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
  }, [selectedWorkplace, selectedLevel, sortBy]);

  // Filter & Search Logic
  const filteredJobs = jobs
    .filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skillsRequired.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchWorkplace =
        selectedWorkplace === 'All' || job.workplaceType === selectedWorkplace;

      const matchLevel =
        selectedLevel === 'All' || job.experienceLevel === selectedLevel;

      return matchSearch && matchWorkplace && matchLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      if (sortBy === 'date') return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Discover Opportunities</h1>
          <p className="text-xs text-slate-400">
            Discover vacancies from configured public feeds and supported employer job boards. Optional third-party integrations may require operator configuration.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Job</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role, company, skill (e.g. TypeScript, React, Express, Remote)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Segmented Filter Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Workplace filter */}
            <select
              value={selectedWorkplace}
              onChange={(e) => setSelectedWorkplace(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
            >
              <option value="All">All Workplace Types</option>
              <option value="Remote">Remote Only</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>

            {/* Level filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
            >
              <option value="All">All Experience Levels</option>
              <option value="Internship">Internship</option>
              <option value="Entry-Level">Entry-Level / Junior</option>
              <option value="Mid-Senior">Mid-Senior</option>
              <option value="Director">Director / Executive</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none"
            >
              <option value="match">Gemini Match Score (High First)</option>
              <option value="date">Date Posted (Newest)</option>
              <option value="title">Job Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-xs">No opportunities found matching your current search filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedWorkplace('All');
              setSelectedLevel('All');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200 hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onSelectJob={selectJob} />
          ))}
        </div>
      )}

      {/* Modals */}
      <JobDetailDrawer job={selectedJob} onClose={closeJob} />
      <AddJobModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
