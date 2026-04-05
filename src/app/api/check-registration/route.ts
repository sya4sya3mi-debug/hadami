import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BETA_USER_LIMIT = 15;

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const allowed = (count ?? 0) < BETA_USER_LIMIT;
  return NextResponse.json({ allowed, count: count ?? 0, limit: BETA_USER_LIMIT });
}
