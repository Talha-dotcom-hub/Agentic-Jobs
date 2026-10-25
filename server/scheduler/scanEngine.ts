import { searchAllSources } from '../sources/sourceManager.js';
import { sendPushNotificationToUser } from '../push/webPushService.js';
import { getPersistedResume } from '../resume/resumeManager.js';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini client for background matching
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface UserScanConfig {
  userId: string;
  enabled: boolean;
  frequencyType: 'hourly' | 'daily';
  frequencyValue: number; // 1-24 for hours, 1-5 for days
  timezone: string;
  lastScanTime: string;
  nextScanTime: string;
  resumeText?: string;
  isScanning?: boolean;
}

export interface ScanHistoryRecord {
  id: string;
  userId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'completed' | 'failed' | 'rate_limited';
  jobsDiscovered: number;
  newJobsFound: number;
  highMatchJobsCount: number;
  sourcesSummary: string;
  errorDetails?: string;
}

// In-memory scan locks & history store
const activeLocks = new Set<string>();
const scanHistoryStore: ScanHistoryRecord[] = [];

export function calculateNextScanTime(
  frequencyType: 'hourly' | 'daily',
  frequencyValue: number,
  fromTime: Date = new Date()
): Date {
  const next = new Date(fromTime.getTime());
  if (frequencyType === 'hourly') {
    const hours = Math.max(2, Math.min(24, frequencyValue));
    next.setTime(next.getTime() + hours * 3600000);
  } else {
    const days = Math.max(1, Math.min(5, frequencyValue));
    next.setDate(next.getDate() + days);
  }
  return next;
}

export async function executeScheduledUserScan(
  config: UserScanConfig,
  supabaseClient?: any
): Promise<{
  success: boolean;
  jobsDiscovered: number;
  newJobsFound: number;
  highMatchJobsCount: number;
  nextScanTime: string;
  error?: string;
}> {
  const startTime = Date.now();

  // Atomic Lock Check
  if (activeLocks.has(config.userId)) {
    return {
      success: false,
      jobsDiscovered: 0,
      newJobsFound: 0,
      highMatchJobsCount: 0,
      nextScanTime: config.nextScanTime,
      error: 'Concurrent scan already in progress for this user.',
    };
  }

  activeLocks.add(config.userId);

  try {
    // Shared Multi-Source Search Execution
    const searchResult = await searchAllSources({
      keywords: 'Software Developer Engineer',
      limit: 10,
    });

    const discoveredJobs = searchResult.jobs;
    let highMatchesCount = 0;

    let resumeText = config.resumeText;
    if (!resumeText) {
      try {
        const persisted = await getPersistedResume(config.userId, supabaseClient);
        resumeText = persisted.text;
      } catch (e) {
        // resume fallback handled gracefully
      }
    }

    // Filter and match new jobs
    if (resumeText && process.env.GEMINI_API_KEY) {
      for (const job of discoveredJobs.slice(0, 3)) {
        try {
          const prompt = `Evaluate candidate match (0-100 score).
JOB: ${job.title} at ${job.company}
RESUME: ${resumeText.slice(0, 1000)}`;

          const aiRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                },
                required: ['score'],
              },
            },
          });

          const parsed = JSON.parse(aiRes.text || '{}');
          if (parsed.score >= 85) {
            highMatchesCount++;

            // Dispatch Web Push Notification for High Match
            await sendPushNotificationToUser(
              config.userId,
              {
                title: `🎯 High Match Opportunity Found: ${parsed.score}%`,
                message: `${job.title} at ${job.company} matches your resume competencies.`,
                data: {
                  category: 'match',
                  jobId: job.id,
                },
              },
              supabaseClient
            );
          }
        } catch (e) {
          // Continue loop if single evaluation fails
        }
      }
    }

    // Dispatch required push notification upon scan completion
    try {
      await sendPushNotificationToUser(
        config.userId,
        {
          title: 'Scheduled Scan completed, Click To View Results',
          message: 'Scheduled Scan completed, Click To View Results',
          data: {
            url: '/?view=recommended',
            category: 'scan',
          },
        },
        supabaseClient
      );
    } catch (pushErr) {
      console.warn('Scheduled scan push dispatch warning:', pushErr);
    }

    const nextRun = calculateNextScanTime(
      config.frequencyType,
      config.frequencyValue,
      new Date()
    ).toISOString();

    const record: ScanHistoryRecord = {
      id: `scan-${Date.now()}`,
      userId: config.userId,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'completed',
      jobsDiscovered: discoveredJobs.length,
      newJobsFound: Math.min(discoveredJobs.length, 3),
      highMatchJobsCount: highMatchesCount,
      sourcesSummary: searchResult.sourceStatuses.map((s) => `${s.displayName}: ${s.jobs.length}`).join(' · '),
    };

    // Log to in-memory store
    scanHistoryStore.unshift(record);

    // Persist to Supabase if available
    if (supabaseClient) {
      try {
        await supabaseClient.from('scan_history').insert({
          user_id: config.userId,
          started_at: record.startedAt,
          completed_at: record.completedAt,
          duration_ms: record.durationMs,
          status: record.status,
          jobs_discovered: record.jobsDiscovered,
          new_jobs_found: record.newJobsFound,
          high_match_jobs_count: record.highMatchJobsCount,
          sources_summary: record.sourcesSummary,
        });
      } catch (dbErr: any) {
        console.warn('Failed to insert scan_history to Supabase:', dbErr.message);
      }
    }

    return {
      success: true,
      jobsDiscovered: discoveredJobs.length,
      newJobsFound: Math.min(discoveredJobs.length, 3),
      highMatchJobsCount: highMatchesCount,
      nextScanTime: nextRun,
    };
  } catch (err: any) {
    return {
      success: false,
      jobsDiscovered: 0,
      newJobsFound: 0,
      highMatchJobsCount: 0,
      nextScanTime: config.nextScanTime,
      error: err.message || 'Scheduled scan execution error',
    };
  } finally {
    activeLocks.delete(config.userId);
  }
}

export async function getUserScanHistory(userId: string, supabaseClient?: any): Promise<ScanHistoryRecord[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          startedAt: d.started_at,
          completedAt: d.completed_at,
          durationMs: d.duration_ms,
          status: d.status,
          jobsDiscovered: d.jobs_discovered,
          newJobsFound: d.new_jobs_found,
          highMatchJobsCount: d.high_match_jobs_count,
          sourcesSummary: d.sources_summary,
          errorDetails: d.error_details,
        }));
      }
    } catch (err) {
      console.warn('Supabase scan_history lookup error, falling back:', err);
    }
  }

  return scanHistoryStore.filter((s) => s.userId === userId);
}
