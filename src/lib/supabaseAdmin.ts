import { createClient, SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin must not be used in browser");
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client: Record<string | symbol, unknown> = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    if (typeof value === "function") {
      const fn = value as (...args: unknown[]) => unknown;
      return fn.bind(getClient());
    }
    return value;
  },
}) as SupabaseClient;
