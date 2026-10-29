import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { decryptGeminiApiKey, encryptGeminiApiKey } from '../server/credentials/geminiCredentialVault.js';

describe('Personal Gemini credential encryption', () => {
  test('encrypts credentials with AES-GCM and decrypts only with the same stable key', () => {
    const previousKey = process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
    process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY = 'test-encryption-secret-with-at-least-32-characters';
    try {
      const encrypted = encryptGeminiApiKey('test-gemini-api-key');
      assert.notEqual(encrypted.ciphertext, 'test-gemini-api-key');
      assert.equal(decryptGeminiApiKey({
        encrypted_key: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
      }), 'test-gemini-api-key');

      process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY = 'different-test-encryption-secret-with-at-least-32-characters';
      assert.throws(() => decryptGeminiApiKey({
        encrypted_key: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
      }));
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
      else process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY = previousKey;
    }
  });

  test('rejects a missing or too-short encryption secret', () => {
    const previousKey = process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
    delete process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
    try {
      assert.throws(() => encryptGeminiApiKey('test-gemini-api-key'), /at least 32 characters/);
      process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY = 'too-short';
      assert.throws(() => encryptGeminiApiKey('test-gemini-api-key'), /at least 32 characters/);
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
      else process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY = previousKey;
    }
  });
});
