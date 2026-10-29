import { Job, MatchResult, ScanHistoryEntry, ScanSchedule, Resume, SourceHealth } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Fallback silently if session lookup fails
    }
  }
  return headers;
}

export interface GeminiKeyStatus {
  configured: boolean;
  keyHint?: string | null;
  updatedAt?: string | null;
}
export async function getGeminiKeyStatus(): Promise<GeminiKeyStatus> {
  const res = await fetch('/api/settings/gemini-key', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gemini key status failed (${res.status}).`);
  return body as GeminiKeyStatus;
}
export async function saveGeminiApiKey(apiKey: string): Promise<GeminiKeyStatus> {
  const res = await fetch('/api/settings/gemini-key', {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ apiKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gemini key save failed (${res.status}).`);
  return body as GeminiKeyStatus;
}
export async function deleteGeminiApiKey(): Promise<void> {
  const res = await fetch('/api/settings/gemini-key', { method: 'DELETE', headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gemini key deletion failed (${res.status}).`);
}
export async function fetchRecommendedJobsApi(): Promise<Job[]> {
  const res = await fetch('/api/jobs/recommended', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to fetch recommendations (${res.status}).`);
  if (!Array.isArray(body)) throw new Error('The backend returned an invalid recommendations response.');
  return body as Job[];
}
export async function fetchHealthStatus() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch health status');
    return await res.json();
  } catch (err) {
    console.warn('Backend health check warning:', err);
    return { status: 'offline', geminiConfigured: false, apifyConfigured: false, rapidapiConfigured: false };
  }
}

