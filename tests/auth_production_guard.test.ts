import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthMiddleware } from '../server/middleware/auth';

class FakeResponse {
  statusCode = 200;
  body: unknown = null;
  status(code: number) { this.statusCode = code; return this; }
  json(body: unknown) { this.body = body; return this; }
}

test('production rejects test tokens when Supabase auth is unavailable', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const req = { headers: { authorization: 'Bearer test-token-attacker' } } as any;
    const res = new FakeResponse();
    let nextCalled = false;
    await createAuthMiddleware(null)(req, res as any, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
    assert.equal(req.user, undefined);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('verified identity comes from Supabase, not request body userId', async () => {
  const client = {
    auth: {
      getUser: async (token: string) => ({
        data: { user: { id: 'verified-user-id', email: 'verified@example.test', role: 'authenticated' } },
        error: null,
      }),
    },
  };
  const req = { headers: { authorization: 'Bearer valid-token' }, body: { userId: 'attacker-user-id' } } as any;
  const res = new FakeResponse();
  let nextCalled = false;
  await createAuthMiddleware(client)(req, res as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'verified-user-id');
  assert.notEqual(req.user.id, req.body.userId);
});