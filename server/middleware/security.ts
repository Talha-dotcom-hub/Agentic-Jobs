import { Request, Response, NextFunction } from 'express';

// Rate Limiter Memory Bucket Store
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const bucket = rateLimitStore.get(key) || { count: 0, resetTime: now + options.windowMs };

    if (now > bucket.resetTime) {
      bucket.count = 1;
      bucket.resetTime = now + options.windowMs;
    } else {
      bucket.count++;
    }

    rateLimitStore.set(key, bucket);

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > options.maxRequests) {
      return res.status(429).json({
        error: options.message || 'Too many requests. Please slow down and try again later.',
        retryAfterMs: bucket.resetTime - now,
      });
    }

    next();
  };
}

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://api.apify.com https://linkedin-data-api.p.rapidapi.com https://remotive.com;"
    );

  next();
}

export function sanitizePromptInput(input: string, maxLength: number = 3000): string {
  if (!input) return '';

  let sanitized = String(input).slice(0, maxLength);

  // Strip obvious prompt injection override patterns
  const injectionPatterns = [
    /ignore (all )?previous instructions/gi,
    /disregard (all )?prior instructions/gi,
    /system prompt:/gi,
    /reveal system (prompt|instructions)/gi,
    /you are now operating in/gi,
    /jailbreak/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered-input]');
  }

  return sanitized;
}
