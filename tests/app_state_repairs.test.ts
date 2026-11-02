import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('session restoration blocks public-route rendering until Supabase auth is ready', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert.match(app, /isSupabaseConfigured && !authReady/);
  assert.match(app, /Restoring your session/);
  const context = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
  assert.match(context, /activeViewRef\.current = requestedView;\s*setActiveViewState\(requestedView\)/);
});

test('Discover search text is initialized from and persisted to the URL', () => {
  const discover = fs.readFileSync('src/pages/app/DiscoverJobs.tsx', 'utf8');
  assert.match(discover, /useState\(\(\) => getFilterValue\('q', ''\)/);
  assert.match(discover, /q: searchTerm\.trim\(\)/);
  assert.doesNotMatch(discover, /searchParams\.delete\('q'\)/);
});

test('source configuration endpoint separates configured state from enabled state and never calls it live-tested', () => {
  const server = fs.readFileSync('server.ts', 'utf8');
  const api = fs.readFileSync('src/services/api.ts', 'utf8');
  assert.match(server, /const isConfigured = c\.isConfigured\(\)/);
  assert.match(server, /enabled,/);
  assert.match(server, /status: !enabled \? 'Disabled' : !isConfigured \? 'Not configured' : 'Not tested'/);
  assert.match(api, /lastCheckTime: 'Not tested'/);
  assert.match(api, /source\.sourceId === 'apify-linkedin' \|\| source\.sourceId === 'rapidapi-linkedin'/);
});

test('scan completion only emits a final no-match message after complete resume scoring', () => {
  const scanner = fs.readFileSync('server/scheduler/scanEngine.ts', 'utf8');
  assert.match(scanner, /const aiScoringComplete = Boolean\(resumeText && activeGeminiKey\)/);
  assert.match(scanner, /matchByUrl\.size === discoveredJobs\.length && !aiScoringError && !quotaExhaustedForThisScan/);
  assert.match(scanner, /const matchScoringComplete = aiScoringComplete && sourceErrors\.length === 0/);
  assert.match(scanner, /Scan completed\. No job matches found according to your resume with an 85% or higher match score\./);
  assert.match(scanner, /not all configured sources responded; no definitive 85% no-match result is available/);
  assert.match(scanner, /status: matchScoringComplete \? 'completed' : 'partial'/);
  const migration = fs.readFileSync('supabase/migrations/20261102_scan_history_partial_status.sql', 'utf8');
  assert.match(migration, /'completed', 'partial', 'failed', 'rate_limited'/);
  const appContext = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
  assert.match(appContext, /Partial discovery:.*No definitive no-match result is available/);
});
