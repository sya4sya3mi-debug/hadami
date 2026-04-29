/**
 * Persistent rate limiter backed by Supabase RPC.
 *
 * Uses the `check_rate_limit` RPC (SECURITY DEFINER, service-role only)
 * which atomically increments a counter per (key, window) and returns
 * whether the request is within the allowed budget.
 *
 * On RPC failure with failOpen=true the limiter degrades to a
 * process-local in-memory check instead of pure fail-open. This caps
 * the blast radius if the DB-side limiter is unavailable while still
 * letting public endpoints (e.g. image-proxy) keep serving.
 */
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RateLimitOptions = {
  failOpen?: boolean;
};

const localFallback = new Map<string, { windowStart: number; count: number }>();
const LOCAL_FALLBACK_MAX_KEYS = 5000;

function localFallbackCheck(
  key: string,
  windowMs: number,
  maxRequests: number
): boolean {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const entry = localFallback.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    if (localFallback.size >= LOCAL_FALLBACK_MAX_KEYS) {
      const firstKey = localFallback.keys().next().value;
      if (firstKey !== undefined) localFallback.delete(firstKey);
    }
    localFallback.set(key, { windowStart, count: 1 });
    return 1 <= maxRequests;
  }

  entry.count++;
  return entry.count <= maxRequests;
}

export async function rateLimit(
  ip: string,
  windowMs: number,
  maxRequests: number,
  route: string = "default",
  options: RateLimitOptions = {}
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const failOpen = options.failOpen ?? true;
  const key = `ip:${ip}:${route}`;
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));

  const onRpcFailure = () => {
    if (!failOpen) {
      return { allowed: false, remaining: 0, retryAfterMs: windowMs };
    }
    const allowed = localFallbackCheck(key, windowMs, maxRequests);
    return {
      allowed,
      remaining: allowed ? 1 : 0,
      retryAfterMs: allowed ? 0 : windowMs,
    };
  };

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });

    if (error) {
      console.error("rate limit RPC error:", error.message);
      return onRpcFailure();
    }

    const allowed = data === true;
    return {
      allowed,
      remaining: allowed ? 1 : 0, // exact remaining not available from RPC
      retryAfterMs: allowed ? 0 : windowMs,
    };
  } catch (err) {
    console.error("rate limit unexpected error:", err);
    return onRpcFailure();
  }
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
