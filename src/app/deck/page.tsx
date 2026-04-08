"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById, INGREDIENT_GENRES, GENRE_DESCRIPTIONS } from "@/lib/ingredients";
import { CategoryKey } from "@/types";
import { findCombinations } from "@/lib/combinations";
import { recommendDeck } from "@/lib/deckRecommender";
import { getGenreByKey, GENRE_SLOT_CONFIG } from "@/lib/productGenres";
import { SKIN_CONCERNS } from "@/lib/concerns";
import DeckEditor from "@/components/deck/DeckEditor";
import dynamic from "next/dynamic";
const CoverageChart = dynamic(() => import("@/components/deck/CoverageChart"), {
  loading: () => <div className="bg-white rounded-xl p-4 border border-border h-[300px] flex items-center justify-center text-sm text-bo-ink-muted">チャート読み込み中...</div>,
  ssr: false,
});
import CombinationCard from "@/components/deck/CombinationCard";
import AutoRecommendModal from "@/components/deck/AutoRecommendModal";
import Disclaimer from "@/components/ui/Disclaimer";
import PageLoading from "@/components/ui/PageLoading";
import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import BottomSheet from "@/components/scan/BottomSheet";
import Glass from "@/components/ui/Glass";
import { RoutineType, IngredientGenre, Product, ProductGenre, RecommendationResult } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  cream: "クリーム", serum: "美容液", mask_pack: "マスク",
  toner: "化粧水", sunscreen: "日焼け止め", emulsion: "乳液", other: "その他",
};

const DECK_OPTIONS: { key: RoutineType; label: string; icon: string }[] = [
  { key: "morning", label: "朝デッキ", icon: "☀️" },
  { key: "night", label: "夜デッキ", icon: "🌙" },
];

