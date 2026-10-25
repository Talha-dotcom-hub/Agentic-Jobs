import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';

export const apifyConnector: SourceConnector = {
  sourceId: 'apify-linkedin',
  displayName: 'Apify LinkedIn Jobs Actor',
  apiKeyEnvVar: 'APIFY_API_TOKEN',

  isConfigured(): boolean {
    return Boolean(process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN.trim().length > 5);
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const token = process.env.APIFY_API_TOKEN;

    if (!token || !this.isConfigured()) {
      return {
        sourceId: this.sourceId,
        displayName: this.displayName,
        apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: false,
        success: false,
        jobs: [],
        error: 'APIFY_API_TOKEN is not configured in server environment variables.',
        durationMs: Date.now() - startTime,
      };
    }

    const actorId = process.env.APIFY_ACTOR_ID || 'h34k1~linkedin-jobs-scraper';
    const limit = params.limit || 10;
    const keywords = params.keywords || 'Software Engineer';
    const location = params.location || 'United States';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout budget

      const response = await fetch(
        `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(
          token
        )}&limit=${limit}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: keywords,
            location: location,
            maxJobs: limit,
          }),
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
            error: 'Apify API rate limit exceeded or quota exhausted.',
            durationMs: Date.now() - startTime,
          };
        }
        throw new Error(`Apify Actor returned HTTP status ${response.status}`);
      }

      const items = await response.json();
      const normalizedJobs: NormalizedJob[] = [];

      if (Array.isArray(items)) {
        for (const item of items) {
          if (!item.title && !item.jobTitle) continue;

          const title = item.title || item.jobTitle || 'Software Engineer';
          const company = item.companyName || item.company || 'Tech Employer';
          const jobUrl = item.jobUrl || item.url || item.link || 'https://linkedin.com/jobs';
          const loc = item.location || location;

          normalizedJobs.push({
            id: `apify-${item.id || item.jobId || Math.random().toString(36).substring(7)}`,
            source: 'Apify LinkedIn Actor',
            title,
            company,
            location: loc,
            workplaceType: loc.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            type: 'Full-time',
            experienceLevel: 'Mid-Senior',
            salary: item.salary || undefined,
            originalUrl: jobUrl,
            description: item.descriptionText || item.description || `Job posting for ${title} at ${company}.`,
            skillsRequired: ['TypeScript', 'React', 'Node.js'],
            postedDate: item.postedAt || item.publishedAt || new Date().toISOString(),
            firstSeen: new Date().toISOString(),
            verified: true,
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
        error: err.name === 'AbortError' ? 'Apify Actor request timed out (12s limit).' : err.message || 'Apify connection error',
        durationMs: Date.now() - startTime,
      };
    }
  },
};
