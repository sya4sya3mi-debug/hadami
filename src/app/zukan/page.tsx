"use client";

import "@/styles/hadami-tokens.css";
import { useState, useMemo, useCallback } from "react";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { useRouter } from "next/navigation";
import { useZukanStore } from "@/stores/useZukanStore";
import { useProductStore } from "@/stores/useProductStore";
import {
  getActiveIngredients,
  getActiveIngredientCount,
  ACTIVE_CATEGORIES,
  getActiveByCategory,
  getActiveCategoryTotal,
} from "@/lib/ingredients";
import { SKIN_CONCERNS } from "@/lib/concerns";
import { RarityKey, Product, CategoryKey } from "@/types";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import Disclaimer from "@/components/ui/Disclaimer";
import TargetedRakutenSection from "@/components/recommendations/TargetedRakutenSection";
import { ActiveCategoryIcon, SkinConcernIcon } from "@/components/ui/CosmeticIcons";

const RARITY_ORDER: RarityKey[] = ["legendary", "rare", "uncommon", "common"];

const RARITY_VIS: Record<
  RarityKey,
  { star: number; color: string; bg: string; border: string }
> = {
  common:    { star: 1, color: "#9CA3AF", bg: "rgba(156,163,175,0.07)", border: "rgba(156,163,175,0.15)" },
  uncommon:  { star: 2, color: "#4CAF50", bg: "rgba(76,175,80,0.07)",   border: "rgba(76,175,80,0.15)" },
  rare:      { star: 3, color: "#E91E8C", bg: "rgba(233,30,140,0.07)",  border: "rgba(233,30,140,0.18)" },
  legendary: { star: 4, color: "#F59E0B", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.22)" },
};

/* ═══════════════════════════════════════
   Tab 1: 効果カテゴリ別
   ═══════════════════════════════════════ */
