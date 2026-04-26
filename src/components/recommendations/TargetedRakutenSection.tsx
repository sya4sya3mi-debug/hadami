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
            .filter((hint) => hint.length > 0),
        ),
      ).slice(0, 3),
    [ingredientHints],
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
    <div
      style={{
        background: "var(--hd-surface-2)",
        border: "1px solid var(--hd-hair)",
        padding: "16px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: description ? 6 : 12,
        }}
      >
        <div
          className="hd-mono hd-caps"
          style={{ color: "var(--hd-ink-40)" }}
        >
          Sponsored · {icon}
        </div>
        <div
          className="hd-mono"
          style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.15em" }}
        >
          1 / {products.length || 6}
        </div>
      </div>

      <div
        className="hd-serif"
        style={{
          fontSize: 16,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          marginBottom: description ? 8 : 14,
        }}
      >
        {title}
      </div>

      {description && (
        <p
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 11,
            lineHeight: 1.7,
            color: "var(--hd-ink-60)",
            margin: "0 0 12px",
          }}
        >
          {description}
        </p>
      )}

      {normalizedHints.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {normalizedHints.map((hint) => (
            <span
              key={hint}
              className="hd-mono hd-caps"
              style={{
                padding: "3px 8px",
                color: "var(--hd-ink-60)",
                border: "1px solid var(--hd-hair)",
                background: "var(--hd-bg)",
              }}
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
        <p
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 12,
            color: "var(--hd-ink-60)",
            padding: "12px 0",
            textAlign: "center",
            margin: 0,
          }}
        >
          {emptyMessage}
        </p>
      )}

      <div
        className="hd-mono hd-caps"
        style={{
          color: "var(--hd-ink-40)",
          textAlign: "right",
          marginTop: 12,
        }}
      >
        Rakuten Affiliate
      </div>
    </div>
  );
}
