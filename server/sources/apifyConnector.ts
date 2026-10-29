import { createHash } from 'node:crypto';
import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { isSafeExternalUrl } from '../security/urlValidator.js';
import { fetchWithRetry } from './http.js';

const DEFAULT_ACTOR_ID = 'valig/linkedin-jobs-scraper';
const APIFY_API = 'https://api.apify.com/v2';
const ACTOR_MAX_WAIT_MS = 75_000;

function getApifyToken(): string | undefined {
  return process.env.APIFY_API_TOKEN?.trim() || process.env.APIFY_KEY?.trim() || undefined;
}

function actorIdForPath(value: string): string | null {
  const normalized = value.trim().replace('/', '~');
  return /^[A-Za-z0-9._~-]+$/.test(normalized) ? encodeURIComponent(normalized) : null;
}

function mapApifyJob(item: any): NormalizedJob | null {
  if (!item || typeof item !== 'object') return null;
  const titleValue = item.title || item.jobTitle;
  const companyValue = item.companyName || item.company?.name || item.company;
  const urlValue = item.url || item.applyUrl || item.jobUrl || item.link;
  const title = typeof titleValue === 'string' ? titleValue.trim() : '';
  const company = typeof companyValue === 'string' ? companyValue.trim() : '';
  if (!title || !company || typeof urlValue !== 'string') return null;

  let url: URL;
  try { url = new URL(urlValue); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || !isSafeExternalUrl(url.href)) return null;

  const location = typeof item.location === 'string' ? item.location : 'Not specified';
  return {
    id: `apify-${createHash('sha256').update(`${url.href}|${title}|${company}`).digest('hex').slice(0, 24)}`,
    source: 'Apify LinkedIn Actor',
    title,
    company,
    location,
    workplaceType: /remote/i.test(item.workType || location) ? 'Remote'
      : /hybrid/i.test(item.workType || location) ? 'Hybrid'
        : /on.?site/i.test(item.workType || location) ? 'On-site' : 'Not specified',
    type: ['Full-time', 'Contract', 'Part-time', 'Internship'].includes(item.contractType) ? item.contractType : 'Not specified',
    experienceLevel: ['Internship', 'Entry-Level', 'Mid-Senior', 'Director', 'Executive'].includes(item.experienceLevel) ? item.experienceLevel : 'Not specified',
    salary: typeof item.salary === 'string' ? item.salary.slice(0, 120) : undefined,
    originalUrl: url.href,
    description: typeof item.description === 'string' ? item.description.slice(0, 5000)
      : typeof item.descriptionText === 'string' ? item.descriptionText.slice(0, 5000) : '',
    skillsRequired: Array.isArray(item.skillsRequired)
      ? item.skillsRequired.filter((value: unknown): value is string => typeof value === 'string').slice(0, 20)
      : [],
    postedDate: typeof item.postedDate === 'string' ? item.postedDate : typeof item.postedAt === 'string' ? item.postedAt : '',
    firstSeen: new Date().toISOString(),
    verified: false,
  };
}

async function readJson(response: Response, description: string): Promise<any> {
  try { return await response.json(); }
  catch { throw new Error(`${description} returned invalid JSON.`); }
}

function responseData(value: any): any {
  return value && typeof value === 'object' && value.data && typeof value.data === 'object'
    ? value.data
    : value;
}

