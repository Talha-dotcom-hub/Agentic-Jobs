import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { apifyConnector } from './apifyConnector.js';
import { rapidapiConnector } from './rapidapiConnector.js';
import { publicFeedsConnector } from './publicFeedsConnector.js';
import { atsConnector } from './atsConnector.js';
import { canonicalizeJobUrl, getJobSourceLinks, mergeJobSourceLinks } from './jobIdentity.js';

export const registeredConnectors: SourceConnector[] = [
  apifyConnector,
  rapidapiConnector,
  publicFeedsConnector,
  atsConnector,
];

const approvalRequiredSources = new Set(['apify-linkedin', 'rapidapi-linkedin']);

export function isConnectorEnabled(connector: SourceConnector): boolean {
  return !approvalRequiredSources.has(connector.sourceId) ||
    process.env.ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS === 'true';
}

export function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const uniqueJobs: NormalizedJob[] = [];
  const indicesByKey = new Map<string, number>();
  for (const job of jobs) {
    const key = canonicalizeJobUrl(job.originalUrl) || `${job.source}|${job.id}`;
    const existingIndex = indicesByKey.get(key);
    if (existingIndex === undefined) {
      indicesByKey.set(key, uniqueJobs.length);
      uniqueJobs.push({ ...job, sourceLinks: mergeJobSourceLinks(getJobSourceLinks(job)) });
      continue;
    }
    const existingJob = uniqueJobs[existingIndex];
    uniqueJobs[existingIndex] = {
      ...existingJob,
      sourceLinks: mergeJobSourceLinks(existingJob.sourceLinks, getJobSourceLinks(job)),
    };
  }
  return uniqueJobs;
}

export async function searchAllSources(params: SourceSearchParams): Promise<{
  jobs: NormalizedJob[];
  sourceStatuses: NormalizedSourceResult[];
}> {
  // Execute independent source queries with bounded concurrency
  const results = await Promise.allSettled(registeredConnectors.map((connector) => (
    isConnectorEnabled(connector)
      ? connector.fetchJobs(params)
      : Promise.resolve({
        sourceId: connector.sourceId,
        displayName: connector.displayName,
        apiKeyEnvVar: connector.apiKeyEnvVar,
        isConfigured: false,
        success: false,
        jobs: [],
        error: 'Disabled until the operator confirms the provider terms, authorization, and usage limits permit this integration.',
        durationMs: 0,
      })
  )));

  const sourceStatuses: NormalizedSourceResult[] = [];
  const rawJobsList: NormalizedJob[] = [];

  results.forEach((res, idx) => {
    const connector = registeredConnectors[idx];
    if (res.status === 'fulfilled') {
      sourceStatuses.push(res.value);
      if (res.value.success && res.value.jobs) {
        rawJobsList.push(...res.value.jobs);
      }
    } else {
      sourceStatuses.push({
        sourceId: connector.sourceId,
        displayName: connector.displayName,
        apiKeyEnvVar: connector.apiKeyEnvVar,
        isConfigured: connector.isConfigured(),
        success: false,
        jobs: [],
        error: res.reason?.message || 'Source execution failed',
        durationMs: 0,
      });
    }
  });

  return {
    jobs: deduplicateJobs(rawJobsList),
    sourceStatuses,
  };
}
