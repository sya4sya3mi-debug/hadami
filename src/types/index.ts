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

// ── 成分ジャンル（出自）──
export type IngredientGenre =
  | "amino_acid"
  | "vitamin"
  | "peptide"
  | "botanical"
  | "oil_lipid"
  | "ferment"
  | "acid"
  | "base"
  | "water";

export interface IngredientGenreInfo {
  key: IngredientGenre;
  label: string;
  icon: string;
  color: string;
}

// ── 成分 ──
export interface Ingredient {
  id: string;
  nameJa: string;
  nameInci: string;
  categories: CategoryKey[];
  rarity: RarityKey;
  genre: IngredientGenre;
  color: string;
  note: string;
  aliases?: string[];
  funFact?: string;
  caution?: string;
  activeIngredient?: boolean; // 医薬部外品の有効成分として承認されている場合 true
  // ── 図鑑100成分の追加データ ──
  effectSummary?: string;       // 効果サマリー
  suitableFor?: string;         // 向いている悩み・肌質
  combinationCaution?: string;  // 併用注意
  synergyPartners?: string[];   // 相性のよい相手成分
  synergySummary?: string;      // 相乗サマリー
  referenceUrl?: string;        // 参考URL
  subCategories?: CategoryKey[]; // 6分類_副カテゴリ
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
  packageImagePath?: string;
  packageImageThumb?: string;
  packageImageThumbPath?: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsedAt?: string;
  purchasedAt?: string;
  ingredients: ProductIngredient[];
  isQuasiDrug?: boolean;
  activeIngredientIds?: string[];
}

export interface ProductIngredient {
  ingredientId: string;
  orderIndex: number;
  isActiveInProduct?: boolean;
}

// ── ルーティン ──
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

// ── おすすめルーティン結果 ──
export interface RecommendationResult {
  productIds: string[];
  score: number;
  recommendedCombinations: Combination[];
  cautionCombinations: Combination[];
  genreCoverage: Record<IngredientGenre, number>;
  coveredGenreCount: number;
}

// ── 楽天商品 ──
export interface RakutenProduct {
  name: string;
  price: number;
  imageUrl: string | null;
  affiliateUrl: string;
  reviewScore: number;
  shopName: string;
}

// ── 有効成分の信頼度 ──
export type ActiveConfidence = "confirmed" | "high" | "medium";
export type ActiveSource = "ocr_label" | "web_search" | "master_db";

export interface ResolvedActiveIngredientInfo {
  ingredientId: string;
  nameJa: string;
  confidence: ActiveConfidence;
  sources: ActiveSource[];
  mhlwCategory?: string;
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
  isQuasiDrug: boolean;
  activeIngredients: ResolvedActiveIngredientInfo[];
}
