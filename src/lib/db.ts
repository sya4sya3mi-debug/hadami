import { SupabaseClient } from "@supabase/supabase-js";

const GUEST_LIMIT = 3;
const USER_LIMIT = 20;

/** Supabaseに製品を保存 */
export async function saveProductToDb(
  supabase: SupabaseClient,
  userId: string,
  product: {
    name: string;
    brand: string;
    ingredientIds: string[];
    unknownIngredients: string[];
    packageImageBase64?: string;
  }
) {
  // 件数チェック
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== null && count >= USER_LIMIT) {
    return { error: "limit_reached", productId: null, imageUrl: null };
  }

  // 製品を保存
  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      name: product.name,
      brand: product.brand,
      ingredient_ids: product.ingredientIds,
      unknown_ingredients: product.unknownIngredients,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, productId: null, imageUrl: null };

  let imageUrl: string | null = null;

  // 写真をStorageにアップロード
  if (product.packageImageBase64) {
    const base64Data = product.packageImageBase64.split(",")[1];
    if (base64Data) {
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const filePath = `${userId}/${data.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, bytes, { contentType: "image/jpeg", upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;

        // URLをDBに保存
        await supabase
          .from("products")
          .update({ package_image_url: imageUrl })
          .eq("id", data.id);
      }
    }
  }

  return { error: null, productId: data.id, imageUrl };
}

/** Supabaseに図鑑発見を保存 */
export async function saveDiscoveriesToDb(
  supabase: SupabaseClient,
  userId: string,
  ingredientIds: string[]
) {
  const rows = ingredientIds.map((id) => ({
    user_id: userId,
    ingredient_id: id,
  }));

  await supabase.from("zukan_discoveries").upsert(rows, {
    onConflict: "user_id,ingredient_id",
    ignoreDuplicates: true,
  });
}

/** ユーザーの製品数を取得 */
export async function getProductCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

/** ゲストの保存件数上限 */
export function getGuestLimit() {
  return GUEST_LIMIT;
}

/** ユーザーの保存件数上限 */
export function getUserLimit() {
  return USER_LIMIT;
}
