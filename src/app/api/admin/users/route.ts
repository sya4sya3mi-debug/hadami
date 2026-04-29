import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
const DEFAULT_MONTHLY_SCAN_LIMIT = 30;
const LEGACY_SCAN_LIMIT_MARKER = "__limit__";

function isUserScanLimitsTableMissingError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" && error.message.includes("user_scan_limits"))
  );
}

async function upsertLegacyScanLimit(userId: string, monthlyScanLimit: number) {
  return supabaseAdmin
    .from("scan_usage")
    .upsert(
      { user_id: userId, month: LEGACY_SCAN_LIMIT_MARKER, count: monthlyScanLimit },
      { onConflict: "user_id,month" }
    );
}

async function deleteLegacyScanLimit(userId: string) {
  return supabaseAdmin
    .from("scan_usage")
    .delete()
    .eq("user_id", userId)
    .eq("month", LEGACY_SCAN_LIMIT_MARKER);
}

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
};

type ActivatedProfile = {
  id: string;
  invite_activated_at: string;
};

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function listAllAuthUsers() {
  const perPage = 1000;
  let page = 1;
  const users: AuthUser[] = [];

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { users: [], error };
    }

    const pageUsers = (data?.users ?? []) as AuthUser[];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }
    page += 1;
  }

  return { users, error: null };
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const [{ users, error: usersError }, activatedProfilesResult] = await Promise.all([
    listAllAuthUsers(),
    supabaseAdmin
      .from("profiles")
      .select("id, invite_activated_at")
      .not("invite_activated_at", "is", null),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  if (activatedProfilesResult.error) {
    return NextResponse.json({ error: activatedProfilesResult.error.message }, { status: 500 });
  }

  const activatedProfiles = (activatedProfilesResult.data ?? []) as ActivatedProfile[];
  const activatedUserIds = activatedProfiles.map((row) => row.id);
  if (activatedUserIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const authUserById = new Map(users.map((u) => [u.id, u]));
  const inviteActivatedAtByUserId = new Map(
    activatedProfiles.map((row) => [row.id, row.invite_activated_at])
  );
  const activatedAuthUsers = activatedUserIds
    .map((id) => authUserById.get(id))
    .filter((u): u is AuthUser => Boolean(u));

  const currentMonth = new Date().toISOString().substring(0, 7);
  const scanLimitsPromise = activatedUserIds.length
    ? supabaseAdmin
        .from("user_scan_limits")
        .select("user_id, monthly_limit")
        .in("user_id", activatedUserIds)
    : Promise.resolve({
        data: [] as { user_id: string; monthly_limit: number }[],
        error: null,
      });

  const legacyLimitsPromise = activatedUserIds.length
    ? supabaseAdmin
        .from("scan_usage")
        .select("user_id, count")
        .eq("month", LEGACY_SCAN_LIMIT_MARKER)
        .in("user_id", activatedUserIds)
    : Promise.resolve({
        data: [] as { user_id: string; count: number }[],
        error: null,
      });

  const [productsResult, scansResult, discoveriesResult, scanLimitsResult, legacyLimitsResult] = await Promise.all([
    supabaseAdmin.from("products").select("user_id").in("user_id", activatedUserIds),
    supabaseAdmin
      .from("scan_usage")
      .select("user_id, count")
      .eq("month", currentMonth)
      .in("user_id", activatedUserIds),
    supabaseAdmin.from("zukan_discoveries").select("user_id").in("user_id", activatedUserIds),
    scanLimitsPromise,
    legacyLimitsPromise,
  ]);

  if (productsResult.error || scansResult.error || discoveriesResult.error) {
    const error = productsResult.error || scansResult.error || discoveriesResult.error;
    return NextResponse.json({ error: error?.message ?? "予期しないエラーが発生しました" }, { status: 500 });
  }
  if (scanLimitsResult.error && !isUserScanLimitsTableMissingError(scanLimitsResult.error)) {
    return NextResponse.json({ error: scanLimitsResult.error.message }, { status: 500 });
  }
  if (legacyLimitsResult.error) {
    return NextResponse.json({ error: legacyLimitsResult.error.message }, { status: 500 });
  }

  const productCount: Record<string, number> = {};
  const scanCount: Record<string, number> = {};
  const discoveryCount: Record<string, number> = {};
  const userScanLimit: Record<string, number> = {};

  (productsResult.data ?? []).forEach((row: { user_id: string }) => {
    productCount[row.user_id] = (productCount[row.user_id] ?? 0) + 1;
  });
  (scansResult.data ?? []).forEach((row: { user_id: string; count: number }) => {
    scanCount[row.user_id] = (scanCount[row.user_id] ?? 0) + (row.count ?? 0);
  });
  (discoveriesResult.data ?? []).forEach((row: { user_id: string }) => {
    discoveryCount[row.user_id] = (discoveryCount[row.user_id] ?? 0) + 1;
  });
  (scanLimitsResult.data ?? []).forEach((row: { user_id: string; monthly_limit: number }) => {
    if (typeof row.monthly_limit === "number" && row.monthly_limit > 0) {
      userScanLimit[row.user_id] = row.monthly_limit;
    }
  });
  (legacyLimitsResult.data ?? []).forEach((row: { user_id: string; count: number }) => {
    if (!(row.user_id in userScanLimit) && typeof row.count === "number" && row.count > 0) {
      userScanLimit[row.user_id] = row.count;
    }
  });

  const result = activatedAuthUsers.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    createdAt: u.created_at ?? "",
    lastSignIn: u.last_sign_in_at ?? null,
    inviteActivatedAt: inviteActivatedAtByUserId.get(u.id) ?? null,
    isBanned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
    products: productCount[u.id] ?? 0,
    scansThisMonth: scanCount[u.id] ?? 0,
    discoveries: discoveryCount[u.id] ?? 0,
    monthlyScanLimit: userScanLimit[u.id] ?? DEFAULT_MONTHLY_SCAN_LIMIT,
  }));

  result.sort(
    (a, b) => new Date(b.inviteActivatedAt ?? b.createdAt).getTime() - new Date(a.inviteActivatedAt ?? a.createdAt).getTime()
  );

  return NextResponse.json({ users: result });
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; ban?: boolean; monthlyScanLimit?: number }
    | null;
  const id = body?.id;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  if (typeof body?.monthlyScanLimit === "number") {
    const monthlyScanLimit = Math.trunc(body.monthlyScanLimit);
    if (!Number.isFinite(monthlyScanLimit) || monthlyScanLimit < 1 || monthlyScanLimit > 100) {
      return NextResponse.json({ error: "上限は1〜100で指定してください" }, { status: 400 });
    }

    if (monthlyScanLimit === DEFAULT_MONTHLY_SCAN_LIMIT) {
      const { error } = await supabaseAdmin
        .from("user_scan_limits")
        .delete()
        .eq("user_id", id);
      if (error && !isUserScanLimitsTableMissingError(error)) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      await deleteLegacyScanLimit(id);
      return NextResponse.json({ success: true, monthlyScanLimit });
    }

    const { error } = await supabaseAdmin
      .from("user_scan_limits")
      .upsert(
        {
          user_id: id,
          monthly_limit: monthlyScanLimit,
          updated_by: userId,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      if (!isUserScanLimitsTableMissingError(error)) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const legacy = await upsertLegacyScanLimit(id, monthlyScanLimit);
      if (legacy.error) {
        return NextResponse.json({ error: legacy.error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, monthlyScanLimit });
    }

    await deleteLegacyScanLimit(id);
    return NextResponse.json({ success: true, monthlyScanLimit });
  }

  if (typeof body?.ban !== "boolean") {
    return NextResponse.json({ error: "更新内容が不正です" }, { status: 400 });
  }

  if (id === userId) {
    return NextResponse.json({ error: "自分自身をBANすることはできません" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: body.ban ? "87600h" : "none",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  if (id === userId) {
    return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
