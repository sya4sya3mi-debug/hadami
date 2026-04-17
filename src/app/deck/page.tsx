"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { useDeckStore } from "@/stores/useDeckStore";
import { useProductStore } from "@/stores/useProductStore";
import { getIngredientById } from "@/lib/ingredients";
import { findCombinations } from "@/lib/combinations";
import { recommendDeck } from "@/lib/deckRecommender";
import { getGenreByKey, GENRE_SLOT_CONFIG } from "@/lib/productGenres";
import DeckTray from "@/components/deck/DeckTray";
// import DeckSummary from "@/components/deck/DeckSummary";
import DeckAnalysis from "@/components/deck/DeckAnalysis";
import EmptyDeckState from "@/components/deck/EmptyDeckState";
import ProductPicker from "@/components/deck/ProductPicker";
import AutoRecommendModal from "@/components/deck/AutoRecommendModal";
import Disclaimer from "@/components/ui/Disclaimer";

import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import { RoutineType, Product, ProductGenre, RecommendationResult, CategoryKey } from "@/types";
import { SparkleIcon, ChartIcon, SunIcon, MoonIcon } from "@/components/ui/Icons";
// Routine creation uses /api/routine/create

const DECK_OPTIONS: { key: RoutineType; label: string }[] = [
  { key: "morning", label: "朝" },
  { key: "night", label: "夜" },
];

