import { executeScheduledUserScan, UserScanConfig, calculateNextScanTime } from './scanEngine.js';
import { getPersistedResume } from '../resume/resumeManager.js';

let workerInterval: NodeJS.Timeout | null = null;
const LOCK_STALE_AFTER_MS = 15 * 60 * 1000;
const DEFAULT_RETRY_DELAY_MS = 15 * 60 * 1000;

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

function staleLockCutoff(): string {
  return new Date(Date.now() - LOCK_STALE_AFTER_MS).toISOString();
}

function retryTime(): string {
  return new Date(Date.now() + DEFAULT_RETRY_DELAY_MS).toISOString();
}

async function claimSchedule(supabaseClient: any, userId: string): Promise<any | null> {
  const nowIso = new Date().toISOString();
  const cutoff = staleLockCutoff();
  const { data, error } = await supabaseClient
    .from('scan_schedules')
    .update({ is_scanning: true, scan_started_at: nowIso, status: 'running', updated_at: nowIso })
    .eq('user_id', userId)
    .or(`is_scanning.eq.false,scan_started_at.is.null,scan_started_at.lt.${cutoff}`)
    .select('user_id,enabled,frequency_type,frequency_value,timezone,last_scan_time,next_scan_time,last_successful_jobs_count,source_failures_count')
    .maybeSingle();
  if (error) {
    console.warn('Could not claim scheduled scan lock:', error.message);
    return null;
  }
  return data || null;
}

async function releaseSchedule(
  supabaseClient: any,
  schedule: any,
  result: Awaited<ReturnType<typeof executeScheduledUserScan>>,
): Promise<void> {
  const now = new Date();
  const nextScanTime = result.success
    ? result.nextScanTime
    : (result.nextScanTime && new Date(result.nextScanTime).getTime() > now.getTime() ? result.nextScanTime : retryTime());
  const patch = {
    is_scanning: false,
    scan_started_at: null,
    status: result.success ? 'completed' : 'error',
    last_scan_time: now.toISOString(),
    next_scan_time: nextScanTime,
    last_successful_jobs_count: result.success
      ? result.jobsDiscovered
      : (schedule.last_successful_jobs_count || 0),
    source_failures_count: typeof result.sourceFailuresCount === 'number' ? result.sourceFailuresCount : (schedule.source_failures_count || 0),
    updated_at: now.toISOString(),
  };
  const { error } = await supabaseClient.from('scan_schedules').update(patch).eq('user_id', schedule.user_id);
  if (error) throw new Error(`Could not persist scan schedule result: ${error.message}`);
}

