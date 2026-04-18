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

/** GET: ユーザー一覧＋統計 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data: usersData, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const users = usersData?.users ?? [];
  const userIds = users.map((u) => u.id);
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [productsResult, scansResult, discoveriesResult] =
    await Promise.all([
      supabaseAdmin.from("products").select("user_id").in("user_id", userIds),
      supabaseAdmin
        .from("scan_usage")
        .select("user_id, count")
        .eq("month", currentMonth)
        .in("user_id", userIds),
      supabaseAdmin
        .from("zukan_discoveries")
        .select("user_id")
        .in("user_id", userIds),
    ]);

  // ユーザーごとに集計
  const productCount: Record<string, number> = {};
  const scanCount: Record<string, number> = {};
  const discoveryCount: Record<string, number> = {};

  (productsResult.data ?? []).forEach((row: { user_id: string }) => {
    productCount[row.user_id] = (productCount[row.user_id] ?? 0) + 1;
  });
  (scansResult.data ?? []).forEach((row: { user_id: string; count: number }) => {
    scanCount[row.user_id] = (scanCount[row.user_id] ?? 0) + (row.count ?? 0);
  });
  (discoveriesResult.data ?? []).forEach((row: { user_id: string }) => {
    discoveryCount[row.user_id] = (discoveryCount[row.user_id] ?? 0) + 1;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = users.map((u: any) => ({
    id: u.id,
    email: u.email ?? "",
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    isBanned: u.banned_until
      ? new Date(u.banned_until) > new Date()
      : false,
    products: productCount[u.id] ?? 0,
    scansThisMonth: scanCount[u.id] ?? 0,
    discoveries: discoveryCount[u.id] ?? 0,
  }));

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ users: result });
}

/** PATCH: ユーザーのBAN / BAN解除 */
export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id, ban } = (await request.json()) as { id: string; ban: boolean };

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  if (id === userId) {
    return NextResponse.json(
      { error: "自分自身をBANすることはできません" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: ban ? "87600h" : "none",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
