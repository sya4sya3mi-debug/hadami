import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const CACHE_KEY = "hadami-img-cache";
const CACHE_TTL_MS = 55 * 60 * 1000; // 55分（signed URLの有効期限1時間より短く）

type UrlCache = Record<string, { url: string; expiresAt: number }>;

/** インメモリキャッシュ — localStorage I/O を最小化 */
let memCache: UrlCache | null = null;

function loadCache(): UrlCache {
  if (memCache) return memCache;
  if (typeof window === "undefined") return {};
  try {
    memCache = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "{}");
    return memCache!;
  } catch {
    memCache = {};
    return memCache;
  }
}

function saveCache(cache: UrlCache) {
  memCache = cache;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/** 複数パスの signed URL を一括取得（バッチAPI使用） */
export async function getSignedImageUrls(
  supabase: SupabaseClient,
  filePaths: string[],
  expiresIn: number = 3600
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const cache = loadCache();
  const needFetch: string[] = [];

  for (const fp of filePaths) {
    if (fp.startsWith("http://") || fp.startsWith("https://")) {
      result[fp] = fp;
    } else {
      const cached = cache[fp];
      if (cached && cached.expiresAt > Date.now()) {
        result[fp] = cached.url;
      } else {
        needFetch.push(fp);
      }
    }
  }

  if (needFetch.length > 0) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(needFetch, expiresIn);

    if (!error && data) {
      const now = Date.now();
      for (const item of data) {
        if (item.signedUrl && item.path) {
          cache[item.path] = { url: item.signedUrl, expiresAt: now + CACHE_TTL_MS };
          result[item.path] = item.signedUrl;
        }
      }
      saveCache(cache);
    } else {
      for (const fp of needFetch) {
        result[fp] = null;
      }
    }
  }

  return result;
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
  memCache = null;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CACHE_KEY);
}
