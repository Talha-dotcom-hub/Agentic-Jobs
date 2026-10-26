import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { apifyConnector } from '../server/sources/apifyConnector';
import { rapidapiConnector } from '../server/sources/rapidapiConnector';
import { publicFeedsConnector } from '../server/sources/publicFeedsConnector';
import { atsConnector } from '../server/sources/atsConnector';
import { searchAllSources } from '../server/sources/sourceManager';

const envKeys = ['APIFY_API_TOKEN', 'RAPIDAPI_KEY', 'ATS_GREENHOUSE_BOARDS', 'ATS_LEVER_COMPANIES'];
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
});
