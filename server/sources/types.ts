export interface SourceSearchParams {
  keywords?: string;
  location?: string;
  experienceLevel?: string;
  workplaceType?: string;
  limit?: number;
  page?: number;
}

export interface NormalizedJob {
  id: string;
  source: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Internship';
  experienceLevel: 'Internship' | 'Entry-Level' | 'Mid-Senior' | 'Director' | 'Executive';
  salary?: string;
  originalUrl: string;
  description: string;
  skillsRequired: string[];
  postedDate: string;
  firstSeen: string;
  verified: boolean;
  isStale?: boolean;
}

export interface NormalizedSourceResult {
  sourceId: string;
  displayName: string;
  isConfigured: boolean;
  success: boolean;
  jobs: NormalizedJob[];
  error?: string;
  durationMs: number;
  rateLimited?: boolean;
  apiKeyEnvVar: string;
}

export interface SourceConnector {
  sourceId: string;
  displayName: string;
  apiKeyEnvVar: string;
  isConfigured: () => boolean;
  fetchJobs: (params: SourceSearchParams) => Promise<NormalizedSourceResult>;
}
