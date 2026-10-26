import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Sparkles } from 'lucide-react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose }) => {
  const { addCustomJob, registerOverlay, unregisterOverlay, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      registerOverlay('add-job-modal', onClose);
      return () => unregisterOverlay('add-job-modal');
    }
  }, [isOpen, onClose, registerOverlay, unregisterOverlay]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle(''); setCompany(''); setLocation(''); setSalary('');
    setOriginalUrl(''); setDescription(''); setSkills('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;
    if (originalUrl.trim()) {
      try {
        const url = new URL(originalUrl);
        if (url.protocol !== 'https:') throw new Error('Only HTTPS job URLs are accepted.');
      } catch (error: any) {
        showToast(error?.message || 'Enter a valid HTTPS job URL.', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const success = await addCustomJob({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || 'Not specified',
        salary: salary.trim() || undefined,
        originalUrl: originalUrl.trim(),
        description: description.trim(),
        skillsRequired: skills.split(',').map((s) => s.trim()).filter(Boolean),
        matchScore: null,
        verified: false,
        workplaceType: 'Not specified',
        experienceLevel: 'Not specified',
        type: 'Not specified',
      });
      if (!success) return;
      showToast('Job entry saved. It will not have a match score until evaluated against your resume.', 'success');
      reset();
      onClose();
    } catch (error: any) {
      showToast(error?.message || 'Could not save the job entry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Sparkles className="w-4 h-4 text-cyan-400" /><span>Add Custom Job Listing</span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Job Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Analyst" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company Name *</label>
              <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Employer name" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Location / Workplace</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Not specified" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Salary Range</label>
              <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Only if known" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Original Post URL</label>
              <input type="url" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="https://... (optional)" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Required Skills (comma separated)</label>
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Add only skills from the job post" className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Job Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Paste the actual vacancy description..." className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none" />
          </div>
          <p className="text-[11px] text-slate-500">Manual entries are unverified and unscored until a real resume-based evaluation is run. A real application URL is recommended.</p>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium flex items-center gap-1.5 shadow-md shadow-violet-600/20 disabled:opacity-50">
              <Plus className="w-4 h-4" /><span>{saving ? 'Saving…' : 'Add Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
