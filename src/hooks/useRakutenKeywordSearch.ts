"use client";

import { useEffect, useMemo, useState } from "react";
import type { RakutenProduct } from "@/types";

type RakutenSearchResults = Record<string, RakutenProduct[]>;

const CACHE_TTL = 10 * 60 * 1000;
const cacheMap = new Map<
  string,
  { data: RakutenSearchResults; timestamp: number }
>();

export function useRakutenKeywordSearch(enabled: boolean, keywords: string[]) {
  const normalizedKeywords = useMemo(
    () =>
      Array.from(
        new Set(
          keywords
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
        )
      ).slice(0, 5),
    [keywords]
  );

  const cacheKey = normalizedKeywords.join("||");
  const cached = cacheKey ? cacheMap.get(cacheKey) : undefined;
  const hasFreshCache =
    cached !== undefined && Date.now() - cached.timestamp < CACHE_TTL;

  const [data, setData] = useState<RakutenSearchResults>(cached?.data ?? {});
  const [loading, setLoading] = useState(
    enabled && normalizedKeywords.length > 0 && !hasFreshCache
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || normalizedKeywords.length === 0) {
      setData({});
      setLoading(false);
      setError(null);
      return;
    }

    if (hasFreshCache) {
      setData(cached?.data ?? {});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setData({});
    setLoading(true);
    setError(null);

    fetch("/api/rakuten/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: normalizedKeywords }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to fetch Rakuten products");
        }
        return payload as { results?: RakutenSearchResults };
      })
      .then((payload) => {
        if (cancelled) return;
        const nextData = payload.results ?? {};
        setData(nextData);
        cacheMap.set(cacheKey, {
          data: nextData,
          timestamp: Date.now(),
        });
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, normalizedKeywords, cacheKey, hasFreshCache, cached]);

  return { data, loading, error, keywords: normalizedKeywords };
}
