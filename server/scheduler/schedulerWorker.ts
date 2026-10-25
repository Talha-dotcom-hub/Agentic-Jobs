import { executeScheduledUserScan, UserScanConfig, calculateNextScanTime } from './scanEngine.js';
import { getPersistedResume } from '../resume/resumeManager.js';

let workerInterval: NodeJS.Timeout | null = null;
let isFallbackScanRunning = false;

export interface SchedulerState {
  enabled: boolean;
  frequencyType: 'hourly' | 'daily';
  frequencyValue: number;
  lastScanTime: string;
  nextScanTime: string;
  lastSuccessfulScanJobsCount: number;
  sourceFailuresCount: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

/**
 * Executes due background scans across real authenticated users persisted in Supabase.
 * Uses atomic locking (is_scanning flag) to ensure idempotency across multiple workers/restarts.
 */
export async function processDueScans(
  getState?: () => SchedulerState,
  updateState?: (patch: Partial<SchedulerState>) => void,
  supabaseClient?: any
): Promise<{ processedUsersCount: number }> {
  let processedUsersCount = 0;

  // 1. Database-backed real users scanning via Supabase
  if (supabaseClient) {
    try {
      const nowIso = new Date().toISOString();

      // Query only due users who have automated scanning enabled and are not currently locked
      const { data: dueSchedules, error } = await supabaseClient
        .from('scan_schedules')
        .select('user_id, enabled, frequency_type, frequency_value, timezone, last_scan_time, next_scan_time, is_scanning')
        .eq('enabled', true)
        .lte('next_scan_time', nowIso)
        .eq('is_scanning', false);

      if (!error && Array.isArray(dueSchedules) && dueSchedules.length > 0) {
        for (const sched of dueSchedules) {
          // Atomic Lock Claim in Supabase
          const { data: claimed, error: claimError } = await supabaseClient
            .from('scan_schedules')
            .update({ is_scanning: true, status: 'running' })
            .eq('user_id', sched.user_id)
            .eq('is_scanning', false)
            .select('user_id')
            .single();

          if (claimError || !claimed) {
            // Another worker or process acquired the lock; skip to avoid duplicates
            continue;
          }

          try {
            // Retrieve user's persistent resume memory
            const userResume = await getPersistedResume(sched.user_id, supabaseClient);

            const config: UserScanConfig = {
              userId: sched.user_id,
              enabled: true,
              frequencyType: sched.frequency_type || 'hourly',
              frequencyValue: sched.frequency_value || 4,
              timezone: sched.timezone || 'UTC',
              lastScanTime: sched.last_scan_time || nowIso,
              nextScanTime: sched.next_scan_time || nowIso,
              resumeText: userResume?.text || '',
            };

            const result = await executeScheduledUserScan(config, supabaseClient);

            // Compute next execution time based on strict hourly/daily rules
            const nextScanTime = result.nextScanTime || calculateNextScanTime(
              config.frequencyType,
              config.frequencyValue,
              new Date()
            ).toISOString();

            // Release lock and update schedule state in database
            await supabaseClient
              .from('scan_schedules')
              .update({
                is_scanning: false,
                status: result.success ? 'completed' : 'error',
                last_scan_time: new Date().toISOString(),
                next_scan_time: nextScanTime,
                last_successful_jobs_count: result.jobsDiscovered,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', sched.user_id);

            processedUsersCount++;
          } catch (scanErr) {
            console.error(`Scheduled scan failed for user ${sched.user_id}:`, scanErr);
            // Release lock on error
            await supabaseClient
              .from('scan_schedules')
              .update({ is_scanning: false, status: 'error' })
              .eq('user_id', sched.user_id);
          }
        }

        return { processedUsersCount };
      }
    } catch (err) {
      console.warn('Database scheduler worker poll warning:', err);
    }
  }

  // 2. Local fallback if Supabase is unavailable (or demo mode)
  if (getState && updateState && !isFallbackScanRunning) {
    const state = getState();
    const now = Date.now();
    const nextTime = new Date(state.nextScanTime).getTime();

    if (state.enabled && now >= nextTime) {
      isFallbackScanRunning = true;
      updateState({ status: 'running' });

      try {
        const fallbackUserId = 'user-001';
        const userResume = await getPersistedResume(fallbackUserId, supabaseClient);
        const config: UserScanConfig = {
          userId: fallbackUserId,
          enabled: state.enabled,
          frequencyType: state.frequencyType,
          frequencyValue: state.frequencyValue,
          timezone: 'UTC',
          lastScanTime: state.lastScanTime,
          nextScanTime: state.nextScanTime,
          resumeText: userResume.text,
        };

        const result = await executeScheduledUserScan(config, supabaseClient);
        updateState({
          status: result.success ? 'completed' : 'error',
          lastScanTime: new Date().toISOString(),
          nextScanTime: result.nextScanTime,
          lastSuccessfulScanJobsCount: result.jobsDiscovered,
        });
        processedUsersCount++;
      } catch (e) {
        updateState({ status: 'error' });
      } finally {
        isFallbackScanRunning = false;
      }
    }
  }

  return { processedUsersCount };
}

export function initSchedulerWorker(
  getState?: () => SchedulerState,
  updateState?: (patch: Partial<SchedulerState>) => void,
  intervalMs: number = 30000,
  supabaseClient?: any
) {
  if (workerInterval) {
    clearInterval(workerInterval);
  }

  // Initial check after short spin-up delay (5s)
  setTimeout(() => {
    processDueScans(getState, updateState, supabaseClient).catch(() => {});
  }, 5000);

  // Autonomous background polling loop
  workerInterval = setInterval(() => {
    processDueScans(getState, updateState, supabaseClient).catch(() => {});
  }, intervalMs);

  return () => {
    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
    }
  };
}
