"use client";

import { useState } from "react";
import Link from "next/link";
import { Ingredient, Combination, ProductGenre } from "@/types";
import { RARITY } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import { getGenreByKey } from "@/lib/productGenres";
import Badge from "@/components/ui/Badge";
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

  // Show all ingredients in one list initially
  const showGrouped = foundIngredients.length > 8;

  return (
    <div className="space-y-4 pb-24">
      {/* Product header card */}
      <div
        className="bg-white rounded-2xl p-4 animate-float-up"
        style={{ border: "1px solid #F5E6EF", boxShadow: "0 2px 8px rgba(249,168,192,0.08)" }}
      >
        <div className="flex items-center gap-3">
          {imagePreview ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
            >
              {genre?.icon || "📦"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: "#2D2D2D" }}>{productName}</div>
            <div className="text-xs truncate" style={{ color: "#9B9B9B" }}>{brand}</div>
          </div>
          {genre && (
            <span
              className="text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0"
              style={{ background: genre.color + "18", color: genre.color }}
            >
              {genre.icon} {genre.label}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-center gap-4 mt-3 pt-3 text-xs font-medium"
          style={{ borderTop: "1px solid #F5F5F5", color: "#9B9B9B" }}
        >
          <span style={{ color: "#5BBFAD" }}>検出 {foundIngredients.length}種</span>
          {unknownIngredients.length > 0 && (
            <span>未登録 {unknownIngredients.length}種</span>
          )}
          {combinations.length > 0 && (
            <span style={{ color: "#F9A8C0" }}>組み合わせ {combinations.length}件</span>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
          <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#5BBFAD" }} />
          検出成分
        </h3>

        {showGrouped ? (
          /* Category-grouped collapsible sections */
          <div className="space-y-2">
            {Array.from(grouped.entries()).map(([catKey, items]) => {
              const cat = getCategoryByKey(catKey);
              const isOpen = expandedCategories.has(catKey);
              return (
                <div key={catKey}>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: cat ? cat.color + "10" : "#F9F9F9" }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat?.icon || "📋"}</span>
                      <span className="font-bold text-xs" style={{ color: cat?.color || "#2D2D2D" }}>
                        {cat?.label || "その他"} ({items.length})
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "#BDBDBD" }}>{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-1.5 mt-1.5">
                      {items.map(({ ingredient, orderIndex }, idx) => (
                        <IngredientRow
                          key={ingredient.id}
                          ingredient={ingredient}
                          orderIndex={orderIndex}
                          delay={Math.min(idx, 10) * 50}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat list for small results */
          <div className="space-y-1.5">
            {foundIngredients.map(({ ingredient, orderIndex }, idx) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                orderIndex={orderIndex}
                delay={Math.min(idx, 10) * 50}
              />
            ))}
          </div>
        )}

        {foundIngredients.length === 0 && (
          <div
            className="text-center py-8 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.7)" }}
          >
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm" style={{ color: "#9B9B9B" }}>成分が検出されませんでした</p>
          </div>
        )}
      </div>

      {/* Unknown ingredients */}
      {unknownIngredients.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnknown(!showUnknown)}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "#9B9B9B" }}
          >
            <span>未登録成分（{unknownIngredients.length}種）</span>
            <span>{showUnknown ? "▲" : "▼"}</span>
          </button>
          {showUnknown && (
            <div className="mt-2 rounded-xl p-3 text-xs" style={{ background: "#F9F9F9", color: "#9B9B9B" }}>
              {unknownIngredients.join("、")}
            </div>
          )}
        </div>
      )}

      {/* Combinations */}
      {combinations.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
            <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#F9A8C0" }} />
            組み合わせ情報
          </h3>
          <div className="space-y-2">
            {combinations.map((combo, i) => {
              const isGood = combo.type === "recommended";
              return (
                <div
                  key={i}
                  className="rounded-2xl p-3.5 flex gap-3"
                  style={{
                    background: "#fff",
                    borderLeft: `4px solid ${isGood ? "#5BBFAD" : "#F48C8C"}`,
                    border: `1px solid ${isGood ? "#5BBFAD20" : "#F48C8C20"}`,
                    borderLeftWidth: 4,
                  }}
                >
                  <span className="text-lg shrink-0">{isGood ? "📚" : "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{combo.label}</div>
                    <p className="text-xs mt-1" style={{ color: "#9B9B9B" }}>{combo.desc}</p>
                    <p className="text-[10px] mt-1" style={{ color: "#BDBDBD" }}>出典: {combo.source}</p>
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
        <div
          className="fixed left-0 right-0 z-40"
          style={{
            bottom: 0,
            padding: "16px 20px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom) + 56px)",
            background: "linear-gradient(to top, white 60%, rgba(255,255,255,0))",
          }}
        >
          <button
            onClick={handleSave}
            disabled={saved}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300"
            style={
              saved
                ? { background: "#E8FAF8", color: "#5BBFAD" }
                : { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff", boxShadow: "0 4px 16px rgba(91,191,173,0.35)" }
            }
          >
            {saved ? (
              <span className="animate-check-pop inline-block">✓ 履歴に保存しました</span>
            ) : (
              "✨ 履歴に保存する"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function IngredientRow({ ingredient, orderIndex, delay }: { ingredient: Ingredient; orderIndex: number; delay: number }) {
  return (
    <Link
      href={`/ingredient/${ingredient.id}`}
      className="flex items-center gap-3 bg-white rounded-2xl p-3 animate-stagger-in"
      style={{
        border: "1px solid #F5E6EF",
        boxShadow: "0 1px 4px rgba(249,168,192,0.06)",
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <span className="text-lg">{RARITY[ingredient.rarity].icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{ingredient.nameJa}</span>
          <Badge rarity={ingredient.rarity} size="sm" />
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9B9B9B" }}>{ingredient.nameInci}</div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {ingredient.categories.map((cat) => {
            const c = getCategoryByKey(cat);
            return c ? (
              <span
                key={cat}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: c.color + "18", color: c.color }}
              >
                {c.icon} {c.label}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <span className="text-[10px] font-medium shrink-0" style={{ color: "#BDBDBD" }}>#{orderIndex + 1}</span>
    </Link>
  );
}
