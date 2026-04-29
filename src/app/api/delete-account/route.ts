import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import {
  getProductImageDisplayPathFromStoredPath,
  getProductImageSharePathFromStoredPath,
} from "@/lib/productImages";
import { r2Delete } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeStoredImagePath(storedValue: string): string | null {
  if (!storedValue) return null;

  if (storedValue.startsWith("data:") || storedValue.startsWith("/")) {
    return null;
  }

  if (
    !storedValue.startsWith("http://") &&
    !storedValue.startsWith("https://")
  ) {
    return storedValue;
  }

  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2PublicUrl && storedValue.startsWith(`${r2PublicUrl}/`)) {
    return storedValue.slice(`${r2PublicUrl}/`.length);
  }

  try {
    const url = new URL(storedValue);
    const supabaseMatch = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
    );
    return supabaseMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function collectR2Keys(paths: Array<string | null>): string[] {
  const keys = new Set<string>();

  for (const path of paths) {
    if (!path) continue;

    const normalized = normalizeStoredImagePath(path);
    if (!normalized) continue;

    keys.add(normalized);
    keys.add(getProductImageDisplayPathFromStoredPath(normalized));
    keys.add(getProductImageSharePathFromStoredPath(normalized));
  }

  return Array.from(keys);
}

function throwIfError(
  error: { message: string } | null,
  message: string
): asserts error is null {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
}

export async function DELETE() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  try {
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("package_image_url")
      .eq("user_id", auth.user.id);
    throwIfError(productsError, "Failed to fetch products");

    const imageKeys = collectR2Keys(
      (products ?? []).map((product) => product.package_image_url)
    );
    if (imageKeys.length > 0) {
      await r2Delete(imageKeys);
    }

    try {
      const { data: legacyFiles, error: legacyListError } = await supabaseAdmin.storage
        .from("product-images")
        .list(auth.user.id);

      if (!legacyListError && legacyFiles && legacyFiles.length > 0) {
        const legacyPaths = legacyFiles.map((file) => `${auth.user.id}/${file.name}`);
        const { error: legacyRemoveError } = await supabaseAdmin.storage
          .from("product-images")
          .remove(legacyPaths);

        if (legacyRemoveError) {
          console.warn("Legacy Supabase storage cleanup skipped:", legacyRemoveError);
        }
      }
    } catch (error) {
      console.warn("Legacy Supabase storage cleanup skipped:", error);
    }

    const { data: scanHistory, error: scanHistoryError } = await supabaseAdmin
      .from("scan_history")
      .select("id")
      .eq("user_id", auth.user.id);
    throwIfError(scanHistoryError, "Failed to fetch scan history");

    const scanIds = (scanHistory ?? []).map((row) => row.id);
    if (scanIds.length > 0) {
      const { error: scanIngredientsError } = await supabaseAdmin
        .from("scan_ingredients")
        .delete()
        .in("scan_id", scanIds);
      throwIfError(scanIngredientsError, "Failed to delete scan ingredients");
    }

    const { error: deckItemsError } = await supabaseAdmin
      .from("deck_items")
      .delete()
      .eq("user_id", auth.user.id);
    throwIfError(deckItemsError, "Failed to delete deck items");

    const { error: scanHistoryDeleteError } = await supabaseAdmin
      .from("scan_history")
      .delete()
      .eq("user_id", auth.user.id);
    throwIfError(scanHistoryDeleteError, "Failed to delete scan history");

    const { error: scanUsageError } = await supabaseAdmin
      .from("scan_usage")
      .delete()
      .eq("user_id", auth.user.id);
    throwIfError(scanUsageError, "Failed to delete scan usage");

    const { error: productsDeleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("user_id", auth.user.id);
    throwIfError(productsDeleteError, "Failed to delete products");

    const { error: zukanError } = await supabaseAdmin
      .from("zukan_discoveries")
      .delete()
      .eq("user_id", auth.user.id);
    throwIfError(zukanError, "Failed to delete discoveries");

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", auth.user.id);
    throwIfError(profileError, "Failed to delete profile");

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      auth.user.id
    );
    throwIfError(authDeleteError, "Failed to delete auth user");

    return NextResponse.json({
      success: true,
      deletedImageCount: imageKeys.length,
    });
  } catch (error) {
    console.error("Account deletion failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "アカウント削除に失敗しました",
      },
      { status: 500 }
    );
  }
}
