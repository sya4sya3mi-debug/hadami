"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { MASTER_INGREDIENTS } from "@/lib/ingredients";

const TYPE_LABELS: Record<string, string> = {
  cream: "クリーム", serum: "美容液", mask_pack: "マスク", toner: "化粧水",
  emulsion: "乳液", sunscreen: "日焼け止め", other: "その他",
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "未設定";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProductDetail({
  product,
  onClose,
  onToggleFavorite,
  onUpdatePurchasedAt,
}: {
  product: Product;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onUpdatePurchasedAt?: (date: string | undefined) => void;
}) {
  const router = useRouter();
  const [editingPurchaseDate, setEditingPurchaseDate] = useState(false);
  const [purchaseDateInput, setPurchaseDateInput] = useState(
    product.purchasedAt ? new Date(product.purchasedAt).toISOString().slice(0, 10) : ""
  );

  const ingredientDetails = product.ingredients.map((ing) => {
    const master = MASTER_INGREDIENTS.find((m) => m.id === ing.ingredientId);
    const name = master?.nameJa || ing.ingredientId;
    return {
      name,
      id: ing.ingredientId,
      category: master?.categories?.[0] || "基剤",
      rarity: master?.rarity === "legendary" ? 4 : master?.rarity === "rare" ? 3 : master?.rarity === "uncommon" ? 2 : 1,
    };
  });

  return (
    <div className="fixed inset-0 z-[300] bg-bo-cream overflow-y-auto animate-fade-up">
      {/* Image header */}
      <div className="relative h-[260px] overflow-hidden">
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

        {/* Fav button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 rounded-[10px] bg-white/20 backdrop-blur-lg border-none flex items-center justify-center cursor-pointer text-base z-[2]"
        >
          {product.isFavorite ? "❤️" : "🤍"}
        </button>

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
      <div className="px-5 pt-6 pb-24 -mt-4 rounded-t-2xl bg-bo-cream relative">
        {/* Date info */}
        <div className="flex gap-2.5 mb-5">
          <div className="flex-1 bg-white rounded-r1 p-3 border border-bo-parchment shadow-bo1">
            <div className="text-[9px] text-bo-ink-muted font-sans mb-1">最終使用日</div>
            <div className="text-[12px] font-bold text-bo-ink font-sans">
              {formatDate(product.lastUsedAt)}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-r1 p-3 border border-bo-parchment shadow-bo1">
            <div className="text-[9px] text-bo-ink-muted font-sans mb-1">購入日</div>
            {editingPurchaseDate ? (
              <div className="flex flex-col gap-1.5">
                <input
                  type="date"
                  value={purchaseDateInput}
                  onChange={(e) => setPurchaseDateInput(e.target.value)}
                  className="text-[11px] font-sans border border-bo-parchment rounded-md px-2 py-1 bg-white text-bo-ink w-full"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const dateValue = purchaseDateInput
                        ? new Date(purchaseDateInput + "T00:00:00").toISOString()
                        : undefined;
                      onUpdatePurchasedAt?.(dateValue);
                      setEditingPurchaseDate(false);
                    }}
                    className="flex-1 text-[10px] font-bold py-1 rounded-md border-none bg-bo-accent text-white cursor-pointer font-sans"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setPurchaseDateInput(product.purchasedAt ? new Date(product.purchasedAt).toISOString().slice(0, 10) : "");
                      setEditingPurchaseDate(false);
                    }}
                    className="flex-1 text-[10px] font-bold py-1 rounded-md border border-bo-parchment bg-white text-bo-ink-muted cursor-pointer font-sans"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingPurchaseDate(true)}
                className="text-[12px] font-bold font-sans bg-transparent border-none cursor-pointer p-0 text-left w-full"
                style={{ color: product.purchasedAt ? "#1B2620" : "#3A8F7A" }}
              >
                {product.purchasedAt ? formatDate(product.purchasedAt) : "＋ 追加"}
              </button>
            )}
          </div>
        </div>

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
                onClose();
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
              onClose();
              router.push("/scan");
            }}
            className="flex-1 py-3.5 rounded-r1 border-none bg-bo-accent text-white text-xs font-bold font-sans cursor-pointer shadow-bo-accent"
          >
            再スキャン
          </button>
        </div>
      </div>

      {/* Bottom fixed back bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[310] px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-bo-cream/[0.92] backdrop-blur-xl border-t border-bo-parchment">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-r1 bg-bo-parchment border-none text-[13px] font-bold text-bo-ink-soft font-sans cursor-pointer flex items-center justify-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D4F45" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Myコスメに戻る
        </button>
      </div>
    </div>
  );
}
