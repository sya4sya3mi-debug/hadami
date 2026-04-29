// ルーティンカードのスタイルプリセット定義
// テンプレート（レイアウト）とアクセントカラーの選択肢を集約

import type { RoutineCardMode } from "@/lib/routineCards";

export type RoutineTemplateKey = "editorial" | "minimal" | "magazine" | "polaroid";

export type AccentColorKey =
  | "crimson"
  | "coral"
  | "saffron"
  | "olive"
  | "emerald"
  | "teal"
  | "cobalt"
  | "lilac"
  | "plum"
  | "ink";

export type AccentColorOption = {
  key: AccentColorKey;
  label: string;
  swatchVar: string;
  legacyHex: string;
};

export type TemplateOption = {
  key: RoutineTemplateKey;
  label: string;
  description: string;
};

export const ACCENT_COLORS: readonly AccentColorOption[] = [
  { key: "crimson", label: "クリムゾン", swatchVar: "#C8203A", legacyHex: "#C8203A" },
  { key: "coral",   label: "コーラル",   swatchVar: "#F26B5E", legacyHex: "#F26B5E" },
  { key: "saffron", label: "サフラン",   swatchVar: "#E5A41C", legacyHex: "#E5A41C" },
  { key: "olive",   label: "オリーブ",   swatchVar: "#6F7A2E", legacyHex: "#6F7A2E" },
  { key: "emerald", label: "エメラルド", swatchVar: "#138A5C", legacyHex: "#138A5C" },
  { key: "teal",    label: "ティール",   swatchVar: "#0E8B8E", legacyHex: "#0E8B8E" },
  { key: "cobalt",  label: "コバルト",   swatchVar: "#1E4FB8", legacyHex: "#1E4FB8" },
  { key: "lilac",   label: "ライラック", swatchVar: "#7E5BCC", legacyHex: "#7E5BCC" },
  { key: "plum",    label: "プラム",     swatchVar: "#7A2660", legacyHex: "#7A2660" },
  { key: "ink",     label: "インク",     swatchVar: "#1F1F1F", legacyHex: "#1F1F1F" },
] as const;

const LEGACY_KEY_MAP: Record<string, AccentColorKey> = {
  moss: "emerald",
  terra: "coral",
  lavender: "lilac",
  dune: "saffron",
  sage: "olive",
  ink: "ink",
};

export const TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  { key: "editorial", label: "エディトリアル", description: "雑誌的な3+2グリッド" },
  { key: "minimal", label: "ミニマル", description: "余白多め、縦積み" },
  { key: "magazine", label: "マガジン", description: "推し1本を主役に" },
  { key: "polaroid", label: "ポラロイド", description: "白フチ・微回転の手作り感" },
] as const;

const ACCENT_KEYS = ACCENT_COLORS.map((c) => c.key) as readonly AccentColorKey[];
const TEMPLATE_KEYS = TEMPLATE_OPTIONS.map((t) => t.key) as readonly RoutineTemplateKey[];

export function isAccentColorKey(value: unknown): value is AccentColorKey {
  return typeof value === "string" && (ACCENT_KEYS as readonly string[]).includes(value);
}

export function isRoutineTemplateKey(value: unknown): value is RoutineTemplateKey {
  return typeof value === "string" && (TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function resolveAccentVar(key: string): string {
  const found = ACCENT_COLORS.find((c) => c.key === key);
  return found ? found.swatchVar : "#F26B5E";
}

export function getAccentLabel(key: string): string {
  return ACCENT_COLORS.find((c) => c.key === key)?.label ?? "コーラル";
}

export function getTemplateLabel(key: string): string {
  return TEMPLATE_OPTIONS.find((t) => t.key === key)?.label ?? "エディトリアル";
}

// 初回オープン時のAM/PM連動初期色（朝=暖色 / 夜=寒色）
export function getInitialAccentForMode(mode: RoutineCardMode): AccentColorKey {
  return mode === "pm" ? "cobalt" : "coral";
}

// HEX値や旧形式の accentColor を AccentColorKey に正規化
export function coerceAccentColor(raw: unknown): AccentColorKey {
  if (isAccentColorKey(raw)) return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    const mapped = LEGACY_KEY_MAP[normalized];
    if (mapped) return mapped;
    const matchedHex = ACCENT_COLORS.find(
      (c) => c.legacyHex.toLowerCase() === normalized,
    );
    if (matchedHex) return matchedHex.key;
  }
  return "coral";
}

export function coerceRoutineTemplate(raw: unknown): RoutineTemplateKey {
  return isRoutineTemplateKey(raw) ? raw : "editorial";
}