export const apifyConnector: SourceConnector = {
  sourceId: 'apify-linkedin',
  displayName: 'Apify LinkedIn Jobs Actor',
  apiKeyEnvVar: 'APIFY_API_TOKEN',

  isConfigured(): boolean {
    return Boolean(
      getApifyToken() &&
      actorIdForPath(process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID),
    );
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const token = getApifyToken();
    const actorId = actorIdForPath(process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID);
    if (!token || !actorId) {
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: false, success: false, jobs: [],
        error: !token ? 'APIFY_API_TOKEN (or APIFY_KEY) is not configured in server environment variables.'
          : 'APIFY_ACTOR_ID contains unsupported characters; use an Apify actor ID or username/name.',
        durationMs: Date.now() - startTime,
      };
    }

    const keywords = (params.keywords || '').trim().slice(0, 200);
    if (!keywords) {
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: false, jobs: [],
        error: 'Search keywords are required for Apify job discovery.',
        durationMs: Date.now() - startTime,
      };
    }
    const limit = Math.max(1, Math.min(Math.floor(params.limit || 10), 100));
    const input: Record<string, unknown> = { keywords, limit };
    if (params.location?.trim()) input.location = params.location.trim().slice(0, 160);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

    try {
      const startResponse = await fetchWithRetry(`${APIFY_API}/acts/${actorId}/runs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      }, { timeoutMs: 12000, retries: 0 });
      if (startResponse.status === 429 || startResponse.status === 402) {
        return {
          sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
          isConfigured: true, success: false, jobs: [], rateLimited: true,
          error: 'Apify rejected the actor start because of rate limits or account quota.',
          durationMs: Date.now() - startTime,
        };
      }
      if (!startResponse.ok) throw new Error(`Apify actor start returned HTTP ${startResponse.status}.`);
      const started = responseData(await readJson(startResponse, 'Apify actor start'));
      const runId = typeof started?.id === 'string' ? started.id : '';
      if (!runId || !/^[A-Za-z0-9_-]+$/.test(runId)) throw new Error('Apify did not return a valid actor run ID.');

      const deadline = Date.now() + ACTOR_MAX_WAIT_MS;
      let run = started;
      while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(String(run.status || '')) && Date.now() < deadline) {
        const statusResponse = await fetchWithRetry(
          `${APIFY_API}/actor-runs/${encodeURIComponent(runId)}?waitForFinish=15`,
          { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
          { timeoutMs: 20000, retries: 2 },
        );
        if (!statusResponse.ok) throw new Error(`Apify run status returned HTTP ${statusResponse.status}.`);
        run = responseData(await readJson(statusResponse, 'Apify run status'));
      }
      if (run.status !== 'SUCCEEDED') {
        const message = Date.now() >= deadline
          ? 'Apify actor did not finish within the 75 second scan budget; no partial jobs were accepted.'
          : `Apify actor run ended with status ${String(run.status || 'unknown')}.`;
        return {
          sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
          isConfigured: true, success: false, jobs: [], error: message,
          durationMs: Date.now() - startTime,
        };
      }

      const datasetId = typeof run.defaultDatasetId === 'string' ? run.defaultDatasetId : '';
      if (!datasetId || !/^[A-Za-z0-9_-]+$/.test(datasetId)) throw new Error('Apify run did not return a valid default dataset ID.');
      const items: any[] = [];
      const pageSize = 25;
      const maxItems = Math.min(100, Math.max(limit, 10));
      for (let offset = 0; offset < maxItems; offset += pageSize) {
        const itemUrl = new URL(`${APIFY_API}/datasets/${encodeURIComponent(datasetId)}/items`);
        itemUrl.searchParams.set('format', 'json');
        itemUrl.searchParams.set('clean', 'true');
        itemUrl.searchParams.set('offset', String(offset));
        itemUrl.searchParams.set('limit', String(Math.min(pageSize, maxItems - offset)));
        const itemsResponse = await fetchWithRetry(itemUrl.toString(), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }, { timeoutMs: 12000, retries: 2 });
        if (!itemsResponse.ok) throw new Error(`Apify dataset retrieval returned HTTP ${itemsResponse.status}.`);
        const page = await readJson(itemsResponse, 'Apify dataset retrieval');
        if (!Array.isArray(page)) throw new Error('Apify dataset response was not a JSON array.');
        items.push(...page);
        if (page.length < pageSize) break;
      }

      const jobs = items.map(mapApifyJob).filter((job: NormalizedJob | null): job is NormalizedJob => job !== null);
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: true, jobs: jobs.slice(0, limit), durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const status = Number(error?.status || error?.statusCode);
      return {
        sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: false, jobs: [],
        rateLimited: status === 429 || status === 402,
        error: error?.name === 'AbortError' ? 'Apify request timed out.'
          : String(error?.message || 'Apify connection error').replace(/https?:\/\/[^\s)]+/gi, '[external service]'),
        durationMs: Date.now() - startTime,
      };
    }
  },
};
