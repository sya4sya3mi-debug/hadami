"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, getGenreInfo } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { shareProductCheck } from "@/lib/share";
import { getGenreByKey } from "@/lib/productGenres";
import Badge from "@/components/ui/Badge";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";

export default function ProductDetailPage() {
  const { loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));
  const [showShare, setShowShare] = useState(false);

  if (loading) {
    return <PageLoading message="コスメ情報を読み込んでいます..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen px-5 pt-10 text-center bg-bo-cream">
        <p className="text-bo-ink-muted">コスメが見つかりません</p>
        <Link href="/history" className="text-sm mt-2 inline-block font-medium text-bo-accent">
          Myコスメに戻る
        </Link>
      </div>
    );
  }

  const genre = getGenreByKey(product.productType || "other");

  const ingredients = product.ingredients
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((i) => i !== undefined);

  const ingredientNames = ingredients.map((i) => i.nameJa);
  const combinations = findCombinations(ingredientNames);
  const shareText = shareProductCheck(product, ingredientNames);

  return (
    <AuthGuard>
    <div className="min-h-screen bg-bo-cream">
      <div className="px-5 pt-8 pb-6">
        <Link href="/history" className="text-sm font-medium mb-5 inline-block text-bo-accent">
          ← Myコスメ
        </Link>

        {/* Product photo */}
        {product.packageImage && (
          <div className="mb-4 rounded-2xl overflow-hidden bg-white shadow-sm border border-bo-parchment">
            <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
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
        <div
          className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-bo-parchment"
        >
          {!product.packageImage && (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 bg-gradient-to-br from-bo-accent-soft to-bo-parchment"
            >
              📦
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-bo-ink">{product.name}</h1>
            <p className="text-sm text-bo-ink-muted">{product.brand}</p>
            {genre && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1"
                style={{ background: `${genre.color}18`, color: genre.color }}
              >
                {genre.icon} {genre.label}
              </span>
            )}
          </div>
        </div>

        {/* Ingredients list */}
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink">
          <span className="w-1 h-4 rounded-full inline-block bg-bo-accent" />
          全成分（{ingredients.length}種）
        </h2>
        <div className="space-y-2 mb-6">
          {ingredients.map((ing, idx) => (
            <Link
              key={ing.id}
              href={`/ingredient/${ing.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-bo-parchment"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-bo-ink">{ing.nameJa}</span>
                  <Badge rarity={ing.rarity} size="sm" />
                </div>
                <div className="text-xs mt-0.5 text-bo-ink-muted">{ing.nameInci}</div>
                {(() => {
                  const g = getGenreInfo(ing.genre);
                  return g ? (
                    <div className="flex gap-1 mt-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: g.color + "20", color: g.color }}
                      >
                        {g.icon} {g.label}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
              <span className="text-xs font-medium shrink-0 text-bo-ink-faint">
                #{idx + 1}
              </span>
            </Link>
          ))}
        </div>

        {/* Combinations */}
        {combinations.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink">
              <span className="w-1 h-4 rounded-full inline-block bg-bo-accent" />
              組み合わせ情報
            </h2>
            <div className="space-y-2">
              {combinations.map((combo, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-3.5 ${
                    combo.type === "recommended"
                      ? "bg-bo-accent-soft border border-bo-accent/20"
                      : "bg-bo-danger-bg border border-bo-danger/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{combo.type === "recommended" ? "📚" : "📋"}</span>
                    <span className="font-bold text-sm text-bo-ink">{combo.label}</span>
                  </div>
                  <p className="text-xs text-bo-ink-muted">{combo.desc}</p>
                  <p className="text-xs mt-1 text-bo-ink-faint">出典: {combo.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowShare(true)}
            className="flex-1 py-3 rounded-2xl text-sm font-medium border border-bo-parchment text-bo-ink-muted"
          >
            Xに共有する 🐦
          </button>
          {product.packageImage && (
            <a
              href={product.packageImage}
              download={`${product.name}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-2xl text-sm font-medium text-center border border-bo-accent/20 text-bo-accent bg-bo-accent-soft"
            >
              写真を保存 📥
            </a>
          )}
        </div>

        <Disclaimer />
      </div>

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} />}
    </div>
    </AuthGuard>
  );
}
