/**
 * In-memory rate limiter.
 *
 * LIMITATION: This Map is scoped to a single serverless function instance.
 * On Vercel, each cold start or new instance gets a fresh Map. This means:
 * - It catches rapid-fire bursts within one instance (still valuable)
 * - It does NOT persist across deploys, cold starts, or multiple instances
 *
 * For authenticated endpoints, the atomic scan quota (try_reserve_scan RPC)
 * provides the durable limit. This in-memory check is a first line of defense
 * against unauthenticated abuse and rapid bursts.
 *
 * For production DoS protection, deploy Vercel Firewall / WAF rules.
 */
const store = new Map<string, { count: number; resetAt: number }>();
let callCount = 0;

export function rateLimit(
  ip: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();

  // Periodic cleanup every 100 calls
  callCount++;
  if (callCount % 100 === 0) {
    store.forEach((entry, key) => {
      if (entry.resetAt <= now) store.delete(key);
    });
  }

  // Hard cap on map size to prevent memory exhaustion
  if (store.size > 10_000) {
    store.clear();
  }

  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0,
  };
}

export function getClientIp(req: Request): string {
  // On Vercel, x-real-ip is set by the platform and cannot be spoofed by the client.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: x-forwarded-for (leftmost entry). Can be spoofed if no trusted proxy.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
