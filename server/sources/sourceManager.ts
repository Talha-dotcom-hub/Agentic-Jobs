import { SourceConnector, SourceSearchParams, NormalizedSourceResult, NormalizedJob } from './types.js';
import { apifyConnector } from './apifyConnector.js';
import { rapidapiConnector } from './rapidapiConnector.js';
import { publicFeedsConnector } from './publicFeedsConnector.js';
import { atsConnector } from './atsConnector.js';

export const registeredConnectors: SourceConnector[] = [
  apifyConnector,
  rapidapiConnector,
  publicFeedsConnector,
  atsConnector,
];

export async function searchAllSources(params: SourceSearchParams): Promise<{
  jobs: NormalizedJob[];
  sourceStatuses: NormalizedSourceResult[];
}> {
  // Execute independent source queries with bounded concurrency
  const results = await Promise.allSettled(
    registeredConnectors.map((connector) => connector.fetchJobs(params))
  );

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

  // Conservative deduplication matching:
  // Key = title.toLowerCase() + '|' + company.toLowerCase()
  const seenKeys = new Set<string>();
  const deduplicatedJobs: NormalizedJob[] = [];

  for (const job of rawJobsList) {
    const key = `${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedJobs.push(job);
    }
  }

  return {
    jobs: deduplicatedJobs,
    sourceStatuses,
  };
}
