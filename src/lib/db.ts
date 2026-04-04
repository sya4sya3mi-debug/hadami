import { SupabaseClient } from "@supabase/supabase-js";
import { getSignedImageUrl } from "./storage";

const USER_LIMIT = 20;

/**
 * 画像のデコードサイズ上限 (5MB)。
 * Supabase Storage バケット "product-images" にも同じ上限を設定すること（ダッシュボード > Storage > Policies）。
 */
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImageSize(base64Data: string): boolean {
  const estimatedBytes = Math.ceil(base64Data.length * 0.75);
  return estimatedBytes <= MAX_PRODUCT_IMAGE_BYTES;
}

/** Supabaseに製品を保存 */
export async function saveProductToDb(
  supabase: SupabaseClient,
  userId: string,
  product: {
    name: string;
    brand: string;
    productType?: string;
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
      product_type: product.productType ?? "other",
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
      if (!validateImageSize(base64Data)) {
        return { error: "画像サイズが上限(5MB)を超えています", productId: data.id, imageUrl: null };
      }
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const filePath = `${userId}/${data.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, bytes, { contentType: "image/jpeg", upsert: true });

      if (!uploadError) {
        // パスをDBに保存（signed URLは読み取り時に生成）
        const { error: updateError } = await supabase
          .from("products")
          .update({ package_image_url: filePath })
          .eq("id", data.id)
          .eq("user_id", userId);

        if (!updateError) {
          // 呼び出し元がすぐ表示できるよう signed URL を生成
          imageUrl = await getSignedImageUrl(supabase, filePath);
        } else {
          // DBにURLを残せない場合は、端末間の表示差を防ぐため保存を巻き戻す
          await supabase.storage.from("product-images").remove([filePath]);
          await supabase
            .from("products")
            .delete()
            .eq("id", data.id)
            .eq("user_id", userId);

          return {
            error: "画像の保存に失敗しました。もう一度お試しください。",
            productId: null,
            imageUrl: null,
          };
        }
      }
    }
  }

  return { error: null, productId: data.id, imageUrl };
}

/** 製品のパッケージ画像のみ更新 */
export async function updateProductImageInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  imageBase64: string
): Promise<{ error: string | null; imageUrl: string | null }> {
  const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  if (!base64Data) return { error: "画像データが不正です", imageUrl: null };

  if (!validateImageSize(base64Data)) {
    return { error: "画像サイズが上限(5MB)を超えています", imageUrl: null };
  }

  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const filePath = `${userId}/${productId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, bytes, { contentType: "image/jpeg", upsert: true });

  if (uploadError) return { error: uploadError.message, imageUrl: null };

  const { error: updateError } = await supabase
    .from("products")
    .update({ package_image_url: filePath })
    .eq("id", productId)
    .eq("user_id", userId);

  if (updateError) return { error: updateError.message, imageUrl: null };

  const imageUrl = await getSignedImageUrl(supabase, filePath);
  return { error: null, imageUrl };
}

/** 製品のパッケージ画像のみ削除 */
export async function deleteProductImageFromDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ error: string | null }> {
  const filePath = `${userId}/${productId}.jpg`;
  await supabase.storage.from("product-images").remove([filePath]);

  const { error } = await supabase
    .from("products")
    .update({ package_image_url: null })
    .eq("id", productId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

/** Supabaseから製品を削除 */
export async function deleteProductFromDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string
) {
  // Storage の画像も削除
  const filePath = `${userId}/${productId}.jpg`;
  await supabase.storage.from("product-images").remove([filePath]);

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

/** 製品のジャンルを更新 */
export async function updateProductTypeInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  productType: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ product_type: productType })
    .eq("id", productId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
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

/** ユーザーの保存件数上限 */
export function getUserLimit() {
  return USER_LIMIT;
}

/** アカウント累計スキャン上限 */
export function getAccountScanLimit() {
  return 10;
}

/** @deprecated 後方互換のため残す */
export function getMonthlyScanLimit() {
  return getAccountScanLimit();
}

/** 現在の年月を YYYY-MM 形式で取得 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** ログインユーザーの累計スキャン回数を取得（user_id ベース） */
export async function getScanCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId);
  if (!data || data.length === 0) return 0;
  return data.reduce((sum: number, row: { count: number }) => sum + (row.count ?? 0), 0);
}

/** メールアドレス単位の累計スキャン回数を取得（退会→再入会でもリセットされない） */
export async function getScanCountByEmail(supabase: SupabaseClient, email: string): Promise<number> {
  const { data } = await supabase
    .from("scan_limit_by_email")
    .select("total_count")
    .eq("email", email)
    .single();
  return data?.total_count ?? 0;
}

/** 原子的にスキャン枠を予約（チェック＋インクリメントを1操作で実行）。上限内なら true。 */
export async function tryReserveScan(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<boolean> {
  const limit = getAccountScanLimit();
  const { data, error } = await supabase.rpc("try_reserve_scan", {
    p_email: email,
    p_user_id: userId,
    p_limit: limit,
  });
  if (error) {
    console.error("tryReserveScan RPC error:", error);
    return false;
  }
  return data === true;
}

/** API 失敗時に予約済みスキャン枠を解放する */
export async function rollbackScan(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<void> {
  const { error } = await supabase.rpc("rollback_scan", {
    p_email: email,
    p_user_id: userId,
  });
  if (error) {
    console.error("rollbackScan RPC error:", error);
  }
}

/** @deprecated tryReserveScan に置き換え。後方互換のため残す */
export async function incrementScanCount(supabase: SupabaseClient, userId: string, email: string) {
  const month = getCurrentMonth();

  // user_id ベース（月別内訳の記録用）
  const { data } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (data) {
    await supabase
      .from("scan_usage")
      .update({ count: data.count + 1 })
      .eq("user_id", userId)
      .eq("month", month);
  } else {
    await supabase
      .from("scan_usage")
      .insert({ user_id: userId, month, count: 1 });
  }

  // メールアドレスベース（退会耐性のある累計）
  const { data: emailRow } = await supabase
    .from("scan_limit_by_email")
    .select("total_count")
    .eq("email", email)
    .single();

  if (emailRow) {
    await supabase
      .from("scan_limit_by_email")
      .update({ total_count: emailRow.total_count + 1, updated_at: new Date().toISOString() })
      .eq("email", email);
  } else {
    await supabase
      .from("scan_limit_by_email")
      .insert({ email, total_count: 1 });
  }
}
