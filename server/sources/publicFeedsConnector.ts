import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';

export const publicFeedsConnector: SourceConnector = {
  sourceId: 'public-feeds',
  displayName: 'Public Developer Jobs Feed',
  apiKeyEnvVar: 'NONE',

  isConfigured(): boolean {
    return true; // Always available
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const keywords = (params.keywords || 'software').toLowerCase();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout budget

      const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=15', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Public feed returned HTTP status ${response.status}`);
      }

      const body = await response.json();
      const rawJobs = body.jobs || [];

      const normalizedJobs: NormalizedJob[] = [];

      if (Array.isArray(rawJobs)) {
        for (const item of rawJobs) {
          if (!item.title) continue;

          // Filter by keyword if provided
          if (keywords && !item.title.toLowerCase().includes(keywords) && !item.company_name?.toLowerCase().includes(keywords)) {
            continue;
          }

          normalizedJobs.push({
            id: `remotive-${item.id || Math.random().toString(36).substring(7)}`,
            source: 'Public Jobs Feed',
            title: item.title,
            company: item.company_name || 'Tech Employer',
            companyLogo: item.company_logo || undefined,
            location: item.candidate_required_location || 'Remote',
            workplaceType: 'Remote',
            type: item.job_type === 'full_time' ? 'Full-time' : 'Contract',
            experienceLevel: 'Mid-Senior',
            salary: item.salary || undefined,
            originalUrl: item.url || 'https://remotive.com',
            description: item.description
              ? item.description.replace(/<[^>]*>/g, '').slice(0, 1500)
              : `Remote software engineering role at ${item.company_name}.`,
            skillsRequired: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ['TypeScript', 'React', 'Python'],
            postedDate: item.publication_date || new Date().toISOString(),
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
        error: err.name === 'AbortError' ? 'Public feed request timed out (6s limit).' : err.message || 'Public feed error',
        durationMs: Date.now() - startTime,
      };
    }
  },
};
