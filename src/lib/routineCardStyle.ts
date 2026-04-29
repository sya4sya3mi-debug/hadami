// ルーティンカードのスタイルプリセット定義
// テンプレート（レイアウト）とアクセントカラーの選択肢を集約

import type { RoutineCardMode } from "@/lib/routineCards";

export type RoutineTemplateKey = "editorial" | "minimal" | "magazine" | "polaroid";

export type AccentColorKey = "moss" | "terra" | "lavender" | "dune" | "sage" | "ink";

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
  { key: "moss", label: "モス", swatchVar: "var(--hd-moss)", legacyHex: "#3A8F7A" },
  { key: "terra", label: "テラ", swatchVar: "var(--hd-terra)", legacyHex: "#C77B5C" },
  { key: "lavender", label: "ラベンダー", swatchVar: "var(--hd-lavender)", legacyHex: "#9D8FBF" },
  { key: "dune", label: "デューン", swatchVar: "var(--hd-dune)", legacyHex: "#C8B68F" },
  { key: "sage", label: "セージ", swatchVar: "var(--hd-sage)", legacyHex: "#9BB59A" },
  { key: "ink", label: "インク", swatchVar: "var(--hd-ink)", legacyHex: "#1F1F1F" },
] as const;

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
  return found ? found.swatchVar : "var(--hd-moss)";
}

export function getAccentLabel(key: string): string {
  return ACCENT_COLORS.find((c) => c.key === key)?.label ?? "モス";
}

export function getTemplateLabel(key: string): string {
  return TEMPLATE_OPTIONS.find((t) => t.key === key)?.label ?? "エディトリアル";
}

// 初回オープン時のAM/PM連動初期色（朝=暖色 / 夜=寒色）
export function getInitialAccentForMode(mode: RoutineCardMode): AccentColorKey {
  return mode === "pm" ? "lavender" : "terra";
}

// HEX値や旧形式の accentColor を AccentColorKey に正規化
export function coerceAccentColor(raw: unknown): AccentColorKey {
  if (isAccentColorKey(raw)) return raw;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    const matchedHex = ACCENT_COLORS.find(
      (c) => c.legacyHex.toLowerCase() === normalized,
    );
    if (matchedHex) return matchedHex.key;
  }
  return "moss";
}

export function coerceRoutineTemplate(raw: unknown): RoutineTemplateKey {
  return isRoutineTemplateKey(raw) ? raw : "editorial";
}
