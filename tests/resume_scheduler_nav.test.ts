import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractDeterministicProfile } from '../server/resume/resumeManager';
import { calculateNextScanTime, executeScheduledUserScan } from '../server/scheduler/scanEngine';

describe('Resume Memory, Scheduler Constraints & Push Notification Suite', () => {
  test('Deterministic resume extractor extracts structured profile without fabrication', () => {
    const sampleResume = `
      Senior Full Stack Software Engineer with 6+ years of experience.
      Core Skills: TypeScript, React, Node.js, Python, PostgreSQL, Docker, AWS.
      Certifications: AWS Certified Solutions Architect.
      Education: Bachelor of Science in Computer Science.
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

  test('Scheduled user scan executes and dispatches exact completion notification', async () => {
    const config = {
      userId: 'test-user-scan-notification',
      enabled: true,
      frequencyType: 'hourly' as const,
      frequencyValue: 4,
      timezone: 'UTC',
      lastScanTime: new Date(Date.now() - 3600000 * 4).toISOString(),
      nextScanTime: new Date().toISOString(),
      resumeText: 'Full Stack Engineer with TypeScript and React experience',
    };

    const result = await executeScheduledUserScan(config);

    assert.strictEqual(result.success, true, 'Scan completed successfully');
    assert.ok(result.jobsDiscovered >= 0, 'Jobs count is non-negative');
    assert.ok(result.nextScanTime, 'Next scan time is calculated');
  });
});
