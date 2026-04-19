"use client";

import { useMemo } from "react";
import type { RakutenProduct } from "@/types";
import { useRakutenKeywordSearch } from "@/hooks/useRakutenKeywordSearch";
import AdCarousel from "./AdCarousel";
import SkeletonLoader from "./SkeletonLoader";

interface Props {
  enabled: boolean;
  title: string;
  description?: string;
  keywords: string[];
  ingredientHints?: string[];
  icon?: string;
  bgClass?: string;
  hideIfEmpty?: boolean;
  emptyMessage?: string;
}

export default function TargetedRakutenSection({
  enabled,
  title,
  description,
  keywords,
  ingredientHints = [],
  icon = "PR",
  bgClass = "bg-[#FFF7F0]",
  hideIfEmpty = true,
  emptyMessage = "楽天で該当アイテムが見つからないため、ここでは非表示にしています。",
}: Props) {
  const { data, loading, error, keywords: normalizedKeywords } =
    useRakutenKeywordSearch(enabled, keywords);

  const normalizedHints = useMemo(
    () =>
      Array.from(
        new Set(
          ingredientHints
            .map((hint) => hint.trim())
            .filter((hint) => hint.length > 0)
        )
      ).slice(0, 3),
    [ingredientHints]
  );

  const products = useMemo(() => {
    const seen = new Set<string>();
    const merged: RakutenProduct[] = [];

    for (const keyword of normalizedKeywords) {
      for (const product of data[keyword] ?? []) {
        const dedupeKey =
          product.affiliateUrl || `${product.shopName}:${product.name}`;
        if (seen.has(dedupeKey)) continue;

        seen.add(dedupeKey);
        merged.push(product);

        if (merged.length >= 6) {
          return merged;
        }
      }
    }

    return merged;
  }, [data, normalizedKeywords]);

  if (!enabled) return null;
  if (error) return null;
  if (!loading && products.length === 0 && hideIfEmpty) return null;

  return (
    <div className={`rounded-r2 ${bgClass} border border-bo-parchment p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-white/80 px-2 text-[10px] font-bold text-bo-accent font-sans">
          {icon}
        </span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">{title}</h3>
      </div>

      {description && (
        <p className="text-[11px] leading-relaxed text-bo-ink-muted font-sans mb-2">
          {description}
        </p>
      )}

      {normalizedHints.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {normalizedHints.map((hint) => (
            <span
              key={hint}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 text-bo-ink-muted font-sans"
            >
              {hint}
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonLoader />
      ) : products.length > 0 ? (
        <AdCarousel products={products} />
      ) : (
        <p className="text-xs text-bo-ink-muted font-sans py-3 text-center">
          {emptyMessage}
        </p>
      )}

      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        楽天アフィリエイトを含みます
      </div>
    </div>
  );
}
