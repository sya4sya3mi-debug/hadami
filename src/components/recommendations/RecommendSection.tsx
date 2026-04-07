"use client";

import { useRecommendations } from "@/hooks/useRecommendations";
import RakutenProductCard from "./RakutenProductCard";
import SkeletonLoader from "./SkeletonLoader";
import type { RakutenProduct } from "@/types";

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
    ((data.similar.products?.length ?? 0) > 0 ||
      (data.discovery.products?.length ?? 0) > 0);

  // スキャンページでは商品なし・ローディング中は非表示
  if (hideIfEmpty && (loading || !hasProducts)) return null;

  if (!loading && !hasProducts) {
    return (
      <div className="rounded-r2 bg-white border border-bo-parchment p-5 text-center">
        <div className="text-2xl mb-2">🔍</div>
        <p className="text-sm font-semibold text-bo-ink font-sans mb-1">
          レコメンド準備中
        </p>
        <p className="text-xs text-bo-ink-muted font-sans">
          スキャン履歴が増えると、あなたにぴったりのコスメを提案します
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 軸1: 似た成分 */}
      <AxisSection
        icon="🔄"
        title="あなたの好みに近いアイテム"
        reason={data?.similar.reason}
        products={data?.similar.products}
        loading={loading}
        bgClass="bg-[#F0F9F4]"
      />

      {/* 軸2: 未知成分 */}
      <AxisSection
        icon="🧬"
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
  icon,
  title,
  reason,
  products,
  loading,
  bgClass,
  ingredientHints,
}: {
  icon: string;
  title: string;
  reason?: string;
  products?: RakutenProduct[];
  loading: boolean;
  bgClass: string;
  ingredientHints?: string[];
}) {
  return (
    <div className={`rounded-r2 ${bgClass} border border-bo-parchment p-4`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">{title}</h3>
      </div>

      {/* 選出ロジックバッジ */}
      {reason && (
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-bo-ink-muted font-sans mb-3">
          {reason}
        </span>
      )}

      {/* 成分ヒント（軸2のみ） */}
      {ingredientHints && ingredientHints.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
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
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {products.map((product, i) => (
            <RakutenProductCard key={i} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-bo-ink-muted font-sans py-3 text-center">
          該当する商品が見つかりませんでした
        </p>
      )}

      {/* powered by 楽天市場 */}
      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        powered by 楽天市場
      </div>
    </div>
  );
}
