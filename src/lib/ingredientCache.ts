import { SupabaseClient } from "@supabase/supabase-js";

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

/** 成分検索結果をキャッシュに保存 */
export async function saveIngredientCache(
  supabase: SupabaseClient,
  productName: string,
  brand: string,
  ingredients: string
): Promise<void> {
  const { error } = await supabase
    .from("ingredient_cache")
    .upsert(
      { product_name: productName, brand, ingredients },
      { onConflict: "product_name,brand" }
    );

  if (error) {
    console.error("[ingredient_cache] save error:", error.message);
  }
}
