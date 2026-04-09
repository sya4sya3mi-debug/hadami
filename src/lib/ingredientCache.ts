import { SupabaseClient } from "@supabase/supabase-js";

/** キャッシュ検索結果の型 */
export interface CachedIngredients {
  ingredients: string;
  isQuasiDrug?: boolean;
  activeIngredients?: string;
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

/** キャッシュから成分リスト＋有効成分情報を検索 */
export async function lookupIngredientCacheFull(
  supabase: SupabaseClient,
  productName: string,
  brand: string
): Promise<CachedIngredients | null> {
  const { data } = await supabase
    .from("ingredient_cache")
    .select("ingredients, is_quasi_drug, active_ingredients")
    .ilike("product_name", productName)
    .ilike("brand", brand)
    .limit(1)
    .single();

  if (!data?.ingredients) return null;

  return {
    ingredients: data.ingredients,
    isQuasiDrug: data.is_quasi_drug ?? undefined,
    activeIngredients: data.active_ingredients ?? undefined,
  };
}

/** 成分検索結果をキャッシュに保存（有効成分情報対応） */
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
