import { memo } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { getGenreByKey } from "@/lib/productGenres";
import { StarIcon } from "@/components/ui/Badge";

interface DeckCardProps {
  product: Product;
  onRemove?: () => void;
}

function DeckCard({ product, onRemove }: DeckCardProps) {
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    if (ing?.activeIngredient) {
      ing.categories.forEach((cat) => categories.add(cat));
    }
  });

  return (
    <div className="bg-white rounded-r2 p-3.5 flex items-center gap-3 border border-bo-parchment shadow-bo1">
      {product.packageImage ? (
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 relative">
          <Image
            src={product.packageImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="44px"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-bo-accent-soft to-bo-parchment">
          <StarIcon color="#3A8F7A" size={22} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="text-sm font-bold truncate text-bo-ink font-sans">
            {product.name}
          </div>
          {(() => {
            const genre = getGenreByKey(product.productType || "other");
            return genre ? (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shrink-0 text-[10px] font-sans"
                style={{ background: `${genre.color}18`, color: genre.color }}
              >
                {genre.icon} {genre.label}
              </span>
            ) : null;
          })()}
        </div>
        <div className="text-xs mt-0.5 text-bo-ink-muted font-sans">
          {product.brand}
        </div>
        <div className="flex gap-1 mt-1.5">
          {Array.from(categories).slice(0, 6).map((catKey) => {
            const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
            return info ? (
              <span
                key={catKey}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-sans"
                style={{ background: info.color + "20", color: info.color }}
              >
                {info.icon}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 bg-bo-danger-bg text-bo-danger"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default memo(DeckCard);
