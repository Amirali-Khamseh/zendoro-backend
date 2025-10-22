import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware";

const HOURLY_LIMIT = 100;
const BURST = 10;
const TOKENS_PER_SECOND = HOURLY_LIMIT / 3600;

type Bucket = {
  tokens: number;
  lastRefill: number;
  hourlyTimestamps: number[];
};

// In-memory store keyed by userId or IP for unauthenticated requests
const buckets = new Map<string | number, Bucket>();

function getKey(req: Request) {
  const a = req as AuthRequest;
  return a.user?.userId ?? req.ip;
}

export function agentRateLimiter(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const key = getKey(req);
  const now = Date.now() / 1000;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: BURST, lastRefill: now, hourlyTimestamps: [] };
    buckets.set(key, bucket);
  }

  // Refill token bucket
  const elapsed = Math.max(0, now - bucket.lastRefill);
  const refill = elapsed * TOKENS_PER_SECOND;
  bucket.tokens = Math.min(BURST, bucket.tokens + refill);
  bucket.lastRefill = now;

  // Clean up hourly timestamps older than 1 hour
  bucket.hourlyTimestamps = bucket.hourlyTimestamps.filter(
    (ts) => ts > now - 3600
  );

  // Enforce hourly quota
  if (bucket.hourlyTimestamps.length >= HOURLY_LIMIT) {
    // compute retry-after (seconds until oldest timestamp falls out of window)
    const oldest = bucket.hourlyTimestamps[0];
    const retryAfter = Math.ceil(Math.max(0, oldest + 3600 - now));
    res.setHeader("Retry-After", String(retryAfter));
    return res
      .status(429)
      .json({
        error: `Hourly message limit exceeded. Retry after ${retryAfter} seconds.`,
      });
  }

  // Enforce token availability (throttle)
  if (bucket.tokens < 1) {
    const needed = 1 - bucket.tokens;
    const wait = Math.ceil(needed / TOKENS_PER_SECOND);
    res.setHeader("Retry-After", String(wait));
    return res
      .status(429)
      .json({
        error: `Too many requests — slow down. Retry after ${wait} seconds.`,
      });
  }

  // Consume a token and record the timestamp for hourly quota
  bucket.tokens -= 1;
  bucket.hourlyTimestamps.push(now);

  next();
}

// Expose buckets map for inspection/testing if needed
export const _buckets = buckets;
