import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** Rate-limit result returned to callers. */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Returns a lazily-initialised Upstash Redis client.
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */
let _redis: Redis | undefined;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

/**
 * Returns a rate limiter for unauthenticated requests.
 * Allows 60 requests per 60-second sliding window.
 */
export function getDefaultLimiter(): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    analytics: true,
    prefix: 'ratelimit:default',
  });
}

/**
 * Returns a rate limiter for authenticated requests.
 * Allows 120 requests per 60-second sliding window.
 */
export function getAuthenticatedLimiter(): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(120, '60 s'),
    analytics: true,
    prefix: 'ratelimit:authenticated',
  });
}

/**
 * Returns a rate limiter for publish operations.
 * Allows 10 requests per 1-hour sliding window.
 */
export function getPublishLimiter(): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:publish',
  });
}

/**
 * Checks whether the given identifier is rate-limited.
 *
 * @param identifier - A unique identifier for the requester (e.g. IP or user ID)
 * @param limiter    - The rate limiter to use (defaults to `getDefaultLimiter()`)
 * @returns Rate-limit result with success status and quota metadata
 */
export async function rateLimit(
  identifier: string,
  limiter?: Ratelimit,
): Promise<RateLimitResult> {
  const rl = limiter ?? getDefaultLimiter();
  const result = await rl.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
