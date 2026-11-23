import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';

/** General public endpoints — 60 requests per minute */
export const generalLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1m'),
  prefix: 'rl:general',
});

/** Email subscribe — 5 requests per minute */
export const subscribeLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),
  prefix: 'rl:subscribe',
});

/**
 * External fetch endpoints (metadata, tweets, music) — 40 requests per minute.
 * One profile view makes a request per card that needs remote data, so the
 * limit has to clear a card-heavy page in a single load.
 */
export const fetchLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, '1m'),
  prefix: 'rl:fetch',
});
