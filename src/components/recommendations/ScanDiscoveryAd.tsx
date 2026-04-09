"use client";

import { useRecommendations } from "@/hooks/useRecommendations";
import { getIngredientByName } from "@/lib/ingredients";
import RakutenProductCard from "./RakutenProductCard";
import SkeletonLoader from "./SkeletonLoader";
import type { RarityKey } from "@/types";

const RARITY_VIS: Record<RarityKey, { star: number; color: string }> = {
  common:    { star: 1, color: "#9CA3AF" },
  uncommon:  { star: 2, color: "#4CAF50" },
  rare:      { star: 3, color: "#E91E8C" },
  legendary: { star: 4, color: "#F59E0B" },
};

export default function ScanDiscoveryAd() {
  const { data, loading, error } = useRecommendations(true);

  if (error) return null;

  const discovery = data?.discovery;
  const hasProducts = (discovery?.products?.length ?? 0) > 0;
  const hasHints = (discovery?.ingredientHints?.length ?? 0) > 0;

  // ローディング中でなく、表示するものがなければ非表示
  if (!loading && !hasProducts && !hasHints) return null;

  // ingredientHints（成分名）からフルデータを引く
  const hintIngredients = (discovery?.ingredientHints || [])
    .map((name) => getIngredientByName(name))
    .filter((ing): ing is NonNullable<typeof ing> => ing !== undefined);

  return (
    <div className="rounded-r2 bg-[#FFF7F0] border border-bo-parchment p-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">🧬</span>
        <h3 className="text-[13px] font-bold text-bo-ink font-sans">
          まだ出会っていない注目成分
        </h3>
      </div>

      {/* 選出ロジックバッジ */}
      {discovery?.reason && (
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-bo-ink-muted font-sans mb-3">
          {discovery.reason}
        </span>
      )}

      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* 成分行（図鑑と同じ表示形式） */}
          {hintIngredients.length > 0 && (
            <div className="flex flex-col gap-[5px] mb-3">
              {hintIngredients.map((ing) => {
                const r = RARITY_VIS[ing.rarity];
                return (
                  <div
                    key={ing.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[13px]"
                    style={{
                      background: "rgba(232,240,236,0.4)",
                      opacity: 0.5,
                    }}
                  >
                    {/* Stars */}
                    <span
                      className="text-[10px] shrink-0 w-[34px] text-center"
                      style={{ color: r.color }}
                    >
                      {"★".repeat(r.star)}
                      <span className="text-bo-parchment">
                        {"★".repeat(4 - r.star)}
                      </span>
                    </span>

                    {/* Name + hint */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold font-sans truncate text-bo-ink-faint">
                        ？？？
                      </div>
                      {ing.funFact && (
                        <div
                          className="text-[10px] font-sans mt-px truncate"
                          style={{ color: "#B08D3A" }}
                        >
                          💡 {ing.funFact}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 商品カード */}
          {hasProducts && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {discovery!.products.map((product, i) => (
                <RakutenProductCard key={i} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      {/* powered by 楽天市場 */}
      <div className="text-[9px] text-bo-ink-faint font-sans text-right mt-2">
        powered by 楽天市場
      </div>

      {/* 免責注記 */}
      <p className="text-[10px] text-bo-ink-faint font-sans text-center mt-2">
        ※ 効果効能を保証するものではありません
      </p>
    </div>
  );
}
