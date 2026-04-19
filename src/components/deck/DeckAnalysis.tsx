"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Product, CategoryKey, Combination } from "@/types";
import { ACTIVE_CATEGORIES, getIngredientById } from "@/lib/ingredients";
import { SKIN_CONCERNS } from "@/lib/concerns";
import CombinationCard from "./CombinationCard";
import BottomSheet from "@/components/scan/BottomSheet";
import { ActiveCategoryIcon, SkinConcernIcon } from "@/components/ui/CosmeticIcons";
import { AlertIcon, CheckCircleIcon } from "@/components/ui/Icons";

const CoverageChart = dynamic(() => import("./CoverageChart"), {
  loading: () => (
    <div className="h-[280px] flex items-center justify-center text-sm text-bo-ink-muted">
      チャート読み込み中...
    </div>
  ),
  ssr: false,
});

type AnalysisTab = "coverage" | "combos" | "ingredients";

interface DeckAnalysisProps {
  open: boolean;
  onClose: () => void;
  deckProducts: Product[];
  categoryCounts: Record<CategoryKey, number>;
  coveredCategories: number;
  totalIngredients: number;
  combinations: Combination[];
  comboWithSources: { combo: Combination; sources: [string[], string[]] }[];
  recommendedCombos: Combination[];
  cautionCombos: Combination[];
}

