import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const CACHE_KEY = "hadami-img-cache";
const CACHE_TTL_MS = 55 * 60 * 1000; // 55分（signed URLの有効期限1時間より短く）

type UrlCache = Record<string, { url: string; expiresAt: number }>;

function loadCache(): UrlCache {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: UrlCache) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * ストレージパスから signed URL を生成する。
 * キャッシュがあれば再利用し、ない/期限切れのときだけ Supabase にリクエスト。
 * フル URL（既存データの後方互換）が渡された場合はそのまま返す。
 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  // Already a full URL (legacy data) — return as-is
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const cache = loadCache();
  const cached = cache[filePath];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) return null;

  cache[filePath] = { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS };
  saveCache(cache);

  return data.signedUrl;
}

/** キャッシュをクリア（ログアウト時などに使用） */
export function clearImageUrlCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CACHE_KEY);
}
