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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>{editingApp ? 'Edit Application Record' : 'Track New Application'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Lead Full Stack Developer"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Nexus AI Labs"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Application Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
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
              <label className="block text-slate-300 font-medium mb-1">Target Salary / Comp</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $165,000 / yr"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Person / Recruiter</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Recruiter)"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Job Post URL</label>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Application Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add referral notes, interview dates, or preparation points..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium flex items-center gap-1.5 shadow-md shadow-violet-600/20"
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
