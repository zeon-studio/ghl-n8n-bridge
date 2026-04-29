import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if we have the credentials (prevents build errors)
let redis: Redis | undefined;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (e) {
  console.warn('Failed to initialize Upstash Redis');
}

// 60 requests per minute for token and registration endpoints
export const tokenRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/token',
}) : null;

// 1000 requests per minute for GHL webhook ingestion
export const webhookRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/webhook',
}) : null;

// Global soft limit burst (10 req/sec) to prevent sudden spikes from taking down the app
export const burstRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(10, '1 s', 10),
  analytics: false,
  prefix: '@upstash/ratelimit/burst',
}) : null;
