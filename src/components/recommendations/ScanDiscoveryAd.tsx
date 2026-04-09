"use client";

import { useRecommendations } from "@/hooks/useRecommendations";
import RakutenProductCard from "./RakutenProductCard";
import SkeletonLoader from "./SkeletonLoader";

export default function ScanDiscoveryAd() {
  const { data, loading, error } = useRecommendations(true);

  if (error) return null;

  const discovery = data?.discovery;
  const hasProducts = (discovery?.products?.length ?? 0) > 0;

  // ローディング中でなく、商品がなければ非表示
  if (!loading && !hasProducts) return null;

  return (
    <div className="rounded-r2 bg-[#FFF7F0] border border-bo-parchment p-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-white/80 px-2 text-[10px] font-bold text-bo-accent font-sans">
          PR
        </span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">
          まだ出会っていない注目成分
        </h3>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* 商品カード */}
          {hasProducts && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {discovery!.products.map((product, i) => (
                <RakutenProductCard key={i} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        楽天アフィリエイトを含みます
      </div>
    </div>
  );
}
