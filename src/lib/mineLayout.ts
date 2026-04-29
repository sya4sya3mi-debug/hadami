import type { Product } from "@/types";

export type FrameVariant = "polaroid" | "clean" | "bordered" | "mono";

// djb2 hash — 高速・分散良好。同じ productId は常に同じ hash を返す。
export function djb2Hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

export function getFrameVariant(productId: string): FrameVariant {
  const r = djb2Hash(productId) % 100;
  if (r < 25) return "polaroid";
  if (r < 65) return "clean";
  if (r < 90) return "bordered";
  return "mono";
}

// -1°, -0.5°, 0°, 0.5°, 1° のいずれか（productId固定）
export function getRotation(productId: string): number {
  return ((djb2Hash(productId) % 5) - 2) * 0.5;
}

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const MONTH_FULL = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

// 「MAR '26」形式
export function formatAcquisitionDate(dateString?: string): string | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const yy = String(d.getFullYear()).slice(2);
  return `${MONTH_ABBR[d.getMonth()]} '${yy}`;
}

export function getCollectionSummary(products: Product[]): {
  count: number;
  genreCount: number;
  brandCount: number;
} {
  const genres = new Set<string>();
  const brands = new Set<string>();
  for (const p of products) {
    if (p.productType) genres.add(p.productType);
    if (p.brand?.trim()) brands.add(p.brand.trim());
  }
  return {
    count: products.length,
    genreCount: genres.size,
    brandCount: brands.size,
  };
}

// 「ISSUE 03 · MARCH '26」形式
export function getIssueLabel(
  firstUseDate: string | undefined,
  now: Date = new Date()
): string {
  let issueNumber = 1;
  if (firstUseDate) {
    const first = new Date(firstUseDate);
    if (!Number.isNaN(first.getTime())) {
      const monthDiff =
        (now.getFullYear() - first.getFullYear()) * 12 +
        (now.getMonth() - first.getMonth());
      issueNumber = Math.max(1, monthDiff + 1);
    }
  }
  const yy = String(now.getFullYear()).slice(2);
  return `ISSUE ${String(issueNumber).padStart(2, "0")} · ${MONTH_FULL[now.getMonth()]} '${yy}`;
}

// 表示優先度: featured(isFavorite + lastUsedAt 最新) > favorited > recently used > created desc
export function pickHero(products: Product[]): Product | null {
  if (products.length === 0) return null;
  const favorites = products.filter((p) => p.isFavorite);
  const pool = favorites.length > 0 ? favorites : products;

  const sorted = [...pool].sort((a, b) => {
    const aDate = a.lastUsedAt ?? a.createdAt;
    const bDate = b.lastUsedAt ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
  return sorted[0] ?? null;
}

export function pickSatellites(
  products: Product[],
  n: number,
  exclude: Product[] = []
): Product[] {
  const excludeIds = new Set(exclude.map((p) => p.id));
  return products
    .filter((p) => !excludeIds.has(p.id))
    .sort((a, b) => {
      // お気に入り優先 → 直近使用 → 作成順
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      const aDate = a.lastUsedAt ?? a.createdAt;
      const bDate = b.lastUsedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, n);
}

export function pickStaffPicks(
  products: Product[],
  n: number,
  exclude: Product[] = []
): Product[] {
  const excludeIds = new Set(exclude.map((p) => p.id));
  return products
    .filter((p) => p.isFavorite && !excludeIds.has(p.id))
    .sort((a, b) => {
      const aDate = a.lastUsedAt ?? a.createdAt;
      const bDate = b.lastUsedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, n);
}

// ブランド先頭文字列（モノグラム用）。アルファベット2文字 or 漢字1文字。
export function getBrandMonogram(brand: string): string {
  const trimmed = brand.trim();
  if (!trimmed) return "·";
  // ASCII を含む場合は単語先頭を最大2文字（"SK-II" → "SK"、"資生堂" → "資"）
  if (/^[\x20-\x7e]/.test(trimmed)) {
    const words = trimmed.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return trimmed.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || trimmed[0];
  }
  return trimmed[0];
}
