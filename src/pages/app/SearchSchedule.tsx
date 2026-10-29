import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, RefreshCw, CheckCircle2, Power } from 'lucide-react';
import { fetchScanHistoryApi } from '../../services/api';
import { ScanHistoryEntry } from '../../types';

export const SearchSchedule: React.FC = () => {
  const { schedule, updateSchedule, runScanNow, isDemoMode } = useApp();

  const [enabled, setEnabled] = useState(schedule.enabled);
  const [frequencyType, setFrequencyType] = useState<'hourly' | 'daily'>(schedule.frequencyType);
  const [frequencyValue, setFrequencyValue] = useState(schedule.frequencyValue);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    setEnabled(schedule.enabled);
    setFrequencyType(schedule.frequencyType);
    setFrequencyValue(schedule.frequencyValue);
  }, [schedule.enabled, schedule.frequencyType, schedule.frequencyValue]);

  useEffect(() => {
    let active = true;
    if (isDemoMode) {
      setScanHistory([]);
      setHistoryError('');
      setHistoryLoading(false);
      return () => { active = false; };
    }

    setHistoryLoading(true);
    setHistoryError('');
    fetchScanHistoryApi()
      .then((history) => {
        if (active) setScanHistory(history);
      })
      .catch((error: unknown) => {
        if (active) {
          setHistoryError(error instanceof Error ? error.message : 'Could not load recent scan history.');
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => { active = false; };
  }, [historyRefresh, isDemoMode, schedule.lastScanTime, schedule.status]);

  const handleSaveSchedule = async () => {
    await updateSchedule({
      enabled,
      frequencyType,
      frequencyValue,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-violet-400" />
          <span>Automated Job Discovery Schedule</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure backend job discovery intervals. Public feeds and configured employer ATS boards are supported; third-party providers stay disabled until their terms and authorization are confirmed.
        </p>
      </div>

      {/* Main Schedule Config Panel */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 text-xs">
        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-2">
              <Power className={`w-4 h-4 ${enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Automated Background Scans</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              When enabled, server workers fetch and deduplicate listings automatically.
            </p>
          </div>

          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
              enabled ? 'bg-emerald-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Frequency Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-200">Execution Frequency</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFrequencyType('hourly');
                setFrequencyValue(4);
              }}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                frequencyType === 'hourly'
                  ? 'bg-violet-600/15 border-violet-500/50 text-white font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">Hourly Interval</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scans every 2 to 24 hours</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFrequencyType('daily');
                setFrequencyValue(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                frequencyType === 'daily'
                  ? 'bg-violet-600/15 border-violet-500/50 text-white font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold">Daily Interval</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scans every 1 to 5 days</div>
            </button>
          </div>

          {/* Value Discrete Selection */}
          <div className="space-y-2 pt-2">
            <label className="block text-slate-300 font-medium">
              Selected Interval ({frequencyValue} {frequencyType === 'hourly' ? (frequencyValue === 1 ? 'hour' : 'hours') : (frequencyValue === 1 ? 'day' : 'days')})
            </label>

            {frequencyType === 'hourly' ? (
              <select
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((h) => (
                  <option key={h} value={h}>
                    Every {h} hours {h === 4 ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    Every {d} {d === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Minimum: {frequencyType === 'hourly' ? '2 hours' : '1 day'}</span>
              <span>Maximum: {frequencyType === 'hourly' ? '24 hours' : '5 days'}</span>
            </div>
          </div>
        </div>

        {/* Schedule status is always derived from the saved account schedule, never hard-coded. */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-[11px]">
          <div className="flex flex-wrap justify-between gap-2 text-slate-300">
            <span>Last Scan Status:</span>
            <span className={`font-semibold ${schedule.status === 'completed' ? 'text-emerald-400' : schedule.status === 'error' ? 'text-rose-300' : 'text-slate-200'}`}>
              {schedule.status === 'completed' ? 'Completed' : schedule.status === 'running' ? 'Running' : schedule.status === 'error' ? 'Needs retry' : 'Not run yet'}
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-slate-300">
            <span>Last successful scan jobs:</span>
            <span className="font-semibold text-slate-200">{schedule.lastSuccessfulScanJobsCount || 0}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-slate-300">
            <span>Recorded source failures:</span>
            <span className="font-semibold text-slate-200">{schedule.sourceFailuresCount || 0}</span>
          </div>
          <div className="text-slate-500">
            {schedule.lastScanTime ? `Last scan attempt: ${new Date(schedule.lastScanTime).toLocaleString()}` : 'No scan attempt has been recorded for this account yet.'}
          </div>
          <div className="text-slate-500">
            {schedule.nextScanTime ? `Next scheduled scan: ${new Date(schedule.nextScanTime).toLocaleString()}` : 'No next scan is scheduled.'}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={runScanNow}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trigger Scan Now</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all text-center"
          >
            Save Schedule Preferences
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6" aria-labelledby="scan-history-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="scan-history-heading" className="text-sm font-semibold text-white">Recent scan history</h2>
            <p className="mt-1 text-[11px] text-slate-400">Completed and failed attempts from the rolling last 24 hours, shown in your local timezone.</p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryRefresh((value) => value + 1)}
            disabled={historyLoading || isDemoMode}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {isDemoMode ? (
          <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-slate-400">Live scan history is unavailable in demo mode.</p>
        ) : historyLoading ? (
          <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-slate-400" role="status">Loading recent scan history…</p>
        ) : historyError ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-rose-200" role="alert">{historyError}</p>
        ) : scanHistory.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-slate-400">No scan attempts have been recorded in the past 24 hours.</p>
        ) : (
          <ol className="space-y-3">
            {scanHistory.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-100">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${entry.status === 'completed' ? 'text-emerald-400' : 'text-rose-300'}`} />
                    {entry.status === 'completed' ? 'Completed' : entry.status === 'rate_limited' ? 'Rate limited' : 'Failed'}
                  </span>
                  <time className="text-[10px] text-slate-500" dateTime={entry.startedAt}>
                    {new Date(entry.startedAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 text-[11px] text-slate-300">
                  {entry.jobsDiscovered} retrieved · {entry.newJobsFound} new · {entry.highMatchJobsCount} matches above 85%
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {entry.sourcesChecked} sources checked · {entry.verifiedJobsCount} source-verified · {entry.duplicatesSuppressedCount} duplicates suppressed
                </p>
                <p className="mt-1 break-words text-[10px] text-slate-500">{entry.sourcesSummary}</p>
                {entry.sourceErrors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[10px] text-amber-200">
                    {entry.sourceErrors.map((sourceError) => <li key={sourceError}>{sourceError}</li>)}
                  </ul>
                )}
                {entry.errorDetails && <p className="mt-2 text-[11px] text-rose-200">{entry.errorDetails}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
