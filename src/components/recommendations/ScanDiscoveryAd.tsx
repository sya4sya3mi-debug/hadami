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
    <div className="rounded-r2 bg-[#FFF7F0] border border-bo-parchment p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-white/80 px-2 text-[10px] font-bold text-bo-accent font-sans">
          PR
        </span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">
          まだ出会っていない注目成分
        </h3>
      </div>

      {loading ? <SkeletonLoader /> : <AdCarousel products={products} />}

      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        楽天アフィリエイトを含みます
      </div>
    </div>
  );
}
