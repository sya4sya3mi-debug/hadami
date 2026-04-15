import type { SupabaseClient } from "@supabase/supabase-js";

// --- インメモリキャッシュ（署名付きURL用） ---
type CacheEntry = { url: string; expiresAt: number };
const urlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50分（署名URLは60分有効、10分のマージン）

function getCached(key: string): string | null {
  const entry = urlCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    urlCache.delete(key);
    return null;
  }
  return entry.url;
}

function setCache(key: string, url: string) {
  urlCache.set(key, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

function isDirectUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}

async function fetchSignedUrls(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};

  const res = await fetch("/api/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys }),
  });

  if (!res.ok) {
    console.warn("signed-url fetch failed:", res.status);
    return {};
  }

  const data = await res.json();
  return data.urls as Record<string, string>;
}

/** 複数パスの署名付きURLを一括取得（キャッシュ付き） */
export async function getSignedImageUrls(
  _supabase: SupabaseClient,
  filePaths: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expiresIn?: number
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const uncachedKeys: string[] = [];

  for (const fp of filePaths) {
    if (isDirectUrl(fp)) {
      result[fp] = fp;
      continue;
    }

    const cached = getCached(fp);
    if (cached) {
      result[fp] = cached;
    } else {
      uncachedKeys.push(fp);
    }
  }

  if (uncachedKeys.length > 0) {
    const signed = await fetchSignedUrls(uncachedKeys);
    for (const key of uncachedKeys) {
      const url = signed[key] ?? null;
      if (url) setCache(key, url);
      result[key] = url;
    }
  }

  return result;
}

/**
 * ストレージパスから署名付きURLを生成する。
 * フル URL（既存データの後方互換）が渡された場合はそのまま返す。
 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn?: number
): Promise<string | null> {
  const urls = await getSignedImageUrls(supabase, [filePath], expiresIn);
  return urls[filePath] ?? null;
}

/** キャッシュクリア */
export function clearImageUrlCache() {
  urlCache.clear();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("hadami-img-cache");
  }
}
