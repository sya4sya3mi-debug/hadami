"use client";

import { Combination } from "@/types";
import { getIngredientByName, getIngredientCategoryInfo } from "@/lib/ingredients";
import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";

interface Props {
  combo: Combination;
  ingredientProducts: [string[], string[]];
}

function getIngredientCatInfo(nameJa: string) {
  const ing = getIngredientByName(nameJa);
  if (!ing) return null;
  return getIngredientCategoryInfo(ing);
}

function IngredientTag({ name, products }: { name: string; products: string[] }) {
  const cat = getIngredientCatInfo(name);
  const bg = cat ? `${cat.color}1A` : "rgba(200,200,200,0.15)";
  const color = cat ? cat.color : "#9E9E9E";

  return (
    <div className="flex-1 min-w-0">
      <div
        className="px-2.5 py-1.5 rounded-xl text-center"
        style={{ background: bg, border: `1px solid ${color}30` }}
      >
        {cat && (
          <div
            className="inline-flex items-center gap-1 text-[10px] mb-0.5 font-sans"
            style={{ color }}
          >
            <ActiveCategoryIcon category={cat.key} size={11} />
            {cat.label}
          </div>
        )}
        <div className="text-xs font-bold truncate text-bo-ink font-sans">{name}</div>
      </div>
      {products.length > 0 && (
        <div className="text-[10px] text-center mt-1 px-1 leading-tight text-bo-ink-muted font-sans">
          {products.map((product, index) => (
            <span key={index}>
              {index > 0 && "、"}
              {product}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CombinationCard({ combo, ingredientProducts }: Props) {
  const isRecommended = combo.type === "recommended";

  return (
    <div
      className={`rounded-r2 p-4 ${
        isRecommended
          ? "bg-white border border-bo-parchment shadow-bo1"
          : "bg-gradient-to-br from-[#FFF8F0] to-bo-danger-bg border border-bo-danger/25"
      }`}
    >
      <div className="flex items-start gap-2 mb-3">
        <IngredientTag name={combo.pair[0]} products={ingredientProducts[0]} />

        <div className="flex items-center justify-center pt-3 shrink-0">
          <span
            className={`text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center ${
              isRecommended
                ? "bg-bo-accent/15 text-bo-accent"
                : "bg-bo-danger/15 text-bo-danger"
            }`}
          >
            {isRecommended ? "+" : "!"}
          </span>
        </div>

        <IngredientTag name={combo.pair[1]} products={ingredientProducts[1]} />
      </div>

      <div
        className={`text-xs font-bold mb-0.5 font-sans ${
          isRecommended ? "text-bo-ink" : "text-bo-danger"
        }`}
      >
        {combo.label}
      </div>
      <p className="text-xs leading-relaxed text-bo-ink-muted font-sans">{combo.desc}</p>
    </div>
  );
}
