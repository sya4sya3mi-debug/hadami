"use client";

import "@/styles/hadami-tokens.css";
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
import DeckAnalysis from "@/components/deck/DeckAnalysis";
import EmptyDeckState from "@/components/deck/EmptyDeckState";
import ProductPicker from "@/components/deck/ProductPicker";
import AutoRecommendModal from "@/components/deck/AutoRecommendModal";
import Disclaimer from "@/components/ui/Disclaimer";
import { Ico } from "@/components/redesign/apothecary/Icons";

import { useUser } from "@/lib/auth";
import AuthGuard from "@/components/ui/AuthGuard";
import { RoutineType, Product, ProductGenre, RecommendationResult, CategoryKey } from "@/types";
import { defaultRoutineCardConfig } from "@/lib/routines";

const DECK_OPTIONS: { key: RoutineType; label: string }[] = [
  { key: "morning", label: "朝" },
  { key: "night", label: "夜" },
];

const moonIco = (p: React.SVGProps<SVGSVGElement> = {}) => (
  <svg viewBox="0 0 20 20" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.6} {...p}>
    <path d="M16 11.5a6.5 6.5 0 1 1-8-8 5 5 0 0 0 8 8z" strokeLinejoin="round" />
  </svg>
);

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

  const handleCreateShareCard = () => {
    if (isCreatingShareCard) return;
    const getShareCardImageSource = (product?: Product) =>
      product?.packageImageThumbPath ?? product?.packageImagePath ?? "";

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
            icon: genre?.icon ?? "🌿",
            step_name: genre?.label ?? "その他",
            product_name: product?.name ?? "",
            brand: product?.brand ?? "",
            product_id: product?.id ?? "",
            product_image_url: getShareCardImageSource(product),
          };
        });
    };

    setIsCreatingShareCard(true);
    setShareCardError(null);

    try {
      const draft = {
        config: defaultRoutineCardConfig(),
        amSteps: buildSteps("morning"),
        pmSteps: buildSteps("night"),
      };
      sessionStorage.setItem("hadami.shareCard.draft", JSON.stringify(draft));
      router.push("/routine/share");
    } catch (e) {
      console.error("Failed to prepare share card draft:", e);
      setShareCardError("シェアカードの作成に失敗しました");
      setIsCreatingShareCard(false);
    }
  };

  const openPicker = (genre: ProductGenre | null) => {
    setPickerGenreFilter(genre);
    setShowPicker(true);
  };

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact" data-card="default">
        <div
          className="hd hd-page"
          style={{ minHeight: "100vh", background: "var(--hd-bg)" }}
        >
          <div style={{ padding: "16px 20px 96px" }}>
            {/* Sticky Header */}
            <div
              style={{
                position: "sticky",
                top: "env(safe-area-inset-top, 0px)",
                zIndex: 30,
                background: "var(--hd-bg)",
                margin: "0 -20px 20px",
                padding: "8px 20px 16px",
                borderBottom: "1px solid var(--hd-hair)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Regimen · 01</div>
                  <div className="hd-serif" style={{ marginTop: 4, fontSize: 24, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                    スキンケア<span style={{ fontStyle: "italic" }}>管理.</span>
                  </div>
                </div>
                {deckProducts.length > 0 && allProducts.length > 0 && (
                  <button
                    onClick={handleAutoRecommend}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--hd-ink)",
                      color: "var(--hd-ink)",
                      padding: "8px 14px",
                      borderRadius: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      height: 34,
                    }}
                  >
                    {Ico.sparkleSm({ width: 11, height: 11 })}
                    <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.18em" }}>
                      AUTO-COMPOSE
                    </span>
                  </button>
                )}
              </div>

              {/* AM/PM segmented — A pure (sharp inverted) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  border: "1px solid var(--hd-ink)",
                }}
              >
                {DECK_OPTIONS.map((opt, i) => {
                  const on = deckIndex === i;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setDeckIndex(i)}
                      style={{
                        padding: "14px 0",
                        cursor: "pointer",
                        background: on ? "var(--hd-ink)" : "transparent",
                        color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      {opt.key === "morning" ? Ico.sun({ width: 14, height: 14 }) : moonIco({ width: 14, height: 14 })}
                      <span className="hd-serif" style={{ fontSize: 15 }}>{opt.label}</span>
                      <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.7 }}>
                        {opt.key === "morning" ? "AM" : "PM"} · {String(routineCounts[i]).padStart(2, "0")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            {deckProducts.length > 0 ? (
              <>
                <DeckTray
                  productsByGenre={productsByGenre}
                  routine={routine === "night" ? "night" : "morning"}
                  onAddSlot={(genre) => openPicker(genre)}
                  onRemoveProduct={(id) => { void handleRemoveItem(id); }}
                />

                <button
                  onClick={() => setShowAnalysis(true)}
                  style={{
                    width: "100%",
                    marginTop: 28,
                    padding: "16px 0",
                    background: "transparent",
                    border: "1px solid var(--hd-ink)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <span className="hd-serif" style={{ fontSize: 14 }}>ルーティン分析</span>
                  <span
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}
                  >ANALYZE →</span>
                </button>

                <button
                  type="button"
                  onClick={() => { void handleCreateShareCard(); }}
                  disabled={isCreatingShareCard}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "16px 0",
                    background: "var(--hd-ink)",
                    color: "var(--hd-bg)",
                    border: "1px solid var(--hd-ink)",
                    cursor: isCreatingShareCard ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    opacity: isCreatingShareCard ? 0.6 : 1,
                  }}
                >
                  <span className="hd-serif" style={{ fontSize: 14 }}>シェアカードを作成</span>
                  <span
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-bg)", opacity: 0.7 }}
                  >SHARE →</span>
                </button>
                {isCreatingShareCard && (
                  <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                    シェアカードを作成しています...
                  </p>
                )}
                {shareCardError && (
                  <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "var(--hd-terra)", fontFamily: "var(--hd-sans)" }}>
                    {shareCardError}
                  </p>
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
                  style={{
                    width: "100%",
                    marginTop: 24,
                    padding: "16px 0",
                    background: "var(--hd-ink)",
                    color: "var(--hd-bg)",
                    border: "1px solid var(--hd-ink)",
                    cursor: isCreatingShareCard ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    opacity: isCreatingShareCard ? 0.6 : 1,
                  }}
                >
                  <span className="hd-serif" style={{ fontSize: 14 }}>シェアカードを作成</span>
                  <span
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-bg)", opacity: 0.7 }}
                  >SHARE →</span>
                </button>
                {isCreatingShareCard && (
                  <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                    シェアカードを作成しています...
                  </p>
                )}
                {shareCardError && (
                  <p style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "var(--hd-terra)", fontFamily: "var(--hd-sans)" }}>
                    {shareCardError}
                  </p>
                )}
              </>
            )}

            <Disclaimer />
          </div>
        </div>

        <ProductPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          genreFilter={pickerGenreFilter}
          allProducts={allProducts}
          deckItems={allDeckItems}
          routine={routine}
          onAdd={(productId) => { void handleAddItem(productId); }}
        />

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
