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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-high border border-[#27272A] rounded-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2 text-on-surface font-semibold text-base font-headline-sm">
            <Plus className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            <span>Add Custom Job Listing</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-body-sm">
          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Job Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Systems Engineer"
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Company Name *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Employer name"
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Location / Workplace</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote, NYC, etc."
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Salary Band</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="$150k - $200k"
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-code-score"
              />
            </div>
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Job Post URL (HTTPS)</label>
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-code-meta"
              />
            </div>
          </div>
          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Required Skills (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="TypeScript, Rust, PostgreSQL, etc."
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-code-meta"
            />
          </div>
          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Job Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the actual vacancy description..."
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors resize-none font-body-sm"
            />
          </div>
          <p className="font-code-meta text-[11px] text-on-surface-variant">
            Manual entries are unverified until evaluated against your uploaded resume profile.
          </p>
          <div className="pt-3 border-t border-[#27272A] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] bg-surface-container hover:bg-surface-container-high border border-[#27272A] text-on-surface font-label-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Add Opportunity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
