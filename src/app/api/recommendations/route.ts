import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { searchRakutenCached } from "@/lib/rakuten";
import {
  getIngredientById,
  MASTER_INGREDIENTS,
} from "@/lib/ingredients";
import type { RakutenProduct } from "@/types";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { supabase, user } = auth;

  // 1. ユーザーの成分プロファイル取得（MV）
  const { data: profile } = await supabase
    .from("user_ingredient_profile")
    .select("*")
    .eq("user_id", user.id)
    .order("encounter_count", { ascending: false });

  const hasProfile = profile && profile.length > 0;

  // 2. コード側の成分データで補強
  const enriched = hasProfile
    ? profile
        .map((row) => ({
          ...row,
          ingredient: getIngredientById(row.ingredient_id),
        }))
        .filter((row) => row.ingredient !== undefined)
    : [];

  const knownIds = new Set(enriched.map((e) => e.ingredient_id));

  // 3. 軸1: よく出会う成分のキーワード生成
  //    履歴なしの場合は人気スキンケアのおすすめを表示
  const topIngredients = enriched.slice(0, 3);
  const similarKeywords = hasProfile
    ? topIngredients
        .map((e) => `${e.ingredient!.nameJa} スキンケア 人気`)
        .filter((k) => k.trim() !== "スキンケア 人気")
    : ["スキンケア 人気 ランキング"];

  // 4. 軸2: 未発見の高レアリティ成分
  const unknownRare = MASTER_INGREDIENTS.filter(
    (i) =>
      (i.rarity === "rare" || i.rarity === "legendary") &&
      !knownIds.has(i.id)
  ).slice(0, 3);

  const discoveryKeywords = unknownRare.map(
    (i) => `${i.nameJa} 配合 化粧品`
  );

  // 5. 楽天API検索（順次実行、レートリミット対応）
  const allKeywords = [
    ...similarKeywords.slice(0, 2),
    ...discoveryKeywords.slice(0, 2),
  ];

  const searchResults: Record<string, RakutenProduct[]> = {};
  for (const keyword of allKeywords) {
    try {
      searchResults[keyword] = await searchRakutenCached(keyword, supabase);
    } catch (e) {
      console.error("Rakuten search failed for keyword:", keyword, e);
      searchResults[keyword] = [];
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  // 6. 結果の振り分け
  const similarProducts = similarKeywords
    .slice(0, 2)
    .flatMap((k) => searchResults[k] || [])
    .slice(0, 3);

  const discoveryProducts = discoveryKeywords
    .slice(0, 2)
    .flatMap((k) => searchResults[k] || [])
    .slice(0, 3);

  const totalScans = enriched.reduce(
    (sum, e) => sum + Number(e.encounter_count),
    0
  );

  return NextResponse.json({
    similar: {
      label: "あなたの好みに近いアイテム",
      reason: topIngredients.length > 0
        ? `スキャン${totalScans}回の傾向から`
        : "人気のスキンケアアイテム",
      products: similarProducts,
    },
    discovery: {
      label: "まだ出会っていない注目成分",
      reason: unknownRare.length > 0
        ? hasProfile
          ? `${knownIds.size}成分と未重複`
          : "注目の高レア成分"
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
