"use client";

import { useRef, useEffect } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";
import RakutenProductCard from "./RakutenProductCard";
import SkeletonLoader from "./SkeletonLoader";
import type { RakutenProduct } from "@/types";
import { RAKUTEN_CARD_SCROLL_STEP_PX } from "./cardLayout";

interface Props {
  enabled: boolean;
  /** 商品がない場合・ローディング中は何も表示しない（スキャンページ用） */
  hideIfEmpty?: boolean;
}

export default function RecommendSection({ enabled, hideIfEmpty = false }: Props) {
  const { data, loading, error } = useRecommendations(enabled);

  if (!enabled) return null;
  if (error) return null;

  const hasProducts =
    data &&
    (data.discovery.products?.length ?? 0) > 0;

  // スキャンページでは商品なし・ローディング中は非表示
  if (hideIfEmpty && (loading || !hasProducts)) return null;

  if (!loading && !hasProducts) {
    return (
      <div className="rounded-r2 bg-white border border-bo-parchment p-5 text-center">
        <div className="text-2xl mb-2">🛍️</div>
        <p className="text-sm font-semibold text-bo-ink font-sans mb-1">
          あなた向けのコスメを提案
        </p>
        <p className="text-xs text-bo-ink-muted font-sans">
          コスメをスキャンするほど、成分の傾向に合った商品が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 軸1: 似た成分 — 一時非表示 */}
      {/* <AxisSection
        icon="🔄"
        title="あなたの好みに近いアイテム"
        reason={data?.similar.reason}
        products={data?.similar.products}
        loading={loading}
        bgClass="bg-[#F0F9F4]"
      /> */}

      {/* 軸2: 未知成分 */}
      <AxisSection
        title="まだ出会っていない注目成分"
        reason={data?.discovery.reason}
        products={data?.discovery.products}
        loading={loading}
        bgClass="bg-[#FFF7F0]"
        ingredientHints={data?.discovery.ingredientHints}
      />

      {/* 免責注記 */}
      <p className="text-[10px] text-bo-ink-faint font-sans text-center">
        ※ 効果効能を保証するものではありません
      </p>
    </div>
  );
}

function AxisSection({
  title,
  reason,
  products,
  loading,
  bgClass,
  ingredientHints,
}: {
  title: string;
  reason?: string;
  products?: RakutenProduct[];
  loading: boolean;
  bgClass: string;
  ingredientHints?: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  // 自動スライド: 3秒ごとに次のカードへ
  useEffect(() => {
    if (!products || products.length <= 1) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const maxIndex = products.length - 1;
      indexRef.current = indexRef.current >= maxIndex ? 0 : indexRef.current + 1;
      el.scrollTo({
        left: indexRef.current * RAKUTEN_CARD_SCROLL_STEP_PX,
        behavior: "smooth",
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className={`rounded-r2 ${bgClass} border border-bo-parchment p-3`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex min-w-7 h-7 items-center justify-center rounded-full bg-white/80 px-2 text-[10px] font-bold text-bo-accent font-sans">
          PR
        </span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">{title}</h3>
      </div>

      {/* 選出ロジックバッジ */}
      {reason && (
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-bo-ink-muted font-sans mb-2">
          {reason}
        </span>
      )}

      {/* 成分ヒント（軸2のみ） */}
      {ingredientHints && ingredientHints.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ingredientHints.map((hint) => (
            <span
              key={hint}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 text-bo-ink-muted font-sans"
            >
              {hint}
            </span>
          ))}
        </div>
      )}

      {/* 商品カード */}
      {loading ? (
        <SkeletonLoader />
      ) : products && products.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
          onMouseEnter={() => {
            indexRef.current = Math.round(
              (scrollRef.current?.scrollLeft ?? 0) /
                RAKUTEN_CARD_SCROLL_STEP_PX
            );
          }}
        >
          {products.map((product, i) => (
            <RakutenProductCard key={i} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-bo-ink-muted font-sans py-3 text-center">
          該当する商品が見つかりませんでした
        </p>
      )}

      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        楽天アフィリエイトを含みます
      </div>
    </div>
  );
}
