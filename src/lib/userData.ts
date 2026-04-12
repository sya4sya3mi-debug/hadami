import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeckItem, Product, ProductGenre, RoutineType } from "@/types";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { getProductImageThumbPathFromStoredPath } from "@/lib/productImages";
import { clearImageUrlCache, getSignedImageUrls } from "./storage";

const PRODUCT_STORAGE_KEY = "hadami-products";
const DECK_STORAGE_KEY = "hadami-deck";
const ZUKAN_STORAGE_KEY = "hadami-zukan";
const CACHE_OWNER_KEY = "hadami-cache-owner";

type ProductRow = {
  id: string;
  name: string | null;
  brand: string | null;
  product_type: string | null;
  ingredient_ids: string[] | null;
  package_image_url: string | null;
  is_favorite: boolean | null;
  created_at: string | null;
  last_used_at: string | null;
  purchased_at: string | null;
  is_quasi_drug: boolean | null;
  active_ingredient_ids: string[] | null;
};

type DiscoveryRow = {
  ingredient_id: string;
};

type DeckRow = {
  product_id: string;
  routine: RoutineType;
  order_index: number | null;
};

function isDirectImageUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

function resolveProductImage(
  productId: string,
  storedValue: string | null,
  signedUrls: Record<string, string | null>
) {
  if (!storedValue) {
    return {
      packageImagePath: undefined,
      packageImage: undefined,
      packageImageThumbPath: undefined,
      packageImageThumb: undefined,
    };
  }

  if (isDirectImageUrl(storedValue)) {
    return {
      packageImagePath: storedValue,
      packageImage: storedValue,
      packageImageThumbPath: storedValue,
      packageImageThumb: storedValue,
    };
  }

  const thumbPath = getProductImageThumbPathFromStoredPath(storedValue);
  const fullImage = signedUrls[storedValue] ?? `/api/product-image/${productId}`;

  return {
    packageImagePath: storedValue,
    packageImage: fullImage,
    packageImageThumbPath: thumbPath,
    packageImageThumb: signedUrls[thumbPath] ?? fullImage,
  };
}

export function getCacheOwner() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CACHE_OWNER_KEY);
}

export function setCacheOwner(owner: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_OWNER_KEY, owner);
}

export function clearCachedUserData() {
  useProductStore.getState().clearAll();
  useDeckStore.getState().clearAll();
  useZukanStore.getState().clearAll();
  clearImageUrlCache();

  if (typeof window === "undefined") return;

  window.localStorage.removeItem(PRODUCT_STORAGE_KEY);
  window.localStorage.removeItem(DECK_STORAGE_KEY);
  window.localStorage.removeItem(ZUKAN_STORAGE_KEY);
  window.localStorage.removeItem(CACHE_OWNER_KEY);
}

function mapProducts(
  rows: ProductRow[],
  signedUrls: Record<string, string | null>
): Product[] {
  return rows.map((row) => {
    const image = resolveProductImage(row.id, row.package_image_url, signedUrls);

    return {
      id: row.id,
      name: row.name ?? "未設定",
      brand: row.brand ?? "",
      productType: (row.product_type as ProductGenre) || "other",
      packageImagePath: image.packageImagePath,
      packageImage: image.packageImage,
      packageImageThumbPath: image.packageImageThumbPath,
      packageImageThumb: image.packageImageThumb,
      isFavorite: row.is_favorite ?? false,
      createdAt: row.created_at ?? new Date(0).toISOString(),
      lastUsedAt: row.last_used_at ?? undefined,
      purchasedAt: row.purchased_at ?? undefined,
      isQuasiDrug: row.is_quasi_drug ?? undefined,
      activeIngredientIds: row.active_ingredient_ids ?? undefined,
      ingredients: (row.ingredient_ids ?? []).map((ingredientId, index) => ({
        ingredientId,
        orderIndex: index,
      })),
    };
  });
}

function mapDeckItems(rows: DeckRow[]): DeckItem[] {
  return rows.map((row, index) => ({
    productId: row.product_id,
    routine: row.routine,
    orderIndex: row.order_index ?? index,
  }));
}

const THUMB_VERSION = 2; // Bump when thumbnail size/quality changes
const THUMB_VERSION_KEY = "hadami_thumb_version";

