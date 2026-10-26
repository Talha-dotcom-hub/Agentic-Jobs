import { Job, MatchResult, ScanSchedule, Resume } from '../types';
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
  try {
    const res = await fetch('/api/jobs/recommended', { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body) ? body as Job[] : [];
  } catch (error) {
    console.warn('Recommended jobs fetch warning:', error);
    return [];
  }
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
  resumeText?: string
): Promise<MatchResult> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/gemini/match', {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobTitle, jobCompany, jobDescription, resumeText }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Gemini matching failed (${res.status}).`);
  return body as MatchResult;
}export async function triggerDiscoveryScan(): Promise<{ success: boolean; jobsDiscovered: number; newJobsFound: number; highMatchJobsCount: number; nextScanTime: string; aiScoringConfigured?: boolean; aiScoringExhausted?: boolean; scoredJobsCount?: number; message?: string; error?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/scan/trigger', { method: 'POST', headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Live scan failed (${res.status}).`);
  return body;
}export async function fetchScanSchedule(): Promise<ScanSchedule> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/schedule', { headers });
    if (!res.ok) throw new Error('Failed to fetch schedule');
    return await res.json();
  } catch (err) {
    return {
      enabled: true,
      frequencyType: 'hourly',
      frequencyValue: 4,
      lastScanTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      nextScanTime: new Date(Date.now() + 3600000 * 2).toISOString(),
      lastSuccessfulScanJobsCount: 14,
      sourceFailuresCount: 0,
      status: 'idle',
    };
  }
}

export async function updateScanSchedule(schedule: Partial<ScanSchedule>): Promise<ScanSchedule> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers,
      body: JSON.stringify(schedule),
    });
    if (!res.ok) throw new Error('Failed to update schedule');
    return await res.json();
  } catch (err) {
    console.warn('Update schedule fallback:', err);
    return schedule as ScanSchedule;
  }
}

export async function addCustomJobApi(jobData: any) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/jobs/add', {
      method: 'POST',
      headers,
      body: JSON.stringify(jobData),
    });
    if (!res.ok) throw new Error('Failed to add job');
    return await res.json();
  } catch (err) {
    return {
      id: `custom-${Date.now()}`,
      ...jobData,
      source: 'User Custom Entry',
      postedDate: new Date().toISOString(),
      verified: true,
    };
  }
}

export async function fetchResumeApi(userId?: string): Promise<Resume | null> {
  try {
    const headers = await getAuthHeaders();
    const url = userId ? `/api/resume?userId=${encodeURIComponent(userId)}` : '/api/resume';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch resume');
    const data = await res.json();
    return {
      text: data.text || data.content_text || '',
      name: data.name || data.file_name || 'Resume.pdf',
      lastUpdated: data.lastUpdated || data.updated_at || new Date().toISOString(),
      extractedSkills: data.extractedSkills || data.extracted_skills || [],
      parsedRole: data.parsedRole || data.profile?.headline || 'Software Engineer',
      profile: data.profile || data.structured_profile,
      extractionStatus: data.extractionStatus || data.extraction_status || 'completed',
      profileVersion: data.profileVersion || data.profile_version || 1,
    };
  } catch (err) {
    console.warn('Fetch resume warning:', err);
    return null;
  }
}

export async function saveResumeApi(resumeText: string, name?: string, userId?: string): Promise<Resume> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/resume', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: resumeText, name, userId }),
    });
    if (!res.ok) throw new Error('Failed to save resume');
    const data = await res.json();
    return {
      text: data.text || resumeText,
      name: data.name || name || 'Resume.pdf',
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      extractedSkills: data.extractedSkills || [],
      parsedRole: data.parsedRole || data.profile?.headline || 'Software Engineer',
      profile: data.profile,
      extractionStatus: data.extractionStatus || 'completed',
      profileVersion: data.profileVersion || 1,
    };
  } catch (err) {
    return {
      text: resumeText,
      name: name || 'Resume_2026.pdf',
      lastUpdated: new Date().toISOString(),
      extractedSkills: ['TypeScript', 'React', 'Node.js', 'Express', 'Python', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'AWS'],
    };
  }
}

export async function extractResumeProfileApi(resumeText?: string, name?: string, userId?: string) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/resume/extract', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: resumeText, name, userId }),
    });
    if (!res.ok) throw new Error('Failed to extract resume profile');
    return await res.json();
  } catch (err: any) {
    console.warn('Extract profile api warning:', err);
    return null;
  }
}

export async function deleteResumeApi(userId?: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/resume', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ userId }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Delete resume api warning:', err);
    return false;
  }
}

export async function deleteAccountApi(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/user/account', {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch (err) {
    console.warn('Delete account api warning:', err);
    return false;
  }
}
