"use client";

import { useRecommendations } from "@/hooks/useRecommendations";
import AdCarousel from "./AdCarousel";
import SkeletonLoader from "./SkeletonLoader";

export default function ScanDiscoveryAd() {
  const { data, loading, error } = useRecommendations(true);

  if (error) return null;

  const products = data?.discovery?.products ?? [];

  if (!loading && products.length === 0) return null;

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
          marginBottom: 10,
        }}
      >
        <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
          Sponsored · PR
        </div>
        <div
          className="hd-mono"
          style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.15em" }}
        >
          {products.length > 0 ? `1 / ${products.length}` : "1 / 6"}
        </div>
      </div>

      <div
        className="hd-serif"
        style={{
          fontSize: 16,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          marginBottom: 14,
        }}
      >
        まだ出会っていない<span style={{ fontStyle: "italic", color: "var(--hd-moss)" }}>注目成分</span>
      </div>

      {loading ? <SkeletonLoader /> : <AdCarousel products={products} />}

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
