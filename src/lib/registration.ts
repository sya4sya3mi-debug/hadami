import "server-only";

import { BETA_USER_LIMIT } from "@/lib/limits";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getRegisteredProfileCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("display_name", "is", null)
    .neq("display_name", "");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getRegistrationAvailability() {
  const count = await getRegisteredProfileCount();

  return {
    allowed: count < BETA_USER_LIMIT,
    count,
    limit: BETA_USER_LIMIT,
  };
}
