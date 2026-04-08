"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useZukanStore } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import {
  ACTIVE_INGREDIENTS,
  ACTIVE_INGREDIENT_COUNT,
  ACTIVE_CATEGORIES,
  getActiveByCategory,
  getActiveCategoryTotal,
  getIngredientById,
} from "@/lib/ingredients";
import { SKIN_CONCERNS } from "@/lib/concerns";
import { RarityKey, Product, CategoryKey } from "@/types";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import Disclaimer from "@/components/ui/Disclaimer";

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

  return (
    <div>
      {/* Horizontal icon selector */}
      <div
        className="flex gap-1 overflow-x-auto py-3.5 px-4"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {catStats.map((cat) => {
          const active = selectedCat === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`shrink-0 flex flex-col items-center gap-[3px] px-2.5 pt-2 pb-1.5 border-none cursor-pointer transition-all duration-200 min-w-[52px] ${
                active ? "bg-white shadow-bo2 rounded-2xl" : "bg-transparent rounded-2xl"
              }`}
            >
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px] transition-all duration-200"
                style={{
                  background: `${cat.color}${active ? "20" : "0C"}`,
                  border: `1.5px solid ${cat.color}${active ? "50" : "15"}`,
                }}
              >
                {cat.icon}
              </div>
              <span
                className={`text-[9px] font-sans whitespace-nowrap ${
                  active ? "font-bold text-bo-ink" : "font-medium text-bo-ink-muted"
                }`}
              >
                {cat.label}
              </span>
              <span
                className="text-[9px] font-bold font-sans"
                style={{ color: active ? cat.color : "#B5C7BE" }}
              >
                {cat.pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected category detail */}
      {currentCat && (
        <div key={currentCat.key} className="px-4 pb-2 animate-fade-up">
          {/* Category header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-bo-ink font-serif">
                {currentCat.label}
              </span>
              <span className="text-[11px] text-bo-ink-muted font-sans">
                {currentCat.disc}/{currentCat.total}
              </span>
            </div>
            <div className="h-1 w-[72px] rounded-sm bg-bo-parchment overflow-hidden">
              <div
                className="h-full rounded-sm transition-[width] duration-[600ms] ease-out"
                style={{
                  width: `${currentCat.pct}%`,
                  background: `linear-gradient(90deg, ${currentCat.color}, ${currentCat.color}AA)`,
                }}
              />
            </div>
          </div>

          {/* Ingredient list */}
          <div className="flex flex-col gap-[5px]">
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[13px] relative overflow-hidden ${
                    found ? "cursor-pointer" : ""
                  }`}
                  style={{
                    background: found ? r.bg : "rgba(232,240,236,0.4)",
                    border: `1px solid ${found ? r.border : "transparent"}`,
                    opacity: found ? 1 : 0.5,
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
                  <span
                    className="text-[10px] shrink-0 w-[34px] text-center relative"
                    style={{ color: r.color }}
                  >
                    {"★".repeat(r.star)}
                    <span className="text-bo-parchment">
                      {"★".repeat(4 - r.star)}
                    </span>
                  </span>

                  {/* Name + note */}
                  <div className="flex-1 min-w-0 relative">
                    <div
                      className={`text-[13px] font-semibold font-sans truncate ${
                        found ? "text-bo-ink" : "text-bo-ink-faint"
                      }`}
                    >
                      {found ? ing.nameJa : "？？？"}
                    </div>
                    {(found ? ing.note : ing.funFact) && (
                      <div
                        className="text-[10px] font-sans mt-px truncate"
                        style={{ color: found ? "#7E9389" : "#B08D3A" }}
                      >
                        {found ? ing.note : `💡 ${ing.funFact}`}
                      </div>
                    )}
                  </div>
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

  /* ── Step 1: Concern list ── */
  if (!concern) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3.5">
        {SKIN_CONCERNS.map((c) => {
          const covered = c.keyIngredients.filter(
            (k) => getProductsWithIngredient(k.id).length > 0
          ).length;
          const coverPct = Math.round((covered / c.keyIngredients.length) * 100);
          return (
            <button
              key={c.label}
              onClick={() => setSelectedConcern(c.label)}
              className="flex items-center gap-3 py-3.5 px-4 rounded-2xl border border-bo-parchment bg-white shadow-bo1 cursor-pointer text-left w-full"
            >
              <div
                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
                style={{
                  background: `${c.color}12`,
                  border: `1px solid ${c.color}22`,
                }}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-bo-ink font-sans">
                  {c.label}
                </div>
                <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">
                  マイコスメカバー {covered}/{c.keyIngredients.length}
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center text-sm font-extrabold font-serif"
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
    <div className="py-3 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => {
            setSelectedConcern(null);
            setExpandedIng(null);
          }}
          className="w-[30px] h-[30px] rounded-[9px] border border-bo-parchment bg-white cursor-pointer flex items-center justify-center shrink-0"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7E9389"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-lg">{concern.icon}</span>
        <span className="text-base font-extrabold text-bo-ink font-serif flex-1">
          {concern.label}
        </span>
        <div
          className="py-[3px] px-2.5 rounded-lg text-xs font-extrabold font-serif"
          style={{ background: `${concern.color}12`, color: concern.color }}
        >
          {coverPct}%
        </div>
      </div>

      {/* Tip */}
      <div
        className="mx-4 mb-3 py-2.5 px-3.5 rounded-r1 text-[11px] text-bo-ink-soft font-sans leading-relaxed"
        style={{
          background: `${concern.color}08`,
          border: `1px solid ${concern.color}12`,
        }}
      >
        💡 {concern.tip}
      </div>

      {/* Key Ingredients */}
      <div className="flex flex-col gap-1.5 px-4">
        {concern.keyIngredients.map((ing) => {
          const r = RARITY_VIS[ing.rarity];
          const found = discoveredSet.has(ing.id);
          const matchedProducts = getProductsWithIngredient(ing.id);
          const hasProducts = matchedProducts.length > 0;
          const open = expandedIng === ing.id;

          return (
            <div
              key={ing.id}
              className="rounded-[14px] overflow-hidden bg-white border border-bo-parchment shadow-bo1"
            >
              {/* Row */}
              <div
                onClick={() => setExpandedIng(open ? null : ing.id)}
                className="flex items-center gap-2.5 py-3 px-3.5 cursor-pointer"
              >
                <div
                  className="w-6 h-6 rounded-[7px] shrink-0 flex items-center justify-center text-[11px]"
                  style={{
                    background: found
                      ? "rgba(58,143,122,0.08)"
                      : "rgba(181,199,190,0.15)",
                  }}
                >
                  {found ? "✅" : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[13px] font-bold font-sans ${
                        found ? "text-bo-ink" : "text-bo-ink-faint"
                      }`}
                    >
                      {found ? ing.name : "？？？"}
                    </span>
                    <span className="text-[9px]" style={{ color: r.color }}>
                      {"★".repeat(r.star)}
                    </span>
                  </div>
                  <div className="text-[10px] text-bo-ink-muted font-sans mt-px truncate">
                    {ing.role}
                  </div>
                </div>
                {hasProducts ? (
                  <span className="text-[10px] font-bold text-bo-accent font-sans shrink-0 py-0.5 px-2 rounded-md bg-bo-accent/[0.08]">
                    {matchedProducts.length}件
                  </span>
                ) : (
                  <span className="text-[10px] text-bo-ink-faint font-sans shrink-0">
                    {found ? "未配合" : "未発見"}
                  </span>
                )}
              </div>

              {/* Accordion: Matching products */}
              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: open ? 300 : 0 }}
              >
                <div className="px-3.5 pb-3 border-t border-bo-parchment">
                  {hasProducts ? (
                    matchedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/product/${p.id}`)}
                        className="flex items-center gap-2 py-2 px-2.5 rounded-[10px] mt-1.5 bg-bo-accent-pale cursor-pointer"
                      >
                        <span className="text-[13px]">📦</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-bo-ink font-sans truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-bo-ink-muted font-sans">
                            {p.brand}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2.5 text-center">
                      <button
                        onClick={() => router.push("/scan")}
                        className="py-2 px-5 rounded-[10px] border-none bg-bo-accent text-white text-[11px] font-bold font-sans cursor-pointer"
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
      <div className="flex items-center gap-2.5 mx-4 mt-3">
        <div className="flex-1 h-1 rounded-sm bg-bo-parchment overflow-hidden">
          <div
            className="h-full rounded-sm transition-[width] duration-[800ms] ease-out"
            style={{
              width: `${coverPct}%`,
              background: `linear-gradient(90deg, ${concern.color}, ${concern.color}AA)`,
            }}
          />
        </div>
        <span className="text-[10px] text-bo-ink-muted font-sans">
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

  if (loading) {
    return <PageLoading message="図鑑を読み込んでいます..." />;
  }

  /* 有効成分のみでカウント */
  const activeSet = useMemo(() => new Set(ACTIVE_INGREDIENTS.map((i) => i.id)), []);
  const totalDisc = discoveredIds.filter((id) => activeSet.has(id)).length;
  const totalAll = ACTIVE_INGREDIENT_COUNT;
  const pct = totalAll > 0 ? Math.round((totalDisc / totalAll) * 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream pb-24">
        {/* ── Header ── */}
        <div
          className="pt-4 px-5 pb-4"
          style={{
            background: "linear-gradient(180deg, #EAF5F1 0%, #F4F9F6 100%)",
          }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-2xl font-extrabold font-serif text-bo-ink">
              有効成分図鑑
            </span>
            <div>
              <span className="text-[28px] font-extrabold text-bo-accent font-serif leading-none">
                {pct}
              </span>
              <span className="text-xs font-medium text-bo-ink-muted font-sans">
                % <span className="ml-1">{totalDisc}/{totalAll}</span>
              </span>
            </div>
          </div>
          <div className="h-[5px] rounded-[3px] bg-bo-parchment overflow-hidden">
            <div
              className="h-full rounded-[3px] transition-[width] duration-[1200ms]"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #3A8F7A, #4A9B7F)",
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex px-4 border-b border-bo-parchment">
          {(
            [
              { key: "category", label: "効果別" },
              { key: "concern", label: "肌悩みから探す" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-[11px] border-none cursor-pointer bg-transparent text-[13px] font-sans transition-all duration-200 ${
                tab === t.key
                  ? "text-bo-accent font-bold border-b-[2.5px] border-bo-accent"
                  : "text-bo-ink-muted font-medium border-b-[2.5px] border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
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
      </div>
    </AuthGuard>
  );
}
