import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_FALLBACK_MODELS, validateGeminiApiKey } from '../server/ai/geminiFallback.js';

test('Gemini key validation uses the active documented model and propagates provider failures', async () => {
  let requestedModel = '';
  const selected = await validateGeminiApiKey('test-key-without-network', async (model) => {
    requestedModel = model;
    return { name: model };
  });
  assert.equal(selected, GEMINI_FALLBACK_MODELS[0]);
  assert.equal(requestedModel, GEMINI_FALLBACK_MODELS[0]);

  const attemptedModels: string[] = [];
  const fallbackModel = await validateGeminiApiKey('test-key-without-network', async (model) => {
    attemptedModels.push(model);
    if (attemptedModels.length === 1) {
      const error: any = new Error('model not found');
      error.status = 404;
      throw error;
    }
    return { name: model };
  });
  assert.equal(fallbackModel, GEMINI_FALLBACK_MODELS[1]);
  assert.deepEqual(attemptedModels, GEMINI_FALLBACK_MODELS.slice(0, 2));

  await assert.rejects(
    validateGeminiApiKey('test-key-without-network', async () => {
      const error: any = new Error('invalid credential');
      error.status = 403;
      throw error;
    }),
    /invalid credential/,
  );
});
