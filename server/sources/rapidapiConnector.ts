import { createHash } from 'node:crypto';
import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { isSafeExternalUrl } from '../security/urlValidator.js';
import { fetchWithRetry } from './http.js';

const DEFAULT_HOST = 'linkedin-data-api.p.rapidapi.com';

function getRapidApiKey(): string | undefined {
  return process.env.RAPIDAPI_KEY?.trim() || process.env.RAPID_API?.trim() || undefined;
}

function getRapidApiHost(): string {
  const host = (process.env.RAPIDAPI_HOST || DEFAULT_HOST).trim().toLowerCase();
  return /^[a-z0-9-]+\.p\.rapidapi\.com$/.test(host) ? host : '';
}

function getSearchPath(): string {
  const searchPath = (process.env.RAPIDAPI_SEARCH_PATH || '/search-jobs').trim();
  return /^\/[a-z0-9/_-]+$/i.test(searchPath) && !searchPath.includes('..') ? searchPath : '';
}

function mapRapidApiJob(item: any): NormalizedJob | null {
  if (!item || typeof item !== 'object') return null;
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const companyValue = item.company?.name || item.companyName || item.company;
  const company = typeof companyValue === 'string' ? companyValue.trim() : '';
  const rawUrl = item.url || item.link || item.jobUrl;
  if (!title || !company || typeof rawUrl !== 'string') return null;

  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || !isSafeExternalUrl(url.href)) return null;

  const location = typeof item.location === 'string' ? item.location : 'Not specified';
  return {
    id: `rapidapi-${createHash('sha256').update(`${url.href}|${title}|${company}`).digest('hex').slice(0, 24)}`,
    source: 'RapidAPI LinkedIn',
    title,
    company,
    location,
    workplaceType: /remote/i.test(location) ? 'Remote' : /hybrid/i.test(location) ? 'Hybrid' : 'Not specified',
    type: ['Full-time', 'Contract', 'Part-time', 'Internship'].includes(item.employmentType) ? item.employmentType : 'Not specified',
    experienceLevel: ['Internship', 'Entry-Level', 'Mid-Senior', 'Director', 'Executive'].includes(item.experienceLevel) ? item.experienceLevel : 'Not specified',
    salary: typeof item.salary === 'string' ? item.salary.slice(0, 120) : undefined,
    originalUrl: url.href,
    description: typeof item.description === 'string' ? item.description.slice(0, 5000) : '',
    skillsRequired: Array.isArray(item.skillsRequired)
      ? item.skillsRequired.filter((value: unknown): value is string => typeof value === 'string').slice(0, 20)
      : Array.isArray(item.skills)
        ? item.skills.filter((value: unknown): value is string => typeof value === 'string').slice(0, 20)
        : [],
    postedDate: typeof item.postedAt === 'string' ? item.postedAt : typeof item.date === 'string' ? item.date : '',
    firstSeen: new Date().toISOString(),
    verified: item.verified === true,
  };
}

export const rapidapiConnector: SourceConnector = {
  sourceId: 'rapidapi-linkedin',
  displayName: 'RapidAPI LinkedIn Data API',
  apiKeyEnvVar: 'RAPIDAPI_KEY',

  isConfigured(): boolean {
    return Boolean(getRapidApiKey() && getRapidApiHost() && getSearchPath());
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const apiKey = getRapidApiKey();
    const host = getRapidApiHost();
    const searchPath = getSearchPath();

    if (!apiKey || !host || !searchPath) {
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: false, success: false, jobs: [],
        error: !apiKey ? 'RAPIDAPI_KEY (or RAPID_API) is not configured in server environment variables.'
          : !host ? 'RAPIDAPI_HOST must be a hostname under .p.rapidapi.com.'
            : 'RAPIDAPI_SEARCH_PATH must be a relative API path without traversal segments.',
        durationMs: Date.now() - startTime,
      };
    }

    const page = Math.max(1, Math.floor(params.page || 1));
    const limit = Math.max(1, Math.min(Math.floor(params.limit || 10), 25));
    const url = new URL(searchPath, `https://${host}`);
    url.searchParams.set('keywords', (params.keywords || '').slice(0, 200));
    url.searchParams.set('start', String((page - 1) * limit));

    try {
      const response = await fetchWithRetry(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': host,
          Accept: 'application/json',
        },
      }, { timeoutMs: 8000, retries: 2 });

      if (response.status === 429) {
        return {
          sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
          isConfigured: true, success: false, jobs: [], rateLimited: true,
          error: 'RapidAPI rate limit exceeded for the configured LinkedIn Data API subscription.',
          durationMs: Date.now() - startTime,
        };
      }
      if (!response.ok) throw new Error(`RapidAPI host returned status ${response.status}`);

      const body = await response.json();
      const rawList = Array.isArray(body) ? body
        : Array.isArray(body?.data) ? body.data
          : Array.isArray(body?.items) ? body.items
            : Array.isArray(body?.jobs) ? body.jobs
              : Array.isArray(body?.data?.items) ? body.data.items
                : [];
      const jobs = rawList.map(mapRapidApiJob).filter((job: NormalizedJob | null): job is NormalizedJob => job !== null);
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: true, jobs: jobs.slice(0, limit), durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: false, jobs: [],
        error: error?.name === 'AbortError' ? 'RapidAPI request timed out (8s limit).'
          : String(error?.message || 'RapidAPI connection error').replace(/https?:\/\/[^\s)]+/gi, '[external service]'),
        durationMs: Date.now() - startTime,
      };
    }
  },
};