export default function DeckPage() {
  const [deckIndex, setDeckIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"hand" | "list">("hand");
  const [showEditor, setShowEditor] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerGenreFilter, setPickerGenreFilter] = useState<ProductGenre | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedCard, setSelectedCard] = useState<(Product & { stepNum: number }) | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [showAutoRecommend, setShowAutoRecommend] = useState(false);
  const [autoResult, setAutoResult] = useState<RecommendationResult | null>(null);
  const [pickerFilter, setPickerFilter] = useState("すべて");
  const { user, supabase, loading } = useUser();

  const routine = DECK_OPTIONS[deckIndex].key;
  const currentDeck = DECK_OPTIONS[deckIndex];

  const allDeckItems = useDeckStore((s) => s.items);
  const addItem = useDeckStore((s) => s.addItem);
  const removeItem = useDeckStore((s) => s.removeItem);
  const replaceDeckItems = useDeckStore((s) => s.replaceAll);
  const allProducts = useProductStore((s) => s.products);

  const getProduct = (id: string) => allProducts.find((p) => p.id === id);

  const deckItems = allDeckItems
    .filter((i) => i.routine === routine)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const deckProducts = deckItems
    .map((item) => getProduct(item.productId))
    .filter((p): p is Product => p !== undefined);

  const { genreCounts, categoryCounts, coveredGenres, totalIngredients, combinations, recommendedCombos, cautionCombos, comboWithSources } = useMemo(() => {
    const genreCounts: Record<IngredientGenre, number> = {
      water: 0, amino_acid: 0, vitamin: 0, peptide: 0, botanical: 0,
      oil_lipid: 0, ferment: 0, acid: 0, base: 0,
    };
    const categoryCounts: Record<CategoryKey, number> = {
      moisturizing: 0, brightening: 0, turnover: 0, barrier: 0, soothing: 0, keratin: 0,
    };
    const allIngredientNames: string[] = [];
    const genreSet = new Set<string>();
    deckProducts.forEach((product) => {
      product.ingredients.forEach((pi) => {
        const ing = getIngredientById(pi.ingredientId);
        if (ing) {
          allIngredientNames.push(ing.nameJa);
          genreCounts[ing.genre]++;
          genreSet.add(ing.genre);
          ing.categories.forEach((cat) => {
            if (cat in categoryCounts) categoryCounts[cat as CategoryKey]++;
          });
        }
      });
    });
    const coveredGenres = Object.values(genreCounts).filter((c) => c > 0).length;
    const totalIngredients = new Set(allIngredientNames).size;
    const combinations = findCombinations(Array.from(new Set(allIngredientNames)));
    const recommendedCombos = combinations.filter((c) => c.type === "recommended");
    const cautionCombos = combinations.filter((c) => c.type === "note");

    const comboWithSources = combinations.map((combo) => {
      const sources: [string[], string[]] = [[], []];
      combo.pair.forEach((ingredientName, pairIdx) => {
        deckProducts.forEach((product) => {
          const hasIngredient = product.ingredients.some((pi) => {
            const ing = getIngredientById(pi.ingredientId);
            return ing?.nameJa === ingredientName;
          });
          if (hasIngredient) sources[pairIdx].push(product.name);
        });
      });
      return { combo, sources };
    });

    return { genreCounts, categoryCounts, coveredGenres, totalIngredients, combinations, recommendedCombos, cautionCombos, comboWithSources };
  }, [deckProducts]);

  if (loading) {
    return <PageLoading message="マイスキンケアデッキを読み込んでいます..." />;
  }

  const productsByGenre: Record<ProductGenre, Product[]> = {} as Record<ProductGenre, Product[]>;
  GENRE_SLOT_CONFIG.forEach((s) => { productsByGenre[s.genre] = []; });
  deckProducts.forEach((p) => {
    const genre = p.productType || "other";
    if (!productsByGenre[genre]) productsByGenre[genre] = [];
    productsByGenre[genre].push(p);
  });

  const allGenreLabels = INGREDIENT_GENRES.map((g) => g.label);
  const coveredGenreLabels = INGREDIENT_GENRES.filter((g) => genreCounts[g.key] > 0).map((g) => g.label);
  const coveragePercent = deckProducts.length > 0 ? Math.round((coveredGenreLabels.length / allGenreLabels.length) * 100) : 0;

  // Handlers
  const handleAddItem = async (productId: string) => {
    const nextOrderIndex = allDeckItems.filter((item) => item.routine === routine).length;
    addItem(productId, routine);
    if (!user) return;
    const { error } = await supabase.from("deck_items").upsert(
      { user_id: user.id, product_id: productId, routine, order_index: nextOrderIndex },
      { onConflict: "user_id,product_id,routine" }
    );
    if (error) { console.error("Failed to save deck item:", error); removeItem(productId, routine); }
  };

  const handleRemoveItem = async (productId: string) => {
    const previousItems = [...allDeckItems];
    removeItem(productId, routine);
    if (!user) return;
    const { error } = await supabase.from("deck_items").delete()
      .eq("user_id", user.id).eq("product_id", productId).eq("routine", routine);
    if (error) { console.error("Failed to remove deck item:", error); replaceDeckItems(previousItems); }
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
    const newRoutineItems = autoResult.productIds.map((pid, idx) => ({ productId: pid, routine, orderIndex: idx }));
    replaceDeckItems([...otherRoutineItems, ...newRoutineItems]);
    setShowAutoRecommend(false);
    setAutoResult(null);
    if (!user) return;
    const { error: deleteError } = await supabase.from("deck_items").delete().eq("user_id", user.id).eq("routine", routine);
    if (deleteError) { console.error("Failed to clear deck items:", deleteError); replaceDeckItems(previousItems); return; }
    if (newRoutineItems.length > 0) {
      const { error: insertError } = await supabase.from("deck_items").insert(
        newRoutineItems.map((item) => ({ user_id: user.id, product_id: item.productId, routine: item.routine, order_index: item.orderIndex }))
      );
      if (insertError) { console.error("Failed to insert deck items:", insertError); replaceDeckItems(previousItems); }
    }
  };

  const openPicker = (genre: ProductGenre | null) => {
    setPickerGenreFilter(genre);
    setPickerFilter("すべて");
    setShowPicker(true);
  };

  const availableProducts = allProducts.filter(
    (p) => !deckItems.some((item) => item.productId === p.id)
  );
  const pickerProducts = pickerGenreFilter
    ? availableProducts.filter((p) => p.productType === pickerGenreFilter)
    : availableProducts;
  const productTypes = ["すべて", ...Array.from(new Set(pickerProducts.map((p) => p.productType).filter(Boolean)))];
  const filteredProducts = pickerFilter === "すべて"
    ? pickerProducts
    : pickerProducts.filter((p) => p.productType === pickerFilter);

  const prevDeck = () => setDeckIndex((i) => (i - 1 + DECK_OPTIONS.length) % DECK_OPTIONS.length);
  const nextDeck = () => setDeckIndex((i) => (i + 1) % DECK_OPTIONS.length);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0 mb-1">マイデッキ</h1>
              <p className="text-xs text-bo-ink-muted font-sans m-0">スキンケアルーティンを管理</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-bo-parchment rounded-[10px] p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode("hand")}
                  className={`w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer ${
                    viewMode === "hand" ? "bg-white text-bo-ink shadow-bo1" : "bg-transparent text-bo-ink-faint"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-7 rounded-lg border-none flex items-center justify-center cursor-pointer ${
                    viewMode === "list" ? "bg-white text-bo-ink shadow-bo1" : "bg-transparent text-bo-ink-faint"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/></svg>
                </button>
              </div>
              {/* X share button removed */}
            </div>
          </div>

          {/* Routine tabs */}
          <div className="flex gap-2 mb-5">
            {DECK_OPTIONS.map((opt, i) => (
              <button
                key={opt.key}
                onClick={() => { setDeckIndex(i); setShowAnalysis(false); }}
                className={`flex-1 py-3 rounded-r1 border-none text-[13px] font-bold font-sans cursor-pointer ${
                  deckIndex === i ? "bg-bo-accent text-white shadow-bo-accent" : "bg-white text-bo-ink-muted shadow-bo1"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          <div ref={captureRef}>
            {deckProducts.length > 0 && (
              <Glass className="p-4 mb-5">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-bo-ink-soft font-sans">
                    {routine === "morning" ? "朝" : "夜"}ルーティン
                  </span>
                  <span className="text-[13px] font-black text-bo-accent font-serif">{deckProducts.length}ステップ</span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-bo-ink-muted font-sans">ジャンルカバー率</span>
                  <span className={`text-[11px] font-black font-serif ${coveragePercent >= 80 ? "text-bo-accent" : "text-bo-caution"}`}>
                    {coveragePercent}%
                  </span>
                </div>
                <div className="h-[5px] rounded-sm bg-bo-parchment overflow-hidden mb-2">
                  <div
                    className="h-full rounded-sm bg-bo-accent transition-all"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {allGenreLabels.map((cat) => {
                    const covered = coveredGenreLabels.includes(cat);
                    return (
                      <span
                        key={cat}
                        className={`text-[9px] font-semibold font-sans py-0.5 px-2 rounded ${
                          covered ? "bg-bo-safe-bg text-bo-accent" : "bg-bo-parchment text-bo-ink-faint"
                        }`}
                      >
                        {covered ? "✓ " : ""}{cat}
                      </span>
                    );
                  })}
                </div>
              </Glass>
            )}
          </div>

          {/* Hand view */}
          {deckProducts.length > 0 && viewMode === "hand" && (
            <div>
              <div className="flex gap-3.5 overflow-x-auto -mx-5 px-5 py-5 pb-7.5 hide-scrollbar snap-x snap-mandatory">
                {deckProducts.map((item, i) => {
                  const rotation = (i - (deckProducts.length - 1) / 2) * 3;
                  const translateY = Math.abs(i - (deckProducts.length - 1) / 2) * 6;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCard({ ...item, stepNum: i + 1 })}
                      className="min-w-[150px] max-w-[150px] shrink-0 cursor-pointer animate-fade-up snap-center transition-transform duration-300"
                      style={{
                        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                        animationDelay: `${i * 80}ms`,
                      }}
                    >
                      <div className="rounded-[20px] overflow-hidden bg-white border-[1.5px] border-bo-parchment shadow-bo2">
                        <div className="relative">
                          <div className="bg-bo-parchment overflow-hidden aspect-[3/4]">
                            {item.packageImage ? (
                              <Image src={item.packageImage} alt={item.name} width={150} height={200} className="w-full h-full object-cover block" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                            )}
                          </div>
                          <div className="absolute top-2 left-2 w-[26px] h-[26px] rounded-lg bg-bo-accent flex items-center justify-center text-white text-xs font-black font-serif shadow-bo-accent">
                            {i + 1}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-lg rounded-md py-0.5 px-1.5 text-[9px] font-bold text-bo-ink-soft font-sans">
                            {TYPE_LABELS[item.productType || "other"] || "その他"}
                          </div>
                        </div>
                        <div className="p-2.5 pb-3.5">
                          <div className="text-[11px] font-bold text-bo-ink font-sans leading-tight line-clamp-2 mb-1">{item.name}</div>
                          <div className="text-[9px] text-bo-ink-muted font-sans">{item.brand}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-2 text-[11px] text-bo-ink-muted font-sans">← スワイプして確認 →</div>
              <div className="flex items-center justify-center gap-1 mt-4">
                {deckProducts.map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-7 h-7 rounded-lg bg-bo-accent-soft flex items-center justify-center text-xs font-serif font-black text-bo-accent">
                      {i + 1}
                    </div>
                    {i < deckProducts.length - 1 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B5C7BE" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List view */}
          {deckProducts.length > 0 && viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {deckProducts.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 px-3.5 bg-white rounded-r1 border border-bo-parchment shadow-bo1 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="w-7 h-7 rounded-lg bg-bo-accent flex items-center justify-center text-white text-xs font-black font-serif shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-11 h-11 rounded-[10px] overflow-hidden bg-bo-parchment shrink-0">
                    {item.packageImage ? (
                      <Image src={item.packageImage} alt={item.name} width={44} height={44} className="w-full h-full object-cover block" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-bo-ink font-sans leading-snug line-clamp-2">{item.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-bo-ink-muted font-sans">{item.brand}</span>
                      <span className="text-[9px] font-semibold text-bo-ink-muted bg-bo-parchment py-px px-1.5 rounded">
                        {TYPE_LABELS[item.productType || "other"] || "その他"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit deck button */}
          {deckProducts.length > 0 && (
            <button
              onClick={() => setShowEditor(true)}
              className="w-full mt-6 py-3.5 rounded-r1 border-[1.5px] border-bo-accent bg-white text-bo-accent text-[13px] font-bold font-sans cursor-pointer flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              デッキを編集
            </button>
          )}

          {/* Analysis toggle */}
          {deckProducts.length > 0 && (
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className={`w-full mt-6 py-3.5 rounded-r1 border-[1.5px] text-[13px] font-bold font-sans cursor-pointer flex items-center justify-center gap-2 transition-all ${
                showAnalysis ? "border-bo-accent bg-bo-safe-bg text-bo-accent" : "border-bo-parchment bg-white text-bo-ink-soft"
              }`}
            >
              <span className="text-base">📊</span>デッキ分析
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`transition-transform duration-300 ${showAnalysis ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}

          {/* Analysis panel */}
          {showAnalysis && deckProducts.length > 0 && (
            <div className="mt-3 animate-fade-up">
              {/* Concern-based breakdown */}
              <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-5 mb-3">
                <div className="text-[13px] font-bold text-bo-ink font-sans mb-3.5">効能別のカバー</div>
                {SKIN_CONCERNS.map((concern) => {
                  const allIngredientIds = deckProducts.flatMap((d) => d.ingredients.map((pi) => pi.ingredientId));
                  const coveredKeys = concern.keyIngredients.filter((ki) => allIngredientIds.includes(ki.id));
                  const covered = coveredKeys.length > 0;
                  return (
                    <div key={concern.label} className="mb-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[11px] font-semibold font-sans ${covered ? "text-bo-ink-soft" : "text-bo-ink-faint"}`}>
                          {covered ? "✓" : "✗"} {concern.icon} {concern.label}
                        </span>
                        <span className="text-[10px] text-bo-ink-muted font-sans">{covered ? `${coveredKeys.length}/${concern.keyIngredients.length}成分` : "未カバー"}</span>
                      </div>
                      <div className="h-[3px] rounded-sm bg-bo-parchment overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all"
                          style={{ width: `${(coveredKeys.length / concern.keyIngredients.length) * 100}%`, backgroundColor: concern.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { value: `${coveredGenres}/${INGREDIENT_GENRES.length}`, label: "カバー", color: "#3A8F7A" },
                  { value: `${totalIngredients}`, label: "成分数", color: "#D4A853" },
                  { value: `${deckProducts.length}`, label: "アイテム", color: "#6B4A8A" },
                  { value: recommendedCombos.length > 0 ? `${recommendedCombos.length}` : "−", label: "好相性", color: recommendedCombos.length > 0 ? "#3A8F7A" : "#B5C7BE" },
                ].map((s) => (
                  <div key={s.label} className="text-center py-3 rounded-r2 bg-white border border-bo-parchment shadow-bo1">
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-bo-ink-muted font-sans">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Combinations */}
              {combinations.length > 0 && (
                <div className="mb-5">
                  {recommendedCombos.length > 0 && (
                    <>
                      <h3 className="font-bold text-sm text-bo-ink mb-1 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-bo-accent-soft text-bo-accent flex items-center justify-center text-[10px]">✓</span>
                        あなたのコスメが相乗効果を発揮中！
                        <span className="text-xs font-normal text-bo-ink-muted">({recommendedCombos.length}件)</span>
                      </h3>
                      <p className="text-xs text-bo-ink-muted mb-3">今使っている製品の成分同士で、より良いはたらきが期待できる組み合わせが見つかりました</p>
                      <div className="space-y-2.5 mb-4">
                        {comboWithSources.filter((c) => c.combo.type === "recommended").map((item, i) => (
                          <CombinationCard key={`r-${i}`} combo={item.combo} ingredientProducts={item.sources} />
                        ))}
                      </div>
                    </>
                  )}
                  {cautionCombos.length > 0 && (
                    <>
                      <h3 className="font-bold text-sm text-bo-ink mb-3 flex items-center gap-2">
                        <span className="text-sm">⚠️</span>
                        注意が必要な組み合わせ
                        <span className="text-xs font-normal text-bo-ink-muted">({cautionCombos.length}件)</span>
                      </h3>
                      <div className="space-y-2.5">
                        {comboWithSources.filter((c) => c.combo.type === "note").map((item, i) => (
                          <CombinationCard key={`n-${i}`} combo={item.combo} ingredientProducts={item.sources} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Coverage chart */}
              <div className="mb-5">
                <CoverageChart categoryCounts={categoryCounts} />
              </div>
            </div>
          )}

          {/* Genre list */}
          {deckProducts.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-sm text-bo-ink mb-1 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-bo-accent inline-block" />
                ジャンル別成分
              </h3>
              <p className="text-xs text-bo-ink-muted mb-3">成分をタップすると詳細が確認できます</p>
              <div className="space-y-2">
                {INGREDIENT_GENRES.map((genre) => {
                  const ings: { id: string; nameJa: string }[] = [];
                  const seen = new Set<string>();
                  deckProducts.forEach((p) => {
                    p.ingredients.forEach((pi) => {
                      const ing = getIngredientById(pi.ingredientId);
                      if (ing?.genre === genre.key && !seen.has(ing.id)) {
                        seen.add(ing.id);
                        ings.push({ id: ing.id, nameJa: ing.nameJa });
                      }
                    });
                  });
                  if (ings.length === 0) return null;
                  return (
                    <div key={genre.key} className="rounded-r2 p-3 border" style={{ background: genre.color + "12", borderColor: genre.color + "20" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>{genre.icon}</span>
                        <span className="text-sm font-bold" style={{ color: genre.color }}>{genre.label}</span>
                        <span className="text-xs text-bo-ink-muted">({ings.length}種)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-bo-ink-muted mb-2">{GENRE_DESCRIPTIONS[genre.key]?.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ings.map((ing) => (
                          <Link key={ing.id} href={`/ingredient/${ing.id}`} className="text-xs px-2 py-0.5 rounded-full no-underline" style={{ background: genre.color + "25", color: genre.color }}>
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

          {/* Empty state */}
          {deckProducts.length === 0 && (
            <div className="text-center py-12 rounded-r2 bg-white border-[1.5px] border-dashed border-bo-ink-faint">
              <div className="w-16 h-16 rounded-[20px] mx-auto mb-3.5 flex items-center justify-center text-3xl bg-gradient-to-br from-[#F0E8F5] to-[#E8E0F0]">
                {routine === "morning" ? "☀️" : "🌙"}
              </div>
              <div className="text-sm font-bold text-bo-ink font-sans mb-1.5">
                {routine === "morning" ? "朝" : "夜"}ルーティンはまだ未設定
              </div>
              <p className="text-[11px] text-bo-ink-muted font-sans mb-4 leading-relaxed">
                マイコスメから製品を選んで、<br />スキンケアルーティンを組みましょう。
              </p>
              <button
                onClick={() => openPicker(null)}
                className="py-2.5 px-6 rounded-r1 border-none bg-bo-accent text-white text-xs font-bold font-sans cursor-pointer shadow-bo-accent"
              >
                ＋ ルーティンを作る
              </button>
            </div>
          )}

          <Disclaimer />
        </div>

        {/* Card Detail Overlay */}
        {selectedCard && (
          <div
            onClick={() => setSelectedCard(null)}
            className="fixed inset-0 z-[300] bg-bo-ink/60 backdrop-blur-lg flex items-center justify-center p-6 animate-fade-up"
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[320px] rounded-3xl bg-white shadow-bo2 overflow-hidden animate-fade-up">
              <div className="relative h-[200px] overflow-hidden">
                {selectedCard.packageImage ? (
                  <Image src={selectedCard.packageImage} alt={selectedCard.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-bo-parchment flex items-center justify-center text-4xl">📦</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,38,32,0.7)] to-transparent" />
                <div className="absolute top-3.5 left-3.5 w-8 h-8 rounded-[10px] bg-bo-accent flex items-center justify-center text-white text-sm font-black font-serif shadow-bo-accent">
                  {selectedCard.stepNum}
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-[10px] bg-white/20 backdrop-blur-lg border-none flex items-center justify-center cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <div className="absolute bottom-4 left-4.5 right-4.5">
                  <div className="text-[11px] text-white/70 font-sans tracking-wider uppercase">{selectedCard.brand}</div>
                  <div className="text-[17px] font-extrabold text-white font-serif leading-tight mt-0.5">{selectedCard.name}</div>
                </div>
              </div>
              <div className="p-5 pt-4.5">
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  <span className="text-[10px] font-bold text-bo-accent bg-bo-accent-soft py-0.5 px-2.5 rounded-md font-sans">
                    {TYPE_LABELS[selectedCard.productType || "other"] || "その他"}
                  </span>
                </div>
                <div className="text-xs font-bold text-bo-ink font-sans mb-2.5">成分ハイライト</div>
                <div className="flex flex-col gap-1.5">
                  {selectedCard.ingredients.slice(0, 6).map((pi, ii) => {
                    const ing = getIngredientById(pi.ingredientId);
                    if (!ing) return null;
                    const stars = ing.rarity === "legendary" ? 4 : ing.rarity === "rare" ? 3 : ing.rarity === "uncommon" ? 2 : 1;
                    return (
                      <div key={ii} className="flex items-center justify-between py-2 px-3 rounded-[10px] bg-bo-cream">
                        <span className="text-xs font-semibold text-bo-ink font-sans">{ing.nameJa}</span>
                        <span className="text-[10px] text-[#D4A853] tracking-wider">
                          {"★".repeat(stars)}{"☆".repeat(5 - stars)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-bo-ink-faint font-sans mt-3 text-center">タップで閉じる</p>
              </div>
            </div>
          </div>
        )}

        {/* Editor Modal */}
        {showEditor && (
          <DeckEditor
            routine={routine}
            routineLabel={currentDeck.label}
            routineIcon={currentDeck.icon}
            productsByGenre={productsByGenre}
            allProducts={allProducts}
            onClose={() => setShowEditor(false)}
            onPrevDeck={prevDeck}
            onNextDeck={nextDeck}
            onAddSlot={(genre) => openPicker(genre)}
            onRemoveProduct={(id) => { void handleRemoveItem(id); }}
            onAutoRecommend={handleAutoRecommend}
          />
        )}

        {/* Product Picker */}
        <BottomSheet open={showPicker} onClose={() => setShowPicker(false)} title={pickerGenreFilter ? `${getGenreByKey(pickerGenreFilter)?.label || ""}を追加` : "製品を追加"}>
          <div className="pb-4">
            {!pickerGenreFilter && productTypes.length > 2 && (
              <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 hide-scrollbar">
                {productTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setPickerFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-none cursor-pointer ${
                      pickerFilter === type ? "bg-bo-accent text-white" : "bg-bo-parchment text-bo-ink-muted"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-sm text-bo-ink-muted">
                <div className="text-4xl mb-2">🌿</div>
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
                      onClick={() => { void handleAddItem(p.id); setShowPicker(false); }}
                      className="w-full flex items-center gap-3 rounded-r2 p-4 text-left border border-bo-parchment cursor-pointer bg-white"
                    >
                      {p.packageImage ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                          <Image src={p.packageImage} alt={p.name} fill className="object-cover" sizes="48px" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-bo-parchment">
                          {genre?.icon || "📦"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-bo-ink">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="text-xs text-bo-ink-muted">{p.brand}</div>
                          {genre && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: `${genre.color}18`, color: genre.color }}>
                              {genre.icon} {genre.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-bo-ink-faint mt-0.5">{ingredientCount}成分</div>
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-bo-accent-soft text-bo-accent">
                        追加
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </BottomSheet>

        {/* Share modal removed */}
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
