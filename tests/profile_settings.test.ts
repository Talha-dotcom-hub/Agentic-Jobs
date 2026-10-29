import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getScanPreferences,
  getUserProfileSettings,
  saveUserProfileSettings,
  UserPreferences,
} from '../server/settings/profileSettings.js';

function makeProfileClient() {
  const rows = new Map<string, Record<string, any>>([
    ['user-a', {
      id: 'user-a', email: 'a@example.test', full_name: 'Initial A',
      preferences: { pushNotifications: false, highMatchAlerts: true, emailSummaries: true, autoSaveHighMatches: false },
    }],
    ['user-b', {
      id: 'user-b', email: 'b@example.test', full_name: 'Initial B',
      preferences: { pushNotifications: false, highMatchAlerts: false, emailSummaries: false, autoSaveHighMatches: true },
    }],
  ]);
  const calls: Array<{ operation: string; userId?: string; payload?: Record<string, unknown> }> = [];
  const client = {
    from(table: string) {
      assert.equal(table, 'profiles');
      let userId: string | undefined;
      let payload: Record<string, unknown> | undefined;
      return {
        select() { calls.push({ operation: 'select' }); return this; },
        eq(column: string, value: string) {
          if (column === 'id') userId = value;
          for (let index = calls.length - 1; index >= 0; index--) {
            const call = calls[index];
            if (call.operation === 'update' && !call.userId) {
              call.userId = userId;
              break;
            }
          }
          return this;
        },
        maybeSingle: async () => {
          if (payload && userId && rows.has(userId)) {
            rows.set(userId, { ...rows.get(userId), ...payload });
          }
          calls.push({ operation: 'read', userId });
          return { data: userId ? rows.get(userId) || null : null, error: null };
        },
        update(values: Record<string, unknown>) {
          payload = values;
          calls.push({ operation: 'update', userId, payload });
          return this;
        },
      };
    },
    rows,
    calls,
  };
  return client;
}

describe('Persisted account profile settings', () => {
  test('saves server-confirmed name and preferences, and scan preferences reload by account', async () => {
    const client = makeProfileClient();
    const preferences: UserPreferences = {
      pushNotifications: true,
      highMatchAlerts: false,
      emailSummaries: false,
      autoSaveHighMatches: true,
    };
    const saved = await saveUserProfileSettings(client, 'user-a', { fullName: 'Updated A', preferences });
    const restored = await getUserProfileSettings(client, 'user-a');
    const otherAccount = await getUserProfileSettings(client, 'user-b');
    const scanPreferences = await getScanPreferences(client, 'user-a');

    assert.equal(saved.fullName, 'Updated A');
    assert.deepEqual(restored?.preferences, preferences);
    assert.equal(restored?.email, 'a@example.test');
    assert.equal(otherAccount?.fullName, 'Initial B');
    assert.deepEqual(scanPreferences, preferences);
    assert.deepEqual(client.calls.find((call) => call.operation === 'update')?.userId, 'user-a');
    assert.equal(client.rows.get('user-b')?.full_name, 'Initial B');
  });

  test('rejects invalid names and non-boolean preferences without writing', async () => {
    const client = makeProfileClient();
    await assert.rejects(saveUserProfileSettings(client, 'user-a', {
      fullName: '  ',
      preferences: { pushNotifications: true },
    }), /Full name must contain/);
    await assert.rejects(saveUserProfileSettings(client, 'user-a', {
      fullName: 'Valid Name',
      preferences: { pushNotifications: 'true' },
    }), /Every profile preference must be a boolean/);
    assert.equal(client.calls.filter((call) => call.operation === 'update').length, 0);
  });

  test('does not silently default scan preferences when Supabase reports a read error', async () => {
    const client = {
      from: () => ({
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: null, error: { message: 'database unavailable' } }),
      }),
    };
    await assert.rejects(getScanPreferences(client, 'user-a'), /Could not load saved scan preferences/);
  });
});
