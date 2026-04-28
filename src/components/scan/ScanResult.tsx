"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Ingredient, Combination, ProductGenre } from "@/types";
import { ACTIVE_CATEGORIES, getIngredientCategoryInfo, getIngredientCategories, isActiveIngredient } from "@/lib/ingredients";
import { getGenreByKey } from "@/lib/productGenres";
import Disclaimer from "@/components/ui/Disclaimer";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import RecommendSection from "@/components/recommendations/RecommendSection";
import { ActiveCategoryIcon, ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import BottomSheet from "@/components/scan/BottomSheet";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ShareModal from "@/components/ui/ShareModal";
import { generateScanResultShareImage } from "@/lib/generateShareImage";

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
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shareModalOpen, setShareModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shareImageBase64, setShareImageBase64] = useState<string | null>(null);

  const genre = getGenreByKey(productType);

  const activeIngredients = foundIngredients.filter((f) => isActiveIngredient(f.ingredient.id));
  const otherIngredients = foundIngredients.filter((f) => !isActiveIngredient(f.ingredient.id));

  const grouped = new Map<string, { ingredient: Ingredient; orderIndex: number }[]>();
  for (const item of activeIngredients) {
    const catKey = item.ingredient.categories[0] || "_other";
    if (!grouped.has(catKey)) grouped.set(catKey, []);
    grouped.get(catKey)!.push(item);
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (!onSave || saved || isSaving) return;
    try {
      setIsSaving(true);
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = useCallback(async () => {
    const activeIngs = foundIngredients
      .filter((f) => isActiveIngredient(f.ingredient.id))
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((f) => f.ingredient);
    const img = await generateScanResultShareImage({
      productName,
      brand,
      productType,
      imagePreview,
      activeIngredients: activeIngs,
    });
    setShareImageBase64(img);
    setShareModalOpen(true);
  }, [productName, brand, productType, imagePreview, foundIngredients]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        paddingBottom: saved ? 144 : 96,
      }}
    >
      {/* Product header card */}
      <div
        style={{
          background: "var(--hd-surface)",
          border: "1px solid var(--hd-hair)",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {imagePreview ? (
            <div
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                overflow: "hidden",
                border: "1px solid var(--hd-hair)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--hd-bg)",
                border: "1px solid var(--hd-hair)",
                fontSize: 22,
              }}
            >
              {genre?.icon || "📦"}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="hd-serif"
              style={{
                fontSize: 17,
                color: "var(--hd-ink)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {productName}
            </div>
            <div
              className="hd-mono"
              style={{
                marginTop: 4,
                fontSize: 10,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {brand}
            </div>
          </div>
          {genre && (
            <span
              className="hd-mono hd-caps"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                padding: "4px 8px",
                color: "var(--hd-ink-60)",
                border: "1px solid var(--hd-line)",
                letterSpacing: "0.12em",
                flexShrink: 0,
              }}
            >
              <ProductGenreIcon genre={genre.key} size={11} />
              {genre.label}
            </span>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--hd-hair)",
          }}
        >
          <Stat value={activeIngredients.length} label="美容成分" />
          {otherIngredients.length > 0 && (
            <Stat value={otherIngredients.length} label="その他" muted divider />
          )}
          {combinations.length > 0 && (
            <Stat value={combinations.length} label="組み合わせ" divider />
          )}
        </div>

        {/* Save state */}
        {!saved && onSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "14px 22px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--hd-sans)",
              letterSpacing: "0.02em",
              cursor: isSaving ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: isSaving ? 0.6 : 1,
              background: "var(--hd-moss)",
              color: "#fff",
              border: "none",
              borderRadius: 0,
              boxShadow: "0 4px 14px oklch(0.38 0.05 155 / 0.22)",
            }}
          >
            {!isSaving && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
            {isSaving ? "保存中…" : "マイコスメに保存する"}
          </button>
        )}
        {saved && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              padding: "10px 12px",
              background: "var(--hd-bg)",
              border: "1px solid var(--hd-hair)",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                fontSize: 9,
                fontWeight: 700,
              }}
              aria-hidden="true"
            >
              ✓
            </span>
            <span
              className="hd-mono hd-caps"
              style={{
                fontSize: 10,
                color: "var(--hd-ink-60)",
                letterSpacing: "0.14em",
              }}
            >
              Saved to my cosme
            </span>
          </div>
        )}
      </div>

      {/* レコメンド */}
      {saved && <RecommendSection enabled={saved} />}

      {/* 検出成分セクション */}
      <Section title="検出成分" caption="Ingredients">
        {activeIngredients.length > 8 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from(grouped.entries()).map(([catKey, items]) => {
              const catInfo = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
              const isOpen = expandedCategories.has(catKey);
              return (
                <div key={catKey}>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "var(--hd-surface)",
                      border: "1px solid var(--hd-hair)",
                      cursor: "pointer",
                      fontFamily: "var(--hd-sans)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ActiveCategoryIcon category={catInfo?.key} size={16} />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--hd-ink)",
                        }}
                      >
                        {catInfo?.label || "その他"}
                      </span>
                      <span
                        className="hd-mono"
                        style={{
                          fontSize: 10,
                          color: "var(--hd-ink-40)",
                        }}
                      >
                        {items.length}
                      </span>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--hd-ink-40)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                      {items.map(({ ingredient, orderIndex }) => (
                        <IngredientRow
                          key={ingredient.id}
                          ingredient={ingredient}
                          orderIndex={orderIndex}
                          onSelect={setSelectedIngredient}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeIngredients.map(({ ingredient, orderIndex }) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                orderIndex={orderIndex}
                onSelect={setSelectedIngredient}
              />
            ))}
          </div>
        )}

        {activeIngredients.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              background: "var(--hd-surface)",
              border: "1px solid var(--hd-hair)",
              color: "var(--hd-ink-60)",
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
            }}
          >
            美容成分が検出されませんでした
          </div>
        )}
      </Section>

      {/* その他の成分 */}
      {otherIngredients.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnknown(!showUnknown)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--hd-ink-60)",
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
            }}
          >
            <span>その他の成分（{otherIngredients.length}種）</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transition: "transform 0.2s",
                transform: showUnknown ? "rotate(180deg)" : "none",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showUnknown && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {otherIngredients.map(({ ingredient, orderIndex }) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  orderIndex={orderIndex}
                  onSelect={setSelectedIngredient}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 未登録成分 */}
      {unknownIngredients.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--hd-ink-40)",
            fontFamily: "var(--hd-sans)",
            lineHeight: 1.7,
          }}
        >
          未登録成分（{unknownIngredients.length}種）：{unknownIngredients.join("、")}
        </div>
      )}

      {/* Combinations */}
      {combinations.length > 0 && (
        <Section title="組み合わせ" caption="Combinations">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {combinations.map((combo, i) => {
              const isGood = combo.type === "recommended";
              return (
                <div
                  key={i}
                  style={{
                    background: "var(--hd-surface)",
                    border: "1px solid var(--hd-hair)",
                    borderLeft: `2px solid ${isGood ? "var(--hd-ink)" : "oklch(0.55 0.18 25)"}`,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    className="hd-mono hd-caps"
                    style={{
                      fontSize: 9,
                      color: isGood ? "var(--hd-ink-60)" : "oklch(0.55 0.18 25)",
                      letterSpacing: "0.14em",
                      marginBottom: 6,
                    }}
                  >
                    {isGood ? "Recommended" : "Caution"}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--hd-ink)",
                      fontFamily: "var(--hd-sans)",
                      marginBottom: 4,
                    }}
                  >
                    {combo.label}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--hd-ink-60)",
                      fontFamily: "var(--hd-sans)",
                      lineHeight: 1.7,
                    }}
                  >
                    {combo.desc}
                  </p>
                  <p
                    className="hd-mono"
                    style={{
                      margin: "8px 0 0",
                      fontSize: 9,
                      color: "var(--hd-ink-40)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    SOURCE · {combo.source}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Disclaimer />

      {selectedIngredient && typeof document !== "undefined" && createPortal(
        <IngredientDetailSheet
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
        />,
        document.body,
      )}

      {shareModalOpen && typeof document !== "undefined" && createPortal(
        <ShareModal
          text={`【コスメチェック】${productName}（${brand}）\n注目成分：${activeIngredients.slice(0, 3).map((f) => f.ingredient.nameJa).join(" / ")}\n\n#HADAMI #成分チェック`}
          onClose={() => setShareModalOpen(false)}
          imageBase64={shareImageBase64 ?? undefined}
        />,
        document.body,
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  muted,
  divider,
}: {
  value: number;
  label: string;
  muted?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        borderLeft: divider ? "1px solid var(--hd-hair)" : undefined,
      }}
    >
      <div
        className="hd-serif"
        style={{
          fontSize: 22,
          color: muted ? "var(--hd-ink-60)" : "var(--hd-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        className="hd-mono hd-caps"
        style={{
          marginTop: 2,
          fontSize: 9,
          color: "var(--hd-ink-40)",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        {caption && (
          <div
            className="hd-mono hd-caps"
            style={{
              fontSize: 9,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.14em",
              marginBottom: 4,
            }}
          >
            {caption}
          </div>
        )}
        <div
          className="hd-serif"
          style={{
            fontSize: 18,
            color: "var(--hd-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function IngredientRow({
  ingredient,
  orderIndex,
  onSelect,
}: {
  ingredient: Ingredient;
  orderIndex: number;
  onSelect: (ingredient: Ingredient) => void;
}) {
  const c = getIngredientCategoryInfo(ingredient);
  return (
    <button
      onClick={() => onSelect(ingredient)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
        cursor: "pointer",
        fontFamily: "var(--hd-sans)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--hd-ink)",
            }}
          >
            {ingredient.nameJa}
          </span>
        </div>
        <div
          className="hd-mono"
          style={{
            marginTop: 2,
            fontSize: 10,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.04em",
          }}
        >
          {ingredient.nameInci}
        </div>
        {c && (
          <div style={{ marginTop: 6 }}>
            <span
              className="hd-mono hd-caps"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                padding: "2px 6px",
                color: "var(--hd-ink-60)",
                border: "1px solid var(--hd-hair)",
                letterSpacing: "0.1em",
              }}
            >
              <ActiveCategoryIcon category={c.key} size={10} />
              {c.label}
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span
          className="hd-mono"
          style={{
            fontSize: 10,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.06em",
          }}
        >
          #{orderIndex + 1}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--hd-ink-40)" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

function IngredientDetailSheet({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient | null;
  onClose: () => void;
}) {
  if (!ingredient) return null;

  const catInfo = getIngredientCategoryInfo(ingredient);
  const allCats = getIngredientCategories(ingredient);

  return (
    <BottomSheet open={true} onClose={onClose} title={ingredient.nameJa}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "16px 0 8px",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: "var(--hd-bg)",
              border: "1px solid var(--hd-hair)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActiveCategoryIcon category={catInfo?.key} size={22} />
          </div>
          <div
            className="hd-mono"
            style={{
              fontSize: 11,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.06em",
            }}
          >
            {ingredient.nameInci}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {allCats.map((cat) => (
              <span
                key={cat.key}
                className="hd-mono hd-caps"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 9,
                  padding: "2px 6px",
                  color: "var(--hd-ink-60)",
                  border: "1px solid var(--hd-hair)",
                  letterSpacing: "0.1em",
                }}
              >
                <ActiveCategoryIcon category={cat.key} size={11} />
                {cat.label}
              </span>
            ))}
          </div>
        </div>

        <DetailBlock caption="Note" body={ingredient.note} />
        {ingredient.funFact && (
          <DetailBlock caption="Trivia" body={ingredient.funFact} accent />
        )}
        {ingredient.caution && (
          <DetailBlock caption="Caution" body={ingredient.caution} warn />
        )}
      </div>
    </BottomSheet>
  );
}

function DetailBlock({
  caption,
  body,
  accent,
  warn,
}: {
  caption: string;
  body: string;
  accent?: boolean;
  warn?: boolean;
}) {
  const borderColor = warn
    ? "oklch(0.55 0.18 25)"
    : accent
    ? "var(--hd-ink)"
    : "var(--hd-hair)";
  return (
    <div
      style={{
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
        borderLeft: `2px solid ${borderColor}`,
        padding: "12px 14px",
      }}
    >
      <div
        className="hd-mono hd-caps"
        style={{
          fontSize: 9,
          color: "var(--hd-ink-40)",
          letterSpacing: "0.14em",
          marginBottom: 6,
        }}
      >
        {caption}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.75,
          color: "var(--hd-ink-60)",
          fontFamily: "var(--hd-sans)",
        }}
      >
        {body}
      </p>
    </div>
  );
}
