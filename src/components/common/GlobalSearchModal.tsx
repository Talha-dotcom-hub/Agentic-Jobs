import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Briefcase, Bookmark, Sparkles, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob: (job: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectJob,
}) => {
  const { jobs, applications, setActiveView, registerOverlay, unregisterOverlay } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      registerOverlay('global-search-modal', onClose);
      return () => unregisterOverlay('global-search-modal');
    }
  }, [isOpen, onClose, registerOverlay, unregisterOverlay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredJobs = query.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(query.toLowerCase()) ||
          j.company.toLowerCase().includes(query.toLowerCase()) ||
          j.skillsRequired.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
    : jobs.slice(0, 4);

  const filteredApps = query.trim()
    ? applications.filter(
        (a) =>
          a.jobTitle.toLowerCase().includes(query.toLowerCase()) ||
          a.company.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-container-high border border-[#27272A] rounded-xl shadow-2xl overflow-hidden space-y-3 p-4">
        {/* Input Bar */}
        <div className="relative flex items-center border-b border-[#27272A] pb-3">
          <Search className="w-4 h-4 text-primary absolute left-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities, skills, companies, applications (e.g. React, Vercel)..."
            className="w-full pl-9 pr-10 py-2 bg-transparent text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/70 font-body-sm font-medium"
          />
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto space-y-4 text-xs font-body-sm">
          {/* Jobs Results */}
          <div className="space-y-2">
            <div className="font-label-md uppercase font-semibold text-on-surface-variant px-2 flex items-center justify-between">
              <span>Opportunities</span>
              <span className="font-code-meta tabular-nums">{filteredJobs.length} results</span>
            </div>
            <div className="space-y-1">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    onSelectJob(job);
                    onClose();
                  }}
                  className="p-2.5 rounded-[6px] hover:bg-surface-container border border-transparent hover:border-[#27272A] transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-on-surface flex items-center gap-2 truncate">
                      <span className="truncate">{job.title}</span>
                      <span className="text-[10px] text-primary font-code-score font-semibold bg-primary/10 px-1.5 py-0.5 rounded-[4px] border border-primary/20 shrink-0 tabular-nums">
                        {job.matchScore === null ? 'Not scored' : `${job.matchScore}% Match`}
                      </span>
                    </div>
                    <div className="text-[11px] font-code-meta text-on-surface-variant truncate">
                      {job.company} · {job.location} ({job.source})
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Applications Results if matching */}
          {filteredApps.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#27272A]">
              <div className="font-label-md uppercase font-semibold text-on-surface-variant px-2">
                Tracked Applications
              </div>
              <div className="space-y-1">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setActiveView('applications');
                      onClose();
                    }}
                    className="p-2.5 rounded-[6px] hover:bg-surface-container border border-transparent hover:border-[#27272A] transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-on-surface flex items-center gap-2">
                        <span>{app.jobTitle}</span>
                        <span className="text-[10px] text-primary font-code-meta font-semibold bg-primary/10 px-1.5 py-0.5 rounded-[4px] border border-primary/20">
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-code-meta text-on-surface-variant">{app.company}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#27272A] flex items-center justify-between font-code-meta text-[11px] text-on-surface-variant">
          <span>Press ESC to close</span>
          <span>
            Shortcut:{' '}
            <code className="bg-surface-container-lowest px-1.5 py-0.5 rounded-[4px] border border-[#27272A] text-on-surface font-mono">
              Ctrl + K
            </code>
          </span>
        </div>
      </div>
    </div>
  );
};
