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

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w぀-ゟ゠-ヿ一-鿿]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** GET: 未識別成分の集計一覧 + 無視済みリスト。?registered=1 の場合は登録済み成分名一覧を返す */
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("registered") === "1") {
    const { data } = await supabaseAdmin
      .from("custom_ingredients")
      .select("name_ja");
    return NextResponse.json({ names: (data ?? []).map((r: { name_ja: string }) => r.name_ja) });
  }

  const [productsResult, dismissedResult] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("unknown_ingredients")
      .not("unknown_ingredients", "is", null),
    supabaseAdmin
      .from("dismissed_unknowns")
      .select("name, dismissed_at"),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of productsResult.data ?? []) {
    const arr: string[] = row.unknown_ingredients ?? [];
    for (const name of arr) {
      const trimmed = name.trim();
      if (trimmed.length > 0) {
        countMap[trimmed] = (countMap[trimmed] ?? 0) + 1;
      }
    }
  }

  const dismissedNames = new Set(
    (dismissedResult.data ?? []).map((d: { name: string }) => d.name)
  );
  const dismissedAt: Record<string, string> = {};
  for (const d of dismissedResult.data ?? []) {
    dismissedAt[d.name] = d.dismissed_at;
  }

  const items = Object.entries(countMap)
    .map(([name, count]) => ({
      name,
      count,
      dismissed: dismissedNames.has(name),
      dismissedAt: dismissedAt[name] ?? null,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ items });
}

/** POST: 成分名を無視済みにする */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { name } = (await request.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "name が必要です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("dismissed_unknowns")
    .upsert({ name: name.trim() }, { onConflict: "name" });

  if (error) {
    console.error("[admin/unknown-ingredients] dismiss upsert error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** PATCH: 未識別成分をカスタム成分マスタへ登録 */
export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const payload = (await request.json()) as {
    nameJa: string;
    nameInci?: string;
    categories?: string[];
    genre?: string;
    color?: string;
    note?: string;
  };

  if (!payload.nameJa?.trim()) {
    return NextResponse.json({ error: "nameJa が必要です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("custom_ingredients")
    .upsert(
      {
        id: slugify(payload.nameJa),
        name_ja: payload.nameJa.trim(),
        name_inci: payload.nameInci?.trim() ?? "",
        categories: payload.categories ?? [],
        genre: payload.genre ?? "base",
        color: payload.color ?? "#9E9E9E",
        note: payload.note?.trim() ?? "",
      },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[admin/unknown-ingredients] custom_ingredients upsert error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE: 無視を取り消す */
export async function DELETE(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { name } = (await request.json()) as { name: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "name が必要です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("dismissed_unknowns")
    .delete()
    .eq("name", name.trim());

  if (error) {
    console.error("[admin/unknown-ingredients] dismiss delete error:", error);
    return NextResponse.json({ error: "予期しないエラーが発生しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
