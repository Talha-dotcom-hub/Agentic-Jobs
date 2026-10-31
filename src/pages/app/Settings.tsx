import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getGeminiKeyStatus,
  saveGeminiApiKey,
  deleteGeminiApiKey,
  deleteAccountApi,
  fetchProfileSettingsApi,
  saveProfileSettingsApi,
} from '../../services/api';
import type { GeminiKeyStatus, ProfileSettings } from '../../services/api';
import { canSaveProfileSettings } from '../../services/profileSettingsState';
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
  const { user, setUser, showToast, logoutUser, jobs, savedJobIds, applications, notifications, schedule, resume, isDemoMode } = useApp();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<GeminiKeyStatus | null>(null);
  const [geminiKeyBusy, setGeminiKeyBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoadedForUser, setProfileLoadedForUser] = useState<string | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const [preferences, setPreferences] = useState<ProfileSettings['preferences']>(user.preferences);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountDeleteBusy, setAccountDeleteBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user.isAuthenticated || isDemoMode) {
      setProfileLoadedForUser(null);
      setProfileLoadError(null);
      return () => { active = false; };
    }
    setProfileLoadedForUser(null);
    setProfileLoadError(null);
    void (async () => {
      try {
        const settings = await fetchProfileSettingsApi();
        if (!active) return;
        setName(settings.fullName);
        setEmail(settings.email);
        setPreferences(settings.preferences);
        setUser((previous) => ({
          ...previous,
          name: settings.fullName,
          email: settings.email,
          preferences: settings.preferences,
        }));
        setProfileLoadedForUser(user.id);
      } catch (error: unknown) {
        if (active) {
          setProfileLoadError(error instanceof Error ? error.message : 'Could not load saved profile settings.');
        }
      }
    })();
    return () => { active = false; };
  }, [user.id, user.isAuthenticated, isDemoMode, setUser, profileLoadAttempt]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)) return;
    if (isDemoMode) {
      setUser((prev) => ({ ...prev, name, preferences }));
      showToast('Demo profile preferences updated locally.', 'info');
      return;
    }
    setProfileSaving(true);
    try {
      const saved = await saveProfileSettingsApi(name, preferences);
      setName(saved.fullName);
      setEmail(saved.email);
      setPreferences(saved.preferences);
      setUser((prev) => ({
        ...prev,
        name: saved.fullName,
        email: saved.email,
        preferences: saved.preferences,
      }));
      showToast('Profile settings saved to your account.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Profile settings could not be saved. Your previous saved values remain active.', 'error');
    } finally {
      setProfileSaving(false);
    }
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
    const exportData = {
      exportedAt: new Date().toISOString(),
      mode: isDemoMode ? 'demo-sample-data' : 'account-data',
      user: { id: user.id, email: user.email, name: user.name, joinedDate: user.joinedDate, preferences: user.preferences },
      resume: { name: resume.name, text: resume.text, lastUpdated: resume.lastUpdated, profile: resume.profile, extractedSkills: resume.extractedSkills, parsedRole: resume.parsedRole },
      discoveredAndSavedJobs: jobs.filter((job) => savedJobIds.includes(job.id)),
      applications,
      notifications,
      schedule,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = objectUrl;
    downloadAnchor.download = 'agentic_jobs_account_export.json';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    showToast('Current account data export downloaded.', 'success');
  };

  const handleDeleteAccount = async () => {
    if (accountDeleteBusy) return;
    setAccountDeleteBusy(true);
    try {
      await deleteAccountApi();
      setDeleteConfirmOpen(false);
      showToast('Account deletion was confirmed by the backend.', 'success');
      await logoutUser();
    } catch (error: any) {
      showToast(error?.message || 'Account deletion failed. Your session has not been intentionally cleared.', 'error');
    } finally {
      setAccountDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      <div>
        <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>Account &amp; Integration Settings</span>
        </h1>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          Manage profile preferences, API integration credentials, and data privacy.
        </p>
      </div>

      {/* Account Form */}
      <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 rounded-xl bg-surface-container border border-[#27272A] space-y-6 text-xs font-body-sm">
        {profileLoadError && !isDemoMode && user.isAuthenticated && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-[6px] border border-error/30 bg-error-container/20 p-3 text-error">
            <span>Saved profile settings could not be loaded: {profileLoadError} Your saved values have not been changed.</span>
            <button
              type="button"
              onClick={() => setProfileLoadAttempt((attempt) => attempt + 1)}
              className="shrink-0 rounded-[6px] border border-error/40 px-3 py-1 font-semibold hover:bg-error-container/40"
            >
              Retry
            </button>
          </div>
        )}
        <div className="space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm font-headline-sm">
            <User className="w-4 h-4 text-primary" />
            <span>Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)}
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary transition-colors font-body-sm"
              />
            </div>

            <div>
              <label className="block text-on-surface font-medium mb-1 font-label-md">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface-variant focus:outline-none font-code-meta cursor-not-allowed opacity-80"
              />
              <p className="mt-1 text-[10px] font-code-meta text-on-surface-variant/70">Email managed by sign-in provider.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[#27272A]">
          <h3 className="font-bold text-on-surface text-sm font-headline-sm">Discovery &amp; Notification Preferences</h3>
          <PreferenceToggle
            label="High-match alerts"
            description="Create an in-app alert for newly discovered qualifying matches."
            checked={preferences.highMatchAlerts}
            disabled={profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)}
            onChange={(value) => setPreferences((current) => ({ ...current, highMatchAlerts: value }))}
          />
          <PreferenceToggle
            label="Automatically save high matches"
            description="Save qualifying matches to your saved jobs when a scan completes."
            checked={preferences.autoSaveHighMatches}
            disabled={profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)}
            onChange={(value) => setPreferences((current) => ({ ...current, autoSaveHighMatches: value }))}
          />
          <PreferenceToggle
            label="Push notifications"
            description="Deliver browser notifications for alerts when a registered subscription is available."
            checked={preferences.pushNotifications}
            disabled={profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)}
            onChange={(value) => setPreferences((current) => ({ ...current, pushNotifications: value }))}
          />
          <div className="rounded-[6px] border border-[#27272A] bg-surface-container-lowest p-3 text-[11px] font-code-meta text-on-surface-variant/70">
            Email summaries are not available because no email-delivery provider is configured.
          </div>
        </div>

        {/* Primary AI credential */}
        <div className="space-y-4 pt-4 border-t border-[#27272A]">
          <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm font-headline-sm">
            <Key className="w-4 h-4 text-primary" />
            <span>Primary AI Integration — Google Gemini</span>
          </h3>
          <p className="text-on-surface-variant text-[11px] font-body-sm leading-relaxed">
            Your key is encrypted on the backend and used for resume extraction, matching, and scheduled AI scoring.
          </p>
          <div>
            <label className="block text-on-surface font-medium mb-1 font-label-md">Gemini API Key</label>
            <input
              type="password"
              autoComplete="new-password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={geminiKeyStatus?.configured ? `Saved key ${geminiKeyStatus.keyHint || '••••'}. Paste new key to rotate.` : 'Paste your Gemini API key'}
              className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-on-surface focus:outline-none focus:border-primary font-mono text-xs"
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-[4px] border text-[10px] font-code-meta font-semibold ${geminiKeyStatus?.configured ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                {geminiKeyStatus?.configured ? `Saved ${geminiKeyStatus.keyHint || ''}` : 'Gemini key required'}
              </span>
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                disabled={geminiKeyBusy || !geminiKey.trim()}
                className="px-3.5 py-1.5 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md text-xs transition-colors disabled:opacity-50"
              >
                {geminiKeyBusy ? 'Saving...' : 'Encrypt & Save Key'}
              </button>
              {geminiKeyStatus?.configured && (
                <button
                  type="button"
                  onClick={handleRemoveGeminiKey}
                  disabled={geminiKeyBusy}
                  className="px-3.5 py-1.5 rounded-[6px] border border-error/30 text-error hover:bg-error-container/20 font-label-md text-xs transition-colors disabled:opacity-50"
                >
                  Remove Key
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Optional connectors */}
        <div className="p-3.5 rounded-[6px] bg-surface-container-lowest border border-[#27272A] text-[11px] font-code-meta text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">Optional job sources:</strong> Apify and RapidAPI are server-managed integrations and do not need personal keys here. Public job feeds and supported employer ATS sources run independently.
        </div>

        {/* AI Model Preferences */}
        <div className="space-y-3 pt-4 border-t border-[#27272A]">
          <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm font-headline-sm">
            <Cpu className="w-4 h-4 text-tertiary" />
            <span>Automatic AI Model Fallback</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-[#27272A] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-on-surface font-label-md">Gemini model chain</div>
              <span className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-code-meta font-semibold ${geminiKeyStatus?.configured ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                {geminiKeyStatus?.configured ? 'Key Saved' : 'Key Needed'}
              </span>
            </div>
            <div className="text-[11px] text-on-surface-variant font-code-meta leading-relaxed">
              Gemini 3.8 Flash → 3.6 Flash → 3.5 Flash-Lite → 3.1 Flash-Lite → 2.5 Flash*
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={profileSaving || !canSaveProfileSettings(isDemoMode, user.id, profileLoadedForUser)}
            className="px-4 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary font-semibold font-label-md shadow-sm transition-colors disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Data Export & Account Deletion Panel */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface-container border border-[#27272A] space-y-4 text-xs font-body-sm">
        <h3 className="font-bold text-on-surface text-sm font-headline-sm">Data Export &amp; Privacy Control</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest border border-[#27272A]">
          <div>
            <div className="font-semibold text-on-surface font-label-md">Download Account Data Package</div>
            <div className="text-on-surface-variant text-[11px] font-code-meta">Export saved jobs, applications, and profile JSON</div>
          </div>
          <button
            onClick={handleDownloadData}
            className="px-3.5 py-1.5 rounded-[6px] bg-surface-container-high hover:bg-surface-container-highest border border-[#27272A] text-on-surface font-label-md transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-error-container/10 border border-error/30 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-error font-label-md">Delete Account &amp; Resume Data</div>
            <div className="text-error/80 text-[11px] font-code-meta">Permanently remove resume text and all tracked records</div>
          </div>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-3.5 py-1.5 rounded-[6px] bg-error-container text-on-error-container hover:bg-error-container/80 font-label-md font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-high border border-error/40 rounded-xl p-5 space-y-4 font-body-sm">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-headline-sm">
              <ShieldAlert className="w-5 h-5 text-error" />
              <span>Confirm Permanent Account Deletion</span>
            </h3>
            <p className="text-xs text-on-surface-variant font-body-sm">
              Are you sure you want to delete your account? This action permanently removes your resume, applications, saved jobs, and configuration.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-[6px] bg-surface-container border border-[#27272A] text-xs font-label-md text-on-surface hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={accountDeleteBusy}
                className="px-3.5 py-1.5 rounded-[6px] bg-error-container text-on-error-container text-xs font-semibold font-label-md hover:bg-error-container/80 disabled:opacity-50"
              >
                {accountDeleteBusy ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreferenceToggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, checked, disabled, onChange }) => (
  <label className={`flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
    <span>
      <span className="block text-slate-200 font-semibold">{label}</span>
      <span className="block mt-0.5 text-[10px] text-slate-500">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-violet-500"
    />
  </label>
);
