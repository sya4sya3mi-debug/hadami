// シェアカード共通: 比率・テンプレ・ステート型

import type { Product } from "@/types";
import type { SharePalette, SharePaletteKey } from "@/lib/shareCardPalettes";
import type { ShareDecoKey } from "@/lib/shareCardDeco";

export type ShareAspectKey = "1:1" | "9:16";

export type ShareTemplateKey = "H4" | "S5" | "M4";

export type ShareCardConfig = {
  template: ShareTemplateKey;
  palette: SharePaletteKey;
  deco: ShareDecoKey;
  aspect: ShareAspectKey;
  username: string;
  skinType: string;
};

export type ShareTemplateProps = {
  products: Product[]; // 4点（不足時は穴埋めなし、テンプレ側でハンドリング）
  palette: SharePalette;
  deco: ShareDecoKey;
  aspect: ShareAspectKey;
  username: string;
  skinType: string;
};

// 表示用キャンバスサイズ（編集画面でのプレビュー基準）
// 1:1: 540×540, 9:16: 360×640
// 書き出し時は html2canvas scale で 1080px 幅へ拡大する
export const ASPECT_DIMENSIONS: Record<ShareAspectKey, { width: number; height: number }> = {
  "1:1": { width: 540, height: 540 },
  "9:16": { width: 360, height: 640 },
};

// 書き出し倍率: 表示サイズ × scale = 出力 px
// 1:1 → 540 × 2 = 1080, 9:16 → 360 × 3 = 1080
export const ASPECT_EXPORT_SCALE: Record<ShareAspectKey, number> = {
  "1:1": 2,
  "9:16": 3,
};

export function getInitials(value: string): string {
  if (!value) return "—";
  const trimmed = value.trim();
  const ascii = trimmed.match(/[A-Za-z]+/g)?.join(" ") ?? "";
  if (ascii) {
    return ascii
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  }
  return trimmed.charAt(0);
}

// 商品名を短く（テンプレでクリップ用）
export function shortName(name: string, words = 3): string {
  if (!name) return "";
  const parts = name.split(/\s+/);
  if (parts.length <= words) return name;
  return parts.slice(0, words).join(" ");
}
