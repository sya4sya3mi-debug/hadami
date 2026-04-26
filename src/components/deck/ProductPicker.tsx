"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, ProductGenre, DeckItem, RoutineType } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";
import { Ico } from "@/components/redesign/apothecary/Icons";
import BottomSheet from "@/components/scan/BottomSheet";

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  genreFilter: ProductGenre | null;
  allProducts: Product[];
  deckItems: DeckItem[];
  routine: RoutineType;
  onAdd: (productId: string) => void;
}

export default function ProductPicker({
  open,
  onClose,
  genreFilter,
  allProducts,
  deckItems,
  routine,
  onAdd,
}: ProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("すべて");

  const genreInfo = genreFilter ? getGenreByKey(genreFilter) : null;
  const title = genreInfo ? `${genreInfo.label}を選択` : "製品を追加";

  const { availableProducts, productTypes, filteredProducts, genreFallback } = useMemo(() => {
    const available = allProducts.filter(
      (p) => !deckItems.some((item) => item.productId === p.id && item.routine === routine),
    );

    const genreMatched = genreFilter
      ? available.filter((p) => p.productType === genreFilter)
      : available;

    const fallback = genreFilter !== null && genreMatched.length === 0 && available.length > 0;
    const byGenre = fallback ? available : genreMatched;

    const types = [
      "すべて",
      ...Array.from(new Set(byGenre.map((p) => p.productType).filter(Boolean))),
    ];

    let filtered =
      typeFilter === "すべて" ? byGenre : byGenre.filter((p) => p.productType === typeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }

    return {
      availableProducts: available,
      productTypes: types,
      filteredProducts: filtered,
      genreFallback: fallback,
    };
  }, [allProducts, deckItems, routine, genreFilter, typeFilter, searchQuery]);

  const handleAdd = (productId: string) => {
    onAdd(productId);
    onClose();
    setSearchQuery("");
    setTypeFilter("すべて");
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
    setTypeFilter("すべて");
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title={title} height="calc(100dvh - 2rem)">
      <div
        className="hd-root hd-softa"
        data-density="compact"
        style={{ paddingBottom: 16 }}
      >
        <div className="hd" style={{ color: "var(--hd-ink)" }}>
          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--hd-ink-40)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="製品名・ブランドで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 36px",
                border: "1px solid var(--hd-line)",
                borderRadius: 0,
                background: "var(--hd-bg)",
                fontFamily: "var(--hd-sans)",
                fontSize: 14,
                color: "var(--hd-ink)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Genre filter chips */}
          {!genreFallback && productTypes.length > 2 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                marginBottom: 18,
                paddingBottom: 4,
              }}
              className="hide-scrollbar"
            >
              {productTypes.map((type) => {
                const genre =
                  typeof type === "string" && type !== "すべて" ? getGenreByKey(type) : null;
                const on = typeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type as string)}
                    style={{
                      flexShrink: 0,
                      padding: "8px 14px",
                      background: on ? "var(--hd-ink)" : "transparent",
                      color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                      border: on ? "none" : "1px solid var(--hd-line)",
                      borderRadius: 0,
                      cursor: "pointer",
                      fontFamily: "var(--hd-sans)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {genre ? genre.label : type}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty states */}
          {genreFallback && genreInfo ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)", marginBottom: 8 }}
              >
                Empty · 該当なし
              </div>
              <div
                className="hd-serif"
                style={{ fontSize: 18, marginBottom: 6, letterSpacing: "-0.01em" }}
              >
                {genreInfo.label}の製品がありません
              </div>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  marginBottom: 22,
                  lineHeight: 1.7,
                }}
              >
                {genreInfo.label}をスキャンして追加しましょう。
              </p>
              <Link
                href="/scan"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 24px",
                  background: "var(--hd-ink)",
                  color: "var(--hd-bg)",
                  textDecoration: "none",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 13,
                }}
              >
                {Ico.camera({ width: 16, height: 16 })}
                <span>スキャンする</span>
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              {availableProducts.length === 0 && allProducts.length === 0 ? (
                <>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)", marginBottom: 8 }}
                  >
                    Empty · 製品なし
                  </div>
                  <div
                    className="hd-serif"
                    style={{ fontSize: 18, marginBottom: 6, letterSpacing: "-0.01em" }}
                  >
                    まだ製品がありません
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 12,
                      color: "var(--hd-ink-60)",
                      marginBottom: 22,
                      lineHeight: 1.7,
                    }}
                  >
                    化粧品をスキャンして成分を読み取りましょう。
                  </p>
                  <Link
                    href="/scan"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 24px",
                      background: "var(--hd-ink)",
                      color: "var(--hd-bg)",
                      textDecoration: "none",
                      fontFamily: "var(--hd-sans)",
                      fontSize: 13,
                    }}
                  >
                    {Ico.camera({ width: 16, height: 16 })}
                    <span>スキャンする</span>
                  </Link>
                </>
              ) : (
                <>
                  <div
                    className="hd-mono hd-caps"
                    style={{ color: "var(--hd-ink-40)", marginBottom: 6 }}
                  >
                    No Result
                  </div>
                  <p
                    className="hd-serif"
                    style={{
                      fontSize: 15,
                      color: "var(--hd-ink-60)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {searchQuery
                      ? "検索結果がありません"
                      : availableProducts.length === 0 && allProducts.length > 0
                        ? "すべての製品がルーティンに追加済みです"
                        : "追加できる製品がありません"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {filteredProducts.map((p, i) => {
                const genre = getGenreByKey(p.productType || "other");
                const categories = new Set<string>();
                p.ingredients.forEach((pi) => {
                  const ing = getIngredientById(pi.ingredientId);
                  if (ing?.activeIngredient) {
                    ing.categories.forEach((cat) => categories.add(cat));
                  }
                });

                return (
                  <button
                    key={p.id}
                    onClick={() => handleAdd(p.id)}
                    className="hd-softa-card"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 14px",
                      marginBottom: 10,
                      background: "var(--hd-surface)",
                      border: "1px solid var(--hd-hair)",
                      cursor: "pointer",
                      textAlign: "left",
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
                    {p.packageImage ? (
                      <div
                        className="hd-softa-thumb"
                        style={{
                          width: 50,
                          height: 50,
                          flexShrink: 0,
                          overflow: "hidden",
                          background: "var(--hd-surface-2)",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={p.packageImageThumb ?? p.packageImage}
                          alt={p.name}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="50px"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="hd-softa-thumb"
                        style={{
                          width: 50,
                          height: 50,
                          flexShrink: 0,
                          background: "var(--hd-surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--hd-ink-40)",
                        }}
                      >
                        {Ico.camera({ width: 16, height: 16 })}
                      </div>
                    )}
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
                        {genre ? ` · ${genre.label}` : ""}
                      </div>
                      <div
                        className="hd-serif"
                        style={{
                          fontSize: 14,
                          marginTop: 3,
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </div>
                      {categories.size > 0 && (
                        <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                          {Array.from(categories)
                            .slice(0, 5)
                            .map((catKey) => {
                              const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                              return info ? (
                                <span
                                  key={catKey}
                                  title={info.label}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 999,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: `${info.color}1F`,
                                    color: info.color,
                                  }}
                                >
                                  <ActiveCategoryIcon category={info.key} size={10} />
                                </span>
                              ) : null;
                            })}
                        </div>
                      )}
                    </div>
                    <span
                      className="hd-mono hd-caps"
                      style={{
                        flexShrink: 0,
                        padding: "5px 12px",
                        border: "1px solid var(--hd-ink)",
                        color: "var(--hd-ink)",
                        background: "var(--hd-bg)",
                      }}
                    >
                      Add →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
