import React, { useState, useEffect } from 'react';
import { Application, ApplicationStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Briefcase, Check } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingApp?: Application | null;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, editingApp }) => {
  const { addApplication, registerOverlay, unregisterOverlay } = useApp();

  const [jobTitle, setJobTitle] = useState(editingApp?.jobTitle || '');
  const [company, setCompany] = useState(editingApp?.company || '');
  const [status, setStatus] = useState<ApplicationStatus>(editingApp?.status || 'Applied');
  const [salary, setSalary] = useState(editingApp?.salary || '');
  const [contactPerson, setContactPerson] = useState(editingApp?.contactPerson || '');
  const [originalUrl, setOriginalUrl] = useState(editingApp?.originalUrl || '');
  const [notes, setNotes] = useState(editingApp?.notes || '');

  useEffect(() => {
    if (isOpen) {
      registerOverlay('application-modal', onClose);
      return () => unregisterOverlay('application-modal');
    }
  }, [isOpen, onClose, registerOverlay, unregisterOverlay]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !company) return;

    addApplication({
      jobTitle,
      company,
      status,
      salary,
      contactPerson,
      originalUrl: originalUrl || 'https://linkedin.com/jobs',
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-high border border-[#27272A] rounded-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2 text-on-surface font-semibold text-base font-headline-sm">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>{editingApp ? 'Edit Application Record' : 'Track New Application'}</span>
          </div>
          <button
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
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Lead Full Stack Developer"
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
                placeholder="e.g. Nexus AI Labs"
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Application Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-label-md"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Target Salary / Comp</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $165,000 / yr"
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-code-score"
              />
            </div>
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Contact Person / Recruiter</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Recruiter)"
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Job Post URL</label>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-code-meta"
            />
          </div>

          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Application Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add referral notes, interview dates, or preparation points..."
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

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
              className="px-4 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
