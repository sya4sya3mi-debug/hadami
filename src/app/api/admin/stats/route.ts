import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const currentMonth = new Date().toISOString().substring(0, 7);

  const [
    usersResult,
    scansThisMonthResult,
    totalScansResult,
    productsResult,
    discoveriesResult,
    routinesResult,
    inviteCodesResult,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from("scan_usage").select("user_id, count").eq("month", currentMonth),
    supabaseAdmin.from("scan_limit_by_email").select("total_count"),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("zukan_discoveries").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("routines").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("invitation_codes").select("is_active, used_count"),
  ]);

  const totalUsers = usersResult.data?.users?.length ?? 0;
  const scansThisMonth = (scansThisMonthResult.data ?? []).reduce(
    (sum: number, row: { count: number }) => sum + (row.count ?? 0),
    0
  );
  const activeUsersThisMonth = scansThisMonthResult.data?.length ?? 0;
  const totalScans = (totalScansResult.data ?? []).reduce(
    (sum: number, row: { total_count: number }) => sum + (row.total_count ?? 0),
    0
  );
  const totalProducts = productsResult.count ?? 0;
  const totalDiscoveries = discoveriesResult.count ?? 0;
  const totalRoutines = routinesResult.count ?? 0;
  const activeInviteCodes = (inviteCodesResult.data ?? []).filter((c) => c.is_active).length;
  const totalInviteUses = (inviteCodesResult.data ?? []).reduce(
    (sum: number, c: { used_count: number }) => sum + (c.used_count ?? 0),
    0
  );

  return NextResponse.json({
    totalUsers,
    scansThisMonth,
    activeUsersThisMonth,
    totalScans,
    totalProducts,
    totalDiscoveries,
    totalRoutines,
    activeInviteCodes,
    totalInviteUses,
    currentMonth,
  });
}
