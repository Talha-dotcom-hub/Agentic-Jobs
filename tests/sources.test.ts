import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { apifyConnector } from '../server/sources/apifyConnector';
import { rapidapiConnector } from '../server/sources/rapidapiConnector';
import { publicFeedsConnector } from '../server/sources/publicFeedsConnector';
import { searchAllSources } from '../server/sources/sourceManager';

describe('Job Source Connectors Integration Suite', () => {
  test('Apify connector handles missing APIFY_API_TOKEN gracefully', async () => {
    delete process.env.APIFY_API_TOKEN;
    const isConfigured = apifyConnector.isConfigured();
    assert.strictEqual(isConfigured, false, 'Apify is unconfigured when APIFY_API_TOKEN is missing');

    const result = await apifyConnector.fetchJobs({ keywords: 'React' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.error?.includes('APIFY_API_TOKEN'), 'Clear setup guidance returned');
  });

  test('RapidAPI connector handles missing RAPIDAPI_KEY gracefully', async () => {
    delete process.env.RAPIDAPI_KEY;
    const isConfigured = rapidapiConnector.isConfigured();
    assert.strictEqual(isConfigured, false, 'RapidAPI is unconfigured when RAPIDAPI_KEY is missing');

    const result = await rapidapiConnector.fetchJobs({ keywords: 'TypeScript' });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isConfigured, false);
    assert.ok(result.error?.includes('RAPIDAPI_KEY'), 'Clear setup guidance returned');
  });

  test('Public feeds connector is always active and normalizes jobs model', async () => {
    const isConfigured = publicFeedsConnector.isConfigured();
    assert.strictEqual(isConfigured, true, 'Public feeds connector is always available');

    const result = await publicFeedsConnector.fetchJobs({ keywords: 'software' });
    assert.strictEqual(result.isConfigured, true);
    assert.ok(Array.isArray(result.jobs), 'Jobs array returned');

    if (result.jobs.length > 0) {
      const job = result.jobs[0];
      assert.ok(job.id.length > 0, 'Job has stable source ID');
      assert.ok(job.title.length > 0, 'Job has title');
      assert.ok(job.company.length > 0, 'Job has company name');
      assert.ok(job.originalUrl.startsWith('http'), 'Job retains valid original URL');
      assert.strictEqual(job.source, 'Public Jobs Feed', 'Job preserves source provenance');
    }
  });

  test('sourceManager executes parallel queries and deduplicates title+company matches', async () => {
    const searchRes = await searchAllSources({ keywords: 'developer' });

    assert.ok(Array.isArray(searchRes.jobs), 'Search returns jobs list');
    assert.ok(Array.isArray(searchRes.sourceStatuses), 'Search returns source statuses');
    assert.strictEqual(searchRes.sourceStatuses.length, 4, 'Status reported for all 4 connectors');

    // Deduplication check: verify no duplicate (title|company) keys exist
    const seen = new Set<string>();
    for (const job of searchRes.jobs) {
      const key = `${job.title.trim().toLowerCase()}|${job.company.trim().toLowerCase()}`;
      assert.strictEqual(seen.has(key), false, `No duplicate job entries for ${key}`);
      seen.add(key);
    }
  });
});