export default function DeckAnalysis({
  open,
  onClose,
  deckProducts,
  categoryCounts,
  coveredCategories,
  totalIngredients,
  combinations,
  comboWithSources,
  recommendedCombos,
  cautionCombos,
}: DeckAnalysisProps) {
  const [tab, setTab] = useState<AnalysisTab>("coverage");

  const tabs: { key: AnalysisTab; label: string }[] = [
    { key: "coverage", label: "カバー率" },
    { key: "combos", label: "相性" },
    { key: "ingredients", label: "成分" },
  ];

  const tabIndex = tabs.findIndex((t) => t.key === tab);

  const allIngredientIds = useMemo(
    () => deckProducts.flatMap((d) => d.ingredients.map((pi) => pi.ingredientId)),
    [deckProducts]
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="ルーティン分析" height="calc(100dvh - 2rem)">
      <div className="pb-6">
        {/* Tab bar */}
        <div className="relative flex bg-bo-cream rounded-r1 p-1 mb-5">
          <div
            className="absolute top-1 bottom-1 rounded-[10px] bg-white shadow-bo1 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              width: `calc(${100 / tabs.length}% - 4px)`,
              transform: `translateX(calc(${tabIndex * 100}% + ${tabIndex * 4}px))`,
              left: "2px",
            }}
          />
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative z-10 flex-1 py-2 rounded-[10px] border-none text-xs font-bold font-sans cursor-pointer transition-colors duration-200 ${
                tab === t.key ? "text-bo-accent" : "text-bo-ink-muted"
              }`}
            >
              {t.label}
              {t.key === "combos" && combinations.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({combinations.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Coverage tab */}
        {tab === "coverage" && (
          <div className="animate-fade-up">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[
                { value: `${coveredCategories}/${ACTIVE_CATEGORIES.length}`, label: "効果カバー", color: "#3A8F7A" },
                { value: `${totalIngredients}`, label: "成分数", color: "#D4A853" },
                { value: `${deckProducts.length}`, label: "アイテム", color: "#6B4A8A" },
              ].map((s) => (
                <div key={s.label} className="text-center py-3.5 rounded-r2 bg-white shadow-bo1">
                  <div className="text-xl font-black font-serif" style={{ color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Concern coverage */}
            <div className="bg-white rounded-r2 shadow-bo1 p-5 mb-5">
              <div className="text-sm font-bold text-bo-ink font-sans mb-4">
                効能別のカバー
              </div>
              {SKIN_CONCERNS.map((concern) => {
                const coveredKeys = concern.keyIngredients.filter((ki) =>
                  allIngredientIds.includes(ki.id)
                );
                const covered = coveredKeys.length > 0;
                const pct = (coveredKeys.length / concern.keyIngredients.length) * 100;
                return (
                  <div key={concern.label} className="mb-3 last:mb-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span
                        className={`text-xs font-semibold font-sans flex items-center gap-1 ${
                          covered ? "text-bo-ink-soft" : "text-bo-ink-faint"
                        }`}
                      >
                        {covered
                          ? <CheckCircleIcon size={12} color="#3A8F7A" />
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        }
                        <SkinConcernIcon concern={concern.label} size={12} />
                        {concern.label}
                      </span>
                      <span className="text-[11px] text-bo-ink-muted font-sans">
                        {covered
                          ? `${coveredKeys.length}/${concern.keyIngredients.length}成分`
                          : "未カバー"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bo-parchment/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: concern.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar chart */}
            <div className="bg-white rounded-r2 shadow-bo1 p-4">
              <div className="text-sm font-bold text-bo-ink font-sans mb-2">
                カテゴリ別レーダー
              </div>
              <CoverageChart categoryCounts={categoryCounts} />
            </div>
          </div>
        )}

        {/* Combinations tab */}
        {tab === "combos" && (
          <div className="animate-fade-up">
            {combinations.length === 0 ? (
              <div className="text-center py-12 text-sm text-bo-ink-muted font-sans">
                <p>成分の組み合わせ情報はまだありません</p>
              </div>
            ) : (
              <>
                {recommendedCombos.length > 0 && (
                  <div className="mb-5">
                    <h3 className="font-bold text-sm text-bo-ink mb-1.5 flex items-center gap-2 font-sans">
                      <span className="w-5 h-5 rounded-full bg-bo-accent-soft text-bo-accent flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      相乗効果
                      <span className="text-xs font-normal text-bo-ink-muted">
                        ({recommendedCombos.length}件)
                      </span>
                    </h3>
                    <p className="text-xs text-bo-ink-muted mb-3 font-sans">
                      成分同士でより良いはたらきが期待できる組み合わせ
                    </p>
                    <div className="space-y-2.5">
                      {comboWithSources
                        .filter((c) => c.combo.type === "recommended")
                        .map((item, i) => (
                          <CombinationCard
                            key={`r-${i}`}
                            combo={item.combo}
                            ingredientProducts={item.sources}
                          />
                        ))}
                    </div>
                  </div>
                )}
                {cautionCombos.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm text-bo-ink mb-3 flex items-center gap-2 font-sans">
                      <AlertIcon size={16} color="#F59E0B" />
                      注意が必要な組み合わせ
                      <span className="text-xs font-normal text-bo-ink-muted">
                        ({cautionCombos.length}件)
                      </span>
                    </h3>
                    <div className="space-y-2.5">
                      {comboWithSources
                        .filter((c) => c.combo.type === "note")
                        .map((item, i) => (
                          <CombinationCard
                            key={`n-${i}`}
                            combo={item.combo}
                            ingredientProducts={item.sources}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Ingredients tab */}
        {tab === "ingredients" && (
          <div className="animate-fade-up space-y-2.5">
            {ACTIVE_CATEGORIES.map((cat) => {
              const ings: { id: string; nameJa: string }[] = [];
              const seen = new Set<string>();
              deckProducts.forEach((p) => {
                p.ingredients.forEach((pi) => {
                  const ing = getIngredientById(pi.ingredientId);
                  if (
                    ing?.activeIngredient &&
                    ing.categories.includes(cat.key) &&
                    !seen.has(ing.id)
                  ) {
                    seen.add(ing.id);
                    ings.push({ id: ing.id, nameJa: ing.nameJa });
                  }
                });
              });
              if (ings.length === 0) return null;
              return (
                <div
                  key={cat.key}
                  className="w-full rounded-r2 p-4 shadow-bo1"
                  style={{
                    background: cat.color + "0A",
                    border: `1px solid ${cat.color}20`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span style={{ color: cat.color }}><ActiveCategoryIcon category={cat.key} size={16} /></span>
                    <span className="text-sm font-bold font-sans" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-bo-ink-muted font-sans">({ings.length}種)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ings.map((ing) => (
                      <Link
                        key={ing.id}
                        href={`/ingredient/${ing.id}`}
                        className="text-xs px-2.5 py-1 rounded-full no-underline font-sans font-medium"
                        style={{
                          background: cat.color + "20",
                          color: cat.color,
                        }}
                      >
                        {ing.nameJa}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
