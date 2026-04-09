"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, getIngredientCategoryInfo } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { getGenreByKey } from "@/lib/productGenres";
import Badge, { StarIcon } from "@/components/ui/Badge";
import { RARITY } from "@/lib/ingredients";
import Disclaimer from "@/components/ui/Disclaimer";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import { updatePurchasedAtInDb } from "@/lib/db";
import { useState } from "react";
import { ActiveCategoryIcon, ProductGenreIcon } from "@/components/ui/CosmeticIcons";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function ProductDetailPage() {
  const { user, supabase, loading } = useUser();
  const { id } = useParams<{ id: string }>();
  const product = useProductStore((s) => s.getProduct(id));
  const updatePurchasedAt = useProductStore((s) => s.updatePurchasedAt);
  const [editingPurchasedAt, setEditingPurchasedAt] = useState(false);
  const [purchasedAtInput, setPurchasedAtInput] = useState("");
  const [savingPurchasedAt, setSavingPurchasedAt] = useState(false);

  if (loading) {
    return <PageLoading message="コスメ情報を読み込んでいます..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/history"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bo-parchment text-[13px] font-semibold text-bo-accent font-sans active:opacity-70 transition-opacity shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              マイコスメ
            </Link>
            <h1 className="text-lg font-extrabold font-serif text-bo-ink m-0">コスメ詳細</h1>
          </div>
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-bo-parchment mx-auto mb-3 flex items-center justify-center text-2xl">📦</div>
            <p className="text-[13px] font-semibold text-bo-ink-muted font-sans mb-1">コスメが見つかりません</p>
            <Link
              href="/history"
              className="inline-block mt-3 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-bo-accent no-underline"
            >
              マイコスメに戻る
            </Link>
          </div>
        </div>
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
      <div className="px-5 pt-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/history"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bo-parchment text-[13px] font-semibold text-bo-accent font-sans active:opacity-70 transition-opacity shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            マイコスメ
          </Link>
          <h1 className="text-lg font-extrabold font-serif text-bo-ink m-0">コスメ詳細</h1>
        </div>

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
            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-[0px] text-bo-accent shrink-0 bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
              📦
              <span className="absolute inset-0 flex items-center justify-center text-inherit">
                <ProductGenreIcon genre={product.productType || "other"} size={22} />
              </span>
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
                <ProductGenreIcon genre={genre.key} size={12} />
                {genre.label}
              </span>
            )}
          </div>
        </div>

        {/* Date info */}
        {(product.lastUsedAt || product.purchasedAt || true) && (
          <div className="mb-5 bg-white rounded-r2 p-3.5 shadow-bo1 border border-bo-parchment space-y-2.5">
            {/* 最終使用日 */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-bo-ink-muted font-sans">最終使用日</span>
              <span className="text-[12px] font-semibold text-bo-ink font-sans">
                {product.lastUsedAt ? formatDate(product.lastUsedAt) : "—"}
              </span>
            </div>
            {/* 購入日 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-bo-ink-muted font-sans">購入日</span>
              {editingPurchasedAt ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={purchasedAtInput}
                    onChange={(e) => setPurchasedAtInput(e.target.value)}
                    className="text-[11px] border border-bo-parchment rounded-lg px-2 py-1 font-sans text-bo-ink bg-bo-cream focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!user) return;
                      setSavingPurchasedAt(true);
                      const val = purchasedAtInput || null;
                      await updatePurchasedAtInDb(supabase, user.id, product.id, val);
                      updatePurchasedAt(product.id, val ?? undefined);
                      setSavingPurchasedAt(false);
                      setEditingPurchasedAt(false);
                    }}
                    disabled={savingPurchasedAt}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-bo-accent text-white font-bold font-sans disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingPurchasedAt(false)}
                    className="text-[11px] px-2 py-1 rounded-full border border-bo-parchment text-bo-ink-muted font-sans"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-bo-ink font-sans">
                    {product.purchasedAt ? formatDate(product.purchasedAt) : "—"}
                  </span>
                  <button
                    onClick={() => {
                      setPurchasedAtInput(product.purchasedAt ?? "");
                      setEditingPurchasedAt(true);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-bo-parchment text-bo-ink-muted font-sans hover:bg-bo-parchment"
                  >
                    編集
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                  const c = getIngredientCategoryInfo(ing);
                  return c ? (
                    <div className="flex gap-1 mt-0.5">
                      <span
                        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium font-sans"
                        style={{ background: c.color + "18", color: c.color }}
                      >
                        <ActiveCategoryIcon category={c.key} size={11} />
                        {c.label}
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
