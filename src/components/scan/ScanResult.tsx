"use client";

import { useState } from "react";
import Link from "next/link";
import { Ingredient, Combination } from "@/types";
import { RARITY } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import Badge from "@/components/ui/Badge";
import Disclaimer from "@/components/ui/Disclaimer";

interface ScanResultProps {
  productName: string;
  brand: string;
  productType: string;
  foundIngredients: { ingredient: Ingredient; orderIndex: number }[];
  unknownIngredients: string[];
  combinations: Combination[];
  onSave: () => void;
  saved: boolean;
}

export default function ScanResult({
  foundIngredients,
  unknownIngredients,
  combinations,
  onSave,
  saved,
}: ScanResultProps) {
  const [showUnknown, setShowUnknown] = useState(false);

  return (
    <div className="space-y-4">
      {/* Found ingredients */}
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
          <span className="w-1 h-4 rounded-full inline-block" style={{ background: "#5BBFAD" }} />
          検出成分（{foundIngredients.length}種）
        </h3>
        <div className="space-y-2">
          {foundIngredients.map(({ ingredient, orderIndex }) => (
            <Link
              key={ingredient.id}
              href={`/ingredient/${ingredient.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm"
              style={{ border: "1px solid #F5E6EF" }}
            >
              <span className="text-xl">{RARITY[ingredient.rarity].icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{ingredient.nameJa}</span>
                  <Badge rarity={ingredient.rarity} size="sm" />
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{ingredient.nameInci}</div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {ingredient.categories.map((cat) => {
                    const c = getCategoryByKey(cat);
                    return c ? (
                      <span
                        key={cat}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: c.color + "20", color: c.color }}
                      >
                        {c.icon} {c.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: "#BDBDBD" }}>
                #{orderIndex + 1}
              </span>
            </Link>
          ))}

          {foundIngredients.length === 0 && (
            <div
              className="text-center py-8 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.7)" }}
            >
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm" style={{ color: "#9B9B9B" }}>
                成分が検出されませんでした
              </p>
            </div>
          )}
        </div>
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
            {combinations.map((combo, i) => (
              <div
                key={i}
                className="rounded-2xl p-3.5"
                style={
                  combo.type === "recommended"
                    ? { background: "#E8FAF8", border: "1px solid #5BBFAD30" }
                    : { background: "#FFF3F3", border: "1px solid #F48C8C30" }
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{combo.type === "recommended" ? "📚" : "📋"}</span>
                  <span className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{combo.label}</span>
                </div>
                <p className="text-xs" style={{ color: "#9B9B9B" }}>{combo.desc}</p>
                <p className="text-xs mt-1" style={{ color: "#BDBDBD" }}>出典: {combo.source}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saved}
        className="w-full py-3.5 rounded-2xl font-bold text-sm"
        style={
          saved
            ? { background: "#F2F2F2", color: "#9B9B9B" }
            : { background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)", color: "#fff", boxShadow: "0 4px 14px rgba(91,191,173,0.3)" }
        }
      >
        {saved ? "✓ 履歴に保存済み" : "✨ 履歴に保存する"}
      </button>

      <Disclaimer />
    </div>
  );
}