export default function DeckPage() {
  const [deckIndex, setDeckIndex] = useState(() => new Date().getHours() < 15 ? 0 : 1);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerGenreFilter, setPickerGenreFilter] = useState<ProductGenre | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAutoRecommend, setShowAutoRecommend] = useState(false);
  const [autoResult, setAutoResult] = useState<RecommendationResult | null>(null);
  const [isCreatingShareCard, setIsCreatingShareCard] = useState(false);
  const [shareCardError, setShareCardError] = useState<string | null>(null);
  const { user, supabase, loading } = useUser();
  const router = useRouter();

  const routine = DECK_OPTIONS[deckIndex].key;

  const allDeckItems = useDeckStore((s) => s.items);
  const addItem = useDeckStore((s) => s.addItem);
  const removeItem = useDeckStore((s) => s.removeItem);
  const replaceDeckItems = useDeckStore((s) => s.replaceAll);
  const allProducts = useProductStore((s) => s.products);

  const getProduct = (id: string) => allProducts.find((p) => p.id === id);

  const deckItems = allDeckItems
    .filter((i) => i.routine === routine)
    .sort((a, b) => {
      const pa = getProduct(a.productId);
      const pb = getProduct(b.productId);
      const orderA = getGenreByKey(pa?.productType ?? "other")?.order ?? 99;
      const orderB = getGenreByKey(pb?.productType ?? "other")?.order ?? 99;
      return orderA - orderB;
    });

  const deckProducts = deckItems
    .map((item) => getProduct(item.productId))
    .filter((p): p is Product => p !== undefined);

  // Item counts per routine for tab badges
  const morningCount = allDeckItems.filter((i) => i.routine === "morning").length;
  const nightCount = allDeckItems.filter((i) => i.routine === "night").length;
  const routineCounts = [morningCount, nightCount];

  const { categoryCounts, coveredCategories, totalIngredients, combinations, recommendedCombos, cautionCombos, comboWithSources } = useMemo(() => {
    const categoryCounts: Record<CategoryKey, number> = {
      moisturizing: 0, brightening: 0, turnover: 0, barrier: 0, soothing: 0, keratin: 0,
    };
    const allIngredientNames: string[] = [];
    const seenIds = new Set<string>();
    deckProducts.forEach((product) => {
      product.ingredients.forEach((pi) => {
        const ing = getIngredientById(pi.ingredientId);
        if (ing) {
          allIngredientNames.push(ing.nameJa);
          if (ing.activeIngredient && !seenIds.has(ing.id)) {
            seenIds.add(ing.id);
            ing.categories.forEach((cat) => {
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
          }
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

    return { categoryCounts, coveredCategories, totalIngredients, combinations, recommendedCombos, cautionCombos, comboWithSources };
  }, [deckProducts]);

  if (loading) return null;

  const productsByGenre: Record<ProductGenre, Product[]> = {} as Record<ProductGenre, Product[]>;
  GENRE_SLOT_CONFIG.forEach((s) => { productsByGenre[s.genre] = []; });
  deckProducts.forEach((p) => {
    const genre = p.productType || "other";
    if (!productsByGenre[genre]) productsByGenre[genre] = [];
    productsByGenre[genre].push(p);
  });

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

  /** デッキの朝/夜アイテムからシェアカード用ステップを生成して新規作成 */
  const handleCreateShareCard = async () => {
    if (isCreatingShareCard) return;
    const buildSteps = (routineKey: RoutineType) => {
      return allDeckItems
        .filter((i) => i.routine === routineKey)
        .sort((a, b) => {
          const pa = getProduct(a.productId);
          const pb = getProduct(b.productId);
          const orderA = getGenreByKey(pa?.productType ?? "other")?.order ?? 99;
          const orderB = getGenreByKey(pb?.productType ?? "other")?.order ?? 99;
          return orderA - orderB;
        })
        .map((item) => {
          const product = getProduct(item.productId);
          const genre = getGenreByKey(product?.productType ?? "other");
          return {
            step_name: genre?.label ?? "その他",
            product_name: product ? `${product.brand ? product.brand + " " : ""}${product.name}` : undefined,
            product_id: product?.id,
            icon: genre?.icon ?? "🌿",
          };
        });
    };

    setIsCreatingShareCard(true);
    setShareCardError(null);

    try {
      const response = await fetch("/api/routine/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amSteps: buildSteps("morning"),
          pmSteps: buildSteps("night"),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.routineId) {
        setShareCardError(data.error ?? "シェアカードの作成に失敗しました");
        return;
      }

      router.push(`/routine/${data.routineId}/share`);
    } catch (e) {
      console.error("Failed to create routine:", e);
      setShareCardError("シェアカードの作成に失敗しました");
    } finally {
      setIsCreatingShareCard(false);
    }
  };

  const openPicker = (genre: ProductGenre | null) => {
    setPickerGenreFilter(genre);
    setShowPicker(true);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream animate-fade-in">
        <div className="px-5 pt-4 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-bo-ink-muted font-sans m-0">
              スキンケアルーティンを管理
            </p>
            {deckProducts.length > 0 && allProducts.length > 0 && (
              <button
                onClick={handleAutoRecommend}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold border-none cursor-pointer font-sans
                           bg-bo-accent text-white shadow-bo-accent pressable"
              >
                <SparkleIcon size={14} /> 自動編成
              </button>
            )}
          </div>

          {/* Routine tabs — Apple Segmented Control */}
          <div className="relative flex bg-white rounded-r2 p-1 shadow-bo1 mb-6">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-[12px] bg-bo-accent shadow-bo-accent transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                width: `calc(50% - 4px)`,
                transform: `translateX(${deckIndex * 100}%)`,
                left: "4px",
              }}
            />
            {DECK_OPTIONS.map((opt, i) => (
              <button
                key={opt.key}
                onClick={() => setDeckIndex(i)}
                className={`relative z-10 flex-1 py-2.5 rounded-[12px] border-none text-sm font-bold font-sans cursor-pointer transition-colors duration-200 ${
                  deckIndex === i ? "text-white" : "text-bo-ink-muted"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {opt.key === "morning" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
                  {opt.label}
                  <span className="text-xs opacity-70">({routineCounts[i]})</span>
                </span>
              </button>
            ))}
          </div>

          {/* Main content */}
          {deckProducts.length > 0 ? (
            <>
              {/* Deck slots — direct editing */}
              <DeckTray
                productsByGenre={productsByGenre}
                onAddSlot={(genre) => openPicker(genre)}
                onRemoveProduct={(id) => { void handleRemoveItem(id); }}
              />

              {/* Analysis button */}
              <button
                onClick={() => setShowAnalysis(true)}
                className="w-full mt-6 py-3.5 rounded-r2 text-sm font-bold font-sans cursor-pointer
                           flex items-center justify-center gap-2
                           border border-bo-parchment bg-white text-bo-ink-soft shadow-bo1 pressable"
              >
                <ChartIcon size={16} /> ルーティン分析
              </button>

              {/* Share card link */}
              <button
                type="button"
                onClick={() => { void handleCreateShareCard(); }}
                disabled={isCreatingShareCard}
                className="w-full mt-3 py-3.5 rounded-r2 text-sm font-bold font-sans cursor-pointer
                           flex items-center justify-center gap-2
                           border-none text-white shadow-bo1 pressable disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #3A8F7A, #2D7A66)" }}
              >
                🌿 シェアカードを作成
              </button>
              <button
                type="button"
                onClick={() => router.push("/routine")}
                className="w-full mt-3 py-3.5 rounded-r2 text-sm font-bold font-sans cursor-pointer
                           flex items-center justify-center gap-2
                           border border-bo-parchment bg-white text-bo-ink-soft shadow-bo1 pressable"
              >
                📋 マイルーティン一覧
              </button>
              {isCreatingShareCard && (
                <p className="mt-2 text-center text-xs text-bo-ink-muted">シェアカードを作成しています...</p>
              )}
              {shareCardError && (
                <p className="mt-2 text-center text-xs text-red-500">{shareCardError}</p>
              )}
            </>
          ) : (
            <>
              <EmptyDeckState
                routine={routine}
                allProducts={allProducts}
                onCreateRoutine={() => openPicker(null)}
                onAutoRecommend={handleAutoRecommend}
              />
              <button
                type="button"
                onClick={() => { void handleCreateShareCard(); }}
                disabled={isCreatingShareCard}
                className="w-full mt-6 py-3.5 rounded-r2 text-sm font-bold font-sans cursor-pointer
                           flex items-center justify-center gap-2
                           border-none text-white shadow-bo1 pressable disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #3A8F7A, #2D7A66)" }}
              >
                🌿 シェアカードを作成
              </button>
              {isCreatingShareCard && (
                <p className="mt-2 text-center text-xs text-bo-ink-muted">シェアカードを作成しています...</p>
              )}
              {shareCardError && (
                <p className="mt-2 text-center text-xs text-red-500">{shareCardError}</p>
              )}
            </>
          )}

          <Disclaimer />
        </div>

        {/* Product Picker */}
        <ProductPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          genreFilter={pickerGenreFilter}
          allProducts={allProducts}
          deckItems={allDeckItems}
          routine={routine}
          onAdd={(productId) => { void handleAddItem(productId); }}
        />

        {/* Analysis Sheet */}
        <DeckAnalysis
          open={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          deckProducts={deckProducts}
          categoryCounts={categoryCounts}
          coveredCategories={coveredCategories}
          totalIngredients={totalIngredients}
          combinations={combinations}
          comboWithSources={comboWithSources}
          recommendedCombos={recommendedCombos}
          cautionCombos={cautionCombos}
        />

        {/* Auto Recommend Modal */}
        {showAutoRecommend && autoResult && (
          <AutoRecommendModal
            result={autoResult}
            products={allProducts}
            onConfirm={() => { void handleConfirmAutoRecommend(); }}
            onClose={() => { setShowAutoRecommend(false); setAutoResult(null); }}
          />
        )}

        <ScrollToTop />
      </div>
    </AuthGuard>
  );
}
