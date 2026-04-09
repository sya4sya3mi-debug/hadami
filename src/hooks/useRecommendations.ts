"use client";

import { useEffect, useState } from "react";
import type { RakutenProduct } from "@/types";
import { useUser } from "@/lib/auth";

interface RecommendationAxis {
  label: string;
  reason: string;
  products: RakutenProduct[];
  ingredientHints?: string[];
}

interface RecommendationData {
  similar: RecommendationAxis;
  discovery: RecommendationAxis;
  profile: {
    totalScans: number;
    knownIngredientCount: number;
    topGenre: string | null;
  };
}

// モジュールレベルキャッシュ: ユーザーIDごとにデータを保持
const cacheMap = new Map<string, { data: RecommendationData; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30分

export function useRecommendations(enabled: boolean) {
  const { user } = useUser();
  const userId = user?.id ?? "";
  const cached = userId ? cacheMap.get(userId) : undefined;
  const hasFreshCache = cached !== undefined && Date.now() - cached.timestamp < CACHE_TTL;
  const [data, setData] = useState<RecommendationData | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(enabled && !hasFreshCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;
    if (hasFreshCache) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          // 商品がある場合のみキャッシュ（空結果はキャッシュしない）
          const hasProducts =
            (json.similar?.products?.length ?? 0) > 0 ||
            (json.discovery?.products?.length ?? 0) > 0;
          if (hasProducts) {
            cacheMap.set(userId, { data: json, timestamp: Date.now() });
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, userId, hasFreshCache]);

  return { data, loading, error };
}
