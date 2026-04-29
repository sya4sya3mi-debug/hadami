import { SupabaseClient } from "@supabase/supabase-js";
import {
  getProductImageDisplayPath,
  getProductImageSharePath,
} from "@/lib/productImages";
import { r2Delete } from "@/lib/r2";

const USER_LIMIT = 30;
const LEGACY_SCAN_LIMIT_MARKER = "__limit__";
const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
const UPLOAD_MAX_DIMENSION = 1600;
const UPLOAD_WEBP_QUALITY = 0.95;

function validateImageSize(base64Data: string): boolean {
  const estimatedBytes = Math.ceil(base64Data.length * 0.75);
  return estimatedBytes <= MAX_PRODUCT_IMAGE_BYTES;
}

function compressImage(base64Full: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > UPLOAD_MAX_DIMENSION || height > UPLOAD_MAX_DIMENSION) {
        const ratio = Math.min(UPLOAD_MAX_DIMENSION / width, UPLOAD_MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/webp", UPLOAD_WEBP_QUALITY);
      // iOS Safari can silently return an empty data URL when the canvas
      // exceeds the device memory budget. Fall back to JPEG, then to the
      // original input so the upload still succeeds.
      if (!dataUrl || dataUrl.length < "data:image/webp;base64,".length + 32) {
        const jpegFallback = canvas.toDataURL("image/jpeg", 0.9);
        if (jpegFallback && jpegFallback.length > "data:image/jpeg;base64,".length + 32) {
          resolve(jpegFallback);
        } else {
          reject(new Error("Canvas encoding produced empty data"));
        }
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = base64Full;
  });
}

async function prepareProductImage(
  imageBase64: string
): Promise<{ error: string | null; imageDataUrl: string | null }> {
  let imageDataUrl = imageBase64.includes(",")
    ? imageBase64
    : `data:image/webp;base64,${imageBase64}`;

  try {
    imageDataUrl = await compressImage(imageDataUrl);
  } catch {
    // Keep the original data URL when client-side compression fails.
  }

  const base64Data = imageDataUrl.split(",")[1];
  if (!base64Data) {
    return { error: "画像データが不正です", imageDataUrl: null };
  }

  if (!validateImageSize(base64Data)) {
    return { error: "画像サイズが上限(5MB)を超えています", imageDataUrl: null };
  }

  return { error: null, imageDataUrl };
}

async function persistProductImage(
  productId: string,
  imageBase64: string
): Promise<{ error: string | null; filePath: string | null }> {
  const response = await fetch("/api/product-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      imageBase64,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; filePath?: string }
    | null;

  if (!response.ok) {
    return {
      error: payload?.error ?? "画像の保存に失敗しました",
      filePath: null,
    };
  }

  return {
    error: null,
    filePath: payload?.filePath ?? null,
  };
}

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
    isQuasiDrug?: boolean;
    activeIngredientIds?: string[];
  }
) {
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count !== null && count >= USER_LIMIT) {
    return { error: "limit_reached", productId: null, filePath: null };
  }

  const insertData: Record<string, unknown> = {
    user_id: userId,
    name: product.name,
    brand: product.brand,
    product_type: product.productType ?? "other",
    ingredient_ids: product.ingredientIds,
    unknown_ingredients: product.unknownIngredients,
  };

  if (product.isQuasiDrug !== undefined) {
    insertData.is_quasi_drug = product.isQuasiDrug;
  }

  if (product.activeIngredientIds?.length) {
    insertData.active_ingredient_ids = product.activeIngredientIds;
  }

  const { data, error } = await supabase
    .from("products")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    return { error: error.message, productId: null, filePath: null };
  }

  let filePath: string | null = null;

  if (product.packageImageBase64) {
    const preparedImage = await prepareProductImage(product.packageImageBase64);
    if (preparedImage.error || !preparedImage.imageDataUrl) {
      await supabase
        .from("products")
        .delete()
        .eq("id", data.id)
        .eq("user_id", userId);

      return {
        error: preparedImage.error ?? "画像の保存に失敗しました",
        productId: null,
        filePath: null,
      };
    }

    const imageResult = await persistProductImage(data.id, preparedImage.imageDataUrl);
    if (imageResult.error) {
      await supabase
        .from("products")
        .delete()
        .eq("id", data.id)
        .eq("user_id", userId);

      return {
        error: imageResult.error,
        productId: null,
        filePath: null,
      };
    }

    filePath = imageResult.filePath;
  }

  return { error: null, productId: data.id, filePath };
}

export async function updateProductImageInDb(
  _supabase: SupabaseClient,
  _userId: string,
  productId: string,
  imageBase64: string
): Promise<{ error: string | null; filePath: string | null }> {
  const preparedImage = await prepareProductImage(imageBase64);
  if (preparedImage.error || !preparedImage.imageDataUrl) {
    return {
      error: preparedImage.error ?? "画像の保存に失敗しました",
      filePath: null,
    };
  }

  return persistProductImage(productId, preparedImage.imageDataUrl);
}