export async function matchResumeWithJob(
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  _resumeText?: string,
  jobId?: string
): Promise<MatchResult> {
  // The backend loads the canonical resume and job data from this authenticated user's records.
  const headers = await getAuthHeaders();
  const res = await fetch('/api/gemini/match', {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gemini matching failed (${res.status}).`);
  return body as MatchResult;
}

export interface DiscoveryScanResult {
  success: boolean;
  jobsDiscovered: number;
  newJobsFound: number;
  highMatchJobsCount: number;
  nextScanTime: string;
  aiScoringConfigured?: boolean;
  aiScoringExhausted?: boolean;
  aiScoringError?: string;
  scoredJobsCount?: number;
  message?: string;
  error?: string;
}

export async function triggerDiscoveryScan(): Promise<DiscoveryScanResult> {
  const headers = await getAuthHeaders();
  const startResponse = await fetch('/api/scan/trigger', { method: 'POST', headers });
  const startBody = await startResponse.json().catch(() => ({}));
  if (!startResponse.ok) throw new Error(startBody.error || `Live scan failed (${startResponse.status}).`);
  if (startBody.status === 'completed' && startBody.result) return startBody.result as DiscoveryScanResult;
  if (startBody.status === 'failed') throw new Error(startBody.error || 'The scan failed. Check scan history for details.');
  if (!startBody.runId) {
    // Backward compatibility while an older backend deployment is being replaced.
    if (typeof startBody.jobsDiscovered === 'number') return startBody as DiscoveryScanResult;
    throw new Error('The backend accepted no scan run ID. Check that the latest backend and scan_runs migration are deployed.');
  }

  const runId = String(startBody.runId);
  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusResponse = await fetch(`/api/scan/runs/${encodeURIComponent(runId)}`, { headers: await getAuthHeaders() });
    const statusBody = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) throw new Error(statusBody.error || `Scan status check failed (${statusResponse.status}).`);
    if (statusBody.status === 'completed' && statusBody.result) return statusBody.result as DiscoveryScanResult;
    if (statusBody.status === 'failed') throw new Error(statusBody.error || statusBody.result?.error || 'The scan failed. Check scan history for details.');
  }
  throw new Error('The scan is still queued or running in the background. Reopen scan results shortly; the worker continues independently of this page.');
}

export async function fetchScanSchedule(): Promise<ScanSchedule> {
  const res = await fetch('/api/schedule', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to fetch schedule (${res.status}).`);
  return body as ScanSchedule;
}

export async function fetchScanHistoryApi(): Promise<ScanHistoryEntry[]> {
  const res = await fetch('/api/scan/history', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to fetch scan history (${res.status}).`);
  if (!Array.isArray(body)) throw new Error('The backend returned an invalid scan-history response.');
  return body as ScanHistoryEntry[];
}

export async function updateScanSchedule(schedule: Partial<ScanSchedule>): Promise<ScanSchedule> {
  const res = await fetch('/api/schedule', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(schedule),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to update schedule (${res.status}).`);
  return body as ScanSchedule;
}

export async function addCustomJobApi(jobData: Partial<Job>): Promise<Job> {
  const res = await fetch('/api/jobs/add', {
    method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(jobData),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to add job (${res.status}).`);
  return body as Job;
}

export async function fetchDiscoveredJobsApi(): Promise<Job[]> {
  const res = await fetch('/api/jobs/discovered', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to load discovered jobs (${res.status}).`);
  if (!Array.isArray(body)) throw new Error('The backend returned an invalid discovered-jobs response.');
  return body as Job[];
}

export async function fetchSavedJobsApi(): Promise<Job[]> {
  const res = await fetch('/api/jobs/saved', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to load saved jobs (${res.status}).`);
  if (!Array.isArray(body)) throw new Error('The backend returned an invalid saved-jobs response.');
  return body as Job[];
}

export async function saveJobApi(job: Job): Promise<void> {
  const res = await fetch('/api/jobs/saved', {
    method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ job }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Could not save job (${res.status}).`);
}

export async function removeSavedJobApi(jobId: string): Promise<void> {
  const res = await fetch(`/api/jobs/saved/${encodeURIComponent(jobId)}`, {
    method: 'DELETE', headers: await getAuthHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Could not remove saved job (${res.status}).`);
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH', headers: await getAuthHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Could not update notification (${res.status}).`);
}

export async function clearNotificationsApi(): Promise<void> {
  const res = await fetch('/api/notifications', { method: 'DELETE', headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Could not clear notifications (${res.status}).`);
}

export async function fetchResumeApi(_userId?: string): Promise<Resume | null> {
  const res = await fetch('/api/resume', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to fetch resume (${res.status}).`);
  if (!body) return null;
  return {
    text: body.text || body.content_text || '',
    name: body.name || body.file_name || 'Resume',
    lastUpdated: body.lastUpdated || body.updated_at || '',
    extractedSkills: Array.isArray(body.extractedSkills) ? body.extractedSkills : Array.isArray(body.extracted_skills) ? body.extracted_skills : [],
    parsedRole: body.parsedRole || body.profile?.headline || '',
    profile: body.profile || body.structured_profile || undefined,
    extractionStatus: body.extractionStatus || body.extraction_status || 'completed',
    profileVersion: body.profileVersion || body.profile_version || 1,
  };
}

export async function saveResumeApi(resumeText: string, name?: string, _userId?: string): Promise<Resume> {
  const res = await fetch('/api/resume', {
    method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ text: resumeText, name }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to save resume (${res.status}).`);
  return {
    text: body.text || resumeText,
    name: body.name || name || 'Resume',
    lastUpdated: body.lastUpdated || new Date().toISOString(),
    extractedSkills: Array.isArray(body.extractedSkills) ? body.extractedSkills : [],
    parsedRole: body.parsedRole || body.profile?.headline || '',
    profile: body.profile || undefined,
    extractionStatus: body.extractionStatus || 'completed',
    profileVersion: body.profileVersion || 1,
  };
}

export async function extractResumeProfileApi(resumeText?: string, name?: string, _userId?: string) {
  const res = await fetch('/api/resume/extract', {
    method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({ text: resumeText, name }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Resume profile extraction failed (${res.status}).`);
  return body;
}

export async function deleteResumeApi(_userId?: string): Promise<boolean> {
  const res = await fetch('/api/resume', {
    method: 'DELETE', headers: await getAuthHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed to delete resume (${res.status}).`);
  return Boolean(body.success);
}

export async function deleteAccountApi(): Promise<void> {
  const res = await fetch('/api/user/account', { method: 'DELETE', headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success !== true) throw new Error(body.error || `Account deletion failed (${res.status}).`);
}


export async function fetchSourcesApi(): Promise<SourceHealth[]> {
  const res = await fetch('/api/sources', { headers: await getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(body)) throw new Error('Could not load source connector configuration.');
  return body.map((source: any): SourceHealth => ({
    id: String(source.sourceId || source.displayName || 'unknown'),
    name: String(source.displayName || source.sourceId || 'Unknown source'),
    type: source.sourceId === 'apify-linkedin' ? 'Apify LinkedIn Actor'
      : source.sourceId === 'rapidapi-linkedin' ? 'RapidAPI LinkedIn'
      : source.sourceId === 'public-feeds' ? 'Public RSS/ATS' : 'Direct Employer ATS',
    status: source.apiKeyEnvVar === 'NONE' ? 'Available'
      : source.isConfigured ? 'Configured (not health-tested)' : 'Credentials Required',
    lastCheckTime: 'Not live-tested',
    jobsIndexedCount: 0,
    allowedRefreshInterval: 'Source-dependent',
    requiresApiKey: source.apiKeyEnvVar !== 'NONE',
    apiKeyName: source.apiKeyEnvVar === 'NONE' ? undefined : source.apiKeyEnvVar,
  }));
}
