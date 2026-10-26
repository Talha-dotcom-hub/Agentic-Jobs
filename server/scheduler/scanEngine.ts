import { searchAllSources } from '../sources/sourceManager.js';
import { sendPushNotificationToUser } from '../push/webPushService.js';
import { getPersistedResume } from '../resume/resumeManager.js';
import { Type } from '@google/genai';
import { createHash } from 'node:crypto';
import { generateWithGeminiFallback } from '../ai/geminiFallback.js';
import { getUserGeminiApiKey } from '../credentials/geminiCredentialVault.js';

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
  aiScoringConfigured?: boolean;
  aiScoringExhausted?: boolean;
  scoredJobsCount?: number;
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

        // User key takes priority; the backend operator key is an optional service fallback.
    let activeGeminiKey: string | null = process.env.GEMINI_API_KEY || null;
    try {
      const personalKey = await getUserGeminiApiKey(config.userId, supabaseClient);
      if (personalKey) activeGeminiKey = personalKey;
    } catch (credentialError: any) {
      console.warn('Per-user Gemini credential lookup warning:', credentialError?.message || credentialError);
    }

    const matchByUrl = new Map<string, { score: number; matchingEvidence: string[]; potentialSkillGaps: string[]; eligibilityWarnings: string[] }>();
    let quotaExhaustedForThisScan = false;
    if (resumeText && activeGeminiKey) {
      // Bounded AI calls prevent one scan from consuming an unbounded amount of quota.
      for (const job of discoveredJobs.slice(0, 10)) {
        const stableUrl = job.originalUrl || `${job.source}|${job.title}|${job.company}`;
        try {
          const prompt = `Estimate a 0-100 role-fit score from evidence only; this is not hiring probability. Never invent qualifications.
JOB: ${job.title} at ${job.company}
LOCATION: ${job.location}
DESCRIPTION: ${(job.description || '').slice(0, 1800)}
RESUME: ${resumeText.slice(0, 3000)}`;
          const { response: aiRes } = await generateWithGeminiFallback(activeGeminiKey, {
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  matchingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
                  potentialSkillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  eligibilityWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['score', 'matchingEvidence', 'potentialSkillGaps', 'eligibilityWarnings'],
              },
            },
          });
          const parsed = JSON.parse(aiRes.text || '{}');
          const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
          const evaluated = {
            score,
            matchingEvidence: Array.isArray(parsed.matchingEvidence) ? parsed.matchingEvidence : [],
            potentialSkillGaps: Array.isArray(parsed.potentialSkillGaps) ? parsed.potentialSkillGaps : [],
            eligibilityWarnings: Array.isArray(parsed.eligibilityWarnings) ? parsed.eligibilityWarnings : [],
          };
          matchByUrl.set(stableUrl, evaluated);
          if (score >= 85) {
            highMatchesCount++;
            await sendPushNotificationToUser(config.userId, {
              title: `ðŸŽ¯ High Match Opportunity Found: ${score}%`,
              message: `${job.title} at ${job.company} matches evidence in your resume.`,
              data: { category: 'match', jobId: job.id, url: job.originalUrl },
            }, supabaseClient);
          }
        } catch (error: any) {
          if (error?.name === 'GeminiFallbackExhaustedError') {
            quotaExhaustedForThisScan = true;
            console.warn('Gemini fallback chain exhausted; discovery will continue and this user can retry on the next schedule.');
            break;
          }
          console.warn(`AI match skipped for ${job.title}:`, error?.message || error);
        }
      }
    }

    // Store actual vacancies and scores durably. Null score means AI did not evaluate the listing;
    // the recommendations API intentionally does not present these as scored matches.
    let newlyFoundCount = discoveredJobs.length;
    if (supabaseClient && discoveredJobs.length > 0) {
      const nowIso = new Date().toISOString();
      const records = discoveredJobs.map((job) => {
        const stableUrl = job.originalUrl || `${job.source}|${job.title}|${job.company}`;
        const evaluated = matchByUrl.get(stableUrl);
        return {
          user_id: config.userId,
          job_key: createHash('sha256').update(stableUrl).digest('hex'),
          source: job.source,
          title: job.title,
          company: job.company,
          company_logo: job.companyLogo || null,
          location: job.location || 'Unspecified',
          workplace_type: job.workplaceType || null,
          employment_type: job.type || null,
          experience_level: job.experienceLevel || null,
          salary: job.salary || null,
          original_url: job.originalUrl || null,
          description: job.description || '',
          skills_required: Array.isArray(job.skillsRequired) ? job.skillsRequired : [],
          posted_date: job.postedDate || null,
          verified: Boolean(job.verified),
          is_stale: Boolean(job.isStale),
          match_score: evaluated?.score ?? null,
          matching_evidence: evaluated?.matchingEvidence || [],
          potential_skill_gaps: evaluated?.potentialSkillGaps || [],
          eligibility_warnings: evaluated?.eligibilityWarnings || [],
          last_seen_at: nowIso,
          updated_at: nowIso,
        };
      });
      const keys = records.map((record) => record.job_key);
      const { data: existingRows, error: existingError } = await supabaseClient
        .from('user_discovered_jobs').select('job_key').eq('user_id', config.userId).in('job_key', keys);
      if (!existingError) {
        const existingKeys = new Set((existingRows || []).map((row: any) => row.job_key));
        newlyFoundCount = records.filter((record) => !existingKeys.has(record.job_key)).length;
      }
      const { error: persistError } = await supabaseClient
        .from('user_discovered_jobs').upsert(records, { onConflict: 'user_id,job_key' });
      if (persistError) throw new Error(`Could not persist discovered jobs: ${persistError.message}`);
    }
    if (quotaExhaustedForThisScan) {
      console.warn(`AI scoring paused for user ${config.userId} after fallback exhaustion; job discovery results were retained without fabricated scores.`);
    }// Dispatch required push notification upon scan completion
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
      newJobsFound: newlyFoundCount,
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
      newJobsFound: newlyFoundCount,
      highMatchJobsCount: highMatchesCount,
      nextScanTime: nextRun,
      aiScoringConfigured: Boolean(activeGeminiKey),
      aiScoringExhausted: quotaExhaustedForThisScan,
      scoredJobsCount: matchByUrl.size,
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
