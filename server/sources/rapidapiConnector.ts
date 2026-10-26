import { createHash } from 'node:crypto';
import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';

export const rapidapiConnector: SourceConnector = {
  sourceId: 'rapidapi-linkedin',
  displayName: 'RapidAPI LinkedIn Data API',
  apiKeyEnvVar: 'RAPIDAPI_KEY',

  isConfigured(): boolean {
    return Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY.trim().length > 5);
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey || !this.isConfigured()) {
      return {
        sourceId: this.sourceId,
        displayName: this.displayName,
        apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: false,
        success: false,
        jobs: [],
        error: 'RAPIDAPI_KEY is not configured in server environment variables.',
        durationMs: Date.now() - startTime,
      };
    }

    const keywords = encodeURIComponent(params.keywords || 'Software Engineer');
    const page = params.page || 1;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout budget

      const response = await fetch(
        `https://linkedin-data-api.p.rapidapi.com/search-jobs?keywords=${keywords}&start=${(page - 1) * 10}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return {
            sourceId: this.sourceId,
            displayName: this.displayName,
            apiKeyEnvVar: this.apiKeyEnvVar,
            isConfigured: true,
            success: false,
            jobs: [],
            rateLimited: true,
            error: 'RapidAPI rate limit exceeded for linkedin-data-api.p.rapidapi.com.',
            durationMs: Date.now() - startTime,
          };
        }
        throw new Error(`RapidAPI host returned status ${response.status}`);
      }

      const body = await response.json();
      const normalizedJobs: NormalizedJob[] = [];

      const rawList = body.data || body.items || (Array.isArray(body) ? body : []);

      if (Array.isArray(rawList)) {
        for (const item of rawList) {
          if (!item.title) continue;

          const title = item.title;
          const company = item.company?.name || item.companyName || item.company;
          const jobUrl = item.url || item.link || item.jobUrl;
          const loc = item.location || 'Not specified';
          if (typeof title !== 'string' || !title.trim() || typeof company !== 'string' || !company.trim() || typeof jobUrl !== 'string' || !jobUrl.startsWith('https://')) continue;

          normalizedJobs.push({
            id: `rapidapi-${createHash('sha256').update(`${jobUrl}|${title}|${company}`).digest('hex').slice(0, 24)}`,
            source: 'RapidAPI LinkedIn',
            title,
            company,
            location: loc,
            workplaceType: /remote/i.test(loc) ? 'Remote' : /hybrid/i.test(loc) ? 'Hybrid' : 'Not specified',
            type: item.employmentType === 'Full-time' || item.employmentType === 'Contract' || item.employmentType === 'Part-time' || item.employmentType === 'Internship' ? item.employmentType : 'Not specified',
            experienceLevel: ['Internship','Entry-Level','Mid-Senior','Director','Executive'].includes(item.experienceLevel) ? item.experienceLevel : 'Not specified',
            salary: item.salary || undefined,
            originalUrl: jobUrl,
            description: typeof item.description === 'string' ? item.description.slice(0, 5000) : '',
            skillsRequired: Array.isArray(item.skillsRequired) ? item.skillsRequired.filter((v: unknown) => typeof v === 'string').slice(0, 20) : Array.isArray(item.skills) ? item.skills.filter((v: unknown) => typeof v === 'string').slice(0, 20) : [],
            postedDate: typeof item.postedAt === 'string' ? item.postedAt : typeof item.date === 'string' ? item.date : '',
            firstSeen: new Date().toISOString(),
            verified: item.verified === true,
          });
        }
      }

      return {
        sourceId: this.sourceId,
        displayName: this.displayName,
        apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true,
        success: true,
        jobs: normalizedJobs,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        sourceId: this.sourceId,
        displayName: this.displayName,
        apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true,
        success: false,
        jobs: [],
        error: err.name === 'AbortError' ? 'RapidAPI request timed out (8s limit).' : err.message || 'RapidAPI connection error',
        durationMs: Date.now() - startTime,
      };
    }
  },
};
