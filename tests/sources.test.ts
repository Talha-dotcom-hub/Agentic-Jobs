import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { apifyConnector } from '../server/sources/apifyConnector';
import { rapidapiConnector } from '../server/sources/rapidapiConnector';
import { publicFeedsConnector } from '../server/sources/publicFeedsConnector';
import { atsConnector } from '../server/sources/atsConnector';
import { deduplicateJobs, isConnectorEnabled, registeredConnectors, searchAllSources } from '../server/sources/sourceManager';
import { NormalizedJob } from '../server/sources/types';

const envKeys = [
  'APIFY_API_TOKEN', 'APIFY_KEY', 'APIFY_ACTOR_ID',
  'RAPIDAPI_KEY', 'RAPID_API', 'RAPIDAPI_HOST', 'RAPIDAPI_SEARCH_PATH',
  'ATS_GREENHOUSE_BOARDS', 'ATS_LEVER_COMPANIES', 'ENABLE_APPROVED_THIRD_PARTY_JOB_CONNECTORS',
];
async function withNoOptionalSources<T>(fn: () => Promise<T>): Promise<T> {
  const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) delete process.env[key];
  try { return await fn(); }
  finally {
    for (const key of envKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

function mockPublicFeed() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith('https://remotive.com/api/remote-jobs')) {
      return new Response(JSON.stringify({ jobs: [{
        id: 321, title: 'React Developer', company_name: 'Example Remote Co',
        url: 'https://example.com/jobs/react-developer', candidate_required_location: 'Worldwide',
        job_type: 'full_time', tags: ['React', 'TypeScript'],
        description: '<p>Build web applications with React and TypeScript.</p>',
        publication_date: '2026-10-01T00:00:00Z', verified: false,
      }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Unexpected upstream request in test', { status: 500 });
  }) as typeof fetch;
  return () => { globalThis.fetch = originalFetch; };
}

describe('Job Source Connectors Integration Suite', () => {
  test('Apify connector handles missing APIFY_API_TOKEN without a network request', async () => withNoOptionalSources(async () => {
    assert.strictEqual(apifyConnector.isConfigured(), false);
    const result = await apifyConnector.fetchJobs({ keywords: 'React' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.error?.includes('APIFY_API_TOKEN'));
  }));

  test('RapidAPI connector handles missing RAPIDAPI_KEY without a network request', async () => withNoOptionalSources(async () => {
    assert.strictEqual(rapidapiConnector.isConfigured(), false);
    const result = await rapidapiConnector.fetchJobs({ keywords: 'TypeScript' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.error?.includes('RAPIDAPI_KEY'));
  }));

  test('ATS source is explicitly unconfigured when no boards were supplied', async () => withNoOptionalSources(async () => {
    assert.strictEqual(atsConnector.isConfigured(), false);
    const result = await atsConnector.fetchJobs({ keywords: 'React Developer' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.error?.includes('No ATS boards configured'));
  }));

  test('Public feed normalizes only real jobs matching requested resume terms', async () => withNoOptionalSources(async () => {
    const restoreFetch = mockPublicFeed();
    try {
      const result = await publicFeedsConnector.fetchJobs({ keywords: 'React TypeScript', limit: 10 });
      assert.strictEqual(result.isConfigured, true);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.jobs.length, 1);
      const job = result.jobs[0];
      assert.ok(job.id.length > 0);
      assert.strictEqual(job.title, 'React Developer');
      assert.strictEqual(job.company, 'Example Remote Co');
      assert.strictEqual(job.originalUrl, 'https://example.com/jobs/react-developer');
      assert.strictEqual(job.source, 'Public Jobs Feed');
      assert.strictEqual(job.verified, false);
    } finally { restoreFetch(); }
  }));

  test('sourceManager executes connectors and deduplicates jobs using a deterministic feed fixture', async () => withNoOptionalSources(async () => {
    const restoreFetch = mockPublicFeed();
    try {
      const searchRes = await searchAllSources({ keywords: 'developer', limit: 10 });
      assert.ok(Array.isArray(searchRes.jobs));
      assert.ok(Array.isArray(searchRes.sourceStatuses));
      assert.strictEqual(searchRes.sourceStatuses.length, 4);
      assert.strictEqual(searchRes.jobs.length, 1);
      const seen = new Set<string>();
      for (const job of searchRes.jobs) {
        const key = `${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}`;
        assert.strictEqual(seen.has(key), false, `No duplicate job entries for ${key}`);
        seen.add(key);
      }
    } finally { restoreFetch(); }
  }));

  test('deduplication strips tracking parameters but preserves separate vacancies with similar names', () => {
    const makeJob = (id: string, originalUrl: string, source = 'Public Jobs Feed'): NormalizedJob => ({
      id,
      source,
      title: 'Software Engineer',
      company: 'Example Inc',
      location: 'Remote',
      originalUrl,
      description: '',
      skillsRequired: [],
      postedDate: '',
      firstSeen: new Date().toISOString(),
      verified: false,
    });
    const jobs = deduplicateJobs([
      makeJob('one', 'https://jobs.example.com/roles/123?utm_source=newsletter'),
      makeJob('duplicate', 'https://jobs.example.com/roles/123?gclid=tracking', 'Greenhouse ATS'),
      makeJob('different', 'https://jobs.example.com/roles/456'),
    ]);

    assert.deepEqual(jobs.map((job) => job.id), ['one', 'different']);
    assert.deepEqual(jobs[0].sourceLinks?.map((link) => link.source), ['Public Jobs Feed', 'Greenhouse ATS']);
  });

  test('third-party connectors stay disabled until terms and authorization are explicitly confirmed', async () => withNoOptionalSources(async () => {
    const optionalSources = registeredConnectors.filter((source) => source.sourceId === 'apify-linkedin' || source.sourceId === 'rapidapi-linkedin');
    assert.equal(optionalSources.length, 2);
    for (const source of optionalSources) assert.equal(isConnectorEnabled(source), false);
  }));

  test('RapidAPI retries transient GET failures, keeps the token out of the URL, and rejects unsafe job URLs', async () => {
    const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
    process.env.RAPID_API = 'test-secret-token';
    process.env.RAPIDAPI_HOST = 'linkedin-data-api.p.rapidapi.com';
    process.env.RAPIDAPI_SEARCH_PATH = '/search-jobs';
    const originalFetch = globalThis.fetch;
    const requests: Array<{ url: URL; headers: Headers }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      requests.push({ url, headers: new Headers(init?.headers) });
      if (requests.length === 1) return new Response('temporary provider failure', { status: 503 });
      return new Response(JSON.stringify([
        {
          title: 'Data Analyst', companyName: 'Example Analytics',
          url: 'https://www.linkedin.com/jobs/view/analyst-123', location: 'Remote',
          employmentType: 'Full-time', skills: ['SQL', 'Python'],
        },
        {
          title: 'Unsafe', companyName: 'Bad Co',
          url: 'https://user:pass@127.0.0.1/private', location: 'Remote',
        },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    try {
      const result = await rapidapiConnector.fetchJobs({ keywords: 'Data Analyst SQL', page: 2, limit: 5 });
      assert.equal(result.success, true);
      assert.equal(result.jobs.length, 1);
      assert.equal(result.jobs[0].title, 'Data Analyst');
      assert.equal(requests.length, 2);
      assert.equal(requests[1].url.searchParams.get('start'), '5');
      assert.equal(requests[1].url.searchParams.get('keywords'), 'Data Analyst SQL');
      assert.equal(requests[1].url.searchParams.has('key'), false);
      assert.equal(requests[1].headers.get('x-rapidapi-key'), 'test-secret-token');
      assert.equal(requests[1].headers.get('x-rapidapi-host'), 'linkedin-data-api.p.rapidapi.com');
    } finally {
      globalThis.fetch = originalFetch;
      for (const key of envKeys) {
        const value = previous.get(key);
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  });

  test('Apify starts an asynchronous actor run, polls status, paginates results, and normalizes only valid jobs', async () => {
    const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
    process.env.APIFY_KEY = 'test-apify-token';
    process.env.APIFY_ACTOR_ID = 'valig/linkedin-jobs-scraper';
    const originalFetch = globalThis.fetch;
    const requests: Array<{ url: URL; init: RequestInit }> = [];
    let statusPolls = 0;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const request = init || {};
      requests.push({ url, init: request });
      if (request.method === 'POST' && url.pathname.endsWith('/acts/valig~linkedin-jobs-scraper/runs')) {
        return new Response(JSON.stringify({ data: { id: 'run_123', status: 'READY' } }), { status: 201 });
      }
      if (url.pathname.endsWith('/actor-runs/run_123')) {
        statusPolls++;
        const data = statusPolls === 1
          ? { id: 'run_123', status: 'RUNNING' }
          : { id: 'run_123', status: 'SUCCEEDED', defaultDatasetId: 'dataset_123' };
        return new Response(JSON.stringify({ data }), { status: 200 });
      }
      if (url.pathname.endsWith('/datasets/dataset_123/items')) {
        const offset = Number(url.searchParams.get('offset'));
        const count = offset === 0 ? 25 : 15;
        const items: Array<Record<string, unknown>> = Array.from({ length: count }, (_, index) => {
          const itemId = offset + index;
          return {
            id: `job-${itemId}`, title: `Engineer ${itemId}`, companyName: 'Example Co',
            url: `https://www.linkedin.com/jobs/view/${itemId}`, location: 'Remote',
            workType: 'Remote', description: 'Build software.',
          };
        });
        if (offset === 0) items.push({ title: 'Unsafe', companyName: 'Bad', url: 'http://127.0.0.1/private' });
        return new Response(JSON.stringify(items), { status: 200 });
      }
      return new Response('Unexpected request', { status: 500 });
    }) as typeof fetch;

    try {
      const result = await apifyConnector.fetchJobs({ keywords: 'Data Analyst SQL', location: 'Toronto', limit: 40 });
      assert.equal(result.success, true);
      assert.equal(result.jobs.length, 40);
      assert.equal(result.jobs[0].company, 'Example Co');
      assert.equal(result.jobs[0].verified, false);
      assert.equal(statusPolls, 2);
      const start = requests[0];
      assert.equal((start.init.headers as Record<string, string>).Authorization, 'Bearer test-apify-token');
      assert.equal(start.url.searchParams.has('token'), false);
      assert.deepEqual(JSON.parse(String(start.init.body)), { keywords: 'Data Analyst SQL', limit: 40, location: 'Toronto' });
      const datasetRequests = requests.filter((request) => request.url.pathname.endsWith('/datasets/dataset_123/items'));
      assert.equal(datasetRequests.length, 2);
      assert.equal(datasetRequests[0].url.searchParams.get('offset'), '0');
      assert.equal(datasetRequests[1].url.searchParams.get('offset'), '25');
    } finally {
      globalThis.fetch = originalFetch;
      for (const key of envKeys) {
        const value = previous.get(key);
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  });
});
