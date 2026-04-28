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
    <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--hd-sans)", fontSize: 13, color: "var(--hd-ink-40)" }}>
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

  const allIngredientIds = useMemo(
    () => deckProducts.flatMap((d) => d.ingredients.map((pi) => pi.ingredientId)),
    [deckProducts]
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="ルーティン分析" height="calc(100dvh - 2rem)">
      <div style={{ paddingBottom: 24 }}>

        {/* Tab bar — sharp inverted, same style as AM/PM segmented */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
            border: "1px solid var(--hd-ink)",
            marginBottom: 20,
          }}
        >
          {tabs.map((t, i) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "12px 0",
                  cursor: "pointer",
                  background: on ? "var(--hd-ink)" : "transparent",
                  color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                  border: "none",
                  borderLeft: i > 0 ? "1px solid var(--hd-ink)" : "none",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {t.label}
                {t.key === "combos" && combinations.length > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.7 }}>({combinations.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Coverage tab */}
        {tab === "coverage" && (
          <div>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { value: `${coveredCategories}/${ACTIVE_CATEGORIES.length}`, label: "効果カバー", color: "var(--hd-moss)" },
                { value: `${totalIngredients}`, label: "成分数", color: "#D4A853" },
                { value: `${deckProducts.length}`, label: "アイテム", color: "#6B4A8A" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    textAlign: "center",
                    padding: "14px 8px",
                    background: "var(--hd-bg)",
                    border: "1px solid var(--hd-hair)",
                  }}
                >
                  <div
                    className="hd-serif"
                    style={{ fontSize: 20, fontWeight: 900, color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-mono)",
                      fontSize: 9,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--hd-ink-40)",
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Concern coverage */}
            <div
              style={{
                background: "var(--hd-bg)",
                border: "1px solid var(--hd-hair)",
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--hd-ink)",
                  marginBottom: 16,
                }}
              >
                効能別のカバー
              </div>
              {SKIN_CONCERNS.map((concern) => {
                const coveredKeys = concern.keyIngredients.filter((ki) =>
                  allIngredientIds.includes(ki.id)
                );
                const covered = coveredKeys.length > 0;
                const pct = (coveredKeys.length / concern.keyIngredients.length) * 100;
                return (
                  <div key={concern.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: "var(--hd-sans)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: covered ? "var(--hd-ink)" : "var(--hd-ink-40)",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {covered
                          ? <CheckCircleIcon size={12} color="var(--hd-moss)" />
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        }
                        <SkinConcernIcon concern={concern.label} size={12} />
                        {concern.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--hd-mono)",
                          fontSize: 10,
                          color: "var(--hd-ink-40)",
                        }}
                      >
                        {covered
                          ? `${coveredKeys.length}/${concern.keyIngredients.length}成分`
                          : "未カバー"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 2,
                        background: "var(--hd-hair)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${pct}%`,
                          background: concern.color,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar chart */}
            <div
              style={{
                background: "var(--hd-bg)",
                border: "1px solid var(--hd-hair)",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--hd-ink)",
                  marginBottom: 8,
                }}
              >
                カテゴリ別レーダー
              </div>
              <CoverageChart categoryCounts={categoryCounts} />
            </div>
          </div>
        )}

        {/* Combinations tab */}
        {tab === "combos" && (
          <div>
            {combinations.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 13,
                  color: "var(--hd-ink-40)",
                }}
              >
                成分の組み合わせ情報はまだありません
              </div>
            ) : (
              <>
                {recommendedCombos.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          background: "var(--hd-moss)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                      <span
                        className="hd-serif"
                        style={{ fontSize: 14, color: "var(--hd-ink)" }}
                      >
                        相乗効果
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--hd-mono)",
                          fontSize: 10,
                          color: "var(--hd-ink-40)",
                        }}
                      >
                        ({recommendedCombos.length}件)
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--hd-sans)",
                        fontSize: 11,
                        color: "var(--hd-ink-40)",
                        marginBottom: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      成分同士でより良いはたらきが期待できる組み合わせ
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <AlertIcon size={16} color="#D4A853" />
                      <span
                        className="hd-serif"
                        style={{ fontSize: 14, color: "var(--hd-ink)" }}
                      >
                        注意が必要な組み合わせ
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--hd-mono)",
                          fontSize: 10,
                          color: "var(--hd-ink-40)",
                        }}
                      >
                        ({cautionCombos.length}件)
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  style={{
                    padding: 16,
                    background: "var(--hd-bg)",
                    border: "1px solid var(--hd-hair)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ color: "var(--hd-ink-60)" }}>
                      <ActiveCategoryIcon category={cat.key} size={14} />
                    </span>
                    <span
                      className="hd-serif"
                      style={{ fontSize: 14, color: "var(--hd-ink)", letterSpacing: "-0.01em" }}
                    >
                      {cat.label}
                    </span>
                    <span
                      className="hd-mono hd-caps"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        color: "var(--hd-ink-40)",
                      }}
                    >
                      {ings.length} items
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ings.map((ing) => (
                      <Link
                        key={ing.id}
                        href={`/ingredient/${ing.id}`}
                        className="hd-serif"
                        style={{
                          fontSize: 12,
                          padding: "5px 10px",
                          textDecoration: "none",
                          background: "transparent",
                          color: "var(--hd-ink)",
                          border: "1px solid var(--hd-line)",
                          letterSpacing: "-0.01em",
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
