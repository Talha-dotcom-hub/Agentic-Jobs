import { createHash } from 'node:crypto';
import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';

export const publicFeedsConnector: SourceConnector = {
  sourceId: 'public-feeds',
  displayName: 'Public Developer Jobs Feed',
  apiKeyEnvVar: 'NONE',
  isConfigured(): boolean { return true; },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const keywordTerms = (params.keywords || '').toLowerCase().split(/[\s,|]+/).map((term) => term.trim()).filter((term) => term.length >= 3);
    const matchesKeywords = (value: string) => {
      if (!keywordTerms.length) return false;
      const haystack = value.toLowerCase();
      const matches = keywordTerms.filter((term) => haystack.includes(term)).length;
      return matches >= Math.min(2, keywordTerms.length);
    };

    if (!keywordTerms.length) {
      return { sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: false, jobs: [], error: 'Search keywords are required; provide a role or terms derived from the saved resume.', durationMs: Date.now() - startTime };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      // Fetch a bounded public job sample across categories, then match locally so candidate roles
      // outside software development are not excluded before resume-aware matching.
      const response = await fetch('https://remotive.com/api/remote-jobs?limit=100', { signal: controller.signal });
      if (!response.ok) throw new Error(`Public feed returned HTTP status ${response.status}`);
      const body = await response.json();
      const rawJobs = Array.isArray(body?.jobs) ? body.jobs : [];
      const normalizedJobs: NormalizedJob[] = [];
      for (const item of rawJobs) {
        if (typeof item.title !== 'string' || !item.title.trim() || typeof item.company_name !== 'string' || !item.company_name.trim() || typeof item.url !== 'string') continue;
        let parsedUrl: URL;
        try { parsedUrl = new URL(item.url); } catch { continue; }
        if (parsedUrl.protocol !== 'https:') continue;
        const tags = Array.isArray(item.tags) ? item.tags.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0).slice(0, 20) : [];
        const searchableText = [item.title, item.company_name, ...tags, typeof item.description === 'string' ? item.description.replace(/<[^>]*>/g, ' ').slice(0, 5000) : ''].join(' ');
        if (!matchesKeywords(searchableText)) continue;
        const stableKey = `${parsedUrl.href}|${item.title}|${item.company_name}`;
        normalizedJobs.push({
          id: `remotive-${createHash('sha256').update(stableKey).digest('hex').slice(0, 24)}`,
          source: 'Public Jobs Feed', title: item.title.trim(), company: item.company_name.trim(),
          companyLogo: typeof item.company_logo === 'string' ? item.company_logo : undefined,
          location: typeof item.candidate_required_location === 'string' && item.candidate_required_location.trim() ? item.candidate_required_location.trim() : 'Not specified',
          workplaceType: 'Remote',
          type: item.job_type === 'full_time' ? 'Full-time' : item.job_type === 'part_time' ? 'Part-time' : item.job_type === 'contract' ? 'Contract' : 'Not specified',
          experienceLevel: 'Not specified', salary: typeof item.salary === 'string' && item.salary.trim() ? item.salary.trim() : undefined,
          originalUrl: parsedUrl.href,
          description: typeof item.description === 'string' ? item.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 6000) : '',
          skillsRequired: tags, postedDate: typeof item.publication_date === 'string' ? item.publication_date : '',
          firstSeen: new Date().toISOString(), verified: item.verified === true,
        });
      }
      return { sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: true, jobs: normalizedJobs.slice(0, Math.max(1, Math.min(params.limit || 10, 25))), durationMs: Date.now() - startTime };
    } catch (err: any) {
      return { sourceId: this.sourceId, displayName: this.displayName, apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true, success: false, jobs: [],
        error: err?.name === 'AbortError' ? 'Public feed request timed out (8s limit).' : String(err?.message || 'Public feed error'),
        durationMs: Date.now() - startTime };
    } finally { clearTimeout(timeoutId); }
  },
};
