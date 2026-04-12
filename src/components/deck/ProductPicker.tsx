"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, ProductGenre, DeckItem, RoutineType } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
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
      (p) => !deckItems.some((item) => item.productId === p.id && item.routine === routine)
    );

    const genreMatched = genreFilter
      ? available.filter((p) => p.productType === genreFilter)
      : available;

    // If genre filter produces no results, fall back to all available products
    const fallback = genreFilter !== null && genreMatched.length === 0 && available.length > 0;
    const byGenre = fallback ? available : genreMatched;

    const types = [
      "すべて",
      ...Array.from(new Set(byGenre.map((p) => p.productType).filter(Boolean))),
    ];

    let filtered = typeFilter === "すべて"
      ? byGenre
      : byGenre.filter((p) => p.productType === typeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    return { availableProducts: available, productTypes: types, filteredProducts: filtered, genreFallback: fallback };
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
      <div className="pb-4">
        {/* Search bar */}
        <div className="relative mb-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9E9E9E"
            strokeWidth="2"
            strokeLinecap="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="製品名やブランドで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-[14px] border-none bg-bo-cream text-sm font-sans
                       text-bo-ink placeholder:text-bo-ink-faint outline-none
                       focus:ring-2 focus:ring-bo-accent/30 transition-shadow"
          />
        </div>

        {/* Genre filter chips — hide in fallback mode */}
        {!genreFallback && productTypes.length > 2 && (
          <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 hide-scrollbar">
            {productTypes.map((type) => {
              const genre = typeof type === "string" && type !== "すべて" ? getGenreByKey(type) : null;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as string)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-none cursor-pointer pressable font-sans ${
                    typeFilter === type
                      ? "bg-bo-accent text-white shadow-bo-accent"
                      : "bg-white text-bo-ink-muted shadow-bo1"
                  }`}
                >
                  {genre ? `${genre.icon} ${genre.label}` : type}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty states */}
        {genreFallback && genreInfo ? (
          /* Genre has no matching products — show scan prompt */
          <div className="text-center py-16 animate-fade-up">
            <div
              className="w-16 h-16 rounded-[20px] mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: `${genreInfo.color}15` }}
            >
              {genreInfo.icon}
            </div>
            <p className="text-sm font-bold text-bo-ink mb-1 font-sans">
              {genreInfo.label}の製品がありません
            </p>
            <p className="text-xs text-bo-ink-muted mb-5 font-sans">
              {genreInfo.label}をスキャンして追加しましょう
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-r1 bg-bo-accent text-white
                         text-sm font-bold no-underline shadow-bo-accent pressable font-sans"
            >
              📷 スキャンする
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            {availableProducts.length === 0 && allProducts.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-[20px] mx-auto mb-4 flex items-center justify-center
                                bg-gradient-to-br from-bo-accent-soft to-bo-accent-pale">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="text-sm font-bold text-bo-ink mb-1 font-sans">まだ製品がありません</p>
                <p className="text-xs text-bo-ink-muted mb-5 font-sans">
                  化粧品をスキャンして成分を読み取りましょう
                </p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-r1 bg-bo-accent text-white
                             text-sm font-bold no-underline shadow-bo-accent pressable font-sans"
                >
                  📷 スキャンする
                </Link>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-sm text-bo-ink-muted font-sans">
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
          <div className="space-y-2.5">
            {filteredProducts.map((p) => {
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
                  className="w-full flex items-center gap-3 rounded-r2 p-4 text-left border-none
                             bg-white shadow-bo1 cursor-pointer pressable animate-spring-in"
                >
                  {p.packageImage ? (
                    <div className="w-14 h-14 rounded-[14px] overflow-hidden shrink-0 relative shadow-bo1">
                      <Image
                        src={p.packageImageThumb ?? p.packageImage}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
                      style={{ background: genre ? `${genre.color}15` : "#f0f0f0" }}
                    >
                      {genre?.icon || "📦"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-bo-ink font-sans">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-bo-ink-muted font-sans">{p.brand}</span>
                      {genre && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-sans"
                          style={{
                            background: `${genre.color}15`,
                            color: genre.color,
                          }}
                        >
                          <ProductGenreIcon genre={genre.key} size={10} />
                          {genre.label}
                        </span>
                      )}
                    </div>
                    {/* Category coverage badges */}
                    {categories.size > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {Array.from(categories)
                          .slice(0, 5)
                          .map((catKey) => {
                            const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                            return info ? (
                              <span
                                key={catKey}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold font-sans"
                                style={{ background: info.color + "18", color: info.color }}
                              >
                                {info.icon} {info.label}
                              </span>
                            ) : null;
                          })}
                      </div>
                    )}
                  </div>
                  <div className="px-3.5 py-2 rounded-full text-xs font-bold shrink-0 font-sans bg-bo-accent text-white shadow-bo-accent">
                    追加
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
