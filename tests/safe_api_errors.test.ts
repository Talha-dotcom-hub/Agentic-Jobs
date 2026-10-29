import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ProfileSettingsValidationError,
  profileSettingsApiError,
  safeApiErrorMessage,
  safeErrorMetadata,
} from '../server/middleware/safeErrors.js';

describe('Safe API error responses and diagnostics', () => {
  test('resume API fallback does not disclose Supabase, storage, or supplied content details', () => {
    const internalError = new Error(
      'storage.internal: user@example.test resume text and bearer-token-value',
    );
    const responseMessage = safeApiErrorMessage(
      internalError,
      'Could not save the resume and structured profile. Please try again.',
    );

    assert.equal(responseMessage, 'Could not save the resume and structured profile. Please try again.');
    assert.equal(responseMessage.includes('user@example.test'), false);
    assert.equal(responseMessage.includes('bearer-token-value'), false);
  });

  test('profile settings preserves validation errors but hides internal persistence errors', () => {
    const validation = profileSettingsApiError(new ProfileSettingsValidationError('Full name must contain 1 to 120 characters.'));
    assert.deepEqual(validation, {
      status: 400,
      message: 'Full name must contain 1 to 120 characters.',
    });

    const databaseError = profileSettingsApiError(new Error('database connection includes private record details'));
    assert.deepEqual(databaseError, {
      status: 503,
      message: 'Could not save profile settings. Please try again.',
    });
    assert.equal(databaseError.message.includes('private record details'), false);
  });

  test('server diagnostics retain safe error metadata without including the raw message', () => {
    const metadata = safeErrorMetadata(Object.assign(
      new Error('secret key and uploaded resume text must not be logged'),
      { code: '23505', status: 503 },
    ));

    assert.deepEqual(metadata, { name: 'Error', code: '23505', status: 503 });
    assert.equal(JSON.stringify(metadata).includes('uploaded resume text'), false);
  });
});
