import React from 'react';

export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-800 rounded w-1/3" />
        <div className="h-6 bg-slate-800 rounded-lg w-20" />
      </div>

      <div className="space-y-2">
        <div className="h-5 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800/60 rounded w-1/2" />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-4 bg-slate-800/60 rounded w-24" />
        <div className="h-4 bg-slate-800/60 rounded w-16" />
      </div>

      <div className="h-10 bg-slate-800/40 rounded-xl" />

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="h-7 bg-slate-800/60 rounded-lg w-24" />
        <div className="h-7 bg-slate-800/80 rounded-lg w-28" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 flex items-center justify-between gap-4 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-3 bg-slate-800/60 rounded w-1/4" />
      </div>
      <div className="h-6 bg-slate-800 rounded-lg w-20 shrink-0" />
    </div>
  );
};
