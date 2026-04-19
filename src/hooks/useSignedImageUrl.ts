"use client";

import { useEffect, useState } from "react";

/* ── in-memory cache (TTL 50 min < signed URL expiry 60 min) ── */
const CACHE_TTL_MS = 50 * 60 * 1000;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const urlCache = new Map<string, CacheEntry>();

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

/* ── de-duplicate in-flight requests ── */
let pendingKeys: string[] = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushPromise: Promise<Record<string, string>> | null = null;

function scheduleFetch(): Promise<Record<string, string>> {
  if (flushPromise) return flushPromise;

  flushPromise = new Promise((resolve) => {
    flushTimer = setTimeout(async () => {
      const keys = Array.from(new Set(pendingKeys));
      pendingKeys = [];
      flushTimer = null;
      flushPromise = null;

      if (keys.length === 0) {
        resolve({});
        return;
      }

      try {
        const res = await fetch("/api/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys }),
        });
        if (!res.ok) {
          resolve({});
          return;
        }
        const data = await res.json();
        const urls: Record<string, string> = data.urls ?? {};

        for (const [k, v] of Object.entries(urls)) {
          setCache(k, v);
        }
        resolve(urls);
      } catch {
        resolve({});
      }
    }, 16); // batch within one frame
  });

  return flushPromise;
}

async function resolveSignedUrl(key: string): Promise<string | undefined> {
  const cached = getCached(key);
  if (cached) return cached;

  pendingKeys.push(key);
  const urls = await scheduleFetch();
  return urls[key] ?? getCached(key) ?? undefined;
}

function isDirectUrl(path: string): boolean {
  return (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/") ||
    path.startsWith("data:")
  );
}

/**
 * 画像パスからR2署名付きURLを非同期で解決するフック。
 * 既にHTTP URLやdata: URLの場合はそのまま返す。
 */
export function useSignedImageUrl(
  path: string | undefined
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => {
    if (!path) return undefined;
    if (isDirectUrl(path)) return path;
    return getCached(path) ?? undefined;
  });

  useEffect(() => {
    if (!path || isDirectUrl(path)) {
      setUrl(path);
      return;
    }

    const cached = getCached(path);
    if (cached) {
      setUrl(cached);
      return;
    }

    let cancelled = false;
    resolveSignedUrl(path).then((resolved) => {
      if (!cancelled && resolved) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

/** キャッシュクリア */
export function clearSignedUrlCache() {
  urlCache.clear();
}
