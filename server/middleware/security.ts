import { Request, Response, NextFunction } from 'express';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

// This store is process-local. Use a shared store (for example Redis)
// when running multiple API instances so limits are consistent across the fleet.
const rateLimitStore = new Map<string, RateLimitBucket>();
const MAX_RATE_LIMIT_BUCKETS = 10_000;
const RATE_LIMIT_SWEEP_INTERVAL = 256;
let rateLimitRequestCount = 0;

function removeExpiredBuckets(now: number): void {
  for (const [key, bucket] of rateLimitStore) if (bucket.resetTime <= now) rateLimitStore.delete(key);
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const windowMs = Math.max(1, Math.floor(options.windowMs));
  const maxRequests = Math.max(1, Math.floor(options.maxRequests));
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    rateLimitRequestCount += 1;
    if (rateLimitRequestCount % RATE_LIMIT_SWEEP_INTERVAL === 0 || rateLimitStore.size >= MAX_RATE_LIMIT_BUCKETS) removeExpiredBuckets(now);
    let bucket = rateLimitStore.get(key);
    if (!bucket || now >= bucket.resetTime) bucket = { count: 1, resetTime: now + windowMs };
    else bucket.count += 1;
    // Keep memory bounded under high-cardinality traffic using Map insertion order as a small LRU.
    if (rateLimitStore.has(key)) rateLimitStore.delete(key);
    if (rateLimitStore.size >= MAX_RATE_LIMIT_BUCKETS) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey !== undefined) rateLimitStore.delete(oldestKey);
    }
    rateLimitStore.set(key, bucket);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));
    if (bucket.count > maxRequests) return res.status(429).json({ error: options.message || 'Too many requests. Please slow down and try again later.', retryAfterMs: Math.max(0, bucket.resetTime - now) });
    next();
  };
}

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP inline/eval allowances are retained until browser regression testing can safely tighten them.
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://api.apify.com https://linkedin-data-api.p.rapidapi.com https://remotive.com;");
  next();
}

export function sanitizePromptInput(input: string, maxLength: number = 3000): string {
  if (!input) return '';
  let sanitized = String(input).slice(0, maxLength);
  const injectionPatterns = [/ignore (all )?previous instructions/gi, /disregard (all )?prior instructions/gi, /system prompt:/gi, /reveal system (prompt|instructions)/gi, /you are now operating in/gi, /jailbreak/gi];
  for (const pattern of injectionPatterns) sanitized = sanitized.replace(pattern, '[filtered-input]');
  return sanitized;
}
