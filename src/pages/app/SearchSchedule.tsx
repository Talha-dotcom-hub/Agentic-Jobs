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
        <h1 className="font-headline-lg text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>Automated Job Discovery Schedule</span>
        </h1>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          Configure backend job discovery intervals. Public feeds and configured employer ATS boards are polled automatically.
        </p>
      </div>

      {/* Main Schedule Config Panel */}
      <div className="p-4 sm:p-6 rounded-xl bg-surface-container border border-[#27272A] space-y-6 text-xs font-body-sm">
        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-[6px] bg-surface-container-lowest border border-[#27272A]">
          <div className="space-y-1">
            <div className="font-semibold text-on-surface flex items-center gap-2 font-label-md">
              <Power className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span>Automated Background Scans</span>
            </div>
            <p className="text-on-surface-variant text-[11px] font-code-meta">
              When enabled, server workers fetch and deduplicate listings automatically.
            </p>
          </div>

          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 border border-[#27272A] ${
              enabled ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-surface-container-lowest transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Frequency Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-on-surface font-label-md">Execution Frequency</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFrequencyType('hourly');
                setFrequencyValue(4);
              }}
              className={`p-3.5 rounded-[6px] border text-left transition-colors ${
                frequencyType === 'hourly'
                  ? 'bg-primary/10 border-primary/30 text-on-surface font-semibold'
                  : 'bg-surface-container-lowest border-[#27272A] text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="font-bold font-label-md">Hourly Interval</div>
              <div className="text-[11px] font-code-meta text-on-surface-variant mt-0.5">Scans every 2 to 24 hours</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFrequencyType('daily');
                setFrequencyValue(1);
              }}
              className={`p-3.5 rounded-[6px] border text-left transition-colors ${
                frequencyType === 'daily'
                  ? 'bg-primary/10 border-primary/30 text-on-surface font-semibold'
                  : 'bg-surface-container-lowest border-[#27272A] text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="font-bold font-label-md">Daily Interval</div>
              <div className="text-[11px] font-code-meta text-on-surface-variant mt-0.5">Scans every 1 to 5 days</div>
            </button>
          </div>

          {/* Value Discrete Selection */}
          <div className="space-y-2 pt-1">
            <label className="block text-on-surface font-medium font-label-md">
              Selected Interval ({frequencyValue} {frequencyType === 'hourly' ? (frequencyValue === 1 ? 'hour' : 'hours') : (frequencyValue === 1 ? 'day' : 'days')})
            </label>

            {frequencyType === 'hourly' ? (
              <select
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-xs text-on-surface focus:outline-none focus:border-primary font-code-score font-semibold"
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
                className="w-full px-3.5 py-2 bg-surface-container-lowest border border-[#27272A] rounded-[6px] text-xs text-on-surface focus:outline-none focus:border-primary font-code-score font-semibold"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    Every {d} {d === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-between font-code-meta text-[10px] text-on-surface-variant pt-1">
              <span>Minimum: {frequencyType === 'hourly' ? '2 hours' : '1 day'}</span>
              <span>Maximum: {frequencyType === 'hourly' ? '24 hours' : '5 days'}</span>
            </div>
          </div>
        </div>

        {/* Schedule status telemetry */}
        <div className="p-3.5 sm:p-4 rounded-[6px] bg-surface-container-lowest border border-[#27272A] space-y-2 text-[11px] font-code-meta">
          <div className="flex flex-wrap justify-between gap-2 text-on-surface">
            <span>Last Scan Status:</span>
            <span className={`font-semibold ${schedule.status === 'completed' ? 'text-primary' : schedule.status === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
              {schedule.status === 'completed' ? 'Completed' : schedule.status === 'running' ? 'Running' : schedule.status === 'error' ? 'Needs retry' : 'Not run yet'}
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-on-surface-variant">
            <span>Last successful scan jobs:</span>
            <span className="font-semibold text-on-surface tabular-nums">{schedule.lastSuccessfulScanJobsCount || 0}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-on-surface-variant">
            <span>Recorded source failures:</span>
            <span className="font-semibold text-on-surface tabular-nums">{schedule.sourceFailuresCount || 0}</span>
          </div>
          <div className="text-on-surface-variant/80">
            {schedule.lastScanTime ? `Last scan attempt: ${new Date(schedule.lastScanTime).toLocaleString()}` : 'No scan attempt has been recorded for this account yet.'}
          </div>
          <div className="text-on-surface-variant/80">
            {schedule.nextScanTime ? `Next scheduled scan: ${new Date(schedule.nextScanTime).toLocaleString()}` : 'No next scan is scheduled.'}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={runScanNow}
            className="w-full sm:w-auto px-4 py-2 rounded-[6px] bg-surface-container-high hover:bg-surface-container-highest border border-[#27272A] text-on-surface text-xs font-label-md font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Trigger Scan Now</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="w-full sm:w-auto px-5 py-2 rounded-[6px] bg-primary hover:bg-primary-fixed text-on-primary text-xs font-label-md font-semibold shadow-sm transition-colors text-center"
          >
            Save Schedule Preferences
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-[#27272A] bg-surface-container p-4 sm:p-6" aria-labelledby="scan-history-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="scan-history-heading" className="text-sm font-semibold text-on-surface font-headline-sm">Recent scan history</h2>
            <p className="mt-0.5 font-code-meta text-[11px] text-on-surface-variant">Rolling 24-hour log in local timezone.</p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryRefresh((value) => value + 1)}
            disabled={historyLoading || isDemoMode}
            className="inline-flex min-h-8 items-center gap-2 rounded-[6px] border border-[#27272A] bg-surface-container-high px-3 text-xs font-label-md text-on-surface hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            Refresh
          </button>
        </div>

        {isDemoMode ? (
          <p className="rounded-[6px] border border-[#27272A] bg-surface-container-lowest p-3 text-on-surface-variant font-code-meta">Live scan history is unavailable in demo mode.</p>
        ) : historyLoading ? (
          <p className="rounded-[6px] border border-[#27272A] bg-surface-container-lowest p-3 text-on-surface-variant font-code-meta" role="status">Loading recent scan history…</p>
        ) : historyError ? (
          <p className="rounded-[6px] border border-error/30 bg-error-container/20 p-3 text-error font-code-meta" role="alert">{historyError}</p>
        ) : scanHistory.length === 0 ? (
          <p className="rounded-[6px] border border-[#27272A] bg-surface-container-lowest p-3 text-on-surface-variant font-code-meta">No scan attempts have been recorded in the past 24 hours.</p>
        ) : (
          <ol className="space-y-3">
            {scanHistory.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-[#27272A] bg-surface-container-lowest p-3.5 space-y-1.5 font-code-meta">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${entry.status === 'completed' ? 'text-primary' : 'text-error'}`} />
                    {entry.status === 'completed' ? 'Completed' : entry.status === 'rate_limited' ? 'Rate limited' : 'Failed'}
                  </span>
                  <time className="text-[10px] text-on-surface-variant tabular-nums" dateTime={entry.startedAt}>
                    {new Date(entry.startedAt).toLocaleString()}
                  </time>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {entry.jobsDiscovered} retrieved · {entry.newJobsFound} new · {entry.highMatchJobsCount} matches above 85%
                </p>
                <p className="text-[10px] text-on-surface-variant/70">
                  {entry.sourcesChecked} sources checked · {entry.verifiedJobsCount} source-verified · {entry.duplicatesSuppressedCount} duplicates suppressed
                </p>
                {entry.errorDetails && <p className="text-[11px] text-error">{entry.errorDetails}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