function CategoryExplorer({ discoveredIds }: { discoveredIds: string[] }) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<CategoryKey>("brightening");
  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);

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
  const categoryTargets = useMemo(
    () => catIngredients.filter((ing) => !discoveredSet.has(ing.id)).slice(0, 2),
    [catIngredients, discoveredSet]
  );

  return (
    <div>
      {/* Category chips */}
      <div
        style={{
          display: "flex", gap: 8, overflowX: "auto",
          padding: "16px 20px", WebkitOverflowScrolling: "touch",
        }}
      >
        {catStats.map((cat) => {
          const active = selectedCat === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                background: active ? "var(--hd-ink)" : "transparent",
                color: active ? "var(--hd-bg)" : "var(--hd-ink)",
                border: active ? "none" : "1px solid var(--hd-line)",
                cursor: "pointer",
              }}
            >
              <ActiveCategoryIcon category={cat.key} size={13} />
              <div style={{ textAlign: "left" }}>
                <div className="hd-serif" style={{ fontSize: 13, lineHeight: 1, whiteSpace: "nowrap" }}>{cat.label}</div>
                <div className="hd-mono" style={{ fontSize: 9, opacity: 0.7, marginTop: 3, letterSpacing: "0.1em" }}>
                  {cat.disc}/{cat.total}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected category detail */}
      {currentCat && (
        <div key={currentCat.key} style={{ padding: "0 20px 8px" }}>
          {/* Category header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 0 14px",
              borderBottom: "1px solid var(--hd-ink)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  color: currentCat.color,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ActiveCategoryIcon category={currentCat.key} size={20} />
              </span>
              <div>
                <div
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-ink-40)" }}
                >
                  {currentCat.disc} / {currentCat.total} 発見済み
                </div>
                <div
                  className="hd-serif"
                  style={{ fontSize: 18, lineHeight: 1.1, marginTop: 3, letterSpacing: "-0.01em" }}
                >
                  {currentCat.label}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 56,
                  height: 1,
                  background: "var(--hd-hair)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${currentCat.pct}%`,
                    background: "var(--hd-ink)",
                    transition: "width 600ms ease-out",
                  }}
                />
              </div>
              <span
                className="hd-mono"
                style={{
                  fontSize: 13,
                  color: "var(--hd-ink)",
                  letterSpacing: "0.02em",
                }}
              >
                {currentCat.pct}
                <span style={{ fontSize: 9, opacity: 0.55, marginLeft: 1 }}>%</span>
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <TargetedRakutenSection
              enabled={categoryTargets.length > 0}
              icon="PR"
              title={`${currentCat.label}で次に集めたい成分から探す`}
              description="まだ出会っていない成分を含みやすい商品だけを、楽天から先回りで拾えるようにしました。"
              keywords={categoryTargets.map((ingredient) => `${ingredient.nameJa} 配合 スキンケア`)}
              ingredientHints={categoryTargets.map((ingredient) => ingredient.nameJa)}
            />
          </div>

          {/* Ingredient list */}
          <div className="hd-stagger">
            {catIngredients.map((ing, i) => {
              const r = RARITY_VIS[ing.rarity];
              const found = discoveredSet.has(ing.id);
              return (
                <div
                  key={ing.id}
                  onClick={() => { if (found) router.push(`/ingredient/${ing.id}`); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 0",
                    borderTop: i === 0 ? "1px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                    borderBottom:
                      i === catIngredients.length - 1 ? "1px solid var(--hd-ink)" : "none",
                    cursor: found ? "pointer" : "default",
                    opacity: found ? 1 : 0.55,
                  }}
                >
                  <div
                    className="hd-mono"
                    style={{
                      width: 22,
                      fontSize: 9,
                      color: "var(--hd-ink-40)",
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="hd-serif"
                      style={{
                        fontSize: 15,
                        letterSpacing: "-0.01em",
                        color: found ? "var(--hd-ink)" : "var(--hd-ink-60)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {found ? ing.nameJa : "？？？"}
                    </div>
                    <div
                      className="hd-mono hd-caps"
                      style={{
                        color: "var(--hd-ink-40)",
                        marginTop: 3,
                      }}
                    >
                      {ing.nameInci || "—"}
                    </div>
                    {(found ? ing.note : ing.funFact) && (
                      <div
                        style={{
                          fontFamily: "var(--hd-sans)",
                          fontSize: 11,
                          marginTop: 4,
                          lineHeight: 1.5,
                          color: found ? "var(--hd-ink-60)" : "#B08D3A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {found ? ing.note : `${ing.funFact}`}
                      </div>
                    )}
                  </div>
                  <div
                    className="hd-mono"
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      color: r.color,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {"★".repeat(r.star)}
                    <span style={{ opacity: 0.25 }}>{"★".repeat(4 - r.star)}</span>
                  </div>
                  {found && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--hd-ink-40)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
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
function ConcernView({ discoveredIds, products }: { discoveredIds: string[]; products: Product[] }) {
  const router = useRouter();
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [expandedIng, setExpandedIng] = useState<string | null>(null);
  const discoveredSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);

  const getProductsWithIngredient = useCallback(
    (ingredientId: string): Product[] => {
      return products.filter((p) => p.ingredients.some((pi) => pi.ingredientId === ingredientId));
    },
    [products]
  );

  const concern = SKIN_CONCERNS.find((c) => c.label === selectedConcern);
  const concernTargets = useMemo(() => {
    if (!concern) return [];
    return [...concern.keyIngredients]
      .filter((ingredient) => !discoveredSet.has(ingredient.id))
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
      .slice(0, 2);
  }, [concern, discoveredSet]);

  if (!concern) {
    return (
      <div className="hd-stagger" style={{ padding: "16px 20px" }}>
        {SKIN_CONCERNS.map((c, i) => {
          const covered = c.keyIngredients.filter((k) => getProductsWithIngredient(k.id).length > 0).length;
          const coverPct = Math.round((covered / c.keyIngredients.length) * 100);
          const isFirst = i === 0;
          const isLast = i === SKIN_CONCERNS.length - 1;
          return (
            <button
              key={c.label}
              onClick={() => setSelectedConcern(c.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
                background: "transparent",
                borderLeft: "none",
                borderRight: "none",
                borderTop: isFirst ? "1px solid var(--hd-ink)" : "1px solid var(--hd-hair)",
                borderBottom: isLast ? "1px solid var(--hd-ink)" : "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                color: "inherit",
                borderRadius: 0,
              }}
            >
              <div
                className="hd-mono"
                style={{
                  width: 22,
                  fontSize: 9,
                  color: "var(--hd-ink-40)",
                  flexShrink: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  color: c.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SkinConcernIcon concern={c.label} size={20} strokeWidth={1.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="hd-serif"
                  style={{
                    fontSize: 16,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--hd-hair)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${coverPct}%`,
                        background: "var(--hd-ink)",
                        transition: "width 500ms ease-out",
                      }}
                    />
                  </div>
                  <span
                    className="hd-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--hd-ink-60)",
                      flexShrink: 0,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {covered} / {c.keyIngredients.length}
                  </span>
                </div>
              </div>
              <div
                className="hd-mono"
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  color: "var(--hd-ink)",
                  letterSpacing: "0.02em",
                  width: 48,
                  textAlign: "right",
                }}
              >
                {coverPct}
                <span
                  style={{
                    fontSize: 9,
                    opacity: 0.55,
                    marginLeft: 1,
                  }}
                >
                  %
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const covered = concern.keyIngredients.filter((k) => getProductsWithIngredient(k.id).length > 0).length;
  const coverPct = Math.round((covered / concern.keyIngredients.length) * 100);

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px 14px" }}>
        <button
          onClick={() => { setSelectedConcern(null); setExpandedIng(null); }}
          style={{
            width: 36, height: 36, borderRadius: 12,
            border: "1px solid var(--hd-hair)", background: "var(--hd-surface)",
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--hd-ink-60)" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span
          style={{
            width: 40, height: 40, borderRadius: 14,
            background: `${concern.color}15`, color: concern.color,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <SkinConcernIcon concern={concern.label} size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hd-serif" style={{ fontSize: 18 }}>
            {concern.label}
          </div>
          <span style={{ fontSize: 11, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
            {covered}/{concern.keyIngredients.length} カバー
          </span>
        </div>
        <div
          className="hd-serif"
          style={{
            padding: "4px 12px", borderRadius: 999,
            background: `${concern.color}15`, color: concern.color,
            fontSize: 14, fontWeight: 600,
          }}
        >
          {coverPct}%
        </div>
      </div>

      {/* Tip */}
      <div
        style={{
          margin: "0 20px 14px", padding: "12px 14px",
          borderRadius: 12, background: `${concern.color}08`,
          border: `1px solid ${concern.color}18`,
          fontSize: 12, color: "var(--hd-ink-60)",
          fontFamily: "var(--hd-sans)", lineHeight: 1.6,
        }}
      >
        💡 {concern.tip}
      </div>

      <div style={{ padding: "0 20px 8px" }}>
        <TargetedRakutenSection
          enabled={concernTargets.length > 0}
          icon="PR"
          title="この悩みで次に集めたい注目成分"
          description="未発見のキーメジャー成分から、今の悩みに寄せた商品を楽天で見つけやすくしています。"
          keywords={concernTargets.map((ingredient) => `${ingredient.name} 配合 スキンケア`)}
          ingredientHints={concernTargets.map((ingredient) => ingredient.name)}
        />
      </div>

      {/* Key Ingredients */}
      <div className="hd-stagger" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
        {concern.keyIngredients.map((ing) => {
          const r = RARITY_VIS[ing.rarity];
          const found = discoveredSet.has(ing.id);
          const matchedProducts = getProductsWithIngredient(ing.id);
          const hasProducts = matchedProducts.length > 0;
          const open = expandedIng === ing.id;

          return (
            <div
              key={ing.id}
              style={{
                borderRadius: 14, overflow: "hidden",
                background: "var(--hd-surface)",
                border: "1px solid var(--hd-hair)",
              }}
            >
              <div
                onClick={() => setExpandedIng(open ? null : ing.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                    background: found ? "var(--hd-mint-bg)" : "var(--hd-hair)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}
                >
                  {found ? "✅" : "🔒"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 15,
                      letterSpacing: "-0.01em",
                      color: found ? "var(--hd-ink)" : "var(--hd-ink-40)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {found ? ing.name : "？？？"}
                  </div>
                  <div
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink-40)",
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {"★".repeat(r.star)} · {ing.role}
                  </div>
                </div>
                {hasProducts ? (
                  <span
                    className="hd-mono hd-caps"
                    style={{
                      flexShrink: 0,
                      padding: "4px 10px",
                      color: "var(--hd-moss)",
                      border: "1px solid var(--hd-moss)",
                      background: "transparent",
                    }}
                  >
                    {matchedProducts.length}件
                  </span>
                ) : (
                  <span
                    className="hd-mono hd-caps"
                    style={{
                      flexShrink: 0,
                      color: "var(--hd-ink-40)",
                    }}
                  >
                    {found ? "未配合" : "未発見"}
                  </span>
                )}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="var(--hd-ink-40)" strokeWidth="2" strokeLinecap="round"
                  style={{
                    flexShrink: 0,
                    transform: open ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 200ms",
                  }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>

              {/* Accordion */}
              <div
                style={{
                  overflow: "hidden",
                  maxHeight: open ? 300 : 0,
                  transition: "max-height 300ms ease-in-out",
                }}
              >
                <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--hd-hair)" }}>
                  {hasProducts ? (
                    matchedProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/product/${p.id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 0",
                          borderBottom:
                            idx < matchedProducts.length - 1
                              ? "1px solid var(--hd-hair)"
                              : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="hd-mono"
                          style={{
                            width: 22,
                            fontSize: 9,
                            color: "var(--hd-ink-40)",
                            flexShrink: 0,
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="hd-mono hd-caps"
                            style={{
                              color: "var(--hd-ink-40)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.brand}
                          </div>
                          <div
                            className="hd-serif"
                            style={{
                              fontSize: 13,
                              marginTop: 2,
                              letterSpacing: "-0.01em",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </div>
                        </div>
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--hd-ink-40)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px 0", textAlign: "center" }}>
                      <button
                        onClick={() => router.push("/scan")}
                        className="hd-cta"
                        style={{
                          padding: "10px 24px", cursor: "pointer", fontSize: 12,
                          display: "inline-flex", alignItems: "center", gap: 6,
                        }}
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
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          margin: "16px 20px 0", padding: 12, borderRadius: 12,
          background: "var(--hd-surface)", border: "1px solid var(--hd-hair)",
        }}
      >
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--hd-hair)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%", borderRadius: 999, width: `${coverPct}%`,
              background: concern.color,
              transition: "width 800ms ease-out",
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          <span style={{ fontWeight: 600, color: concern.color }}>{covered}</span>
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

  const activeSet = useMemo(() => new Set(getActiveIngredients().map((i) => i.id)), []);
  const totalDisc = discoveredIds.filter((id) => activeSet.has(id)).length;
  const totalAll = getActiveIngredientCount();
  const pct = totalAll > 0 ? Math.round((totalDisc / totalAll) * 100) : 0;

  const circumference = 2 * Math.PI * 28;
  const dashLength = (pct / 100) * circumference;

  if (loading) return null;

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact" data-card="default">
        <div
          className="hd hd-page"
          style={{ minHeight: "100vh", paddingBottom: 96, background: "var(--hd-bg)" }}
        >
          <div
            style={{
              position: "sticky",
              top: "env(safe-area-inset-top, 0px)",
              zIndex: 30,
              background: "var(--hd-bg)",
              borderBottom: "1px solid var(--hd-hair)",
            }}
          >
            {/* Header — A pure */}
            <div style={{ padding: "20px 24px 18px" }}>
              <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)", marginBottom: 10 }}>
                COMPENDIUM · 成分図鑑
              </div>

              <div
                style={{
                  display: "flex", alignItems: "center", gap: 20, paddingBottom: 20,
                  borderBottom: "1px solid var(--hd-ink)",
                }}
              >
                <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
                  <svg viewBox="0 0 68 68" width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="34" cy="34" r="30" fill="none" stroke="var(--hd-hair)" strokeWidth="1.5" />
                    <circle
                      cx="34" cy="34" r="30" fill="none"
                      stroke="var(--hd-moss)" strokeWidth="1.5"
                      strokeDasharray={`${dashLength} ${circumference}`}
                      strokeLinecap="butt"
                      style={{ transition: "stroke-dasharray 1200ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="hd-serif" style={{ fontSize: 20 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>Complete</div>
                  <div className="hd-serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 3 }}>
                    {String(totalDisc).padStart(3, "0")}
                    <span style={{ color: "var(--hd-ink-40)", fontSize: 16 }}> / {totalAll}種</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs — A pure (underline) */}
            <div style={{ padding: "0 24px 14px" }}>
              <div style={{ display: "flex", gap: 28 }}>
                {[
                  { key: "category" as const, en: "BY EFFECT",  jp: "効果別" },
                  { key: "concern"  as const, en: "BY CONCERN", jp: "肌悩み" },
                ].map((t) => {
                  const on = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      style={{
                        background: "none", border: "none", padding: "0 0 10px", cursor: "pointer",
                        borderBottom: on ? "1.5px solid var(--hd-ink)" : "1.5px solid transparent",
                        color: on ? "var(--hd-ink)" : "var(--hd-ink-40)",
                        textAlign: "left",
                      }}
                    >
                      <div className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em" }}>{t.en}</div>
                      <div className="hd-serif" style={{ fontSize: 15, marginTop: 2 }}>{t.jp}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {tab === "category" && <CategoryExplorer discoveredIds={discoveredIds} />}
          {tab === "concern" && <ConcernView discoveredIds={discoveredIds} products={products} />}

          <div style={{ padding: "20px 20px 0" }}>
            <Disclaimer />
          </div>
          <ScrollToTop />
        </div>
      </div>
    </AuthGuard>
  );
}
