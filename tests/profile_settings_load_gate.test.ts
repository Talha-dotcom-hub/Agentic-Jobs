import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { canSaveProfileSettings } from '../src/services/profileSettingsState.js';

describe('Profile settings load gate', () => {
  test('blocks saves until the authenticated account profile has loaded', () => {
    assert.equal(canSaveProfileSettings(false, 'user-a', null), false);
    assert.equal(canSaveProfileSettings(false, 'user-a', 'user-b'), false);
    assert.equal(canSaveProfileSettings(false, 'user-a', 'user-a'), true);
  });

  test('does not allow a previous account load to authorize saving after account change', () => {
    const loadedAccountId: string | null = 'user-a';
    const activeAccountId = 'user-b';
    assert.equal(canSaveProfileSettings(false, activeAccountId, loadedAccountId), false);
  });

  test('keeps demo settings locally savable without an authenticated profile load', () => {
    assert.equal(canSaveProfileSettings(true, null, null), true);
  });
});
