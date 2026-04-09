"use client";

import Image from "next/image";
import { Product, ProductGenre } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";

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

  if (!product) {
    return (
      <div
        onClick={onAdd}
        className="flex items-center gap-3 px-4 h-16 rounded-2xl mb-2 cursor-pointer border-2 border-dashed border-bo-accent/20 bg-gradient-to-r from-white/50 to-bo-accent-soft/30"
      >
        <span className="inline-flex w-9 justify-center text-center opacity-60" style={{ color }}>
          <ProductGenreIcon genre={genre} size={24} />
        </span>
        <span className="text-[13px] font-medium flex-1 text-bo-ink-faint font-sans">
          {label}
        </span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-base font-sans bg-bo-accent/10 text-bo-accent">
          +
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center relative overflow-hidden deck-card-enter h-[72px] rounded-2xl mb-2 bg-white border border-bo-accent/15">
      <div className="absolute left-0 top-0 w-1 h-full bg-bo-accent" />

      <div className="absolute top-1.5 left-2.5 z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white font-serif bg-bo-accent">
        {stepLabel}
      </div>

      <div className="ml-3.5 shrink-0">
        {product.packageImage ? (
          <div className="w-14 h-14 rounded-[10px] overflow-hidden relative">
            <Image
              src={product.packageImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="56px"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-[10px] flex items-center justify-center bg-bo-accent-soft"
            style={{ color }}
          >
            <ProductGenreIcon genre={genre} size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 px-2.5">
        <div className="text-[13px] font-bold truncate text-bo-ink font-sans">
          {product.name}
        </div>
        <div className="text-[11px] mt-0.5 text-bo-ink-muted font-sans">{product.brand}</div>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[10px] font-semibold mt-0.5 font-sans"
          style={{ background: `${color}18`, color }}
        >
          <ProductGenreIcon genre={genre} size={11} />
          {label}
        </span>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="w-[26px] h-[26px] rounded-full border-none flex items-center justify-center text-[11px] cursor-pointer mr-2.5 shrink-0 bg-bo-danger-bg text-bo-danger"
        >
          ×
        </button>
      )}
    </div>
  );
}
