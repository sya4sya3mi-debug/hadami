"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, getGenreInfo } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { getGenreByKey } from "@/lib/productGenres";
import Badge, { StarIcon } from "@/components/ui/Badge";
import { RARITY } from "@/lib/ingredients";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";

export default function ProductDetailPage() {
  const { loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));

  if (loading) {
    return <PageLoading message="コスメ情報を読み込んでいます..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen px-5 pt-10 text-center bg-bo-cream">
        <p className="text-bo-ink-muted">コスメが見つかりません</p>
        <Link href="/history" className="text-sm mt-2 inline-block font-medium text-bo-accent">
          マイコスメに戻る
        </Link>
      </div>
    );
  }

  const genre = getGenreByKey(product.productType || "other");

  const ingredients = [...product.ingredients]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((i) => i !== undefined);

  const ingredientNames = ingredients.map((i) => i.nameJa);
  const combinations = findCombinations(ingredientNames);
  return (
    <AuthGuard>
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-8 pb-6">
        <Link href="/history" className="text-sm font-medium mb-5 inline-block text-bo-accent">
          ← マイコスメ
        </Link>

        {/* Product photo */}
        {product.packageImage && (
          <div className="mb-3 rounded-r2 overflow-hidden bg-white shadow-bo1 border border-bo-parchment">
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={product.packageImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 430px) 100vw, 430px"
                priority
              />
            </div>
          </div>
        )}

        {/* Product header */}
        <div className="flex items-center gap-3 mb-5 bg-white rounded-r2 p-3.5 shadow-bo1 border border-bo-parchment">
          {!product.packageImage && (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
              📦
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base text-bo-ink font-sans truncate">{product.name}</h1>
            <p className="text-xs text-bo-ink-muted font-sans">{product.brand}</p>
            {genre && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1 font-sans"
                style={{ background: `${genre.color}18`, color: genre.color }}
              >
                {genre.icon} {genre.label}
              </span>
            )}
          </div>
        </div>

        {/* Date info */}
        <div className="flex gap-2.5 mb-5">
          <div className="flex-1 bg-white rounded-r1 p-3 border border-bo-parchment shadow-bo1">
            <div className="text-[9px] text-bo-ink-muted font-sans mb-1">最終使用日</div>
            <div className="text-[12px] font-bold text-bo-ink font-sans">
              {product.lastUsedAt
                ? new Date(product.lastUsedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                : "未記録"}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-r1 p-3 border border-bo-parchment shadow-bo1">
            <div className="text-[9px] text-bo-ink-muted font-sans mb-1">購入日</div>
            <div className="text-[12px] font-bold text-bo-ink font-sans">
              {product.purchasedAt
                ? new Date(product.purchasedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                : "未設定"}
            </div>
          </div>
        </div>

        {/* Ingredients list */}
        <h2 className="font-bold text-xs mb-2 flex items-center gap-2 text-bo-ink font-sans">
          <span className="w-1 h-3.5 rounded-full inline-block bg-bo-accent" />
          全成分（{ingredients.length}種）
        </h2>
        <div className="space-y-1.5 mb-5">
          {ingredients.map((ing, idx) => (
            <Link
              key={ing.id}
              href={`/ingredient/${ing.id}`}
              className="flex items-center gap-2.5 bg-white rounded-r1 p-2.5 shadow-bo1 border border-bo-parchment"
            >
              <span className="inline-flex items-center gap-px shrink-0">
                {Array.from({ length: RARITY[ing.rarity].star }).map((_, i) => (
                  <StarIcon key={i} color={RARITY[ing.rarity].color} size={12} />
                ))}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-bo-ink font-sans">{ing.nameJa}</span>
                  <Badge rarity={ing.rarity} size="sm" />
                </div>
                <div className="text-[10px] mt-0.5 text-bo-ink-muted font-sans">{ing.nameInci}</div>
                {(() => {
                  const g = getGenreInfo(ing.genre);
                  return g ? (
                    <div className="flex gap-1 mt-0.5">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium font-sans"
                        style={{ background: g.color + "18", color: g.color }}
                      >
                        {g.icon} {g.label}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
              <span className="text-[10px] font-medium shrink-0 text-bo-ink-faint font-sans">#{idx + 1}</span>
            </Link>
          ))}
        </div>

        {/* Combinations */}
        {combinations.length > 0 && (
          <div className="mb-5">
            <h2 className="font-bold text-xs mb-2 flex items-center gap-2 text-bo-ink font-sans">
              <span className="w-1 h-3.5 rounded-full inline-block bg-bo-accent" />
              組み合わせ情報
            </h2>
            <div className="space-y-1.5">
              {combinations.map((combo, i) => {
                const isGood = combo.type === "recommended";
                return (
                  <div
                    key={i}
                    className={`rounded-r2 p-3 flex gap-2.5 bg-white border ${
                      isGood
                        ? "border-bo-safe/20 border-l-[3px] border-l-bo-safe"
                        : "border-bo-danger/20 border-l-[3px] border-l-bo-danger"
                    }`}
                  >
                    <span className="text-base shrink-0">{isGood ? "📚" : "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-bo-ink font-sans">{combo.label}</div>
                      <p className="text-[11px] mt-0.5 text-bo-ink-muted font-sans">{combo.desc}</p>
                      <p className="text-[10px] mt-0.5 text-bo-ink-faint font-sans">出典: {combo.source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {product.packageImage && (
          <div className="flex gap-2 mb-4">
            <a
              href={product.packageImage}
              download={`${product.name}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-r1 text-xs font-medium text-center border border-bo-accent/20 text-bo-accent bg-bo-accent-soft font-sans"
            >
              写真を保存 📥
            </a>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
    </AuthGuard>
  );
}
