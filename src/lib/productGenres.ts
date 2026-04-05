import { ProductGenre } from "@/types";

export interface ProductGenreInfo {
  key: ProductGenre;
  label: string;
  icon: string;
  color: string;
  order: number;
}

export const PRODUCT_GENRES: readonly ProductGenreInfo[] = [
  { key: "cleansing",  label: "クレンジング",   icon: "\u{1F9F4}", color: "#AB47BC", order: 1 },
  { key: "face_wash",  label: "洗顔",          icon: "\u{1FAE7}", color: "#42A5F5", order: 2 },
  { key: "toner",      label: "化粧水",        icon: "\u{1F4A7}", color: "#4FC3F7", order: 3 },
  { key: "serum",      label: "美容液",        icon: "\u2728",    color: "#CE93D8", order: 4 },
  { key: "emulsion",   label: "乳液",          icon: "\u{1F95B}", color: "#FFB74D", order: 5 },
  { key: "cream",      label: "クリーム",       icon: "\u{1FAD9}", color: "#F9A8C0", order: 6 },
  { key: "sunscreen",  label: "日焼け止め",     icon: "\u2600\uFE0F", color: "#FFD54F", order: 7 },
  { key: "mask_pack",  label: "パック・マスク",  icon: "\u{1F3AD}", color: "#80CBC4", order: 8 },
  { key: "eye_care",   label: "アイケア",       icon: "\u{1F441}\uFE0F", color: "#90A4AE", order: 9 },
  { key: "oil",        label: "オイル",         icon: "\u{1F49B}", color: "#A5D6A7", order: 10 },
  { key: "mist",       label: "ミスト",         icon: "\u{1F32B}\uFE0F", color: "#B3E5FC", order: 11 },
  { key: "other",      label: "その他",         icon: "\u{1F4E6}", color: "#BDBDBD", order: 12 },
] as const;

export function getGenreByKey(key: string): ProductGenreInfo | undefined {
  return PRODUCT_GENRES.find((g) => g.key === key);
}

// ── ジャンル別スロット設計 ──

export interface GenreSlotConfig {
  genre: ProductGenre;
  maxSlots: number;
  section: "base" | "intensive" | "protection" | "special";
  stepLabel: string;
}

export const GENRE_SLOT_CONFIG: readonly GenreSlotConfig[] = [
  { genre: "cleansing",  maxSlots: 1, section: "base",       stepLabel: "1" },
  { genre: "face_wash",  maxSlots: 1, section: "base",       stepLabel: "2" },
  { genre: "toner",      maxSlots: 1, section: "base",       stepLabel: "3" },
  { genre: "serum",      maxSlots: 3, section: "intensive",  stepLabel: "4" },
  { genre: "emulsion",   maxSlots: 1, section: "protection", stepLabel: "5" },
  { genre: "cream",      maxSlots: 1, section: "protection", stepLabel: "6" },
  { genre: "sunscreen",  maxSlots: 1, section: "protection", stepLabel: "7" },
  { genre: "mask_pack",  maxSlots: 1, section: "special",    stepLabel: "S" },
  { genre: "eye_care",   maxSlots: 1, section: "special",    stepLabel: "S" },
  { genre: "oil",        maxSlots: 1, section: "special",    stepLabel: "S" },
  { genre: "mist",       maxSlots: 1, section: "special",    stepLabel: "S" },
  { genre: "other",      maxSlots: 1, section: "special",    stepLabel: "S" },
] as const;

export const SECTION_INFO: Record<string, { label: string; step: string }> = {
  base:       { label: "\u30D9\u30FC\u30B9\u30B1\u30A2",     step: "STEP 1-3" },
  intensive:  { label: "\u96C6\u4E2D\u30B1\u30A2",       step: "STEP 4" },
  protection: { label: "\u4FDD\u8B77\u30B1\u30A2",       step: "STEP 5-7" },
  special:    { label: "\u30B9\u30DA\u30B7\u30E3\u30EB\u30B1\u30A2", step: "SPECIAL" },
};

export function getSlotConfig(genre: ProductGenre): GenreSlotConfig | undefined {
  return GENRE_SLOT_CONFIG.find((c) => c.genre === genre);
}

const SCAN_TYPE_MAP: Record<string, ProductGenre> = {
  "クレンジング": "cleansing",
  "メイク落とし": "cleansing",
  "洗顔": "face_wash",
  "洗顔フォーム": "face_wash",
  "洗顔料": "face_wash",
  "化粧水": "toner",
  "ローション": "toner",
  "トナー": "toner",
  "美容液": "serum",
  "セラム": "serum",
  "エッセンス": "serum",
  "導入美容液": "serum",
  "ブースター": "serum",
  "乳液": "emulsion",
  "ミルク": "emulsion",
  "クリーム": "cream",
  "ナイトクリーム": "cream",
  "保湿クリーム": "cream",
  "日焼け止め": "sunscreen",
  "UVケア": "sunscreen",
  "サンスクリーン": "sunscreen",
  "パック": "mask_pack",
  "マスク": "mask_pack",
  "シートマスク": "mask_pack",
  "アイクリーム": "eye_care",
  "アイケア": "eye_care",
  "目元美容液": "eye_care",
  "オイル": "oil",
  "美容オイル": "oil",
  "フェイスオイル": "oil",
  "ミスト": "mist",
  "スプレー": "mist",
};

/** スキャンAIの日本語出力を ProductGenre キーに変換 */
export function normalizeGenreFromScan(scanType: string): ProductGenre {
  const trimmed = scanType.trim();

  // 完全一致
  if (SCAN_TYPE_MAP[trimmed]) return SCAN_TYPE_MAP[trimmed];

  // 部分一致（キーワード含有チェック）
  for (const [keyword, genre] of Object.entries(SCAN_TYPE_MAP)) {
    if (trimmed.includes(keyword)) return genre;
  }

  return "other";
}
