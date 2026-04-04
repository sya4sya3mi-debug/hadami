"use client";

import { Combination } from "@/types";
import { getIngredientByName } from "@/lib/ingredients";
import { CATEGORIES } from "@/lib/categories";

interface Props {
  combo: Combination;
  ingredientProducts: [string[], string[]];
}

function getPrimaryCategory(nameJa: string) {
  const ing = getIngredientByName(nameJa);
  if (!ing || ing.categories.length === 0) return null;
  return CATEGORIES.find((c) => c.key === ing.categories[0]) ?? null;
}

function IngredientTag({ name, products }: { name: string; products: string[] }) {
  const cat = getPrimaryCategory(name);
  const bg = cat ? `${cat.color}1A` : "rgba(200,200,200,0.15)";
  const color = cat ? cat.color : "#9B9B9B";

  return (
    <div className="flex-1 min-w-0">
      <div
        className="px-2.5 py-1.5 rounded-xl text-center"
        style={{ background: bg, border: `1px solid ${color}30` }}
      >
        {cat && (
          <div className="text-[10px] mb-0.5" style={{ color }}>
            {cat.icon} {cat.label}
          </div>
        )}
        <div className="text-xs font-bold truncate" style={{ color: "#2D2D2D" }}>
          {name}
        </div>
      </div>
      {products.length > 0 && (
        <div className="text-[10px] text-center mt-1 px-1 leading-tight" style={{ color: "#9B9B9B" }}>
          {products.map((p, i) => <span key={i}>{i > 0 && "、"}{p}</span>)}
        </div>
      )}
    </div>
  );
}

export default function CombinationCard({ combo, ingredientProducts }: Props) {
  const isRecommended = combo.type === "recommended";

  return (
    <div
      className="rounded-2xl p-4"
      style={
        isRecommended
          ? { background: "#FFFFFF", border: "1px solid #E8E8E8", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }
          : { background: "linear-gradient(135deg, #FFF8F0 0%, #FFF5F5 100%)", border: "1px solid rgba(244,140,140,0.25)" }
      }
    >
      {/* 成分ペア */}
      <div className="flex items-start gap-2 mb-3">
        <IngredientTag name={combo.pair[0]} products={ingredientProducts[0]} />

        {/* コネクター */}
        <div className="flex items-center justify-center pt-3 shrink-0">
          <span
            className="text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center"
            style={
              isRecommended
                ? { background: "rgba(91,191,173,0.15)", color: "#5BBFAD" }
                : { background: "rgba(244,140,140,0.15)", color: "#E07B7B" }
            }
          >
            {isRecommended ? "+" : "!"}
          </span>
        </div>

        <IngredientTag name={combo.pair[1]} products={ingredientProducts[1]} />
      </div>

      {/* ラベルと説明 */}
      <div
        className="text-xs font-bold mb-0.5"
        style={{ color: isRecommended ? "#2D2D2D" : "#B85050" }}
      >
        {combo.label}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "#9B9B9B" }}>
        {combo.desc}
      </p>
    </div>
  );
}
