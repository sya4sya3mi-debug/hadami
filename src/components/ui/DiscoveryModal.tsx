"use client";

import { Ingredient } from "@/types";
import { RARITY, getIngredientCategoryInfo } from "@/lib/ingredients";
import Badge, { StarIcon } from "./Badge";
import { ActiveCategoryIcon } from "./CosmeticIcons";

interface DiscoveryModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
}

const RARITY_ORDER: Record<string, number> = { legendary: 0, rare: 1, uncommon: 2, common: 3 };

export default function DiscoveryModal({ ingredients, onClose }: DiscoveryModalProps) {
  if (ingredients.length === 0) return null;

  const sorted = [...ingredients].sort(
    (a, b) => (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99)
  );

  const hasLegendary = sorted.some((i) => i.rarity === "legendary");
  const hasRare = sorted.some((i) => i.rarity === "rare");
  const showRarityHeader = hasLegendary || hasRare;
  const headerRarity = hasLegendary ? RARITY.legendary : RARITY.rare;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={onClose}>
      {/* Legendary burst overlay */}
      {hasLegendary && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-40 h-40 rounded-full animate-legendary-burst"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0.1) 40%, transparent 70%)" }}
          />
        </div>
      )}

      <div
        className="bg-white rounded-3xl p-6 w-full max-w-sm relative"
        style={{ boxShadow: hasLegendary
          ? "0 8px 40px rgba(245,158,11,0.4)"
          : hasRare
            ? "0 8px 40px rgba(124,106,232,0.3)"
            : "0 8px 40px rgba(249,168,192,0.3)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="mb-2 flex justify-center">
            {showRarityHeader ? (
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2"
                style={{ background: `${headerRarity.color}15` }}
              >
                {Array.from({ length: headerRarity.star }).map((_, index) => (
                  <StarIcon
                    key={`header-star-${index}`}
                    color={headerRarity.color}
                    size={hasLegendary ? 22 : 20}
                  />
                ))}
              </div>
            ) : (
              <div className="text-5xl">🎉</div>
            )}
          </div>
          <h3 className="font-bold text-xl" style={{ color: "#2D2D2D" }}>
            {hasLegendary ? (
              <span className="animate-shimmer">伝説の成分を発見！</span>
            ) : hasRare ? (
              "レアな成分を発見！"
            ) : (
              "新しい成分を発見！"
            )}
          </h3>
          <p className="text-sm mt-1" style={{ color: "#9B9B9B" }}>
            {ingredients.length}種類が図鑑に追加されました
          </p>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {sorted.map((ing, index) => {
            const rarityInfo = RARITY[ing.rarity];
            const animClass =
              ing.rarity === "legendary" ? "animate-golden-glow" :
              ing.rarity === "rare" ? "animate-sparkle" : "";

            return (
              <div
                key={ing.id}
                className={`flex items-center gap-3 p-3 rounded-2xl animate-float-up ${animClass}`}
                style={{
                  background: `linear-gradient(135deg, ${ing.color}12, ${ing.color}06)`,
                  border: `1px solid ${ing.color}20`,
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "both",
                }}
              >
                <span className="text-2xl">{rarityInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{ing.nameJa}</div>
                  <div className="text-xs" style={{ color: "#9B9B9B" }}>{ing.nameInci}</div>
                  {(() => {
                    const c = getIngredientCategoryInfo(ing);
                    return c ? (
                      <div className="flex gap-1 mt-1">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: c.color + "20", color: c.color }}
                        >
                          <ActiveCategoryIcon category={c.key} size={11} />
                          {c.label}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <Badge rarity={ing.rarity} size="sm" />
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3.5 text-white rounded-2xl font-bold text-sm border-none cursor-pointer pressable font-sans"
          style={{
            background: hasLegendary
              ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
              : "#3A8F7A",
          }}
        >
          {hasLegendary ? "コレクションに追加" : "OK"}
        </button>
      </div>
    </div>
  );
}
