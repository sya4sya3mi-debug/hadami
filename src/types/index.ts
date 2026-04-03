// ── カテゴリ ──
export type CategoryKey = "moisturizing" | "brightening" | "turnover" | "barrier" | "soothing" | "keratin";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

// ── レア度 ──
export type RarityKey = "common" | "uncommon" | "rare" | "legendary";

export interface RarityInfo {
  label: string;
  star: number;
  color: string;
  icon: string;
}

// ── 成分 ──
export interface Ingredient {
  id: string;
  nameJa: string;
  nameInci: string;
  categories: CategoryKey[];
  rarity: RarityKey;
  color: string;
  note: string;
  funFact?: string;
  caution?: string;
}

// ── 製品 ──
export interface Product {
  id: string;
  name: string;
  brand: string;
  productType: string;
  packageImage?: string;
  createdAt: string;
  ingredients: ProductIngredient[];
}

export interface ProductIngredient {
  ingredientId: string;
  orderIndex: number;
}

// ── デッキ ──
export type RoutineType = "morning" | "night";

export interface DeckItem {
  productId: string;
  routine: RoutineType;
  orderIndex: number;
}

// ── 組み合わせ ──
export type CombinationType = "recommended" | "note";

export interface Combination {
  pair: [string, string];
  type: CombinationType;
  label: string;
  desc: string;
  source: string;
}

// ── スキャン結果 ──
export interface ScanResult {
  product: {
    name: string;
    brand: string;
    type: string;
  };
  ingredients: {
    found: { ingredient: Ingredient; orderIndex: number }[];
    unknown: string[];
  };
  combinations: Combination[];
  newDiscoveries: string[];
}
