import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getGeminiKeyStatus, saveGeminiApiKey, deleteGeminiApiKey } from '../../services/api';
import type { GeminiKeyStatus } from '../../services/api';
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
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<GeminiKeyStatus | null>(null);
  const [geminiKeyBusy, setGeminiKeyBusy] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({ ...prev, name, email }));
    showToast('Profile preferences saved in this session.', 'success');
  };
  const refreshGeminiKeyStatus = async () => {
    try {
      const status = await getGeminiKeyStatus();
      setGeminiKeyStatus(status);
    } catch (error: any) {
      setGeminiKeyStatus(null);
      console.warn('Gemini key status unavailable:', error?.message || error);
    }
  };
  useEffect(() => { void refreshGeminiKeyStatus(); }, []);
  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      showToast('Paste your Gemini API key before saving.', 'error');
      return;
    }
    setGeminiKeyBusy(true);
    try {
      const status = await saveGeminiApiKey(geminiKey.trim());
      setGeminiKeyStatus(status);
      setGeminiKey('');
      showToast('Gemini key encrypted and saved. It will be tested during the next AI request.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Could not save Gemini API key.', 'error');
    } finally {
      setGeminiKeyBusy(false);
    }
  };
  const handleRemoveGeminiKey = async () => {
    setGeminiKeyBusy(true);
    try {
      await deleteGeminiApiKey();
      setGeminiKeyStatus({ configured: false });
      setGeminiKey('');
      showToast('Your saved Gemini key was removed.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Could not remove Gemini API key.', 'error');
    } finally {
      setGeminiKeyBusy(false);
    }
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

        {/* Primary AI credential */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-violet-400" />
            <span>Primary AI Integration â€” Google Gemini</span>
          </h3>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Your key is encrypted by the backend and never returned to this page. It is used for resume extraction, matching, and scheduled AI scoring. The app never stores the raw key in browser storage.
          </p>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Gemini API Key</label>
            <input
              type="password"
              autoComplete="new-password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={geminiKeyStatus?.configured ? `Saved key ${geminiKeyStatus.keyHint || 'â€¢â€¢â€¢â€¢'}. Paste a new key to rotate.` : 'Paste your Gemini API key'}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-violet-500 font-mono"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded border text-[10px] font-bold ${geminiKeyStatus?.configured ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                {geminiKeyStatus?.configured ? `Saved ${geminiKeyStatus.keyHint || ''}` : 'Gemini key required'}
              </span>
              <button type="button" onClick={handleSaveGeminiKey} disabled={geminiKeyBusy || !geminiKey.trim()} className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold disabled:opacity-50">
                {geminiKeyBusy ? 'Saving...' : 'Encrypt & Save Key'}
              </button>
              {geminiKeyStatus?.configured && <button type="button" onClick={handleRemoveGeminiKey} disabled={geminiKeyBusy} className="px-3.5 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">Remove Key</button>}
            </div>
          </div>
        </div>
        {/* Optional connectors are configured on the server, not in a user profile. */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Optional job sources:</strong> Apify and RapidAPI are server-managed integrations and do not need personal keys here. Public job feeds and supported employer ATS sources can run independently; an integration is not shown as connected unless the backend reports it configured.
        </div>        {/* AI Model Preferences */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Automatic AI Model Fallback</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-white">Gemini model chain</div>
              <span className={`px-2.5 py-1 rounded border text-[10px] font-bold ${geminiKeyStatus?.configured ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                {geminiKeyStatus?.configured ? 'Key Saved' : 'Key Needed'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono leading-relaxed">Gemini 3.8 Flash â†’ 3.6 Flash â†’ 3.5 Flash-Lite â†’ 3.1 Flash-Lite â†’ 2.5 Flash*</div>
            <p className="text-[11px] text-slate-500">*Fallback uses the same API key; it can help with model-specific limits, but cannot bypass a project-wide quota or invalid key. Legacy model access depends on your Google AI project.</p>
            <p className="text-[11px] text-slate-500">When every eligible model is rate-limited, the scan retains discovered listings and retries AI scoring at a later scheduled run instead of generating fake scores.</p>
          </div>
        </div><div className="pt-2 flex justify-end">
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
