"use client";

import { useState, useEffect } from "react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50分

/**
 * R2キーから署名付きURLを取得するフック。
 * 既にHTTP URLの場合はそのまま返す。
 * インメモリキャッシュにより同一キーの再フェッチを抑制する。
 */
export function useSignedImageUrl(
  path: string | undefined
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => {
    if (!path) return undefined;
    if (isDirectUrl(path)) return path;
    const cached = cache.get(path);
    if (cached && Date.now() < cached.expiresAt) return cached.url;
    return undefined;
  });

  useEffect(() => {
    if (!path) {
      setUrl(undefined);
      return;
    }
    if (isDirectUrl(path)) {
      setUrl(path);
      return;
    }

    const cached = cache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      setUrl(cached.url);
      return;
    }

    let cancelled = false;

    fetch("/api/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: [path] }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const signed = data?.urls?.[path];
        if (signed) {
          cache.set(path, { url: signed, expiresAt: Date.now() + CACHE_TTL_MS });
          setUrl(signed);
        } else {
          setUrl(`${R2_PUBLIC_URL}/${path}`);
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(`${R2_PUBLIC_URL}/${path}`);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

function isDirectUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  );
}
