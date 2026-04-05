"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { recommendDeck } from "@/lib/deckRecommender";
import { CATEGORIES } from "@/lib/categories";
import { getGenreByKey, GENRE_SLOT_CONFIG } from "@/lib/productGenres";
import { shareDeck } from "@/lib/share";
import DeckTray from "@/components/deck/DeckTray";
import CoverageChart from "@/components/deck/CoverageChart";
import CombinationCard from "@/components/deck/CombinationCard";
import AutoRecommendModal from "@/components/deck/AutoRecommendModal";
import ShareModal from "@/components/ui/ShareModal";
import Disclaimer from "@/components/ui/Disclaimer";
import PageLoading from "@/components/ui/PageLoading";
import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import BottomSheet from "@/components/scan/BottomSheet";
import { RoutineType, CategoryKey, Product, ProductGenre, RecommendationResult } from "@/types";

// ── デッキ定義 ──
const DECK_OPTIONS: { key: RoutineType; label: string; icon: string; gradient: string }[] = [
  { key: "morning", label: "\u671D\u30C7\u30C3\u30AD", icon: "\u2600\uFE0F", gradient: "linear-gradient(135deg, #FFD580, #FFBE5C)" },
  { key: "night",   label: "\u591C\u30C7\u30C3\u30AD", icon: "\uD83C\uDF19", gradient: "linear-gradient(135deg, #7B9FD4, #5B7BC4)" },
];

