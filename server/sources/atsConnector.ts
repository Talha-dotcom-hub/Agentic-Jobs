import { createHash } from 'node:crypto';
import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { isSafeExternalUrl } from '../security/urlValidator.js';

function readSlugs(value: string | undefined): string[] {
  return [...new Set((value || '').split(',').map((item) => item.trim()).filter((item) => /^[a-z0-9][a-z0-9-]{0,79}$/i.test(item)))].slice(0, 20);
}
function textOnly(value: unknown, max = 6000): string {
  return typeof value === 'string' ? value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}
function stableId(prefix: string, url: string, title: string, company: string): string {
  return `${prefix}-${createHash('sha256').update(`${url}|${title}|${company}`).digest('hex').slice(0, 24)}`;
}
function keywordMatch(params: SourceSearchParams, text: string): boolean {
  const terms = (params.keywords || '').toLowerCase().split(/[\s,|]+/).map((term) => term.trim()).filter((term) => term.length >= 3);
  if (!terms.length) return false;
  const haystack = text.toLowerCase();
  return terms.filter((term) => haystack.includes(term)).length >= Math.min(2, terms.length);
}

export const atsConnector: SourceConnector = {
  sourceId: 'employer-ats',
  displayName: 'Configured Greenhouse & Lever Employer Boards',
  apiKeyEnvVar: 'ATS_GREENHOUSE_BOARDS / ATS_LEVER_COMPANIES',
  isConfigured(): boolean { return readSlugs(process.env.ATS_GREENHOUSE_BOARDS).length > 0 || readSlugs(process.env.ATS_LEVER_COMPANIES).length > 0; },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const greenhouse = readSlugs(process.env.ATS_GREENHOUSE_BOARDS);
    const lever = readSlugs(process.env.ATS_LEVER_COMPANIES);
    if (!greenhouse.length && !lever.length) {
      return { sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: false, success: false, jobs: [], error: 'No ATS boards configured. Set ATS_GREENHOUSE_BOARDS and/or ATS_LEVER_COMPANIES to enable this source.', durationMs: Date.now() - startTime };
    }
    const jobs: NormalizedJob[] = [];
    const errors: string[] = [];
    const sources: Array<{ kind: 'greenhouse' | 'lever'; slug: string }> = [
      ...greenhouse.map((slug) => ({ kind: 'greenhouse' as const, slug })),
      ...lever.map((slug) => ({ kind: 'lever' as const, slug })),
    ];
    const queryLimit = Math.max(1, Math.min(params.limit || 10, 25));

    await Promise.all(sources.map(async ({ kind, slug }) => {
      const url = kind === 'greenhouse'
        ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`
        : `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
      if (!isSafeExternalUrl(url)) { errors.push(`${kind}:${slug} failed URL validation`); return; }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = kind === 'greenhouse' ? (Array.isArray(data?.jobs) ? data.jobs : []) : (Array.isArray(data) ? data : []);
        for (const item of items) {
          const title = kind === 'greenhouse' ? item.title : item.text;
          const company = (typeof item.company_name === 'string' && item.company_name.trim()) || slug.replace(/[-_]+/g, ' ');
          const rawUrl = kind === 'greenhouse' ? item.absolute_url : item.hostedUrl;
          if (typeof title !== 'string' || !title.trim() || typeof rawUrl !== 'string') continue;
          let original: URL;
          try { original = new URL(rawUrl); } catch { continue; }
          if (original.protocol !== 'https:') continue;
          const description = kind === 'greenhouse' ? textOnly(item.content) : textOnly(item.descriptionPlain || item.description);
          const titleAndBody = `${title} ${description}`;
          if (!keywordMatch(params, titleAndBody)) continue;
          const location = kind === 'greenhouse'
            ? (typeof item.location?.name === 'string' ? item.location.name : 'Not specified')
            : (typeof item.categories?.location === 'string' ? item.categories.location : 'Not specified');
          const stableKey = `${original.href}|${title}|${company}`;
          jobs.push({
            id: stableId(kind, original.href, title, company),
            source: kind === 'greenhouse' ? 'Greenhouse ATS' : 'Lever ATS', title: title.trim(), company,
            location, workplaceType: /remote/i.test(location) ? 'Remote' : /hybrid/i.test(location) ? 'Hybrid' : 'Not specified',
            type: 'Not specified', experienceLevel: 'Not specified', originalUrl: original.href, description,
            skillsRequired: [], postedDate: typeof item.updated_at === 'string' ? item.updated_at : (typeof item.createdAt === 'number' ? new Date(item.createdAt).toISOString() : ''),
            firstSeen: new Date().toISOString(), verified: true,
          });
        }
      } catch (error: any) {
        errors.push(`${kind}:${slug}: ${error?.name === 'AbortError' ? 'request timed out' : String(error?.message || 'request failed')}`);
      } finally { clearTimeout(timeoutId); }
    }));

    const deduplicated = [...new Map(jobs.map((job) => [job.originalUrl, job])).values()].slice(0, queryLimit);
    return { sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
      isConfigured: true, success: jobs.length > 0 || errors.length === 0, jobs: deduplicated,
      error: errors.length ? errors.join('; ').slice(0, 1200) : undefined, durationMs: Date.now() - startTime };
  },
};