async function processQueuedManualScans(supabaseClient: any): Promise<number> {
  let processed = 0;
  // Requeue only abandoned manual runs. This recovers jobs after a backend process restart
  // instead of leaving them in 'running' forever. The schedule lock is also independently stale-checked.
  const abandonedCutoff = staleLockCutoff();
  const { error: recoverError } = await supabaseClient.from('scan_runs')
    .update({ status: 'queued', started_at: null, updated_at: new Date().toISOString(), error_message: 'Requeued after an interrupted worker run.' })
    .eq('status', 'running')
    .lt('started_at', abandonedCutoff);
  if (recoverError) console.warn('Could not recover stale manual scan runs:', recoverError.message);

  const { data: queued, error: queueError } = await supabaseClient
    .from('scan_runs')
    .select('id,user_id,created_at')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(5);
  if (queueError) {
    // A missing migration must be visible; do not silently simulate a completed scan.
    console.warn('Manual scan queue unavailable. Apply the scan_runs migration before deploying:', queueError.message);
    return 0;
  }

  for (const run of queued || []) {
    const nowIso = new Date().toISOString();
    const { data: claimedRun, error: claimRunError } = await supabaseClient
      .from('scan_runs')
      .update({ status: 'running', started_at: nowIso, updated_at: nowIso })
      .eq('id', run.id)
      .eq('status', 'queued')
      .select('id,user_id')
      .maybeSingle();
    if (claimRunError || !claimedRun) continue;

    let schedule: any = null;
    try {
      const { data, error } = await supabaseClient
        .from('scan_schedules')
        .select('user_id,enabled,frequency_type,frequency_value,timezone,last_scan_time,next_scan_time,last_successful_jobs_count,source_failures_count,is_scanning,scan_started_at')
        .eq('user_id', run.user_id)
        .maybeSingle();
      if (error) throw error;
      schedule = data;
      if (!schedule) {
        const { data: created, error: createError } = await supabaseClient
          .from('scan_schedules')
          .upsert({
            user_id: run.user_id,
            enabled: false,
            frequency_type: 'hourly',
            frequency_value: 4,
            next_scan_time: calculateNextScanTime('hourly', 4).toISOString(),
            is_scanning: false,
            status: 'idle',
          }, { onConflict: 'user_id' })
          .select('user_id,enabled,frequency_type,frequency_value,timezone,last_scan_time,next_scan_time,last_successful_jobs_count,source_failures_count,is_scanning,scan_started_at')
          .maybeSingle();
        if (createError) throw createError;
        schedule = created;
      }

      const claimedSchedule = await claimSchedule(supabaseClient, run.user_id);
      if (!claimedSchedule) {
        // Another scheduled/manual run owns the lock. Return this queue item to the queue for a later poll.
        await supabaseClient.from('scan_runs').update({ status: 'queued', started_at: null, updated_at: new Date().toISOString() }).eq('id', run.id);
        continue;
      }
      schedule = claimedSchedule;

      const resume = await getPersistedResume(run.user_id, supabaseClient);
      const config: UserScanConfig = {
        userId: run.user_id,
        enabled: Boolean(schedule.enabled),
        frequencyType: schedule.frequency_type === 'daily' ? 'daily' : 'hourly',
        frequencyValue: Number(schedule.frequency_value || 4),
        timezone: schedule.timezone || 'UTC',
        lastScanTime: schedule.last_scan_time || new Date(0).toISOString(),
        nextScanTime: schedule.next_scan_time || nowIso,
        resumeText: resume?.text || '',
        scanKind: 'manual',
      };
      const result = await executeScheduledUserScan(config, supabaseClient);
      await releaseSchedule(supabaseClient, schedule, result);
      const finalStatus = result.success ? 'completed' : 'failed';
      const { error: resultSaveError } = await supabaseClient.from('scan_runs').update({
        status: finalStatus,
        result,
        error_message: result.success ? null : (result.error || 'Scan failed.'),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', run.id).eq('user_id', run.user_id);
      if (resultSaveError) console.error('Could not persist manual scan result:', resultSaveError.message);
      processed++;
    } catch (error: any) {
      console.error(`Manual scan run failed for ${run.user_id}:`, error?.message || error);
      if (schedule?.user_id) {
        await supabaseClient.from('scan_schedules').update({
          is_scanning: false,
          scan_started_at: null,
          status: 'error',
          next_scan_time: retryTime(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', run.user_id);
      }
      await supabaseClient.from('scan_runs').update({
        status: 'failed',
        error_message: String(error?.message || 'Scan failed.').slice(0, 1000),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', run.id).eq('user_id', run.user_id);
      processed++;
    }
  }
  return processed;
}

/** Execute due scans and queued manual runs using durable per-user Supabase records only. */
export async function processDueScans(
  _getState?: () => SchedulerState,
  _updateState?: (patch: Partial<SchedulerState>) => void,
  supabaseClient?: any,
): Promise<{ processedUsersCount: number }> {
  if (!supabaseClient) {
    if (process.env.NODE_ENV === 'production') console.error('Scheduler worker disabled: Supabase backend is not configured.');
    return { processedUsersCount: 0 };
  }

  let processedUsersCount = 0;
  const nowIso = new Date().toISOString();
  const cutoff = staleLockCutoff();
  try {
    const { data: dueSchedules, error } = await supabaseClient
      .from('scan_schedules')
      .select('user_id,enabled,frequency_type,frequency_value,timezone,last_scan_time,next_scan_time,last_successful_jobs_count,source_failures_count,is_scanning,scan_started_at')
      .eq('enabled', true)
      .lte('next_scan_time', nowIso)
      .or(`is_scanning.eq.false,scan_started_at.is.null,scan_started_at.lt.${cutoff}`);
    if (error) throw error;

    for (const candidate of dueSchedules || []) {
      const schedule = await claimSchedule(supabaseClient, candidate.user_id);
      if (!schedule) continue;
      try {
        const resume = await getPersistedResume(schedule.user_id, supabaseClient);
        const config: UserScanConfig = {
          userId: schedule.user_id,
          enabled: true,
          frequencyType: schedule.frequency_type === 'daily' ? 'daily' : 'hourly',
          frequencyValue: Number(schedule.frequency_value || 4),
          timezone: schedule.timezone || 'UTC',
          lastScanTime: schedule.last_scan_time || nowIso,
          nextScanTime: schedule.next_scan_time || nowIso,
          resumeText: resume?.text || '',
          scanKind: 'scheduled',
        };
        const result = await executeScheduledUserScan(config, supabaseClient);
        await releaseSchedule(supabaseClient, schedule, result);
        processedUsersCount++;
      } catch (error: any) {
        console.error(`Scheduled scan failed for user ${schedule.user_id}:`, error?.message || error);
        await supabaseClient.from('scan_schedules').update({
          is_scanning: false,
          scan_started_at: null,
          status: 'error',
          next_scan_time: retryTime(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', schedule.user_id);
      }
    }
  } catch (error: any) {
    console.error('Database scheduler worker poll failed:', error?.message || error);
  }

  try {
    processedUsersCount += await processQueuedManualScans(supabaseClient);
  } catch (error) {
    console.error('Manual scan queue processing failed:', error);
  }

  return { processedUsersCount };
}

export function initSchedulerWorker(
  getState?: () => SchedulerState,
  updateState?: (patch: Partial<SchedulerState>) => void,
  intervalMs: number = 30000,
  supabaseClient?: any,
) {
  if (workerInterval) clearInterval(workerInterval);
  workerInterval = null;
  if (!supabaseClient) {
    if (process.env.NODE_ENV === 'production') console.error('Scheduler worker not started because Supabase is not configured.');
    return () => {};
  }

  const tick = () => {
    processDueScans(getState, updateState, supabaseClient).catch((error) => {
      console.error('Scheduler worker tick failed:', error);
    });
  };
  const initialTimer = setTimeout(tick, 5000);
  workerInterval = setInterval(tick, Math.max(5000, intervalMs));

  return () => {
    clearTimeout(initialTimer);
    if (workerInterval) clearInterval(workerInterval);
    workerInterval = null;
  };
}
