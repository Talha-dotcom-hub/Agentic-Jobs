import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeExternalUrl } from '../server/security/urlValidator';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
  createCronAuthMiddleware,
} from '../server/middleware/auth';
import { atsConnector } from '../server/sources/atsConnector';
import { calculateNextScanTime } from '../server/scheduler/scanEngine';

describe('Auth & Backend Security Suite', () => {
  describe('SSRF Protection & URL Validation', () => {
    test('Allows valid public HTTPS URLs', () => {
      assert.strictEqual(isSafeExternalUrl('https://boards-api.greenhouse.io/v1/boards/stripe/jobs'), true);
      assert.strictEqual(isSafeExternalUrl('https://api.lever.co/v0/postings/figma'), true);
      assert.strictEqual(isSafeExternalUrl('https://jobs.github.com/positions.json'), true);
    });

    test('Blocks internal loopback addresses', () => {
      assert.strictEqual(isSafeExternalUrl('http://127.0.0.1:3000/api/admin'), false);
      assert.strictEqual(isSafeExternalUrl('http://localhost/secret'), false);
      assert.strictEqual(isSafeExternalUrl('http://[::1]:3000/status'), false);
    });

    test('Blocks AWS / GCP cloud instance metadata endpoints', () => {
      assert.strictEqual(isSafeExternalUrl('http://169.254.169.254/latest/meta-data/'), false);
      assert.strictEqual(isSafeExternalUrl('http://metadata.google.internal/computeMetadata/v1/'), false);
    });

    test('Blocks RFC 1918 private IP subnets', () => {
      assert.strictEqual(isSafeExternalUrl('http://10.0.0.1/internal'), false);
      assert.strictEqual(isSafeExternalUrl('http://192.168.1.100/admin'), false);
      assert.strictEqual(isSafeExternalUrl('http://172.16.0.1/db'), false);
    });

    test('Blocks non-HTTP protocols', () => {
      assert.strictEqual(isSafeExternalUrl('file:///etc/passwd'), false);
      assert.strictEqual(isSafeExternalUrl('ftp://example.com/file'), false);
      assert.strictEqual(isSafeExternalUrl('gopher://example.com'), false);
    });
  });

  describe('JWT Authentication Middleware', () => {
    const mockSupabase = {
      auth: {
        getUser: async (token: string) => {
          if (token === 'valid-user-jwt') {
            return {
              data: {
                user: { id: 'usr-12345', email: 'engineer@example.com', role: 'authenticated' },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        },
      },
    };

    const authMiddleware = createAuthMiddleware(mockSupabase);

    test('Rejects request with missing Authorization header', async () => {
      let status = 0;
      let jsonResponse: any = null;
      const req: any = { headers: {} };
      const res: any = {
        status: (s: number) => {
          status = s;
          return { json: (d: any) => { jsonResponse = d; } };
        },
      };

      await authMiddleware(req, res, () => {});
      assert.strictEqual(status, 401);
      assert.ok(jsonResponse.error.includes('Unauthorized'));
    });

    test('Rejects request with invalid JWT', async () => {
      let status = 0;
      let jsonResponse: any = null;
      const req: any = { headers: { authorization: 'Bearer invalid-token' } };
      const res: any = {
        status: (s: number) => {
          status = s;
          return { json: (d: any) => { jsonResponse = d; } };
        },
      };

      await authMiddleware(req, res, () => {});
      assert.strictEqual(status, 401);
      assert.ok(jsonResponse.error.includes('Invalid or expired'));
    });

    test('Authorizes request with valid JWT and injects req.user', async () => {
      let nextCalled = false;
      const req: any = { headers: { authorization: 'Bearer valid-user-jwt' } };
      const res: any = {};

      await authMiddleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user.id, 'usr-12345');
      assert.strictEqual(req.user.email, 'engineer@example.com');
    });
  });

  describe('Cron Authentication Middleware', () => {
    const originalEnv = process.env.CRON_SECRET;

    test('Enforces CRON_SECRET when configured in environment', () => {
      process.env.CRON_SECRET = 'super-secret-cron-token';
      const cronMiddleware = createCronAuthMiddleware();

      // Missing or wrong secret
      let status = 0;
      const reqUnauthorized: any = { headers: {}, ip: '198.51.100.1' };
      const res: any = {
        status: (s: number) => {
          status = s;
          return { json: () => {} };
        },
      };

      cronMiddleware(reqUnauthorized, res, () => {});
      assert.strictEqual(status, 401);

      // Correct secret in X-Cron-Secret header
      let nextCalled = false;
      const reqAuthorized: any = {
        headers: { 'x-cron-secret': 'super-secret-cron-token' },
      };
      cronMiddleware(reqAuthorized, res, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);

      process.env.CRON_SECRET = originalEnv;
    });
  });

  describe('Scan Interval Calculation & Rules', () => {
    test('Calculates hourly intervals accurately from baseline', () => {
      const now = new Date('2026-10-25T12:00:00Z');
      const next4h = calculateNextScanTime('hourly', 4, now);
      assert.strictEqual(next4h.toISOString(), '2026-10-25T16:00:00.000Z');

      const next12h = calculateNextScanTime('hourly', 12, now);
      assert.strictEqual(next12h.toISOString(), '2026-10-26T00:00:00.000Z');
    });

    test('Calculates daily intervals accurately', () => {
      const now = new Date('2026-10-25T12:00:00Z');
      const next2d = calculateNextScanTime('daily', 2, now);
      assert.strictEqual(next2d.toISOString(), '2026-10-27T12:00:00.000Z');
    });
  });

  describe('ATS Connector Architecture', () => {
    test('ATS Connector instantiates with secure defaults', () => {
      assert.strictEqual(atsConnector.sourceId, 'employer-ats');
      assert.strictEqual(atsConnector.isConfigured(), true);
    });
  });
});
