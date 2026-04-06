"use client";

import { useState } from "react";
import Link from "next/link";
import { Ingredient, Combination, ProductGenre } from "@/types";
import { RARITY } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import { getGenreByKey } from "@/lib/productGenres";
import Badge, { StarIcon } from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";

interface ScanResultProps {
  productName: string;
  brand: string;
  productType: ProductGenre;
  foundIngredients: { ingredient: Ingredient; orderIndex: number }[];
  unknownIngredients: string[];
  combinations: Combination[];
  onSave?: () => void;
  saved: boolean;
  imagePreview?: string;
  newDiscoveryIds?: Set<string>;
}

export default function ScanResult({
  productName,
  brand,
  productType,
  foundIngredients,
  unknownIngredients,
  combinations,
  onSave,
  saved,
  imagePreview,
  newDiscoveryIds,
}: ScanResultProps) {
  const [showUnknown, setShowUnknown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["_all"]));

  const genre = getGenreByKey(productType);

  // Group ingredients by first category
  const grouped = new Map<string, { ingredient: Ingredient; orderIndex: number }[]>();
  for (const item of foundIngredients) {
    const cat = item.ingredient.categories[0] || "_uncategorized";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    if (!onSave || saved) return;
    onSave();
  };

  const showGrouped = foundIngredients.length > 8;

  return (
    <div className="space-y-4 pb-24 animate-fade-up">
      {/* Product header card */}
      <div className="bg-white rounded-r3 overflow-hidden border border-bo-parchment shadow-bo2">
        <div className="h-[3px] bg-gradient-to-r from-bo-accent via-bo-safe to-[#6BC4A0]" />
        <div className="p-5 px-[18px]">
          <div className="flex items-center gap-3">
            {imagePreview ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
                {genre?.icon || "📦"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-base font-serif truncate text-bo-ink">{productName}</div>
              <div className="text-[11px] truncate text-bo-ink-muted font-sans tracking-[0.08em] uppercase">{brand}</div>
            </div>
            {genre && (
              <span
                className="text-[10px] px-2.5 py-1 rounded-md font-semibold shrink-0 font-sans"
                style={{ background: genre.color + "18", color: genre.color }}
              >
                {genre.icon} {genre.label}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 text-xs font-medium font-sans border-t border-bo-parchment text-bo-ink-muted">
            <span className="text-bo-accent font-bold">検出 {foundIngredients.length}種</span>
            {unknownIngredients.length > 0 && (
              <span>未登録 {unknownIngredients.length}種</span>
            )}
            {combinations.length > 0 && (
              <span className="text-bo-accent">組み合わせ {combinations.length}件</span>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink font-sans">
          <span className="w-1 h-4 rounded-full inline-block bg-bo-accent" />
          検出成分
        </h3>

        {showGrouped ? (
          <div className="space-y-2">
            {Array.from(grouped.entries()).map(([catKey, items]) => {
              const cat = getCategoryByKey(catKey);
              const isOpen = expandedCategories.has(catKey);
              return (
                <div key={catKey}>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: cat ? cat.color + "10" : "#F4F9F6" }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon || "📋"}</span>
                      <span className="font-bold text-xs font-sans" style={{ color: cat?.color || "#1B2620" }}>
                        {cat?.label || "その他"} ({items.length})
                      </span>
                    </div>
                    <span className="text-xs text-bo-ink-faint">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-1.5 mt-1.5">
                      {items.map(({ ingredient, orderIndex }, idx) => (
                        <IngredientRow
                          key={ingredient.id}
                          ingredient={ingredient}
                          orderIndex={orderIndex}
                          delay={Math.min(idx, 10) * 50}
                          isNew={newDiscoveryIds?.has(ingredient.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {foundIngredients.map(({ ingredient, orderIndex }, idx) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                orderIndex={orderIndex}
                delay={Math.min(idx, 10) * 50}
                isNew={newDiscoveryIds?.has(ingredient.id)}
              />
            ))}
          </div>
        )}

        {foundIngredients.length === 0 && (
          <div className="text-center py-8 rounded-r2 bg-white/70">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-bo-ink-muted font-sans">成分が検出されませんでした</p>
          </div>
        )}
      </div>

      {/* Unknown ingredients */}
      {unknownIngredients.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnknown(!showUnknown)}
            className="flex items-center gap-1.5 text-sm text-bo-ink-muted font-sans"
          >
            <span>未登録成分（{unknownIngredients.length}種）</span>
            <span>{showUnknown ? "▲" : "▼"}</span>
          </button>
          {showUnknown && (
            <div className="mt-2 rounded-xl p-3 text-xs bg-bo-cream text-bo-ink-muted font-sans">
              {unknownIngredients.join("、")}
            </div>
          )}
        </div>
      )}

      {/* Combinations */}
      {combinations.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-bo-ink font-sans">
            <span className="w-1 h-4 rounded-full inline-block bg-bo-accent" />
            組み合わせ情報
          </h3>
          <div className="space-y-2">
            {combinations.map((combo, i) => {
              const isGood = combo.type === "recommended";
              return (
                <div
                  key={i}
                  className={`rounded-r2 p-3.5 flex gap-3 bg-white border ${
                    isGood
                      ? "border-bo-safe/20 border-l-[4px] border-l-bo-safe"
                      : "border-bo-danger/20 border-l-[4px] border-l-bo-danger"
                  }`}
                >
                  <span className="text-lg shrink-0">{isGood ? "📚" : "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-bo-ink font-sans">{combo.label}</div>
                    <p className="text-xs mt-1 text-bo-ink-muted font-sans">{combo.desc}</p>
                    <p className="text-[10px] mt-1 text-bo-ink-faint font-sans">出典: {combo.source}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Disclaimer />

      {/* Sticky save bar */}
      {onSave && (
        <div className="fixed left-0 right-0 z-40 bottom-0 px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom)+56px)] bg-gradient-to-t from-white via-white/90 to-transparent">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-r2 font-bold text-sm font-sans transition-all duration-300 ${
              saved
                ? "bg-bo-accent-soft text-bo-accent"
                : "bg-gradient-to-br from-bo-accent to-bo-accent-dark text-white shadow-bo-accent"
            }`}
          >
            {saved ? (
              <span className="animate-check-pop inline-block">✓ Myコスメに保存しました</span>
            ) : (
              "✨ Myコスメに保存する"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function IngredientRow({ ingredient, orderIndex, delay, isNew }: { ingredient: Ingredient; orderIndex: number; delay: number; isNew?: boolean }) {
  return (
    <Link
      href={`/ingredient/${ingredient.id}`}
      className={`flex items-center gap-3 rounded-r1 p-3 animate-stagger-in ${
        isNew
          ? "border-2 border-bo-accent shadow-[0_2px_12px_rgba(58,143,122,0.18)] bg-bo-accent-soft/30"
          : "border border-bo-parchment shadow-bo1 bg-white"
      }`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <span className="inline-flex items-center gap-px">
        {Array.from({ length: RARITY[ingredient.rarity].star }).map((_, i) => (
          <StarIcon key={i} color={RARITY[ingredient.rarity].color} size={14} />
        ))}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-bo-ink font-sans">{ingredient.nameJa}</span>
          <Badge rarity={ingredient.rarity} size="sm" />
          {isNew && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-bo-accent text-white">
              NEW
            </span>
          )}
        </div>
        <div className="text-[11px] mt-0.5 text-bo-ink-muted font-sans">{ingredient.nameInci}</div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {ingredient.categories.map((cat) => {
            const c = getCategoryByKey(cat);
            return c ? (
              <span
                key={cat}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium font-sans"
                style={{ background: c.color + "18", color: c.color }}
              >
                {c.icon} {c.label}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <span className="text-[10px] font-medium shrink-0 text-bo-ink-faint font-sans">#{orderIndex + 1}</span>
    </Link>
  );
}
