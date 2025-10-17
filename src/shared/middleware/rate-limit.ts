/**
 * Rate limiting middleware.
 */

import type { Context, Next } from 'hono';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a proper rate limiting service
 */
export function rateLimit(options: {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (c: Context) => string; // Generate key from context
}) {
  const { windowMs, max, keyGenerator } = options;

  return async (c: Context, next: Next) => {
    // Generate key (default: IP address)
    const key = keyGenerator
      ? keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const now = Date.now();
    const record = store[key];

    // Clean up old entries
    if (record && now > record.resetTime) {
      delete store[key];
    }

    // Check if rate limit exceeded
    if (record && record.count >= max) {
      logger.warn('Rate limit exceeded', { key, count: record.count });
      return c.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        429
      );
    }

    // Update or create record
    if (record) {
      record.count++;
    } else {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', (max - (record?.count || 1)).toString());
    c.header('X-RateLimit-Reset', store[key].resetTime.toString());

    await next();
  };
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000); // Clean up every minute
