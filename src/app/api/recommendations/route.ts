import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { batchGetCached, fetchAndCacheRakuten } from "@/lib/rakuten";
import {
  getIngredientById,
  MASTER_INGREDIENTS,
} from "@/lib/ingredients";
import type { RakutenProduct } from "@/types";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { supabase, user } = auth;

  // 1. DBクエリを並列実行
  const [{ count: scanHistoryCount }, { data: profile }] = await Promise.all([
    supabase
      .from("scan_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_ingredient_profile")
      .select("ingredient_id, encounter_count")
      .eq("user_id", user.id)
      .order("encounter_count", { ascending: false }),
  ]);

  if (!profile || profile.length === 0) {
    return NextResponse.json({
      similar: {
        label: "あなたの好みに近いアイテム",
        reason: "スキャン履歴が増えると提案が始まります",
        products: [],
      },
      discovery: {
        label: "まだ出会っていない注目成分",
        reason: "スキャン履歴が増えると提案が始まります",
        products: [],
      },
      profile: { totalScans: 0, knownIngredientCount: 0 },
    });
  }

  // 2. コード側の成分データで補強
  const enriched = profile
    .map((row) => ({
      ...row,
      ingredient: getIngredientById(row.ingredient_id),
    }))
    .filter((row) => row.ingredient !== undefined);

  const knownIds = new Set(enriched.map((e) => e.ingredient_id));

  // 3. 軸1: よく出会う成分のキーワード生成
  const topIngredients = enriched.slice(0, 3);

  // 4. 軸2: 未発見の高レアリティ成分
  const unknownRare = MASTER_INGREDIENTS.filter(
    (i) =>
      (i.rarity === "rare" || i.rarity === "legendary") &&
      !knownIds.has(i.id)
  ).slice(0, 3);

  const discoveryKeywords = unknownRare.map(
    (i) => `${i.nameJa} 配合 化粧品`
  );

  // 5. 楽天API検索（discoveryのみ・軸1は非表示のためスキップ）
  // キャッシュ確認 → 未キャッシュ分のみAPI呼び出し（最大1件なのでsleep不要）
  const discoveryKeyword = discoveryKeywords[0];
  let discoveryProducts: RakutenProduct[] = [];

  if (discoveryKeyword) {
    const cached = await batchGetCached([discoveryKeyword], supabase);
    discoveryProducts = cached[discoveryKeyword]
      ?? await fetchAndCacheRakuten(discoveryKeyword, supabase);
    discoveryProducts = discoveryProducts.slice(0, 6);
  }

  const similarProducts: RakutenProduct[] = [];

  const totalScans = scanHistoryCount ?? 0;

  return NextResponse.json({
    similar: {
      label: "あなたの好みに近いアイテム",
      reason: topIngredients.length > 0
        ? `スキャン${totalScans}回の傾向から`
        : "",
      products: similarProducts,
    },
    discovery: {
      label: "まだ出会っていない注目成分",
      reason: unknownRare.length > 0
        ? `${knownIds.size}成分と未重複`
        : "",
      ingredientHints: unknownRare.map((i) => i.nameJa),
      products: discoveryProducts,
    },
    profile: {
      totalScans,
      knownIngredientCount: knownIds.size,
    },
  });
}
