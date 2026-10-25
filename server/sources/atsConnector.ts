import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { isSafeExternalUrl } from '../security/urlValidator.js';

export const atsConnector: SourceConnector = {
  sourceId: 'employer-ats',
  displayName: 'Employer ATS Integrations (Greenhouse & Lever)',
  apiKeyEnvVar: 'NONE',

  isConfigured(): boolean {
    return true; // Public employer boards available without API key
  },

  async fetchJobs(params: SourceSearchParams): Promise<NormalizedSourceResult> {
    const startTime = Date.now();
    const keywords = (params.keywords || 'software').toLowerCase();

    // Sample curated engineering employer boards on Greenhouse / Lever
    const sampleBoardUrl = 'https://boards-api.greenhouse.io/v1/boards/gitlab/jobs';

    if (!isSafeExternalUrl(sampleBoardUrl)) {
      return {
        sourceId: this.sourceId,
        displayName: this.displayName,
        apiKeyEnvVar: this.apiKeyEnvVar,
        isConfigured: true,
        success: false,
        jobs: [],
        error: 'Target ATS URL failed SSRF security validation.',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(sampleBoardUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ATS board returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      const rawJobs = data.jobs || [];

      const normalizedJobs: NormalizedJob[] = [];

      for (const item of rawJobs.slice(0, 15)) {
        if (!item.title) continue;

        if (keywords && !item.title.toLowerCase().includes(keywords)) {
          continue;
        }

        normalizedJobs.push({
          id: `ats-${item.id || Math.random().toString(36).substring(7)}`,
          source: 'Greenhouse ATS',
          title: item.title,
          company: 'GitLab',
          location: item.location?.name || 'Remote',
          workplaceType: 'Remote',
          type: 'Full-time',
          experienceLevel: 'Mid-Senior',
          originalUrl: item.absolute_url || 'https://about.gitlab.com/jobs/',
          description: `Direct employer career vacancy at GitLab: ${item.title}. View requirements and apply directly on the official career board.`,
          skillsRequired: ['Git', 'DevOps', 'Go', 'Ruby', 'TypeScript', 'Kubernetes'],
          postedDate: item.updated_at || new Date().toISOString(),
          firstSeen: new Date().toISOString(),
          verified: true,
        });
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
        error: err.message || 'ATS connector request failed',
        durationMs: Date.now() - startTime,
      };
    }
  },
};
