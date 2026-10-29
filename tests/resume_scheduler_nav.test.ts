import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deriveResumeSearchKeywords, extractDeterministicProfile } from '../server/resume/resumeManager';
import { calculateNextScanTime, executeScheduledUserScan } from '../server/scheduler/scanEngine';
import { resolveNotificationDestination } from '../src/lib/notificationNavigation';

describe('Resume Memory, Scheduler Constraints & Push Notification Suite', () => {
  test('Deterministic resume extractor extracts structured profile without fabrication', () => {
    const sampleResume = `
      Senior Full Stack Software Engineer with 6+ years of experience.
      Core Skills: TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS.
      Certifications: AWS Certified Solutions Architect.
      Education: Bachelor of Science in Computer Science at Example University.
    `;

    const profile = extractDeterministicProfile(sampleResume, 'Candidate_Resume.pdf');

    assert.ok(profile.headline?.includes('Engineer'), 'Headline inferred');
    assert.ok(profile.skills.includes('TypeScript'), 'TypeScript found');
    assert.ok(profile.skills.includes('React'), 'React found');
    assert.ok(profile.skills.includes('PostgreSQL'), 'PostgreSQL found');
    assert.ok(profile.certifications.length > 0, 'Certification extracted');
    assert.ok(profile.education.length > 0, 'Degree extracted');
    assert.ok(profile.yearsOfExperienceTotal === 6, 'Years of experience extracted accurately');
  });

  test('Schedule validation rejects 1-hour interval and validates allowed ranges', () => {
    const ALLOWED_HOURLY = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const ALLOWED_DAILY = [1, 2, 3, 4, 5];

    // 1-hour is explicitly prohibited
    assert.strictEqual(ALLOWED_HOURLY.includes(1), false, '1 hour must not be allowed');

    // 4-hour is default and allowed
    assert.strictEqual(ALLOWED_HOURLY.includes(4), true, '4 hours is allowed');

    // 24-hour is maximum allowed
    assert.strictEqual(ALLOWED_HOURLY.includes(24), true, '24 hours is allowed');

    // Daily checks
    assert.strictEqual(ALLOWED_DAILY.includes(1), true, '1 day is allowed');
    assert.strictEqual(ALLOWED_DAILY.includes(5), true, '5 days is allowed');
    assert.strictEqual(ALLOWED_DAILY.includes(6), false, '6 days is rejected');
  });

  test('calculateNextScanTime clamps any unexpected inputs strictly to 2-24h and 1-5d', () => {
    const base = new Date('2026-10-25T10:00:00Z');

    // Sub-minimum hourly (1h) clamped up to 2h
    const clampedHourly = calculateNextScanTime('hourly', 1, base);
    assert.strictEqual(clampedHourly.toISOString(), '2026-10-25T12:00:00.000Z');

    // Above-maximum hourly (48h) clamped to 24h
    const clampedMaxHourly = calculateNextScanTime('hourly', 48, base);
    assert.strictEqual(clampedMaxHourly.toISOString(), '2026-10-26T10:00:00.000Z');

    // Above-maximum daily (10d) clamped to 5d
    const clampedMaxDaily = calculateNextScanTime('daily', 10, base);
    assert.strictEqual(clampedMaxDaily.toISOString(), '2026-10-30T10:00:00.000Z');
  });

  test('Resume-derived search keywords reflect evidence from the uploaded resume', () => {
    const keywords = deriveResumeSearchKeywords('Data Analyst\nSkills: Python, SQL, Power BI, Excel.');
    assert.match(keywords, /Data Analyst|Python|SQL|Power BI/i);
    assert.doesNotMatch(keywords, /Software Developer Engineer/);
  });

  test('Scheduled scan fails honestly when no saved resume exists and schedules a future retry', async () => {
    const now = Date.now();
    const result = await executeScheduledUserScan({
      userId: 'test-user-without-resume',
      enabled: true,
      frequencyType: 'hourly',
      frequencyValue: 4,
      timezone: 'UTC',
      lastScanTime: new Date(now - 4 * 3600000).toISOString(),
      nextScanTime: new Date(now).toISOString(),
      resumeText: '',
      scanKind: 'scheduled',
    });

    assert.strictEqual(result.success, false, 'A scan without a real resume must not report success');
    assert.match(result.error || '', /No saved resume/i);
    assert.ok(Date.parse(result.nextScanTime) > now, 'Failure must not immediately retry on the same past schedule time');
  });

  test('Notification destinations resolve safely to supported views and reject invalid links', () => {
    assert.strictEqual(resolveNotificationDestination('job-101', 'match'), 'recommended');
    assert.strictEqual(resolveNotificationDestination('https://example.com/?view=recommended', 'match'), 'recommended');
    assert.strictEqual(resolveNotificationDestination('https://example.com/?view=dashboard', 'scan'), 'dashboard');
    assert.strictEqual(resolveNotificationDestination(undefined, 'followup'), 'applications');
    assert.strictEqual(resolveNotificationDestination('https://evil.example/phish?view=dashboard', 'match'), 'recommended');
    assert.strictEqual(resolveNotificationDestination('https://example.com/?view=not-real', 'scan'), 'discover');
  });
});
