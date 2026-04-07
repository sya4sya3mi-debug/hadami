"use client";

import { useEffect, useState } from "react";
import type { RakutenProduct } from "@/types";

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

export function useRecommendations(enabled: boolean) {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
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
  }, [enabled]);

  return { data, loading, error };
}
