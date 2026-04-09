import { ProductGenre } from "@/types";

export interface ProductGenreInfo {
  key: ProductGenre;
  label: string;
  icon: string;
  color: string;
  order: number;
}

export const PRODUCT_GENRES: readonly ProductGenreInfo[] = [
  { key: "cleansing", label: "クレンジング", icon: "\u{1F9F4}", color: "#AB47BC", order: 1 },
  { key: "face_wash", label: "洗顔", icon: "\u{1FAE7}", color: "#42A5F5", order: 2 },
  { key: "toner", label: "化粧水", icon: "\u{1F4A7}", color: "#4FC3F7", order: 3 },
  { key: "serum", label: "美容液", icon: "\u2728", color: "#CE93D8", order: 4 },
  { key: "emulsion", label: "乳液", icon: "\u{1F95B}", color: "#FFB74D", order: 5 },
  { key: "cream", label: "クリーム", icon: "\u{1FAD9}", color: "#F9A8C0", order: 6 },
  { key: "sunscreen", label: "日焼け止め", icon: "\u2600\uFE0F", color: "#FFD54F", order: 7 },
  { key: "mask_pack", label: "パック・マスク", icon: "\u{1F3AD}", color: "#80CBC4", order: 8 },
  { key: "eye_care", label: "アイケア", icon: "\u{1F441}\uFE0F", color: "#90A4AE", order: 9 },
  { key: "oil", label: "オイル", icon: "\u{1F49B}", color: "#A5D6A7", order: 10 },
  { key: "mist", label: "ミスト", icon: "\u{1F32B}\uFE0F", color: "#B3E5FC", order: 11 },
  { key: "other", label: "その他", icon: "\u{1F4E6}", color: "#BDBDBD", order: 12 },
] as const;

export function getGenreByKey(key: string): ProductGenreInfo | undefined {
  return PRODUCT_GENRES.find((genre) => genre.key === key);
}

export interface GenreSlotConfig {
  genre: ProductGenre;
  maxSlots: number;
  section: "base" | "intensive" | "protection" | "special";
  stepLabel: string;
}

export const GENRE_SLOT_CONFIG: readonly GenreSlotConfig[] = [
  { genre: "toner", maxSlots: 1, section: "base", stepLabel: "1" },
  { genre: "serum", maxSlots: 2, section: "intensive", stepLabel: "2" },
  { genre: "emulsion", maxSlots: 1, section: "protection", stepLabel: "3" },
  { genre: "cream", maxSlots: 1, section: "protection", stepLabel: "4" },
  { genre: "sunscreen", maxSlots: 1, section: "protection", stepLabel: "5" },
  { genre: "mask_pack", maxSlots: 1, section: "special", stepLabel: "6" },
] as const;

export const SECTION_INFO: Record<string, { label: string; step: string }> = {
  base: { label: "ベースケア", step: "STEP 1" },
  intensive: { label: "集中ケア", step: "STEP 2" },
  protection: { label: "保護ケア", step: "STEP 3-5" },
  special: { label: "スペシャルケア", step: "STEP 6" },
};

export function getSlotConfig(genre: ProductGenre): GenreSlotConfig | undefined {
  return GENRE_SLOT_CONFIG.find((config) => config.genre === genre);
}

const SCAN_TYPE_MAP: Record<string, ProductGenre> = {
  cleansing: "cleansing",
  cleanser: "cleansing",
  "クレンジング": "cleansing",
  "メイク落とし": "cleansing",
  "face wash": "face_wash",
  wash: "face_wash",
  "洗顔": "face_wash",
  "洗顔フォーム": "face_wash",
  toner: "toner",
  lotion: "toner",
  "化粧水": "toner",
  ローション: "toner",
  serum: "serum",
  essence: "serum",
  "美容液": "serum",
  エッセンス: "serum",
  emulsion: "emulsion",
  milk: "emulsion",
  "乳液": "emulsion",
  cream: "cream",
  "クリーム": "cream",
  sunscreen: "sunscreen",
  "sun screen": "sunscreen",
  "日焼け止め": "sunscreen",
  UVケア: "sunscreen",
  mask: "mask_pack",
  pack: "mask_pack",
  パック: "mask_pack",
  マスク: "mask_pack",
  "mask pack": "mask_pack",
  "eye care": "eye_care",
  eyecream: "eye_care",
  "アイケア": "eye_care",
  "アイクリーム": "eye_care",
  oil: "oil",
  "オイル": "oil",
  mist: "mist",
  "ミスト": "mist",
  other: "other",
  "その他": "other",
};

export function normalizeGenreFromScan(scanType: string): ProductGenre {
  const trimmed = scanType.trim();
  if (!trimmed) return "other";

  if (SCAN_TYPE_MAP[trimmed]) return SCAN_TYPE_MAP[trimmed];

  const lowered = trimmed.toLowerCase();
  if (SCAN_TYPE_MAP[lowered]) return SCAN_TYPE_MAP[lowered];

  for (const [keyword, genre] of Object.entries(SCAN_TYPE_MAP)) {
    if (trimmed.includes(keyword) || lowered.includes(keyword.toLowerCase())) {
      return genre;
    }
  }

  return "other";
}
