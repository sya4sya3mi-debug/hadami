import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** 認証済みユーザーIDを取得 */
async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // read-only: API routeではCookie書き込み不要
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** GET: 招待コード一覧取得 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("invitation_codes")
    .select("id, code, label, max_uses, used_count, is_active, created_at, expires_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/invites] list error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}

/** POST: 新規コード発行 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { label, maxUses } = (await request.json()) as {
    label?: string;
    maxUses?: number;
  };

  // コードを自動生成: HADAMI-XXXX-XXXX
  const rand = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `HADAMI-${rand()}-${rand()}`;

  const { data, error } = await supabaseAdmin
    .from("invitation_codes")
    .insert({
      code,
      label: label || null,
      max_uses: maxUses ?? 1,
    })
    .select("id, code, label, max_uses, used_count, is_active, created_at")
    .single();

  if (error) {
    console.error("[admin/invites] insert error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ code: data });
}

/** PATCH: コードの有効/無効を切り替え */
export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id, isActive } = (await request.json()) as {
    id: string;
    isActive: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("invitation_codes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("[admin/invites] toggle active error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