async function backfillProductThumbnails(
  supabase: SupabaseClient,
  products: Product[]
) {
  if (typeof window === "undefined") return;

  const storedVersion = localStorage.getItem(THUMB_VERSION_KEY);
  const needsForceRegenerate = storedVersion !== String(THUMB_VERSION);

  const targets = needsForceRegenerate
    ? products.filter(
        (product) =>
          typeof product.packageImagePath === "string" &&
          !isDirectImageUrl(product.packageImagePath)
      )
    : products.filter(
        (product) =>
          typeof product.packageImagePath === "string" &&
          !isDirectImageUrl(product.packageImagePath) &&
          typeof product.packageImageThumbPath === "string" &&
          product.packageImageThumb === product.packageImage
      );

  if (targets.length === 0) {
    if (needsForceRegenerate) localStorage.setItem(THUMB_VERSION_KEY, String(THUMB_VERSION));
    return;
  }

  try {
    const response = await fetch("/api/product-image/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: targets.map((product) => product.id),
        ...(needsForceRegenerate && { force: true }),
      }),
    });

    if (!response.ok) {
      return;
    }

    const thumbPaths = targets
      .map((product) => product.packageImageThumbPath)
      .filter((value): value is string => typeof value === "string");

    if (thumbPaths.length === 0) return;

    const signedThumbs = await getSignedImageUrls(supabase, thumbPaths);
    const currentProducts = useProductStore.getState().products;
    const nextProducts = currentProducts.map((product) => {
      const thumbPath = product.packageImageThumbPath;
      if (!thumbPath) return product;

      const thumbUrl = signedThumbs[thumbPath];
      if (!thumbUrl) return product;

      return {
        ...product,
        packageImageThumb: thumbUrl,
      };
    });

    useProductStore.getState().replaceAll(nextProducts);

    if (needsForceRegenerate) localStorage.setItem(THUMB_VERSION_KEY, String(THUMB_VERSION));
  } catch (error) {
    console.warn("thumbnail backfill skipped:", error);
  }
}

export async function syncUserData(supabase: SupabaseClient, userId: string) {
  const [productsRes, discoveriesRes, deckRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, brand, product_type, ingredient_ids, package_image_url, is_favorite, created_at, last_used_at, purchased_at, is_quasi_drug, active_ingredient_ids")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("zukan_discoveries")
      .select("ingredient_id")
      .eq("user_id", userId),
    supabase
      .from("deck_items")
      .select("product_id, routine, order_index")
      .eq("user_id", userId)
      .order("order_index", { ascending: true }),
  ]);

  const errors: string[] = [];
  let syncedProductIds: Set<string> | null = null;

  if (productsRes.error) {
    errors.push(`products sync failed: ${productsRes.error.message}`);
  } else {
    const productRows = (productsRes.data ?? []) as ProductRow[];
    const signablePaths = Array.from(
      new Set(
        productRows.flatMap((row) => {
          if (
            typeof row.package_image_url !== "string" ||
            isDirectImageUrl(row.package_image_url)
          ) {
            return [];
          }

          return [
            row.package_image_url,
            getProductImageThumbPathFromStoredPath(row.package_image_url),
          ];
        })
      )
    );
    const signedUrls =
      signablePaths.length > 0
        ? await getSignedImageUrls(supabase, signablePaths)
        : {};
    const products = mapProducts(productRows, signedUrls);
    syncedProductIds = new Set(products.map((product) => product.id));
    useProductStore.getState().replaceAll(products);
    void backfillProductThumbnails(supabase, products);
  }

  if (discoveriesRes.error) {
    errors.push(`zukan sync failed: ${discoveriesRes.error.message}`);
  } else {
    useZukanStore.getState().replaceAll(
      ((discoveriesRes.data ?? []) as DiscoveryRow[]).map((row) => row.ingredient_id)
    );
  }

  if (deckRes.error) {
    console.error("deck sync failed:", deckRes.error.message);
    useDeckStore.getState().replaceAll([]);
  } else {
    const allDeckItems = mapDeckItems((deckRes.data ?? []) as DeckRow[]);
    const productIds = syncedProductIds;
    const validDeckItems = productIds
      ? allDeckItems.filter((item) => productIds.has(item.productId))
      : allDeckItems;
    useDeckStore.getState().replaceAll(validDeckItems);

    if (productIds) {
      const orphanProductIds = Array.from(
        new Set(
          allDeckItems
            .filter((item) => !productIds.has(item.productId))
            .map((item) => item.productId)
        )
      );

      if (orphanProductIds.length > 0) {
        void (async () => {
          const { error } = await supabase
            .from("deck_items")
            .delete()
            .eq("user_id", userId)
            .in("product_id", orphanProductIds);
          if (error) {
            console.warn("Failed to clean orphaned deck items:", error);
          }
        })();
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}
