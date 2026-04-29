import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  // ユーザー単位: 5分に1回
  // RPC は MV 全体を CONCURRENTLY refresh する重い処理なので、
  // RPC 障害時はサーバ保護を優先して拒否側 (failOpen: false) に倒す。
  const userRl = await rateLimit(
    `user:${auth.user.id}`,
    5 * 60_000,
    1,
    "refresh-profile",
    { failOpen: false }
  );
  if (!userRl.allowed) {
    // 呼び出し元 (saveScanHistory) は fire-and-forget なので 200 を返す
    return NextResponse.json({ ok: true, skipped: "rate_limited" });
  }

  // IP 単位: 多重認証ユーザーや認証回し攻撃の防御 (1分に5回)
  const ipRl = await rateLimit(
    getClientIp(request),
    60_000,
    5,
    "refresh-profile-ip",
    { failOpen: false }
  );
  if (!ipRl.allowed) {
    return NextResponse.json({ ok: true, skipped: "rate_limited" });
  }

  // SECURITY DEFINER 関数なので認証ユーザーでも実行可能。
  // 加えて 019 のデバウンスで MV のグローバル refresh も 60 秒に 1 回に制限される。
  const { error } = await auth.supabase.rpc("refresh_user_ingredient_profile");

  if (error) {
    console.error("Failed to refresh MV:", error);
    return NextResponse.json(
      { error: "Failed to refresh profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
