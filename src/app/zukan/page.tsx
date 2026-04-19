"use client";

import { useState, useMemo, useCallback } from "react";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { useRouter } from "next/navigation";
import { useZukanStore } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import {
  getActiveIngredients,
  getActiveIngredientCount,
  ACTIVE_CATEGORIES,
  getActiveByCategory,
  getActiveCategoryTotal,
} from "@/lib/ingredients";
import { SKIN_CONCERNS } from "@/lib/concerns";
import { RarityKey, Product, CategoryKey } from "@/types";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import Disclaimer from "@/components/ui/Disclaimer";
import TargetedRakutenSection from "@/components/recommendations/TargetedRakutenSection";
import { ActiveCategoryIcon, SkinConcernIcon } from "@/components/ui/CosmeticIcons";

/* ── Rarity sort order ── */
const RARITY_ORDER: RarityKey[] = ["legendary", "rare", "uncommon", "common"];

/* ── Rarity visual config ── */
const RARITY_VIS: Record<
  RarityKey,
  { star: number; color: string; bg: string; border: string }
> = {
  common: {
    star: 1,
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.07)",
    border: "rgba(156,163,175,0.15)",
  },
  uncommon: {
    star: 2,
    color: "#4CAF50",
    bg: "rgba(76,175,80,0.07)",
    border: "rgba(76,175,80,0.15)",
  },
  rare: {
    star: 3,
    color: "#E91E8C",
    bg: "rgba(233,30,140,0.07)",
    border: "rgba(233,30,140,0.18)",
  },
  legendary: {
    star: 4,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.22)",
  },
};

/* ═══════════════════════════════════════
   Tab 1: 効果カテゴリ別
   ═══════════════════════════════════════ */
