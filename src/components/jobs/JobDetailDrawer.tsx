import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, Bookmark, PlusCircle, RefreshCw, Building, MapPin, DollarSign, ShieldAlert } from 'lucide-react';

interface JobDetailDrawerProps { job: Job | null; onClose: () => void; }

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({ job, onClose }) => {
  const { evaluateJobMatch, toggleSaveJob, savedJobIds, addApplication, applications, registerOverlay, unregisterOverlay, isDemoMode, user, showToast } = useApp();
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (job) {
      registerOverlay('job-detail-drawer', onClose);
      return () => unregisterOverlay('job-detail-drawer');
    }
  }, [job, onClose, registerOverlay, unregisterOverlay]);

  if (!job) return null;
  const isSaved = savedJobIds.includes(job.id);
  const isApplied = applications.some((app) => app.jobId === job.id || app.jobTitle === job.title);
  const match = job.matchResult || null;

  const handleReevaluate = async () => {
    if (!isDemoMode && !user.isAuthenticated) {
      showToast('Sign in and save your resume before evaluating a vacancy.', 'error');
      return;
    }
    setEvaluating(true);
    try { await evaluateJobMatch(job.id); }
    catch (error: any) { showToast(error?.message || 'AI match evaluation failed.', 'error'); }
    finally { setEvaluating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0B0F19] border-l border-slate-800 h-full overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{job.source}</span><span>·</span>
              <span>Posted {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Date not provided'}</span>
            </div>
            <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors" aria-label="Close drawer"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 sm:gap-x-4 text-xs text-slate-300">
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-violet-400" />{job.company}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-400" />{job.location} ({job.workplaceType})</span>
              {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-400" />{job.salary}</span>}
            </div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900 border border-violet-500/30 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs sm:text-sm"><Sparkles className="w-4 h-4 text-cyan-400" /><span>Google Gemini Match Evaluation</span></div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-violet-200">{match ? `${match.score}%` : 'Not evaluated'}</span>
                <button onClick={handleReevaluate} disabled={evaluating} className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-colors rounded-lg bg-slate-800/60" title="Run Gemini match evaluation"><RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-cyan-400' : ''}`} /></button>
              </div>
            </div>
            {match ? (
              <>
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">&quot;{match.summary}&quot;</p>
                {match.matchingEvidence.length > 0 && <div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Evidence from Resume</h4><ul className="space-y-1.5 text-xs text-slate-300 pl-2">{match.matchingEvidence.map((ev, idx) => <li key={idx} className="flex items-start gap-2"><span className="text-emerald-400 font-bold">•</span><span>{ev}</span></li>)}</ul></div>}
                {match.potentialSkillGaps.length > 0 && <div className="space-y-2 pt-2 border-t border-slate-800/80"><h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Potential Skill Gaps</h4><ul className="space-y-1.5 text-xs text-slate-400 pl-2">{match.potentialSkillGaps.map((gap, idx) => <li key={idx} className="flex items-start gap-2"><span className="text-amber-400 font-bold">•</span><span>{gap}</span></li>)}</ul></div>}
                {match.eligibilityWarnings.length > 0 && <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1"><h5 className="text-xs font-semibold text-rose-300 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />Eligibility Note</h5><p className="text-xs text-rose-200/90">{match.eligibilityWarnings.join(' ')}</p></div>}
                <p className="text-[10px] text-slate-500">This is an estimated resume-to-vacancy fit score, not a hiring probability.</p>
              </>
            ) : <p className="text-xs text-slate-400">No AI evaluation has been stored for this vacancy. Run an evaluation to see evidence-based results. A score will not be shown unless the request succeeds.</p>}
          </div>
          <div className="space-y-3 pt-2"><h3 className="text-sm font-semibold text-slate-200">Full Job Description</h3><div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 max-h-80 overflow-y-auto">{job.description || 'No job description was supplied by the source.'}</div></div>
        </div>
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button onClick={() => void toggleSaveJob(job.id)} className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-2 ${isSaved ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' : 'border-slate-800 hover:border-slate-700 text-slate-300'}`}><Bookmark className={`w-4 h-4 ${isSaved ? 'fill-violet-400' : ''}`} /><span>{isSaved ? 'Saved' : 'Save Job'}</span></button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!isApplied && <button onClick={() => void addApplication({ jobId: job.id, jobTitle: job.title, company: job.company, originalUrl: job.originalUrl })} className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"><PlusCircle className="w-4 h-4 text-cyan-400" /><span>Track Application</span></button>}
            {job.originalUrl && <a href={job.originalUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"><span>Apply on Company Site</span><ExternalLink className="w-4 h-4" /></a>}
          </div>
        </div>
      </div>
    </div>
  );
};
