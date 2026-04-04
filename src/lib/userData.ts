import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeckItem, Product, ProductGenre, RoutineType } from "@/types";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { useZukanStore } from "@/stores/useZukanStore";
import { getSignedImageUrl, clearImageUrlCache } from "./storage";

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
  created_at: string | null;
};

type DiscoveryRow = {
  ingredient_id: string;
};

type DeckRow = {
  product_id: string;
  routine: RoutineType;
  order_index: number | null;
};

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

async function mapProducts(supabase: SupabaseClient, rows: ProductRow[]): Promise<Product[]> {
  const products = await Promise.all(
    rows.map(async (row) => {
      let packageImage: string | undefined;
      if (row.package_image_url) {
        const url = await getSignedImageUrl(supabase, row.package_image_url);
        packageImage = url ?? undefined;
      }
      return {
        id: row.id,
        name: row.name ?? "未設定",
        brand: row.brand ?? "",
        productType: (row.product_type as ProductGenre) || "other",
        packageImage,
        createdAt: row.created_at ?? new Date(0).toISOString(),
        ingredients: (row.ingredient_ids ?? []).map((ingredientId, index) => ({
          ingredientId,
          orderIndex: index,
        })),
      };
    })
  );
  return products;
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
      .select("id, name, brand, product_type, ingredient_ids, package_image_url, created_at")
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

  if (productsRes.error) {
    errors.push(`products sync failed: ${productsRes.error.message}`);
  } else {
    const products = await mapProducts(supabase, (productsRes.data ?? []) as ProductRow[]);
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
    useDeckStore.getState().replaceAll(mapDeckItems((deckRes.data ?? []) as DeckRow[]));
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}
