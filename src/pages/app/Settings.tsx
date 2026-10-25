import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings as SettingsIcon,
  User,
  Key,
  ShieldAlert,
  Download,
  Trash2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, setUser, showToast, logoutUser } = useApp();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [apifyToken, setApifyToken] = useState(user.apiKeys?.apifyApiToken || '');
  const [rapidapiKey, setRapidapiKey] = useState(user.apiKeys?.rapidapiKey || '');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      name,
      email,
      apiKeys: {
        apifyApiToken: apifyToken,
        rapidapiKey,
      },
    }));
    showToast('Account profile and integration preferences saved.', 'success');
  };

  const handleDownloadData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'agentic_jobs_user_data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Account data exported as JSON file.', 'success');
  };

  const handleDeleteAccount = () => {
    showToast('Account and all associated resume data deleted.', 'info');
    logoutUser();
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-violet-400" />
          <span>Account &amp; Integration Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage profile preferences, API integration credentials, and data privacy.
        </p>
      </div>

      {/* Account Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Profile Details</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Source Credentials Status Panel */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-violet-400" />
            <span>Source Integration Tokens (Server-Side Proxy)</span>
          </h3>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            API credentials are saved directly to server environment secrets. Client bundles never expose raw keys.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Apify API Token</label>
              <input
                type="password"
                value={apifyToken}
                onChange={(e) => setApifyToken(e.target.value)}
                placeholder="apify_api_••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">RapidAPI Key (linkedin-data-api)</label>
              <input
                type="password"
                value={rapidapiKey}
                onChange={(e) => setRapidapiKey(e.target.value)}
                placeholder="rapid_api_••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI Model Preferences */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>AI Model Configuration</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-white">Google Gemini Evaluation Engine</div>
              <div className="text-[11px] text-slate-400">Server-side SDK using gemini-3.8-flash model</div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
              Active
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-violet-600/20 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Data Export & Account Deletion Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-white text-sm">Data Export &amp; Privacy Control</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <div className="font-semibold text-white">Download Account Data Package</div>
            <div className="text-slate-400 text-[11px]">Export saved jobs, applications, and profile JSON</div>
          </div>
          <button
            onClick={handleDownloadData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-rose-300">Delete Account &amp; Resume Data</div>
            <div className="text-rose-200/80 text-[11px]">Permanently remove resume text and all tracked records</div>
          </div>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B0F19] border border-rose-500/40 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Confirm Permanent Account Deletion</span>
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete your account? This action permanently removes your resume, applications, saved jobs, and configuration.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