export default function DeckPage() {
  const [deckIndex, setDeckIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerGenreFilter, setPickerGenreFilter] = useState<ProductGenre | null>(null);
  const [showShare, setShowShare] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const [showAutoRecommend, setShowAutoRecommend] = useState(false);
  const [autoResult, setAutoResult] = useState<RecommendationResult | null>(null);
  const [pickerFilter, setPickerFilter] = useState("\u3059\u3079\u3066");
  const { user, supabase, loading } = useUser();

  const routine = DECK_OPTIONS[deckIndex].key;
  const currentDeck = DECK_OPTIONS[deckIndex];

  const allDeckItems = useDeckStore((s) => s.items);
  const addItem = useDeckStore((s) => s.addItem);
  const removeItem = useDeckStore((s) => s.removeItem);
  const replaceDeckItems = useDeckStore((s) => s.replaceAll);
  const allProducts = useProductStore((s) => s.products);

  if (loading) {
    return <PageLoading message="マイスキンケアデッキを読み込んでいます..." />;
  }

  const getProduct = (id: string) => allProducts.find((p) => p.id === id);

  const deckItems = allDeckItems
    .filter((i) => i.routine === routine)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const deckProducts = deckItems
    .map((item) => getProduct(item.productId))
    .filter((p): p is Product => p !== undefined);

  // Group products by genre
  const productsByGenre: Record<ProductGenre, Product[]> = {} as Record<ProductGenre, Product[]>;
  GENRE_SLOT_CONFIG.forEach((s) => { productsByGenre[s.genre] = []; });
  deckProducts.forEach((p) => {
    const genre = p.productType || "other";
    if (!productsByGenre[genre]) productsByGenre[genre] = [];
    productsByGenre[genre].push(p);
  });

  // Stats
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

  // Completion
  const totalSlots = GENRE_SLOT_CONFIG.reduce((sum, s) => sum + (s.maxSlots === 1 ? 1 : 1), 0);
  const filledSlots = GENRE_SLOT_CONFIG.filter((s) => (productsByGenre[s.genre]?.length || 0) > 0).length;

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
    setPickerFilter("\u3059\u3079\u3066");
    setShowPicker(true);
  };

  const shareText = shareDeck(
    routine,
    deckProducts.map((p) => ({ emoji: "\uD83D\uDCE6", name: p.name })),
    coveredCategories,
    totalIngredients
  );


  // Picker products
  const availableProducts = allProducts.filter(
    (p) => !deckItems.some((item) => item.productId === p.id)
  );
  const pickerProducts = pickerGenreFilter
    ? availableProducts.filter((p) => p.productType === pickerGenreFilter)
    : availableProducts;
  const productTypes = ["\u3059\u3079\u3066", ...Array.from(new Set(pickerProducts.map((p) => p.productType).filter(Boolean)))];
  const filteredProducts = pickerFilter === "\u3059\u3079\u3066"
    ? pickerProducts
    : pickerProducts.filter((p) => p.productType === pickerFilter);

  // Deck switching
  const prevDeck = () => setDeckIndex((i) => (i - 1 + DECK_OPTIONS.length) % DECK_OPTIONS.length);
  const nextDeck = () => setDeckIndex((i) => (i + 1) % DECK_OPTIONS.length);

  // Hand preview items
  const allHandItems = GENRE_SLOT_CONFIG.map((s) => {
    const products = productsByGenre[s.genre] || [];
    const genreInfo = getGenreByKey(s.genre);
    if (s.maxSlots > 1 && products.length > 0) {
      return products.map((p) => ({
        icon: genreInfo?.icon || "",
        color: genreInfo?.color || "#ccc",
        filled: true,
        genre: genreInfo?.label || "",
        image: p.packageImage || null,
        section: s.section,
        stepLabel: s.stepLabel,
      }));
    }
    return [{
      icon: genreInfo?.icon || "",
      color: genreInfo?.color || "#ccc",
      filled: products.length > 0,
      genre: genreInfo?.label || "",
      image: products[0]?.packageImage || null,
      section: s.section,
      stepLabel: s.stepLabel,
    }];
  }).flat();

  // Limit special section to max 2 items
  const handItems = allHandItems.filter((item, idx) => {
    if (item.section !== "special") return true;
    const specialCount = allHandItems.filter((i, i2) => i2 <= idx && i.section === "special").length;
    return specialCount <= 2;
  });

  return (
    <AuthGuard>
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="font-bold text-base" style={{ color: "#2D2D2D" }}>{"\u2728"} マイデッキ</h1>
          <button
            onClick={() => setShowShare(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border-none"
            style={{ background: "#5BBFAD", color: "#fff" }}
          >
            Xに投稿
          </button>
        </div>

        {/* Capture area for share (Switcher + Hand + Bar + Stats only) */}
        <div ref={captureRef} style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)", borderRadius: 20, padding: "12px 8px 8px" }}>

        {/* Deck Switcher */}
        <div
          className="flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 mb-3"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #F5E6EF" }}
        >
          <button onClick={prevDeck} className="bg-transparent border-none text-base cursor-pointer px-1" style={{ color: "#C5C5C5" }}>{"\u25C0"}</button>
          <div
            className="flex-1 text-center rounded-[10px] py-1.5 text-[13px] font-bold text-white"
            style={{ background: currentDeck.gradient, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
          >
            {currentDeck.icon} {currentDeck.label}
          </div>
          <button onClick={nextDeck} className="bg-transparent border-none text-base cursor-pointer px-1" style={{ color: "#C5C5C5" }}>{"\u25B6"}</button>
        </div>

        {/* Hand Preview */}
        <div
          onClick={() => setShowEditor(true)}
          className="rounded-2xl px-2.5 pt-2.5 pb-1.5 mb-3 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #F5E6EF" }}
        >
          <div className="grid grid-cols-6 gap-x-2 gap-y-2.5 justify-items-center">
            {handItems.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-[64px] h-[64px] rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{
                    fontSize: item.filled && !item.image ? 28 : 20,
                    border: item.filled ? `2px solid ${item.color}` : `1.5px dashed ${item.color}40`,
                    background: item.filled ? `linear-gradient(135deg, ${item.color}20, ${item.color}08)` : `${item.color}06`,
                    opacity: item.filled ? 1 : 0.4,
                    boxShadow: item.filled ? `0 2px 6px ${item.color}25` : "none",
                  }}
                >
                  {item.filled && item.image ? (
                    <Image src={item.image} alt={item.genre} fill className="object-cover" sizes="64px" loading="lazy" />
                  ) : item.filled ? item.icon : "\uFF0B"}
                  <div
                    className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: item.filled ? item.color : "#D0D0D0",
                      fontSize: "8px",
                      fontWeight: 800,
                      color: "#fff",
                      opacity: item.filled ? 1 : 0.6,
                    }}
                  >
                    {item.stepLabel}
                  </div>
                </div>
                <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: item.filled ? item.color : "#C5C5C5" }}>
                  {item.genre}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-1.5 text-[10px] font-semibold" style={{ color: "#5BBFAD" }}>
            編集 {"\u25B6"}
          </div>
        </div>

        {/* Completion Bar */}
        <div className="flex items-center gap-2 mb-3.5 px-1">
          <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: "#9B9B9B" }}>{filledSlots}/{totalSlots}</span>
          <div className="flex gap-0.5 h-[5px] flex-1">
            {GENRE_SLOT_CONFIG.map((s) => {
              const genreInfo = getGenreByKey(s.genre);
              const filled = (productsByGenre[s.genre]?.length || 0) > 0;
              return (
                <div key={s.genre} className="flex-1 rounded-sm" style={{ background: genreInfo?.color || "#ccc", opacity: filled ? 1 : 0.15 }} />
              );
            })}
          </div>
        </div>

        </div>{/* end captureRef */}

        {/* Routine Step Timeline */}
        {deckProducts.length > 0 && (
          <div className="rounded-[20px] p-3.5 mb-4" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #F5E6EF" }}>
            <div className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: "#2D2D2D" }}>
              <span className="w-[3px] h-3.5 rounded-sm inline-block" style={{ background: "linear-gradient(180deg, #F9A8C0, #5BBFAD)" }} />
              ルーティンステップ
            </div>
            {GENRE_SLOT_CONFIG.filter((s) => s.section !== "special").map((slotConfig, i, arr) => {
              const products = productsByGenre[slotConfig.genre] || [];
              const filled = products.length > 0;
              const genreInfo = getGenreByKey(slotConfig.genre);
              const color = genreInfo?.color || "#ccc";
              const nextFilled = i < arr.length - 1 && (productsByGenre[arr[i + 1].genre]?.length || 0) > 0;

              return (
                <div key={slotConfig.genre} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center w-6 shrink-0">
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                      style={{ background: filled ? color : "#E0E0E0", boxShadow: filled ? `0 2px 6px ${color}30` : "none" }}
                    >
                      {filled ? "\u2713" : slotConfig.stepLabel}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-0.5 h-7" style={{
                        background: filled && nextFilled
                          ? `linear-gradient(180deg, ${color}, ${getGenreByKey(arr[i + 1].genre)?.color || "#ccc"})`
                          : "#E8E8E8",
                      }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2.5" style={{ minHeight: 44 }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{genreInfo?.icon}</span>
                      <span className="text-xs font-bold" style={{ color: filled ? "#2D2D2D" : "#C5C5C5" }}>{genreInfo?.label}</span>
                      {slotConfig.maxSlots > 1 && products.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-bold" style={{ background: `${color}18`, color }}>{products.length}/{slotConfig.maxSlots}</span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5 ml-5" style={{ color: filled ? "#9B9B9B" : "#D5D5D5" }}>
                      {filled ? products.map((p) => p.name).join(" / ") : "\u672A\u30BB\u30C3\u30C8"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {deckProducts.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { value: `${coveredCategories}/6`, label: "\u30AB\u30D0\u30FC", color: "#5BBFAD" },
              { value: `${totalIngredients}`, label: "\u6210\u5206\u6570", color: "#F9A8C0" },
              { value: `${deckProducts.length}`, label: "\u30A2\u30A4\u30C6\u30E0", color: "#B39DDB" },
              { value: recommendedCombos.length > 0 ? `${recommendedCombos.length}` : "\u2212", label: "\u597D\u76F8\u6027", color: recommendedCombos.length > 0 ? "#5BBFAD" : "#C5C5C5" },
            ].map((s) => (
              <div key={s.label} className="text-center py-3 rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: "#9B9B9B" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Combinations */}
        {combinations.length > 0 && (
          <div className="mb-5">
            {recommendedCombos.length > 0 && (
              <>
                <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "#E8FAF8", color: "#5BBFAD" }}>{"\u2713"}</span>
                  あなたのコスメが相乗効果を発揮中！
                  <span className="text-xs font-normal" style={{ color: "#9B9B9B" }}>({recommendedCombos.length}件)</span>
                </h3>
                <p className="text-xs mb-3" style={{ color: "#9B9B9B" }}>今使っている製品の成分同士で、より良いはたらきが期待できる組み合わせが見つかりました</p>
                <div className="space-y-2.5 mb-4">
                  {comboWithSources.filter((c) => c.combo.type === "recommended").map((item, i) => (
                    <CombinationCard key={`r-${i}`} combo={item.combo} ingredientProducts={item.sources} />
                  ))}
                </div>
              </>
            )}
            {cautionCombos.length > 0 && (
              <>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
                  <span className="text-sm">{"\u26A0\uFE0F"}</span>
                  注意が必要な組み合わせ
                  <span className="text-xs font-normal" style={{ color: "#9B9B9B" }}>({cautionCombos.length}件)</span>
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
        {deckProducts.length > 0 && (
          <div className="mb-5">
            <CoverageChart categoryCounts={categoryCounts} />
          </div>
        )}

        {/* Category list */}
        {deckProducts.length > 0 && (
          <div className="mb-5">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
              <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#5BBFAD" }} />
              カテゴリ別成分
            </h3>
            <p className="text-xs mb-3" style={{ color: "#9B9B9B" }}>成分をタップすると詳細が確認できます</p>
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
                  <div key={cat.key} className="rounded-2xl p-3" style={{ background: cat.color + "12", border: `1px solid ${cat.color}20` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{cat.icon}</span>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="text-xs" style={{ color: "#9B9B9B" }}>({ings.length}種)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#8B8B8B" }}>{cat.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ings.map((ing) => (
                        <Link key={ing.id} href={`/ingredient/${ing.id}`} className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.color + "25", color: cat.color, textDecoration: "none" }}>
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
          <div className="text-center py-12 rounded-3xl" style={{ background: "rgba(255,255,255,0.6)" }}>
            <div className="text-4xl mb-3">{"\uD83C\uDF38"}</div>
            <p className="font-medium text-sm" style={{ color: "#2D2D2D" }}>まだ製品が追加されていません</p>
            <p className="text-xs mt-1.5" style={{ color: "#9B9B9B" }}>「編集」から製品をスロットに追加しましょう</p>
          </div>
        )}

        <Disclaimer />
      </div>

      {/* ========== EDITOR MODAL ========== */}
      {showEditor && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto animate-deck-editor-up"
          style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}
        >
          <div className="max-w-[430px] mx-auto px-5 pb-10">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 pt-3 pb-2" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
              <div className="flex justify-between items-center mb-2">
                <button onClick={() => setShowEditor(false)} className="bg-transparent border-none text-[13px] font-semibold cursor-pointer py-1" style={{ color: "#5BBFAD" }}>
                  {"\u2190"} 戻る
                </button>
                <span className="text-sm font-bold">{"\uD83C\uDCCF"} デッキ編集</span>
                <button onClick={() => setShowEditor(false)} className="border-none text-[11px] font-bold py-1.5 px-3 rounded-[14px] cursor-pointer" style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", color: "#fff" }}>
                  完了
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-[10px] px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #F5E6EF" }}>
                <button onClick={prevDeck} className="bg-transparent border-none text-sm cursor-pointer" style={{ color: "#C5C5C5" }}>{"\u25C0"}</button>
                <span className="text-xs font-bold" style={{ color: "#E8950A" }}>{currentDeck.icon} {currentDeck.label}</span>
                <button onClick={nextDeck} className="bg-transparent border-none text-sm cursor-pointer" style={{ color: "#C5C5C5" }}>{"\u25B6"}</button>
              </div>
            </div>

            {/* Auto recommend */}
            {allProducts.length >= 2 && (
              <button
                onClick={handleAutoRecommend}
                className="w-full py-3.5 rounded-2xl border-none text-sm font-bold text-white cursor-pointer mb-4"
                style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", boxShadow: "0 2px 8px rgba(249,168,192,0.2)" }}
              >
                おすすめ自動選択
              </button>
            )}

            {/* Deck Tray */}
            <DeckTray
              productsByGenre={productsByGenre}
              onAddSlot={(genre) => openPicker(genre)}
              onRemoveProduct={(id) => { void handleRemoveItem(id); }}
            />
          </div>
        </div>
      )}

      {/* Product Picker */}
      <BottomSheet open={showPicker} onClose={() => setShowPicker(false)} title={pickerGenreFilter ? `${getGenreByKey(pickerGenreFilter)?.label || ""}を追加` : "\u88FD\u54C1\u3092\u8FFD\u52A0"}>
        <div className="pb-4">
          {!pickerGenreFilter && productTypes.length > 2 && (
            <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 hide-scrollbar">
              {productTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setPickerFilter(type)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-none cursor-pointer"
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

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: "#9B9B9B" }}>
              <div className="text-4xl mb-2">{"\uD83C\uDF38"}</div>
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
                    className="w-full flex items-center gap-3 rounded-2xl p-4 text-left border-none cursor-pointer"
                    style={{ background: "#FAFAFA", border: "1px solid #F2F2F2" }}
                  >
                    {p.packageImage ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                        <Image src={p.packageImage} alt={p.name} fill className="object-cover" sizes="48px" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}>
                        {genre?.icon || "\uD83D\uDCE6"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm" style={{ color: "#2D2D2D" }}>{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="text-xs" style={{ color: "#9B9B9B" }}>{p.brand}</div>
                        {genre && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: `${genre.color}18`, color: genre.color, fontSize: "10px" }}>
                            {genre.icon} {genre.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#C5C5C5" }}>{ingredientCount}成分</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0" style={{ background: "#E8FAF8", color: "#5BBFAD" }}>
                      追加
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>

      {showShare && <ShareModal text={shareText} onClose={() => setShowShare(false)} captureRef={captureRef} />}
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
