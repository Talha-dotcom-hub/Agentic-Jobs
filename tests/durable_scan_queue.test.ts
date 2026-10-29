import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recoverStaleManualScans } from '../server/scheduler/schedulerWorker.js';

describe('Durable scan queue recovery and deduplication', () => {
  test('recovers expired leases after a worker restart and permanently fails exhausted runs', async () => {
    const queries: Array<{
      update?: Record<string, unknown>;
      filters: Array<[string, string, unknown]>;
    }> = [];
    const client = {
      from(table: string) {
        assert.equal(table, 'scan_runs');
        const query = { filters: [] as Array<[string, string, unknown]>, update: undefined as Record<string, unknown> | undefined };
        queries.push(query);
        const chain = {
          update(values: Record<string, unknown>) { query.update = values; return chain; },
          eq(column: string, value: unknown) { query.filters.push(['eq', column, value]); return chain; },
          or(value: string) { query.filters.push(['or', '', value]); return chain; },
          lt(column: string, value: unknown) { query.filters.push(['lt', column, value]); return chain; },
          gte(column: string, value: unknown) { query.filters.push(['gte', column, value]); return chain; },
          then(resolve: (result: { data: null; error: null }) => void) {
            resolve({ data: null, error: null });
          },
        };
        return chain;
      },
    };

    await recoverStaleManualScans(client);

    assert.equal(queries.length, 2);
    assert.equal(queries[0].update?.status, 'queued');
    assert.equal(queries[0].update?.lease_expires_at, null);
    assert.deepEqual(queries[0].filters.find(([operator, column]) => operator === 'lt' && column === 'attempt_count'), ['lt', 'attempt_count', 3]);
    assert.equal(queries[1].update?.status, 'failed');
    assert.ok(queries[1].filters.some(([operator, column]) => operator === 'gte' && column === 'attempt_count'));
    for (const query of queries) {
      assert.ok(query.filters.some(([operator, column, value]) => operator === 'eq' && column === 'status' && value === 'running'));
      assert.ok(query.filters.some(([operator]) => operator === 'or'));
    }
  });

  test('uses a per-user database lock and returns an existing active scan instead of enqueuing a duplicate', async () => {
    const migration = await readFile('supabase/migrations/20261030_durable_scan_queue.sql', 'utf8');
    const enqueueFunction = migration.slice(migration.indexOf('CREATE OR REPLACE FUNCTION public.enqueue_scan_run'));

    assert.match(enqueueFunction, /pg_advisory_xact_lock\(hashtextextended\(p_user_id::TEXT, 0\)\)/);
    assert.match(enqueueFunction, /status IN \('queued', 'running'\)/);
    assert.match(enqueueFunction, /RETURN QUERY SELECT existing_run\.id, existing_run\.status/);
    assert.match(enqueueFunction, /GRANT EXECUTE ON FUNCTION public\.enqueue_scan_run\(UUID\) TO service_role/);
  });
});
