import { JobSourceLink, NormalizedJob } from './types.js';

const TRACKING_PARAMETERS = new Set([
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'msclkid',
]);

export function canonicalizeJobUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;

    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    url.hash = '';
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return null;
  }
}

export function getStableJobIdentity(job: {
  id: string;
  source: string;
  originalUrl: string;
}): string {
  const canonicalUrl = canonicalizeJobUrl(job.originalUrl);
  return canonicalUrl || `${job.source.trim().toLowerCase()}|${job.id.trim()}`;
}

export function getJobSourceLinks(job: NormalizedJob): JobSourceLink[] {
  return job.sourceLinks?.length
    ? job.sourceLinks
    : [{
      source: job.source,
      sourceJobId: job.id,
      url: job.originalUrl,
      verified: job.verified,
    }];
}

export function mergeJobSourceLinks(...groups: Array<unknown>): JobSourceLink[] {
  const links = new Map<string, JobSourceLink>();
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const value of group) {
      if (!value || typeof value !== 'object') continue;
      const link = value as Partial<JobSourceLink>;
      if (
        typeof link.source !== 'string' ||
        typeof link.sourceJobId !== 'string' ||
        typeof link.url !== 'string' ||
        typeof link.verified !== 'boolean'
      ) continue;
      const canonicalUrl = canonicalizeJobUrl(link.url);
      if (!canonicalUrl) continue;
      const key = `${link.source.toLowerCase()}|${canonicalUrl}`;
      const current = links.get(key);
      links.set(key, {
        source: link.source,
        sourceJobId: link.sourceJobId,
        url: canonicalUrl,
        verified: Boolean(current?.verified || link.verified),
      });
    }
  }
  return [...links.values()];
}
