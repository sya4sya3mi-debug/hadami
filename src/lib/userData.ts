import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeckItem, Product, ProductGenre, RoutineType } from "@/types";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import {
  PRODUCT_IMAGE_BACKFILL_BATCH_SIZE,
  getProductImageDisplayPathFromStoredPath,
  getProductImageSharePathFromStoredPath,
} from "@/lib/productImages";
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
      packageImageSharePath: undefined,
      packageImageShareUrl: undefined,
    };
  }

  if (isDirectImageUrl(storedValue)) {
    return {
      packageImagePath: storedValue,
      packageImage: storedValue,
      packageImageThumbPath: storedValue,
      packageImageThumb: storedValue,
      packageImageSharePath: storedValue,
      packageImageShareUrl: storedValue,
    };
  }

  // 既に新フォーマット (-display.webp) に移行済みかどうか判定。
  // 移行前 (旧 .avif など) の場合は派生パスのR2ファイルが存在しないため、
  // storedValue（実在ファイル）をそのまま表示用パスとして使う。
  const isMigrated = storedValue.endsWith("-display.webp");
  const displayPath = storedValue;
  const sharePath = isMigrated
    ? getProductImageSharePathFromStoredPath(storedValue)
    : storedValue;
  const displayUrl = signedUrls[displayPath] ?? undefined;
  const shareUrl = signedUrls[sharePath] ?? displayUrl;

  return {
    packageImagePath: displayPath,
    packageImage: displayUrl,
    packageImageThumbPath: displayPath,
    packageImageThumb: displayUrl,
    packageImageSharePath: sharePath,
    packageImageShareUrl: shareUrl,
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
      packageImageSharePath: image.packageImageSharePath,
      packageImageShareUrl: image.packageImageShareUrl,
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

const THUMB_VERSION = 3; // Bump when thumbnail size/quality changes
const THUMB_VERSION_KEY = "hadami_thumb_version";
const THUMB_BACKFILL_RETRY_AFTER_KEY = "hadami_thumb_backfill_retry_after";
const THUMB_BACKFILL_RETRY_MS = 10 * 60 * 1000;
let activeThumbnailBackfill: Promise<void> | null = null;

function getThumbnailBackfillRetryAfter() {
  if (typeof window === "undefined") return 0;

  const rawValue = window.localStorage.getItem(THUMB_BACKFILL_RETRY_AFTER_KEY);
  const retryAfter = Number(rawValue);
  return Number.isFinite(retryAfter) ? retryAfter : 0;
}

function setThumbnailBackfillRetryAfter(nextRetryAfter: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    THUMB_BACKFILL_RETRY_AFTER_KEY,
    String(nextRetryAfter)
  );
}

function clearThumbnailBackfillRetryAfter() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(THUMB_BACKFILL_RETRY_AFTER_KEY);
}

async function backfillProductThumbnails(
  supabase: SupabaseClient,
  products: Product[]
) {
  if (typeof window === "undefined") return;

  const storedVersion = localStorage.getItem(THUMB_VERSION_KEY);
  const needsForceRegenerate = storedVersion !== String(THUMB_VERSION);

  // 表示用URLが取得できなかった、もしくはshare URLがdisplayと同一にフォールバック
  // している場合は、新フォーマット（display.webp / share.webp）の生成が
  // まだ済んでいないためバックフィルが必要。
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
          (!product.packageImage ||
            !product.packageImageShareUrl ||
            product.packageImageShareUrl === product.packageImage)
      );

  if (targets.length === 0) {
    clearThumbnailBackfillRetryAfter();
    if (needsForceRegenerate) localStorage.setItem(THUMB_VERSION_KEY, String(THUMB_VERSION));
    return;
  }

  if (getThumbnailBackfillRetryAfter() > Date.now()) {
    return;
  }

  if (activeThumbnailBackfill) {
    await activeThumbnailBackfill;
    return;
  }

  activeThumbnailBackfill = (async () => {
    try {
      for (
        let index = 0;
        index < targets.length;
        index += PRODUCT_IMAGE_BACKFILL_BATCH_SIZE
      ) {
        const response = await fetch("/api/product-image/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productIds: targets
              .slice(index, index + PRODUCT_IMAGE_BACKFILL_BATCH_SIZE)
              .map((product) => product.id),
            ...(needsForceRegenerate && { force: true }),
          }),
        });

        if (!response.ok) {
          setThumbnailBackfillRetryAfter(Date.now() + THUMB_BACKFILL_RETRY_MS);
          return;
        }
      }

      const refreshPaths = Array.from(
        new Set(
          targets.flatMap((product) => {
            const paths: string[] = [];
            if (product.packageImagePath) paths.push(product.packageImagePath);
            if (product.packageImageSharePath)
              paths.push(product.packageImageSharePath);
            return paths;
          })
        )
      );

      if (refreshPaths.length === 0) {
        clearThumbnailBackfillRetryAfter();
        if (needsForceRegenerate) {
          localStorage.setItem(THUMB_VERSION_KEY, String(THUMB_VERSION));
        }
        return;
      }

      const refreshedSignedUrls = await getSignedImageUrls(supabase, refreshPaths);
      const currentProducts = useProductStore.getState().products;
      const nextProducts = currentProducts.map((product) => {
        const displayPath = product.packageImagePath;
        const sharePath = product.packageImageSharePath;
        const displayUrl = displayPath
          ? refreshedSignedUrls[displayPath]
          : undefined;
        const shareUrl = sharePath ? refreshedSignedUrls[sharePath] : undefined;
        if (!displayUrl && !shareUrl) return product;

        return {
          ...product,
          packageImage: displayUrl ?? product.packageImage,
          packageImageThumb: displayUrl ?? product.packageImageThumb,
          packageImageShareUrl:
            shareUrl ?? displayUrl ?? product.packageImageShareUrl,
        };
      });

      useProductStore.getState().replaceAll(nextProducts);
      clearThumbnailBackfillRetryAfter();

      if (needsForceRegenerate) {
        localStorage.setItem(THUMB_VERSION_KEY, String(THUMB_VERSION));
      }
    } catch (error) {
      setThumbnailBackfillRetryAfter(Date.now() + THUMB_BACKFILL_RETRY_MS);
      console.warn("thumbnail backfill skipped:", error);
    }
  })();

  try {
    await activeThumbnailBackfill;
  } finally {
    activeThumbnailBackfill = null;
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
            getProductImageDisplayPathFromStoredPath(row.package_image_url),
            getProductImageSharePathFromStoredPath(row.package_image_url),
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
