"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { recommendDeck } from "@/lib/deckRecommender";
import { CATEGORIES } from "@/lib/categories";
import { getGenreByKey } from "@/lib/productGenres";
import { shareDeck } from "@/lib/share";
import DeckCard from "@/components/deck/DeckCard";
import CoverageChart from "@/components/deck/CoverageChart";
import CombinationCard from "@/components/deck/CombinationCard";
import AutoRecommendModal from "@/components/deck/AutoRecommendModal";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import PageLoading from "@/components/ui/PageLoading";
import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import Image from "next/image";
import { RoutineType, CategoryKey, Product, RecommendationResult } from "@/types";

export default function DeckPage() {
  const [routine, setRoutine] = useState<RoutineType>("morning");
  const [showPicker, setShowPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAutoRecommend, setShowAutoRecommend] = useState(false);
  const [autoResult, setAutoResult] = useState<RecommendationResult | null>(null);
  const [pickerFilter, setPickerFilter] = useState("すべて");
  const { user, supabase, loading } = useUser();

  const allDeckItems = useDeckStore((s) => s.items);
  const addItem = useDeckStore((s) => s.addItem);
  const removeItem = useDeckStore((s) => s.removeItem);
  const replaceDeckItems = useDeckStore((s) => s.replaceAll);
  const allProducts = useProductStore((s) => s.products);

  if (loading) {
    return <PageLoading message="マイスキンケアデッキを読み込んでいます..." />;
  }

  const handleAddItem = async (productId: string) => {
    const nextOrderIndex = allDeckItems.filter((item) => item.routine === routine).length;
    addItem(productId, routine);

    if (!user) return;

    const { error } = await supabase.from("deck_items").upsert(
      {
        user_id: user.id,
        product_id: productId,
        routine,
        order_index: nextOrderIndex,
      },
      { onConflict: "user_id,product_id,routine" }
    );

    if (error) {
      console.error("Failed to save deck item:", error);
      removeItem(productId, routine);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const previousItems = [...allDeckItems];
    removeItem(productId, routine);

    if (!user) return;

    const { error } = await supabase
      .from("deck_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("routine", routine);

    if (error) {
      console.error("Failed to remove deck item:", error);
      replaceDeckItems(previousItems);
    }
  };

  const handleAutoRecommend = () => {
    const result = recommendDeck(allProducts, getIngredientById);
    setAutoResult(result);
    setShowAutoRecommend(true);
  };

  const handleConfirmAutoRecommend = async () => {
    if (!autoResult) return;

    const previousItems = [...allDeckItems];
    const otherRoutineItems = allDeckItems.filter((i) => i.routine !== routine);
    const newRoutineItems = autoResult.productIds.map((pid, idx) => ({
      productId: pid,
      routine,
      orderIndex: idx,
    }));
    replaceDeckItems([...otherRoutineItems, ...newRoutineItems]);
    setShowAutoRecommend(false);
    setAutoResult(null);

    if (!user) return;

    const { error: deleteError } = await supabase
      .from("deck_items")
      .delete()
      .eq("user_id", user.id)
      .eq("routine", routine);

    if (deleteError) {
      console.error("Failed to clear deck items:", deleteError);
      replaceDeckItems(previousItems);
      return;
    }

    if (newRoutineItems.length > 0) {
      const { error: insertError } = await supabase
        .from("deck_items")
        .insert(
          newRoutineItems.map((item) => ({
            user_id: user.id,
            product_id: item.productId,
            routine: item.routine,
            order_index: item.orderIndex,
          }))
        );

      if (insertError) {
        console.error("Failed to insert deck items:", insertError);
        replaceDeckItems(previousItems);
      }
    }
  };

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

  const recommendedCombos = combinations.filter((c) => c.type === "recommended");
  const cautionCombos = combinations.filter((c) => c.type === "note");

  // 各相性ペアについて、どの製品にその成分が含まれるか計算
  const comboWithSources = combinations.map((combo) => {
    const sources: [string[], string[]] = [[], []];
    combo.pair.forEach((ingredientName, pairIdx) => {
      deckProducts.forEach((product) => {
        const hasIngredient = product.ingredients.some((pi) => {
          const ing = getIngredientById(pi.ingredientId);
          return ing?.nameJa === ingredientName;
        });
        if (hasIngredient) {
          sources[pairIdx].push(product.name);
        }
      });
    });
    return { combo, sources };
  });

  const shareText = shareDeck(
    routine,
    deckProducts.map((p) => ({ emoji: "📦", name: p.name })),
    coveredCategories,
    totalIngredients
  );

  const availableProducts = allProducts.filter(
    (p) => !deckItems.some((item) => item.productId === p.id)
  );

  // コスメ種類フィルター用: 利用可能な製品のタイプ一覧
  const productTypes = ["すべて", ...Array.from(new Set(availableProducts.map((p) => p.productType).filter(Boolean)))];
  const filteredProducts = pickerFilter === "すべて"
    ? availableProducts
    : availableProducts.filter((p) => p.productType === pickerFilter);

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-bold text-lg" style={{ color: "#2D2D2D" }}>🃏 マイスキンケアデッキ</h1>
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", color: "#fff" }}
          >
            共有
          </button>
        </div>

        {/* Routine tabs */}
        <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.6)" }}>
          {([
            { key: "morning" as RoutineType, label: "☀️ 朝", gradient: "linear-gradient(135deg, #FFD580, #FFBE5C)" },
            { key: "night" as RoutineType, label: "🌙 夜", gradient: "linear-gradient(135deg, #7B9FD4, #5B7BC4)" },
            { key: "spring_summer" as RoutineType, label: "🌸 春夏", gradient: "linear-gradient(135deg, #F9A8C0, #F06292)" },
            { key: "autumn_winter" as RoutineType, label: "🍂 秋冬", gradient: "linear-gradient(135deg, #FFAB76, #E07B39)" },
          ]).map(({ key, label, gradient }) => (
            <button
              key={key}
              onClick={() => setRoutine(key)}
              className="py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                routine === key
                  ? {
                      background: gradient,
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }
                  : { color: "#9B9B9B" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="space-y-2 mb-5">
          {deckProducts.map((product) => (
            <DeckCard
              key={product.id}
              product={product}
              onRemove={() => { void handleRemoveItem(product.id); }}
            />
          ))}
          <button
            onClick={() => { setPickerFilter("すべて"); setShowPicker(true); }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5"
            style={{
              border: "2px dashed #D0EAE7",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <span className="text-lg" style={{ color: "#5BBFAD" }}>＋</span>
            <span className="text-sm font-medium" style={{ color: "#5BBFAD" }}>製品を追加</span>
          </button>
          {allProducts.length >= 2 && (
            <button
              onClick={handleAutoRecommend}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)",
                boxShadow: "0 2px 8px rgba(249,168,192,0.2)",
              }}
            >
              おすすめ自動選択
            </button>
          )}
        </div>

        {/* Stats */}
        {deckProducts.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div
              className="text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-lg font-bold" style={{ color: "#5BBFAD" }}>{coveredCategories}/6</div>
              <div className="text-[10px]" style={{ color: "#9B9B9B" }}>カバー</div>
            </div>
            <div
              className="text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-lg font-bold" style={{ color: "#F9A8C0" }}>{totalIngredients}</div>
              <div className="text-[10px]" style={{ color: "#9B9B9B" }}>成分数</div>
            </div>
            <div
              className="text-center py-3 rounded-2xl bg-white shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-lg font-bold" style={{ color: "#B39DDB" }}>{deckProducts.length}</div>
              <div className="text-[10px]" style={{ color: "#9B9B9B" }}>アイテム</div>
            </div>
            <div
              className="text-center py-3 rounded-2xl shadow-sm bg-white"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <div className="text-lg font-bold" style={{ color: recommendedCombos.length > 0 ? "#5BBFAD" : "#C5C5C5" }}>
                {recommendedCombos.length > 0 ? recommendedCombos.length : "−"}
              </div>
              <div className="text-[10px]" style={{ color: "#9B9B9B" }}>好相性</div>
            </div>
          </div>
        )}

        {/* 成分の相性（おすすめ + 注意を分離して表示） */}
        {combinations.length > 0 && (
          <div className="mb-5">
            {recommendedCombos.length > 0 && (
              <>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: "#E8FAF8", color: "#5BBFAD" }}
                  >
                    ✓
                  </span>
                  おすすめの組み合わせ
                  <span className="text-xs font-normal" style={{ color: "#9B9B9B" }}>({recommendedCombos.length}件)</span>
                </h3>
                <div className="space-y-2.5 mb-4">
                  {comboWithSources
                    .filter((c) => c.combo.type === "recommended")
                    .map((item, i) => (
                      <CombinationCard key={`r-${i}`} combo={item.combo} ingredientProducts={item.sources} />
                    ))}
                </div>
              </>
            )}

            {cautionCombos.length > 0 && (
              <>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
                  <span className="text-sm">⚠️</span>
                  注意が必要な組み合わせ
                  <span className="text-xs font-normal" style={{ color: "#9B9B9B" }}>({cautionCombos.length}件)</span>
                </h3>
                <div className="space-y-2.5">
                  {comboWithSources
                    .filter((c) => c.combo.type === "note")
                    .map((item, i) => (
                      <CombinationCard key={`n-${i}`} combo={item.combo} ingredientProducts={item.sources} />
                    ))}
                </div>
              </>
            )}
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
                const ings: { id: string; nameJa: string }[] = [];
                const seen = new Set<string>();
                deckProducts.forEach((p) => {
                  p.ingredients.forEach((pi) => {
                    const ing = getIngredientById(pi.ingredientId);
                    if (ing?.categories.includes(cat.key) && !seen.has(ing.id)) {
                      seen.add(ing.id);
                      ings.push({ id: ing.id, nameJa: ing.nameJa });
                    }
                  });
                });
                if (ings.length === 0) return null;
                return (
                  <div
                    key={cat.key}
                    className="rounded-2xl p-3"
                    style={{ background: cat.color + "12", border: `1px solid ${cat.color}20` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{cat.icon}</span>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="text-xs" style={{ color: "#9B9B9B" }}>({ings.length}種)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ings.map((ing) => (
                        <Link
                          key={ing.id}
                          href={`/ingredient/${ing.id}`}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: cat.color + "25", color: cat.color, textDecoration: "none" }}
                        >
                          {ing.nameJa}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
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
            className="bg-white w-full max-w-[430px] rounded-t-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (fixed) */}
            <div className="px-6 pt-4 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E0E0E0" }} />
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>製品を追加</h3>
                <button onClick={() => setShowPicker(false)} className="text-xl" style={{ color: "#9B9B9B" }}>✕</button>
              </div>
            </div>

            {/* Type filter tabs */}
            {productTypes.length > 2 && (
              <div className="px-6 pb-2 flex gap-1.5 overflow-x-auto shrink-0">
                {productTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setPickerFilter(type)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={
                      pickerFilter === type
                        ? { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff" }
                        : { background: "#F5F5F5", color: "#9B9B9B" }
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable list */}
            <div className="overflow-y-auto px-6 pb-8 flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: "#9B9B9B" }}>
                  <div className="text-4xl mb-2">🌸</div>
                  <p>追加できる製品がありません</p>
                  <p className="mt-1">まず化粧品をスキャンして保存してください</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredProducts.map((p) => {
                    const ingredientCount = p.ingredients.length;
                    const genre = getGenreByKey(p.productType || "other");
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          void handleAddItem(p.id);
                          setShowPicker(false);
                        }}
                        className="w-full flex items-center gap-3 rounded-2xl p-4 text-left"
                        style={{ background: "#FAFAFA", border: "1px solid #F2F2F2" }}
                      >
                        {p.packageImage ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                            <Image
                              src={p.packageImage}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              loading="lazy"

                            />
                          </div>
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
                          >
                            {genre?.icon || "📦"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm" style={{ color: "#2D2D2D" }}>{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                            {genre && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                                style={{ background: `${genre.color}18`, color: genre.color, fontSize: "10px" }}
                              >
                                {genre.icon} {genre.label}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#C5C5C5" }}>
                            {ingredientCount}成分
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0"
                          style={{ background: "#E8FAF8", color: "#5BBFAD" }}
                        >
                          追加
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} />}
      {showAutoRecommend && autoResult && (
        <AutoRecommendModal
          result={autoResult}
          products={allProducts}
          onConfirm={() => { void handleConfirmAutoRecommend(); }}
          onClose={() => { setShowAutoRecommend(false); setAutoResult(null); }}
        />
      )}
    </div>
    </AuthGuard>
  );
}