export async function deleteProductImageFromDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ error: string | null }> {
  if (typeof window === "undefined") {
    try {
      const displayPath = getProductImageDisplayPath(userId, productId);
      const sharePath = getProductImageSharePath(userId, productId);
      await r2Delete([displayPath, sharePath]);
    } catch (e) {
      console.error("R2 image delete failed (non-blocking):", e);
    }
  }

  const { error } = await supabase
    .from("products")
    .update({ package_image_url: null })
    .eq("id", productId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

export async function deleteProductFromDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string
) {
  // R2画像削除はサーバーサイドでのみ実行（クライアントではクレデンシャルが無くフリーズする）
  if (typeof window === "undefined") {
    try {
      const displayPath = getProductImageDisplayPath(userId, productId);
      const sharePath = getProductImageSharePath(userId, productId);
      await r2Delete([displayPath, sharePath]);
    } catch (e) {
      console.error("R2 delete failed (non-blocking):", e);
    }
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

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

export async function updateProductNameInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  name: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ name })
    .eq("id", productId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function updateLastUsedAtInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<void> {
  await supabase
    .from("products")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("user_id", userId);
}

export async function updatePurchasedAtInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  purchasedAt: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ purchased_at: purchasedAt })
    .eq("id", productId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function toggleFavoriteInDb(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  isFavorite: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ is_favorite: isFavorite })
    .eq("id", productId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function saveScanHistory(
  supabase: SupabaseClient,
  userId: string,
  productName: string,
  brand: string,
  ingredientIds: string[]
): Promise<void> {
  const { data: scan, error: scanError } = await supabase
    .from("scan_history")
    .insert({
      user_id: userId,
      product_name: productName,
      brand,
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    console.error("Failed to save scan history:", scanError);
    return;
  }

  if (ingredientIds.length > 0) {
    const rows = ingredientIds.map((id) => ({
      scan_id: scan.id,
      ingredient_id: id,
    }));

    const { error: ingError } = await supabase
      .from("scan_ingredients")
      .insert(rows);

    if (ingError) {
      console.error("Failed to save scan ingredients:", ingError);
    }
  }

  fetch("/api/refresh-profile", { method: "POST" }).catch(() => {});
}

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

export async function getProductCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export function getUserLimit() {
  return USER_LIMIT;
}

export function getAccountScanLimit() {
  return 30;
}

export function getMonthlyScanLimit() {
  return getAccountScanLimit();
}

export async function getUserMonthlyScanLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const defaultLimit = getAccountScanLimit();

  const { data, error } = await supabase
    .from("user_scan_limits")
    .select("monthly_limit")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const isMissingTable =
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      (typeof error.message === "string" && error.message.includes("user_scan_limits"));

    if (!isMissingTable) {
      console.error("getUserMonthlyScanLimit error:", error);
      return defaultLimit;
    }
  } else if (data && typeof data.monthly_limit === "number" && data.monthly_limit > 0) {
    return data.monthly_limit;
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", LEGACY_SCAN_LIMIT_MARKER)
    .maybeSingle();

  if (legacyError) {
    console.error("getUserMonthlyScanLimit legacy fallback error:", legacyError);
    return defaultLimit;
  }

  if (!legacyData || typeof legacyData.count !== "number" || legacyData.count <= 0) {
    return defaultLimit;
  }

  return legacyData.count;
}

export async function getLegacyUserMonthlyScanLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", LEGACY_SCAN_LIMIT_MARKER)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!data || typeof data.count !== "number" || data.count <= 0) {
    return null;
  }

  return data.count;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getScanCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId);
  if (!data || data.length === 0) return 0;
  return data.reduce((sum: number, row: { count: number }) => sum + (row.count ?? 0), 0);
}

export async function getScanCountByEmail(supabase: SupabaseClient, email: string): Promise<number> {
  const { data } = await supabase
    .from("scan_limit_by_email")
    .select("total_count")
    .eq("email", email)
    .single();
  return data?.total_count ?? 0;
}

/** 当月のスキャン回数を取得（月次リセット対応） */
export async function getMonthlyScanCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const month = getCurrentMonth();
  const { data } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();
  return data?.count ?? 0;
}

export async function tryReserveScan(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  limitOverride?: number,
): Promise<boolean> {
  const limit = limitOverride ?? getAccountScanLimit();
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

export async function tryReserveScanFallback(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  limit: number
): Promise<boolean> {
  const month = getCurrentMonth();
  const { data: usage, error: usageError } = await supabase
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (usageError) {
    console.error("tryReserveScanFallback usage read error:", usageError);
    return false;
  }

  const currentCount = usage?.count ?? 0;
  if (currentCount >= limit) {
    return false;
  }

  if (usage) {
    const { error: updateError } = await supabase
      .from("scan_usage")
      .update({ count: currentCount + 1 })
      .eq("user_id", userId)
      .eq("month", month)
      .eq("count", currentCount);

    if (updateError) {
      console.error("tryReserveScanFallback usage update error:", updateError);
      return false;
    }
  } else {
    const { error: insertError } = await supabase
      .from("scan_usage")
      .insert({ user_id: userId, month, count: 1 });

    if (insertError) {
      console.error("tryReserveScanFallback usage insert error:", insertError);
      return false;
    }
  }

  const { data: emailRow, error: emailReadError } = await supabase
    .from("scan_limit_by_email")
    .select("total_count")
    .eq("email", email)
    .maybeSingle();

  if (emailReadError) {
    console.error("tryReserveScanFallback email read error:", emailReadError);
    return true;
  }

  if (emailRow) {
    const { error: emailUpdateError } = await supabase
      .from("scan_limit_by_email")
      .update({ total_count: (emailRow.total_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("email", email);
    if (emailUpdateError) {
      console.error("tryReserveScanFallback email update error:", emailUpdateError);
    }
  } else {
    const { error: emailInsertError } = await supabase
      .from("scan_limit_by_email")
      .insert({ email, total_count: 1 });
    if (emailInsertError) {
      console.error("tryReserveScanFallback email insert error:", emailInsertError);
    }
  }

  return true;
}

export async function rollbackScan(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<void> {
  const { error } = await supabase.rpc("rollback_scan", {
    p_email: email,
    p_user_id: userId,
  });

  if (error) {
    console.error("rollbackScan RPC error:", error);
  }
}

export async function incrementScanCount(supabase: SupabaseClient, userId: string, email: string) {
  const month = getCurrentMonth();

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
