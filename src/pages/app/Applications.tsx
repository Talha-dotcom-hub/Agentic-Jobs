import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApplicationModal } from '../../components/applications/ApplicationModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Application, ApplicationStatus } from '../../types';
import {
  Briefcase,
  Plus,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Search,
  Building,
  LayoutGrid,
  List,
} from 'lucide-react';

export const Applications: React.FC = () => {
  const { applications, updateApplicationStatus, deleteApplication } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | ApplicationStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);

  const filteredApps = applications.filter((app) => {
    const matchTab = activeTab === 'All' || app.status === activeTab;
    const matchSearch =
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
      case 'Interview':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
      case 'Offer':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteApplication(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span>Application Tracking ({applications.length})</span>
          </h1>
          <p className="text-xs text-slate-400">
            Track submission dates, interview rounds, offers, and automatic 5-day follow-up reminders.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingApp(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Track Application</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full sm:w-auto overflow-x-auto text-xs">
            {(['All', 'Applied', 'Interview', 'Offer', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter applications..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dense list view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid card view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List or Grid */}
      {filteredApps.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs">No application records found matching your current filters.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
          {filteredApps.map((app) => {
            const isOverdue =
              app.status === 'Applied' && new Date(app.appliedDate) < fiveDaysAgo;

            return (
              <div
                key={app.id}
                className={`p-5 rounded-2xl bg-slate-900/50 border transition-all space-y-3 ${
                  isOverdue ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">{app.jobTitle}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Follow-Up Recommended (&gt;5d)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-violet-400" />
                      {app.company} {app.location && `· ${app.location}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium focus:outline-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => setDeletingId(app.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                      title="Delete application record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Info Line */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                    {app.salary && <span>· Comp: {app.salary}</span>}
                    {app.contactPerson && <span>· Contact: {app.contactPerson}</span>}
                  </div>

                  {app.originalUrl && (
                    <a
                      href={app.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>Original Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {app.notes && (
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                    &quot;{app.notes}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingApp={editingApp}
      />

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Application Record"
        message="Are you sure you want to delete this tracked application? This record will be permanently removed from your dashboard."
        confirmText="Delete Record"
        confirmVariant="rose"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
