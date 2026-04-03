"use client";

import { useState } from "react";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { CATEGORIES } from "@/lib/categories";
import { shareDeck } from "@/lib/share";
import DeckCard from "@/components/deck/DeckCard";
import CoverageChart from "@/components/deck/CoverageChart";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { RoutineType, CategoryKey, Product } from "@/types";

export default function DeckPage() {
  const [routine, setRoutine] = useState<RoutineType>("morning");
  const [showPicker, setShowPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const allDeckItems = useDeckStore((s) => s.items);
  const addItem = useDeckStore((s) => s.addItem);
  const removeItem = useDeckStore((s) => s.removeItem);
  const allProducts = useProductStore((s) => s.products);

  const deckItems = allDeckItems
    .filter((i) => i.routine === routine)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const getProduct = (id: string) => allProducts.find((p) => p.id === id);

  const deckProducts = deckItems
    .map((item) => getProduct(item.productId))
    .filter((p): p is Product => p !== undefined);

  const categoryCounts: Record<CategoryKey, number> = {
    moisturizing: 0, brightening: 0, turnover: 0,
    barrier: 0, soothing: 0, keratin: 0,
  };
  const allIngredientNames: string[] = [];

  deckProducts.forEach((product) => {
    product.ingredients.forEach((pi) => {
      const ing = getIngredientById(pi.ingredientId);
      if (ing) {
        allIngredientNames.push(ing.nameJa);
        ing.categories.forEach((cat) => { categoryCounts[cat]++; });
      }
    });
  });

  const coveredCategories = Object.values(categoryCounts).filter((c) => c > 0).length;
  const totalIngredients = new Set(allIngredientNames).size;
  const combinations = findCombinations(Array.from(new Set(allIngredientNames)));

  const shareText = shareDeck(
    routine,
    deckProducts.map((p) => ({ emoji: "📦", name: p.name })),
    coveredCategories,
    totalIngredients
  );

  const availableProducts = allProducts.filter(
    (p) => !deckItems.some((item) => item.productId === p.id)
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-bold text-lg" style={{ color: "#2D2D2D" }}>🃏 マイデッキ</h1>
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", color: "#fff" }}
          >
            共有
          </button>
        </div>

        {/* Routine tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)" }}>
          {(["morning", "night"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoutine(r)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                routine === r
                  ? {
                      background: r === "morning"
                        ? "linear-gradient(135deg, #FFD580, #FFBE5C)"
                        : "linear-gradient(135deg, #7B9FD4, #5B7BC4)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }
                  : { color: "#9B9B9B" }
              }
            >
              {r === "morning" ? "☀️ 朝ルーティン" : "🌙 夜ルーティン"}
            </button>
          ))}
        </div>

        {/* Product card tray */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-5 -mx-1 px-1">
          {deckProducts.map((product) => (
            <DeckCard
              key={product.id}
              product={product}
              onRemove={() => removeItem(product.id, routine)}
            />
          ))}
          <button
            onClick={() => setShowPicker(true)}
            className="min-w-[130px] h-[130px] rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0"
            style={{
              border: "2px dashed #D0EAE7",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <span className="text-2xl" style={{ color: "#5BBFAD" }}>＋</span>
            <span className="text-xs font-medium" style={{ color: "#9B9B9B" }}>追加</span>
          </button>
        </div>

        {/* Stats */}
        {deckProducts.length > 0 && (
          <div className="flex gap-3 mb-5">
            <div
              className="flex-1 text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-xl font-bold" style={{ color: "#5BBFAD" }}>{coveredCategories}/6</div>
              <div className="text-[11px]" style={{ color: "#9B9B9B" }}>カテゴリカバー</div>
            </div>
            <div
              className="flex-1 text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-xl font-bold" style={{ color: "#F9A8C0" }}>{totalIngredients}</div>
              <div className="text-[11px]" style={{ color: "#9B9B9B" }}>成分の種類</div>
            </div>
            <div
              className="flex-1 text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-xl font-bold" style={{ color: "#B39DDB" }}>{deckProducts.length}</div>
              <div className="text-[11px]" style={{ color: "#9B9B9B" }}>アイテム数</div>
            </div>
          </div>
        )}

        {/* Radar chart */}
        {deckProducts.length > 0 && (
          <div className="mb-5">
            <CoverageChart categoryCounts={categoryCounts} />
          </div>
        )}

        {/* Category list */}
        {deckProducts.length > 0 && (
          <div className="mb-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#5BBFAD" }} />
              カテゴリ別成分
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const ings = new Set<string>();
                deckProducts.forEach((p) => {
                  p.ingredients.forEach((pi) => {
                    const ing = getIngredientById(pi.ingredientId);
                    if (ing?.categories.includes(cat.key)) ings.add(ing.nameJa);
                  });
                });
                if (ings.size === 0) return null;
                return (
                  <div
                    key={cat.key}
                    className="rounded-2xl p-3"
                    style={{ background: cat.color + "12", border: `1px solid ${cat.color}20` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{cat.icon}</span>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="text-xs" style={{ color: "#9B9B9B" }}>({ings.size}種)</span>
                    </div>
                    <div className="text-xs" style={{ color: "#6B6B6B" }}>
                      {Array.from(ings).join("、")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Combinations */}
        {combinations.length > 0 && (
          <div className="mb-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F9A8C0" }} />
              組み合わせ情報
            </h3>
            <div className="space-y-2">
              {combinations.map((combo, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-3.5"
                  style={
                    combo.type === "recommended"
                      ? { background: "#E8FAF8", border: "1px solid #5BBFAD30" }
                      : { background: "#FFF3F3", border: "1px solid #F48C8C30" }
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{combo.type === "recommended" ? "📚" : "📋"}</span>
                    <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{combo.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#9B9B9B" }}>{combo.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {deckProducts.length === 0 && (
          <div
            className="text-center py-12 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <div className="text-4xl mb-3">🌸</div>
            <p className="font-medium text-sm" style={{ color: "#2D2D2D" }}>まだ製品が追加されていません</p>
            <p className="text-xs mt-1.5" style={{ color: "#9B9B9B" }}>＋ボタンから保存済み製品を追加しましょう</p>
          </div>
        )}

        <Disclaimer />
      </div>

      {/* Product picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowPicker(false)}>
          <div
            className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-8 max-h-[65vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E0E0E0" }} />
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>製品を追加 ✨</h3>
              <button onClick={() => setShowPicker(false)} className="text-xl" style={{ color: "#9B9B9B" }}>✕</button>
            </div>
            {availableProducts.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: "#9B9B9B" }}>
                <div className="text-4xl mb-2">🌸</div>
                <p>追加できる製品がありません</p>
                <p className="mt-1">まず化粧品をスキャンして保存してください</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { addItem(p.id, routine); setShowPicker(false); }}
                    className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left"
                    style={{ background: "#FAFAFA", border: "1px solid #F2F2F2" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                    >
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: "#2D2D2D" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#5BBFAD" }}>追加</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} />}
    </div>
  );
}
