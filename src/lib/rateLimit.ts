/**
 * Persistent rate limiter backed by Supabase RPC.
 *
 * Uses the `check_rate_limit` RPC (SECURITY DEFINER, service-role only)
 * which atomically increments a counter per (key, window) and returns
 * whether the request is within the allowed budget.
 *
 * Falls back to "allow" on RPC errors so a transient DB issue
 * doesn't block all traffic — the durable scan quota (try_reserve_scan)
 * remains the hard cap for authenticated endpoints.
 */
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RateLimitOptions = {
  failOpen?: boolean;
};

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
  const failureResult = failOpen
    ? { allowed: true, remaining: maxRequests, retryAfterMs: 0 }
    : { allowed: false, remaining: 0, retryAfterMs: windowMs };

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });

    if (error) {
      console.error("rate limit RPC error:", error.message);
      return failureResult;
    }

    const allowed = data === true;
    return {
      allowed,
      remaining: allowed ? 1 : 0, // exact remaining not available from RPC
      retryAfterMs: allowed ? 0 : windowMs,
    };
  } catch (err) {
    console.error("rate limit unexpected error:", err);
    return failureResult;
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
