"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { getIngredientById } from "@/lib/ingredients";

const TYPE_LABELS: Record<string, string> = {
  cream: "クリーム", serum: "美容液", mask_pack: "マスク", toner: "化粧水",
  emulsion: "乳液", sunscreen: "日焼け止め", other: "その他",
};

export default function ProductDetail({
  product,
  onClose,
  onToggleFavorite,
  onRescan,
}: {
  product: Product;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onRescan?: () => void;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 200);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const ingredientDetails = product.ingredients.map((ing) => {
    const master = getIngredientById(ing.ingredientId);
    const name = master?.nameJa || ing.ingredientId;
    return {
      name,
      id: ing.ingredientId,
      category: master?.categories?.[0] || "基剤",
      rarity: master?.rarity === "legendary" ? 4 : master?.rarity === "rare" ? 3 : master?.rarity === "uncommon" ? 2 : 1,
    };
  });

  return (
    <div ref={scrollRef} className="fixed inset-0 z-[300] bg-bo-cream overflow-y-auto animate-fade-up">
      {/* Sticky header with back button */}
      <div className="sticky top-0 z-[310] flex items-center justify-between px-4 py-2.5 bg-bo-cream/[0.92] backdrop-blur-xl border-b border-bo-parchment/60">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bo-parchment text-[13px] font-semibold text-bo-accent cursor-pointer font-sans active:opacity-70 transition-opacity border-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          マイコスメ
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="w-9 h-9 rounded-[10px] bg-bo-parchment border-none flex items-center justify-center cursor-pointer text-base"
        >
          {product.isFavorite ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Image header */}
      <div className="relative h-[240px] overflow-hidden">
        {product.packageImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.packageImage}
            alt={product.name}
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center text-5xl">
            📦
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,38,32,0.7)] to-transparent pointer-events-none" />

        {/* Product info overlay */}
        <div className="absolute bottom-5 left-5 right-5">
          <div className="text-[11px] text-white/70 font-sans tracking-[0.08em] uppercase">
            {product.brand}
          </div>
          <div className="text-xl font-extrabold text-white font-serif leading-tight mt-1">
            {product.name}
          </div>
          <div className="flex gap-1.5 mt-2">
            <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-lg py-0.5 px-2.5 rounded-md font-sans">
              {TYPE_LABELS[product.productType || "other"] || "その他"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-6 -mt-4 rounded-t-2xl bg-bo-cream relative pb-8">
        <div className="text-[15px] font-bold text-bo-ink font-sans mb-3.5">
          この製品の成分{" "}
          <span className="text-xs font-normal text-bo-ink-muted">
            {ingredientDetails.length}種
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {ingredientDetails.map((ing, i) => (
            <button
              key={i}
              onClick={() => {
                router.push(`/ingredient/${encodeURIComponent(ing.id)}`);
              }}
              className="flex items-center gap-3 py-3 px-3.5 bg-white rounded-r1 border border-bo-parchment shadow-bo1 cursor-pointer text-left w-full"
            >
              <div className="flex-1">
                <div className="text-[13px] font-bold text-bo-ink font-sans">
                  {ing.name}
                </div>
                <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">
                  {ing.category}
                </div>
              </div>
              <span className="text-[10px] text-[#D4A853] tracking-wide shrink-0">
                {"★".repeat(ing.rarity)}
                {"☆".repeat(5 - ing.rarity)}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B5C7BE" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-[9px] text-bo-ink-faint font-sans mt-3 leading-relaxed">
          成分をタップすると図鑑で詳細を確認できます
        </p>

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          <button
            onClick={() => {
              onClose();
              router.push("/deck");
            }}
            className="flex-1 py-3.5 rounded-r1 border-[1.5px] border-bo-accent bg-white text-bo-accent text-xs font-bold font-sans cursor-pointer"
          >
            デッキに追加
          </button>
          <button
            onClick={() => {
              if (onRescan) {
                onRescan();
              } else {
                onClose();
                router.push("/scan");
              }
            }}
            className="flex-1 py-3.5 rounded-r1 border-none bg-bo-accent text-white text-xs font-bold font-sans cursor-pointer shadow-bo-accent"
          >
            📷 写真を撮る
          </button>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-[320] w-11 h-11 rounded-full bg-bo-accent text-white border-none flex items-center justify-center shadow-bo-accent cursor-pointer"
          aria-label="上に戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
