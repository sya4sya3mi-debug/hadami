"use client";

import Image from "next/image";
import { Product, ProductGenre } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { getIngredientById } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";

interface GenreSlotProps {
  genre: ProductGenre;
  stepLabel: string;
  product?: Product;
  onAdd: () => void;
  onRemove?: () => void;
}

export default function GenreSlot({ genre, stepLabel, product, onAdd, onRemove }: GenreSlotProps) {
  const genreInfo = getGenreByKey(genre);
  if (!genreInfo) return null;
  const { icon, color, label } = genreInfo;

  if (!product) {
    return (
      <div
        onClick={onAdd}
        className="flex items-center gap-3 px-4 cursor-pointer"
        style={{
          height: 64,
          border: `2px dashed ${color}30`,
          borderRadius: 16,
          marginBottom: 8,
          background: `linear-gradient(90deg, rgba(255,255,255,0.5), ${color}06)`,
        }}
      >
        <span className="text-[28px] opacity-40 w-9 text-center">{icon}</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: "#C5C5C5" }}>{label}</span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-base"
          style={{ background: `${color}18`, color }}
        >
          ＋
        </div>
      </div>
    );
  }

  // Collect categories
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    ing?.categories.forEach((c) => categories.add(c));
  });

  return (
    <div
      className="flex items-center relative overflow-hidden deck-card-enter"
      style={{
        height: 72,
        background: `linear-gradient(90deg, #fff, ${color}08)`,
        borderRadius: 16,
        marginBottom: 8,
        border: `1px solid ${color}20`,
        boxShadow: `inset 0 0 0 1px ${color}15`,
      }}
    >
      {/* Color bar */}
      <div className="absolute left-0 top-0 w-1 h-full" style={{ background: color }} />

      {/* Step badge */}
      <div
        className="absolute top-1.5 left-2.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
        style={{ background: color }}
      >
        {stepLabel}
      </div>

      {/* Product image / icon */}
      <div className="ml-3.5 shrink-0">
        {product.packageImage ? (
          <div className="w-14 h-14 rounded-[10px] overflow-hidden relative">
            <Image src={product.packageImage} alt={product.name} fill className="object-cover" sizes="56px" loading="lazy" />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-[10px] flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, ${color}20, #FFF0F5)` }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-2.5">
        <div className="text-[13px] font-bold truncate">{product.name}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9B9B9B" }}>{product.brand}</div>
        <span
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[10px] text-[10px] font-semibold mt-0.5"
          style={{ background: `${color}18`, color }}
        >
          {icon} {label}
        </span>
      </div>

      {/* Category icons */}
      {categories.size > 0 && (
        <div className="flex gap-0.5 mr-2 shrink-0">
          {Array.from(categories).slice(0, 3).map((cat) => {
            const c = getCategoryByKey(cat);
            return c ? (
              <span
                key={cat}
                className="text-[9px] px-1 py-0.5 rounded-md"
                style={{ background: `${c.color}20`, color: c.color }}
              >
                {c.icon}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-[26px] h-[26px] rounded-full border-none flex items-center justify-center text-[11px] cursor-pointer mr-2.5 shrink-0"
          style={{ background: "#FFF3F3", color: "#F48C8C" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
