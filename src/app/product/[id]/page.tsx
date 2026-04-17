"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, getIngredientCategoryInfo } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { getGenreByKey } from "@/lib/productGenres";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import { toggleFavoriteInDb } from "@/lib/db";
import { ActiveCategoryIcon, ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import { StarIcon } from "@/components/ui/Icons";

export default function ProductDetailPage() {
  const { user, supabase, loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));
  const toggleFavorite = useProductStore((s) => s.toggleFavorite);
  const updatePurchasedAt = useProductStore((s) => s.updatePurchasedAt);
  const [editingPurchasedAt, setEditingPurchasedAt] = useState(false);
  const router = useRouter();

  if (loading) return null;

  if (!product) {
    return (
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-r1 bg-white text-sm font-semibold text-bo-ink-muted
                         cursor-pointer font-sans pressable border-none shadow-bo1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              戻る
            </button>
            <h1 className="text-lg font-extrabold font-serif text-bo-ink m-0">コスメ詳細</h1>
          </div>
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📦</div>
            <p className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">コスメが見つかりません</p>
            <button
              onClick={() => router.back()}
              className="inline-block mt-3 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-bo-accent border-none cursor-pointer pressable"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const genre = getGenreByKey(product.productType || "other");

  // 有効成分のみフィルタ
  const allIngredients = [...product.ingredients]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((pi) => getIngredientById(pi.ingredientId))
    .filter((i) => i !== undefined);

  const activeIngredients = allIngredients.filter((i) => i.activeIngredient);

  const ingredientNames = allIngredients.map((i) => i.nameJa);
  const combinations = findCombinations(ingredientNames);

  const handleToggleFavorite = async () => {
    const prevFav = product.isFavorite;
    toggleFavorite(product.id); // 楽観更新
    if (user) {
      const { error } = await toggleFavoriteInDb(supabase, user.id, product.id, !prevFav);
      if (error) {
        toggleFavorite(product.id); // ロールバック
      }
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        {/* Sticky header */}
        <div className="sticky top-0 z-[310] flex items-center justify-between px-4 py-2.5
                        bg-bo-cream/90 backdrop-blur-xl border-b border-bo-parchment/40">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-r1 bg-white text-sm font-semibold text-bo-ink-muted
                       cursor-pointer font-sans pressable border-none shadow-bo1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            戻る
          </button>
          <button
            onClick={handleToggleFavorite}
            className="w-10 h-10 rounded-r1 bg-white border-none flex items-center justify-center cursor-pointer text-lg
                       shadow-bo1 pressable"
          >
            {product.isFavorite ? <StarIcon size={18} color="#F59E0B" filled /> : <StarIcon size={18} color="#BDBDBD" />}
          </button>
        </div>

        {/* Hero image */}
        <div className="relative h-[260px] overflow-hidden">
          {product.packageImage ? (
            <Image
              src={product.packageImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 430px) 100vw, 430px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center">
              {genre ? <ProductGenreIcon genre={genre.key} size={64} /> : <span className="text-5xl">📦</span>}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,38,32,0.75)] via-transparent to-transparent pointer-events-none" />

          {/* Product info overlay */}
          <div className="absolute bottom-6 left-5 right-5">
            <div className="text-xs text-white/70 font-sans tracking-wide uppercase font-semibold">
              {product.brand}
            </div>
            <div className="text-xl font-extrabold text-white font-serif leading-tight mt-1.5">
              {product.name}
            </div>
            {genre && (
              <div className="flex gap-1.5 mt-2.5">
                <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-lg py-1 px-3 rounded-r1 font-sans
                                 inline-flex items-center gap-1.5">
                  <ProductGenreIcon genre={genre.key} size={12} />
                  {genre.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-6 -mt-4 rounded-t-[20px] bg-bo-cream relative pb-8">
          {/* Active ingredients section */}
          {activeIngredients.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-5 rounded-full bg-bo-accent inline-block" />
                <span className="text-base font-bold text-bo-ink font-sans">
                  美容成分
                </span>
                <span className="text-xs text-bo-ink-muted font-sans">
                  {activeIngredients.length}種
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {activeIngredients.map((ing) => {
                  const catInfo = getIngredientCategoryInfo(ing);
                  const rarity = ing.rarity === "legendary" ? 4 : ing.rarity === "rare" ? 3 : ing.rarity === "uncommon" ? 2 : 1;
                  return (
                    <button
                      key={ing.id}
                      onClick={() => router.push(`/ingredient/${encodeURIComponent(ing.id)}`)}
                      className="flex items-center gap-3 py-3 px-3.5 bg-white rounded-r2 shadow-bo1 cursor-pointer text-left w-full
                                 border-none pressable"
                    >
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{
                          background: (catInfo?.color ?? "#9E9E9E") + "15",
                          color: catInfo?.color ?? "#9E9E9E",
                        }}
                      >
                        <ActiveCategoryIcon category={catInfo?.key ?? null} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-bo-ink font-sans">
                          {ing.nameJa}
                        </div>
                        {catInfo && (
                          <div className="text-[10px] mt-0.5 font-sans" style={{ color: catInfo.color }}>
                            {catInfo.label}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#D4A853] tracking-wide shrink-0">
                        {"★".repeat(rarity)}
                        {"☆".repeat(5 - rarity)}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {activeIngredients.length === 0 && (
            <div className="mb-6 py-8 text-center">
              <p className="text-xs text-bo-ink-muted font-sans">美容成分は検出されませんでした</p>
            </div>
          )}

          <p className="text-[10px] text-bo-ink-faint font-sans leading-relaxed">
            成分をタップすると図鑑で詳細を確認できます
          </p>

          {/* Combinations */}
          {combinations.length > 0 && (
            <div className="mt-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-5 rounded-full bg-bo-accent inline-block" />
                <span className="text-base font-bold text-bo-ink font-sans">
                  組み合わせ情報
                </span>
              </div>
              <div className="space-y-2">
                {combinations.map((combo, i) => {
                  const isGood = combo.type === "recommended";
                  return (
                    <div
                      key={i}
                      className={`rounded-r2 p-3.5 flex gap-2.5 bg-white border shadow-bo1 ${
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

          {/* Dates */}
          {(product.lastUsedAt || product.purchasedAt !== undefined || true) && (
            <div className="mt-6 mb-6 bg-white rounded-r2 shadow-bo1 overflow-hidden">
              {/* Last used */}
              {product.lastUsedAt && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-bo-parchment/40">
                  <span className="text-xs font-semibold text-bo-ink-muted font-sans">最終使用日</span>
                  <span className="text-xs font-bold text-bo-ink font-sans">
                    {new Date(product.lastUsedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
              {/* Purchase date */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-bo-ink-muted font-sans">購入日</span>
                {editingPurchasedAt ? (
                  <input
                    type="date"
                    defaultValue={product.purchasedAt ? product.purchasedAt.slice(0, 10) : ""}
                    className="text-xs font-bold text-bo-ink font-sans border border-bo-accent/40 rounded-md px-2 py-1 outline-none"
                    onBlur={(e) => {
                      updatePurchasedAt(product.id, e.target.value || undefined);
                      setEditingPurchasedAt(false);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingPurchasedAt(true)}
                    className="text-xs font-bold font-sans border-none bg-transparent cursor-pointer pressable
                               text-bo-ink-muted underline decoration-dotted"
                  >
                    {product.purchasedAt
                      ? new Date(product.purchasedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
                      : "タップして入力"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => router.push("/deck")}
              className="flex-1 py-3.5 rounded-r2 bg-white border border-bo-accent/30 text-bo-accent text-sm font-bold font-sans
                         cursor-pointer shadow-bo1 pressable"
            >
              ルーティンに追加
            </button>
            <button
              onClick={() => router.push("/scan")}
              className="flex-1 py-3.5 rounded-r2 border-none bg-bo-accent text-white text-sm font-bold font-sans
                         cursor-pointer shadow-bo-accent pressable flex items-center justify-center gap-1.5"
            >
              📷 写真を撮る
            </button>
          </div>

          <div className="mt-6">
            <Disclaimer />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
