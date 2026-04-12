"use client";

import Image from "next/image";
import { Product, ProductGenre } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { ProductGenreIcon, ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";

interface GenreSlotProps {
  genre: ProductGenre;
  stepLabel: string;
  product?: Product;
  onAdd: () => void;
  onRemove?: () => void;
}

export default function GenreSlot({
  genre,
  stepLabel,
  product,
  onAdd,
  onRemove,
}: GenreSlotProps) {
  const genreInfo = getGenreByKey(genre);
  if (!genreInfo) return null;
  const { label, color } = genreInfo;

  // Empty slot
  if (!product) {
    return (
      <div
        onClick={onAdd}
        className="flex items-center gap-4 px-4 h-[76px] rounded-r2 mb-3 cursor-pointer
                   bg-gradient-to-r from-white to-bo-accent-pale/40
                   border border-bo-parchment
                   shadow-bo1
                   active:scale-[0.98] transition-all duration-150"
      >
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: `${color}15` }}
        >
          <ProductGenreIcon genre={genre} size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-bo-ink font-sans block">
            {label}
          </span>
          <span className="text-[11px] text-bo-ink-muted font-sans">
            タップして追加
          </span>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-bo-accent text-white text-lg font-sans shadow-bo-accent shrink-0">
          +
        </div>
      </div>
    );
  }

  // Filled slot — collect active ingredient categories
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    if (ing?.activeIngredient) {
      ing.categories.forEach((cat) => categories.add(cat));
    }
  });

  return (
    <div className="flex items-center relative overflow-hidden deck-card-enter h-[76px] rounded-r2 mb-3 bg-white shadow-bo1 border border-bo-parchment/60
                    active:scale-[0.98] transition-all duration-150 cursor-pointer">
      {/* Left color bar */}
      <div
        className="absolute left-0 top-0 w-1.5 h-full"
        style={{ background: `linear-gradient(to bottom, ${color}, ${color}80)` }}
      />

      {/* Step badge */}
      <div className="absolute top-2 left-3 z-10 w-5 h-5 rounded-md flex items-center justify-center
                      text-[10px] font-black text-white font-serif bg-bo-accent/90">
        {stepLabel}
      </div>

      {/* Product image */}
      <div className="ml-4 shrink-0">
        {product.packageImage ? (
          <div className="w-14 h-14 rounded-[12px] overflow-hidden relative shadow-bo1">
            <Image
              src={product.packageImageThumb ?? product.packageImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="56px"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-[12px] flex items-center justify-center bg-bo-accent-soft"
            style={{ color }}
          >
            <ProductGenreIcon genre={genre} size={24} />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0 px-3">
        <div className="text-sm font-bold truncate text-bo-ink font-sans">
          {product.name}
        </div>
        <div className="text-xs mt-0.5 text-bo-ink-muted font-sans">{product.brand}</div>
        {/* Category icons */}
        {categories.size > 0 && (
          <div className="flex gap-1 mt-1.5">
            {Array.from(categories)
              .slice(0, 5)
              .map((catKey) => {
                const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                return info ? (
                  <span
                    key={catKey}
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center"
                    style={{ background: info.color + "20", color: info.color }}
                    title={info.label}
                  >
                    <ActiveCategoryIcon category={info.key} size={11} />
                  </span>
                ) : null;
              })}
          </div>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-8 h-8 rounded-full border-none flex items-center justify-center text-xs cursor-pointer mr-3 shrink-0
                     bg-bo-danger-bg text-bo-danger pressable"
        >
          ×
        </button>
      )}
    </div>
  );
}
