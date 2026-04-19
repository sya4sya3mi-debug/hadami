import { SupabaseClient } from "@supabase/supabase-js";

/** キャッシュ検索結果の型 */
export interface CachedIngredients {
  ingredients: string;
  isQuasiDrug?: boolean;
  activeIngredients?: string;
}

/**
 * キャッシュキー用の正規化
 * 全角→半角、スペース除去、小文字化で表記揺れを吸収
 */
export function normalizeCacheKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\s\-\u2010-\u2015・]/g, "")
    .toLowerCase()
    .trim();
}

/** キャッシュから成分リストを検索（大文字小文字を無視） */
export async function lookupIngredientCache(
  supabase: SupabaseClient,
  productName: string,
  brand: string
): Promise<string | null> {
  const { data } = await supabase
    .from("ingredient_cache")
    .select("ingredients")
    .ilike("product_name", productName)
    .ilike("brand", brand)
    .limit(1)
    .single();

  return data?.ingredients ?? null;
}

/** キャッシュから成分リスト＋有効成分情報を検索（正規化キー対応） */
export async function lookupIngredientCacheFull(
  supabase: SupabaseClient,
  productName: string,
  brand: string
): Promise<CachedIngredients | null> {
  // まず正規化キーで検索（揺れに強い）
  const normalizedName = normalizeCacheKey(productName);
  const normalizedBrand = normalizeCacheKey(brand);

  const { data: byNormalized } = await supabase
    .from("ingredient_cache")
    .select("ingredients, is_quasi_drug, active_ingredients")
    .eq("normalized_name", normalizedName)
    .eq("normalized_brand", normalizedBrand)
    .limit(1)
    .single();

  const data = byNormalized;

  // 正規化キーでヒットしなければ ILIKE フォールバック
  if (!data) {
    const { data: byIlike } = await supabase
      .from("ingredient_cache")
      .select("ingredients, is_quasi_drug, active_ingredients")
      .ilike("product_name", productName)
      .ilike("brand", brand)
      .limit(1)
      .single();

    if (!byIlike?.ingredients) return null;

    return {
      ingredients: byIlike.ingredients,
      isQuasiDrug: byIlike.is_quasi_drug ?? undefined,
      activeIngredients: byIlike.active_ingredients ?? undefined,
    };
  }

  if (!data.ingredients) return null;

  return {
    ingredients: data.ingredients,
    isQuasiDrug: data.is_quasi_drug ?? undefined,
    activeIngredients: data.active_ingredients ?? undefined,
  };
}

/** 成分検索結果をキャッシュに保存（正規化キー対応） */
export async function saveIngredientCache(
  supabase: SupabaseClient,
  productName: string,
  brand: string,
  ingredients: string,
  isQuasiDrug?: boolean,
  activeIngredients?: string,
): Promise<void> {
  const row: Record<string, unknown> = {
    product_name: productName,
    brand,
    normalized_name: normalizeCacheKey(productName),
    normalized_brand: normalizeCacheKey(brand),
    ingredients,
  };
  if (isQuasiDrug !== undefined) row.is_quasi_drug = isQuasiDrug;
  if (activeIngredients !== undefined) row.active_ingredients = activeIngredients;

  const { error } = await supabase
    .from("ingredient_cache")
    .upsert(row, { onConflict: "product_name,brand" });

  if (error) {
    console.error("[ingredient_cache] save error:", error.message);
  }
}
