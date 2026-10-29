import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNextScanTime, executeScheduledUserScan } from '../server/scheduler/scanEngine';
import {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
  sendPushNotificationToUser,
} from '../server/push/webPushService';

describe('Background Scheduler & Web Push Test Suite', () => {
  test('calculateNextScanTime correctly calculates hourly and daily intervals', () => {
    const baseTime = new Date('2026-10-25T12:00:00Z');

    // 4 Hours
    const nextHourly = calculateNextScanTime('hourly', 4, baseTime);
    assert.strictEqual(nextHourly.toISOString(), '2026-10-25T16:00:00.000Z');

    // 2 Days
    const nextDaily = calculateNextScanTime('daily', 2, baseTime);
    assert.strictEqual(nextDaily.toISOString(), '2026-10-27T12:00:00.000Z');
  });

  test('calculateNextScanTime clamps boundary values safely (2-24h, 1-5d)', () => {
    const baseTime = new Date('2026-10-25T12:00:00Z');

    // Clamp 1 hour up to 2 hours
    const clampedSubMin = calculateNextScanTime('hourly', 1, baseTime);
    assert.strictEqual(clampedSubMin.toISOString(), '2026-10-25T14:00:00.000Z');

    // Clamp 30 hours down to 24
    const clampedHourly = calculateNextScanTime('hourly', 30, baseTime);
    assert.strictEqual(clampedHourly.toISOString(), '2026-10-26T12:00:00.000Z');

    // Clamp 10 days down to 5
    const clampedDaily = calculateNextScanTime('daily', 10, baseTime);
    assert.strictEqual(clampedDaily.toISOString(), '2026-10-30T12:00:00.000Z');
  });

  test('VAPID public key is either configured or explicitly unavailable', () => {
    const publicKey = getVapidPublicKey();
    assert.ok(publicKey === null || (typeof publicKey === 'string' && publicKey.length > 10));
  });

  test('Web Push subscription store manages subscriptions and handles non-existent endpoints safely', async () => {
    const testUserId = 'user-test-123';
    const sub = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
      keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
    };

    saveSubscription(testUserId, sub);

    // Delivery test to non-existent endpoint handles expired status safely
    const result = await sendPushNotificationToUser(testUserId, {
      title: 'Test Alert',
      message: 'Testing Web Push Delivery',
    });

    assert.ok(typeof result.sentCount === 'number');
    assert.ok(typeof result.expiredCount === 'number');

    removeSubscription(testUserId, sub.endpoint);
  });

  test('Push subscription storage failures are surfaced instead of reporting registration success', async () => {
    const sub = {
      endpoint: 'https://push.example.test/subscription',
      keys: { p256dh: 'valid-shaped-key', auth: 'auth-value' },
    };
    const failingClient = {
      from: () => ({
        upsert: async () => ({ error: { message: 'database unavailable' } }),
      }),
    };

    await assert.rejects(
      saveSubscription('user-push-storage-failure', sub, failingClient),
      /Could not persist push subscription: database unavailable/
    );
  });

  test('Push subscription removal is scoped to the owning user and surfaces database failures', async () => {
    const filters: Array<[string, string]> = [];
    const failingClient = {
      from: () => ({
        delete: () => ({
          eq: (column: string, value: string) => {
            filters.push([column, value]);
            return {
              eq: async (nextColumn: string, nextValue: string) => {
                filters.push([nextColumn, nextValue]);
                return { error: { message: 'delete denied' } };
              },
            };
          },
        }),
      }),
    };

    await assert.rejects(
      removeSubscription('user-owner', 'https://push.example.test/subscription', failingClient),
      /Could not remove push subscription: delete denied/
    );
    assert.deepEqual(filters, [
      ['endpoint', 'https://push.example.test/subscription'],
      ['user_id', 'user-owner'],
    ]);
  });
});
