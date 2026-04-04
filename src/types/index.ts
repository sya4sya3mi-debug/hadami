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

// ── 製品ジャンル ──
export type ProductGenre =
  | "cleansing"
  | "face_wash"
  | "toner"
  | "serum"
  | "emulsion"
  | "cream"
  | "sunscreen"
  | "mask_pack"
  | "eye_care"
  | "oil"
  | "mist"
  | "other";

// ── 製品 ──
export interface Product {
  id: string;
  name: string;
  brand: string;
  productType: ProductGenre;
  packageImage?: string;
  createdAt: string;
  ingredients: ProductIngredient[];
}

export interface ProductIngredient {
  ingredientId: string;
  orderIndex: number;
}

// ── デッキ ──
export type RoutineType = "morning" | "night" | "spring_summer" | "autumn_winter";

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

// ── おすすめデッキ結果 ──
export interface RecommendationResult {
  productIds: string[];
  score: number;
  recommendedCombinations: Combination[];
  cautionCombinations: Combination[];
  categoryCoverage: Record<CategoryKey, number>;
  coveredCategoryCount: number;
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