function CategoryExplorer({
  discoveredIds,
}: {
  discoveredIds: string[];
}) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<CategoryKey>("brightening");
  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);

  /* Category stats */
  const catStats = useMemo(() => {
    return ACTIVE_CATEGORIES.map((c) => {
      const total = getActiveCategoryTotal(c.key);
      const items = getActiveByCategory(c.key);
      let disc = 0;
      items.forEach((ing) => {
        if (discoveredSet.has(ing.id)) disc++;
      });
      return { ...c, total, disc, pct: total > 0 ? Math.round((disc / total) * 100) : 0 };
    });
  }, [discoveredSet]);

  /* Sorted ingredients for selected category */
  const catIngredients = useMemo(() => {
    const items = getActiveByCategory(selectedCat);
    return [...items].sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      const aDisc = discoveredSet.has(a.id) ? 0 : 1;
      const bDisc = discoveredSet.has(b.id) ? 0 : 1;
      return aDisc - bDisc;
    });
  }, [selectedCat, discoveredSet]);

  const currentCat = catStats.find((c) => c.key === selectedCat);
  const categoryTargets = useMemo(
    () => catIngredients.filter((ing) => !discoveredSet.has(ing.id)).slice(0, 2),
    [catIngredients, discoveredSet]
  );

  return (
    <div className="animate-fade-up">
      {/* Category selector — pill cards */}
      <div
        className="flex gap-2 overflow-x-auto py-4 px-5 hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {catStats.map((cat) => {
          const active = selectedCat === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`shrink-0 flex items-center gap-2.5 px-4 py-3 border-none cursor-pointer transition-all duration-200 rounded-r2 pressable ${
                active
                  ? "bg-white shadow-bo2"
                  : "bg-white/50 shadow-bo1"
              }`}
            >
              <div
                className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  background: `${cat.color}${active ? "20" : "0C"}`,
                  border: `1.5px solid ${cat.color}${active ? "40" : "10"}`,
                  color: cat.color,
                }}
              >
                <ActiveCategoryIcon category={cat.key} size={17} />
              </div>
              <div className="text-left">
                <span
                  className={`text-xs font-sans whitespace-nowrap block ${
                    active ? "font-bold text-bo-ink" : "font-medium text-bo-ink-muted"
                  }`}
                >
                  {cat.label}
                </span>
                <span
                  className="text-[11px] font-bold font-sans block mt-px"
                  style={{ color: active ? cat.color : "#B5C7BE" }}
                >
                  {cat.disc}/{cat.total}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected category detail */}
      {currentCat && (
        <div key={currentCat.key} className="px-5 pb-2 animate-fade-up">
          {/* Category header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: `${currentCat.color}15`, color: currentCat.color }}
              >
                <ActiveCategoryIcon category={currentCat.key} size={17} />
              </span>
              <div>
                <span className="text-base font-extrabold text-bo-ink font-serif block">
                  {currentCat.label}
                </span>
                <span className="text-[11px] text-bo-ink-muted font-sans">
                  {currentCat.disc}/{currentCat.total} 発見済み
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-bo-parchment overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-[600ms] ease-out"
                  style={{
                    width: `${currentCat.pct}%`,
                    background: `linear-gradient(90deg, ${currentCat.color}, ${currentCat.color}AA)`,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold font-serif"
                style={{ color: currentCat.color }}
              >
                {currentCat.pct}%
              </span>
            </div>
          </div>

          <div className="mb-4">
            <TargetedRakutenSection
              enabled={categoryTargets.length > 0}
              icon="PR"
              title={`${currentCat.label}で次に集めたい成分から探す`}
              description="まだ出会っていない成分を含みやすい商品だけを、楽天から先回りで拾えるようにしました。"
              keywords={categoryTargets.map(
                (ingredient) => `${ingredient.nameJa} 配合 スキンケア`
              )}
              ingredientHints={categoryTargets.map((ingredient) => ingredient.nameJa)}
            />
          </div>

          {/* Ingredient list */}
          <div className="flex flex-col gap-2">
            {catIngredients.map((ing) => {
              const r = RARITY_VIS[ing.rarity];
              const found = discoveredSet.has(ing.id);
              const isLeg = ing.rarity === "legendary";
              return (
                <div
                  key={ing.id}
                  onClick={() => {
                    if (found) router.push(`/ingredient/${ing.id}`);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-r2 relative overflow-hidden
                              transition-all duration-150 ${
                    found ? "cursor-pointer active:scale-[0.98]" : ""
                  }`}
                  style={{
                    background: found ? "white" : "rgba(232,240,236,0.35)",
                    border: `1px solid ${found ? r.border : "transparent"}`,
                    boxShadow: found ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                    opacity: found ? 1 : 0.55,
                  }}
                >
                  {/* Legendary shimmer */}
                  {isLeg && found && (
                    <div
                      className="absolute inset-0 opacity-10 animate-shimmer-legend"
                      style={{
                        background:
                          "linear-gradient(135deg, transparent 25%, rgba(245,158,11,0.5) 50%, transparent 75%)",
                      }}
                    />
                  )}

                  {/* Stars */}
                  <div className="shrink-0 w-10 text-center relative">
                    <span
                      className="text-[11px] tracking-wide"
                      style={{ color: r.color }}
                    >
                      {"★".repeat(r.star)}
                    </span>
                    <span className="text-[11px] tracking-wide text-bo-parchment">
                      {"★".repeat(4 - r.star)}
                    </span>
                  </div>

                  {/* Name + note */}
                  <div className="flex-1 min-w-0 relative">
                    <div
                      className={`text-sm font-semibold font-sans truncate ${
                        found ? "text-bo-ink" : "text-bo-ink-muted"
                      }`}
                    >
                      {found ? ing.nameJa : "？？？"}
                    </div>
                    {(found ? ing.note : ing.funFact) && (
                      <div
                        className="text-[11px] font-sans mt-0.5 truncate"
                        style={{ color: found ? "#9E9E9E" : "#B08D3A" }}
                      >
                        {found ? ing.note : `💡 ${ing.funFact}`}
                      </div>
                    )}
                  </div>

                  {/* Arrow for discovered */}
                  {found && (
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"
                      className="shrink-0"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Tab 2: Concern View
   ═══════════════════════════════════════ */
function ConcernView({
  discoveredIds,
  products,
}: {
  discoveredIds: string[];
  products: Product[];
}) {
  const router = useRouter();
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [expandedIng, setExpandedIng] = useState<string | null>(null);
  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);

  /* Reverse lookup: ingredientId → products containing it */
  const getProductsWithIngredient = useCallback(
    (ingredientId: string): Product[] => {
      return products.filter((p) =>
        p.ingredients.some((pi) => pi.ingredientId === ingredientId)
      );
    },
    [products]
  );

  const concern = SKIN_CONCERNS.find((c) => c.label === selectedConcern);
  const concernTargets = useMemo(() => {
    if (!concern) return [];

    return [...concern.keyIngredients]
      .filter((ingredient) => !discoveredSet.has(ingredient.id))
      .sort(
        (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
      )
      .slice(0, 2);
  }, [concern, discoveredSet]);

  /* ── Step 1: Concern list ── */
  if (!concern) {
    return (
      <div className="flex flex-col gap-2.5 px-5 py-4 animate-fade-up">
        {SKIN_CONCERNS.map((c) => {
          const covered = c.keyIngredients.filter(
            (k) => getProductsWithIngredient(k.id).length > 0
          ).length;
          const coverPct = Math.round((covered / c.keyIngredients.length) * 100);
          return (
            <button
              key={c.label}
              onClick={() => setSelectedConcern(c.label)}
              className="flex items-center gap-3.5 py-4 px-4 rounded-r2 bg-white shadow-bo1 cursor-pointer text-left w-full
                         border-none pressable"
            >
              <div
                className="w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center"
                style={{
                  background: `${c.color}12`,
                  color: c.color,
                }}
              >
                <SkinConcernIcon concern={c.label} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-bo-ink font-sans">
                  {c.label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-bo-parchment/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${coverPct}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <span className="text-[10px] text-bo-ink-muted font-sans shrink-0">
                    {covered}/{c.keyIngredients.length}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-[12px] shrink-0 flex items-center justify-center text-sm font-black font-serif"
                style={{
                  background: `${c.color}10`,
                  color: c.color,
                }}
              >
                {coverPct}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Step 2: Key ingredients for selected concern ── */
  const covered = concern.keyIngredients.filter(
    (k) => getProductsWithIngredient(k.id).length > 0
  ).length;
  const coverPct = Math.round((covered / concern.keyIngredients.length) * 100);

  return (
    <div className="py-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-4">
        <button
          onClick={() => {
            setSelectedConcern(null);
            setExpandedIng(null);
          }}
          className="w-9 h-9 rounded-[12px] border border-bo-parchment bg-white cursor-pointer flex items-center justify-center shrink-0
                     shadow-bo1 pressable"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9E9E9E"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-[14px]"
          style={{ background: `${concern.color}12`, color: concern.color }}
        >
          <SkinConcernIcon concern={concern.label} size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-base font-extrabold text-bo-ink font-serif block">
            {concern.label}
          </span>
          <span className="text-[11px] text-bo-ink-muted font-sans">
            {covered}/{concern.keyIngredients.length} カバー
          </span>
        </div>
        <div
          className="py-1 px-3 rounded-r1 text-sm font-black font-serif"
          style={{ background: `${concern.color}12`, color: concern.color }}
        >
          {coverPct}%
        </div>
      </div>

      {/* Tip */}
      <div
        className="mx-5 mb-4 py-3 px-4 rounded-r2 text-xs text-bo-ink-soft font-sans leading-relaxed"
        style={{
          background: `${concern.color}08`,
          border: `1px solid ${concern.color}15`,
        }}
      >
        💡 {concern.tip}
      </div>

      <div className="px-5 pb-2">
        <TargetedRakutenSection
          enabled={concernTargets.length > 0}
          icon="PR"
          title="この悩みで次に集めたい注目成分"
          description="未発見のキーメジャー成分から、今の悩みに寄せた商品を楽天で見つけやすくしています。"
          keywords={concernTargets.map(
            (ingredient) => `${ingredient.name} 配合 スキンケア`
          )}
          ingredientHints={concernTargets.map((ingredient) => ingredient.name)}
        />
      </div>

      {/* Key Ingredients */}
      <div className="flex flex-col gap-2 px-5">
        {concern.keyIngredients.map((ing) => {
          const r = RARITY_VIS[ing.rarity];
          const found = discoveredSet.has(ing.id);
          const matchedProducts = getProductsWithIngredient(ing.id);
          const hasProducts = matchedProducts.length > 0;
          const open = expandedIng === ing.id;

          return (
            <div
              key={ing.id}
              className="rounded-r2 overflow-hidden bg-white shadow-bo1"
            >
              {/* Row */}
              <div
                onClick={() => setExpandedIng(open ? null : ing.id)}
                className="flex items-center gap-3 py-3.5 px-4 cursor-pointer pressable"
              >
                <div
                  className="w-7 h-7 rounded-[10px] shrink-0 flex items-center justify-center text-sm"
                  style={{
                    background: found
                      ? "rgba(58,143,122,0.08)"
                      : "rgba(181,199,190,0.12)",
                  }}
                >
                  {found ? "✅" : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold font-sans ${
                        found ? "text-bo-ink" : "text-bo-ink-faint"
                      }`}
                    >
                      {found ? ing.name : "？？？"}
                    </span>
                    <span className="text-[10px]" style={{ color: r.color }}>
                      {"★".repeat(r.star)}
                    </span>
                  </div>
                  <div className="text-[11px] text-bo-ink-muted font-sans mt-0.5 truncate">
                    {ing.role}
                  </div>
                </div>
                {hasProducts ? (
                  <span className="text-[11px] font-bold text-bo-accent font-sans shrink-0 py-1 px-2.5 rounded-r1 bg-bo-accent/[0.08]">
                    {matchedProducts.length}件
                  </span>
                ) : (
                  <span className="text-[11px] text-bo-ink-faint font-sans shrink-0">
                    {found ? "未配合" : "未発見"}
                  </span>
                )}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>

              {/* Accordion: Matching products */}
              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: open ? 300 : 0 }}
              >
                <div className="px-4 pb-3.5 border-t border-bo-parchment/60">
                  {hasProducts ? (
                    matchedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/product/${p.id}`)}
                        className="flex items-center gap-2.5 py-2.5 px-3 rounded-r1 mt-2 bg-bo-accent-pale cursor-pointer pressable"
                      >
                        <span className="text-sm">📦</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-bo-ink font-sans truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-bo-ink-muted font-sans">
                            {p.brand}
                          </div>
                        </div>
                        <svg
                          width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"
                          className="shrink-0"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 text-center">
                      <button
                        onClick={() => router.push("/scan")}
                        className="py-2.5 px-6 rounded-r1 border-none bg-bo-accent text-white text-xs font-bold font-sans cursor-pointer
                                   shadow-bo-accent pressable"
                      >
                        📸 スキャンして探す
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coverage bar */}
      <div className="flex items-center gap-3 mx-5 mt-4 p-3 rounded-r1 bg-white shadow-bo1">
        <div className="flex-1 h-1.5 rounded-full bg-bo-parchment/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
            style={{
              width: `${coverPct}%`,
              background: `linear-gradient(90deg, ${concern.color}, ${concern.color}AA)`,
            }}
          />
        </div>
        <span className="text-xs text-bo-ink-muted font-sans">
          <span className="font-bold" style={{ color: concern.color }}>
            {covered}
          </span>
          /{concern.keyIngredients.length} カバー
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Main Page
   ═══════════════════════════════════════ */
export default function ZukanPage() {
  const { loading } = useUser();
  const [tab, setTab] = useState<"category" | "concern">("category");
  const discoveredIds = useZukanStore((s) => s.discoveredIds);
  const products = useProductStore((s) => s.products);

  /* 図鑑対象の美容成分のみでカウント */
  const activeSet = useMemo(() => new Set(getActiveIngredients().map((i) => i.id)), []);
  const totalDisc = discoveredIds.filter((id) => activeSet.has(id)).length;
  const totalAll = getActiveIngredientCount();
  const pct = totalAll > 0 ? Math.round((totalDisc / totalAll) * 100) : 0;

  const circumference = 2 * Math.PI * 34;
  const dashLength = (pct / 100) * circumference;

  if (loading) return null;

  const tabIndex = tab === "category" ? 0 : 1;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream pb-24 animate-fade-in">
        {/* ── Header — Apple Health style ── */}
        <div className="pt-5 px-5 pb-5 bg-gradient-to-b from-[#f0faeb] to-bo-cream">
          <div className="flex items-center gap-5">
            {/* Ring chart */}
            <div className="relative w-[72px] h-[72px] shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#E8F5EE" strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#3A8F7A" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${dashLength} ${circumference}`}
                  className="transition-all duration-[1200ms]"
                  style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-bo-accent font-serif">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="text-xs text-bo-ink-muted font-sans m-0 mb-1">
                美容成分コンプリート率
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-bo-ink font-serif">
                  {totalDisc}
                </span>
                <span className="text-sm text-bo-ink-muted font-sans">
                  / {totalAll} 種
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs — Apple Segmented Control ── */}
        <div
          className="sticky z-30 mb-1 border-b border-white/70 bg-bo-cream/95 px-5 pb-3 pt-2 backdrop-blur-sm"
          style={{
            top: "env(safe-area-inset-top, 0px)",
            boxShadow: "0 10px 24px rgba(34, 52, 48, 0.08)",
          }}
        >
          <div className="relative flex bg-white rounded-r2 p-1 shadow-bo1">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-[12px] bg-bo-accent shadow-bo-accent transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                width: `calc(50% - 4px)`,
                transform: `translateX(${tabIndex * 100}%)`,
                left: "4px",
              }}
            />
            {([
              { key: "category" as const, label: "効果別" },
              { key: "concern" as const, label: "肌悩みから探す" },
            ]).map((t, i) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative z-10 flex-1 py-2.5 rounded-[12px] border-none text-sm font-bold font-sans cursor-pointer transition-colors duration-200 ${
                  tabIndex === i ? "text-white" : "text-bo-ink-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        {tab === "category" && <CategoryExplorer discoveredIds={discoveredIds} />}
        {tab === "concern" && (
          <ConcernView discoveredIds={discoveredIds} products={products} />
        )}

        {/* Footer */}
        <div className="px-5 pt-4">
          <Disclaimer />
        </div>
        <ScrollToTop />
      </div>
    </AuthGuard>
  );
}
