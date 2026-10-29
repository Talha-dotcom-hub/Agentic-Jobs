import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isQualifyingMatchScore } from '../shared/matchThreshold.ts';

describe('Strict resume-match threshold', () => {
  test('only finite numeric scores strictly above 85 qualify', () => {
    assert.equal(isQualifyingMatchScore(86), true);
    assert.equal(isQualifyingMatchScore(85), false);
    assert.equal(isQualifyingMatchScore(84), false);
    assert.equal(isQualifyingMatchScore(undefined), false);
    assert.equal(isQualifyingMatchScore(Number.NaN), false);
    assert.equal(isQualifyingMatchScore('99'), false);
  });

  test('server and frontend recommendations enforce the shared strict threshold', () => {
    const server = fs.readFileSync('server.ts', 'utf8');
    const frontend = fs.readFileSync('src/pages/app/RecommendedJobs.tsx', 'utf8');
    const scanner = fs.readFileSync('server/scheduler/scanEngine.ts', 'utf8');
    const migration = fs.readFileSync('supabase/migrations/20261029_scan_history_deduplication.sql', 'utf8');
    const historyApi = fs.readFileSync('server/scheduler/scanEngine.ts', 'utf8');

    assert.match(server, /\.gt\('match_score', 85\)/);
    assert.match(server, /\.order\('match_score', \{ ascending: false \}\)/);
    assert.match(server, /isQualifyingMatchScore\(job\.matchScore\)/);
    assert.match(frontend, /isQualifyingMatchScore\(job\.matchScore\)/);
    assert.match(scanner, /if \(isQualifyingMatchScore\(score\)\)/);
    assert.match(historyApi, /\.gte\('started_at', new Date\(Date\.now\(\) - 24 \* 60 \* 60 \* 1000\)/);
    assert.match(migration, /INTERVAL '24 hours'/);
    assert.match(migration, /agentic-jobs-prune-scan-history/);
  });
});
