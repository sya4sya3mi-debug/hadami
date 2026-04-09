import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeckItem, Product, ProductGenre, RoutineType } from "@/types";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { clearImageUrlCache } from "./storage";

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

function resolveProductImage(productId: string, storedValue: string | null) {
  if (!storedValue) {
    return {
      packageImagePath: undefined,
      packageImage: undefined,
    };
  }

  if (
    storedValue.startsWith("http://") ||
    storedValue.startsWith("https://") ||
    storedValue.startsWith("/") ||
    storedValue.startsWith("data:")
  ) {
    return {
      packageImagePath: storedValue,
      packageImage: storedValue,
    };
  }

  return {
    packageImagePath: storedValue,
    packageImage: `/api/product-image/${productId}`,
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

function mapProducts(rows: ProductRow[]): Product[] {
  return rows.map((row) => {
    const image = resolveProductImage(row.id, row.package_image_url);

    return {
      id: row.id,
      name: row.name ?? "未設定",
      brand: row.brand ?? "",
      productType: (row.product_type as ProductGenre) || "other",
      packageImagePath: image.packageImagePath,
      packageImage: image.packageImage,
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
    const products = mapProducts((productsRes.data ?? []) as ProductRow[]);
    syncedProductIds = new Set(products.map((product) => product.id));
    useProductStore.getState().replaceAll(products);
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
