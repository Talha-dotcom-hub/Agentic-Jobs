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
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Interview':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Offer':
        return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      case 'Rejected':
        return 'bg-error-container/20 text-error border-error/30';
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
          <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span>Application Tracking ({applications.length})</span>
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
            Track submission dates, interview rounds, offers, and 5-day follow-up reminders.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingApp(null);
            setIsModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto font-label-md"
        >
          <Plus className="w-4 h-4" />
          <span>Track Application</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container border border-[#27272A] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Stitch Segmented Status Tabs */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-[6px] border border-[#27272A] w-full sm:w-auto overflow-x-auto text-xs">
            {(['All', 'Applied', 'Interview', 'Offer', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-[4px] font-label-md transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#27272A] text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter applications..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-xs text-on-surface focus:outline-none focus:border-primary font-body-sm transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-[6px] border border-[#27272A] shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  viewMode === 'list' ? 'bg-[#27272A] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Dense list view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[4px] transition-colors ${
                  viewMode === 'grid' ? 'bg-[#27272A] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
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
        <div className="py-16 text-center space-y-3 bg-surface-container border border-[#27272A] rounded-xl">
          <Briefcase className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="font-body-sm text-on-surface-variant text-xs">No application records found matching your current filters.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
          {filteredApps.map((app) => {
            const isOverdue =
              app.status === 'Applied' && new Date(app.appliedDate) < fiveDaysAgo;

            return (
              <div
                key={app.id}
                className={`p-4 sm:p-5 rounded-xl bg-surface-container-low border card-hover-effect space-y-3 ${
                  isOverdue ? 'border-amber-500/40 bg-amber-500/5' : 'border-[#27272A]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">{app.jobTitle}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-code-meta font-semibold uppercase tracking-wider ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/20 border border-amber-500/30 text-amber-300 font-code-meta text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Follow-Up Recommended (&gt;5d)
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                      <span>{app.company}</span>
                      {app.location && (
                        <>
                          <span className="text-on-surface-variant/50">·</span>
                          <span>{app.location}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-2.5 py-1 rounded-[6px] bg-surface-container border border-[#27272A] text-xs text-on-surface font-label-md focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => setDeletingId(app.id)}
                      className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-[6px] hover:bg-surface-container"
                      title="Delete application record"
                      aria-label="Delete application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Info Line */}
                <div className="pt-2.5 border-t border-[#27272A] flex flex-wrap items-center justify-between gap-3 text-xs font-code-meta text-on-surface-variant">
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
                      className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                    >
                      <span>Original Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {app.notes && (
                  <div className="text-xs font-body-sm text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-[6px] border border-[#27272A] italic">
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
