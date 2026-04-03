"use client";

import { Ingredient } from "@/types";
import { RARITY } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import Badge from "./Badge";

interface DiscoveryModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
}

export default function DiscoveryModal({ ingredients, onClose }: DiscoveryModalProps) {
  if (ingredients.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-sm"
        style={{ boxShadow: "0 8px 40px rgba(249,168,192,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🎉</div>
          <h3 className="font-bold text-xl" style={{ color: "#2D2D2D" }}>
            新しい成分を発見！
          </h3>
          <p className="text-sm mt-1" style={{ color: "#9B9B9B" }}>
            {ingredients.length}種類が図鑑に追加されました ✨
          </p>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {ingredients.map((ing) => {
            const rarityInfo = RARITY[ing.rarity];
            return (
              <div
                key={ing.id}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${ing.color}12, ${ing.color}06)`,
                  border: `1px solid ${ing.color}20`,
                }}
              >
                <span className="text-2xl">{rarityInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{ing.nameJa}</div>
                  <div className="text-xs" style={{ color: "#9B9B9B" }}>{ing.nameInci}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {ing.categories.map((cat) => {
                      const category = getCategoryByKey(cat);
                      return category ? (
                        <span
                          key={cat}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: category.color + "20", color: category.color }}
                        >
                          {category.icon} {category.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <Badge rarity={ing.rarity} size="sm" />
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 text-white rounded-2xl font-bold"
          style={{ background: "linear-gradient(135deg, #5BBFAD, #F9A8C0)" }}
        >
          やったー！🌸
        </button>
      </div>
    </div>
  );
}
