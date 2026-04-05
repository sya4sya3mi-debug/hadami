import Image from "next/image";
import { Product } from "@/types";
import { getIngredientById } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";
import { getGenreByKey } from "@/lib/productGenres";

interface DeckCardProps {
  product: Product;
  onRemove?: () => void;
}

export default function DeckCard({ product, onRemove }: DeckCardProps) {
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    ing?.categories.forEach((c) => categories.add(c));
  });

  return (
    <div
      className="bg-white rounded-2xl p-3.5 flex items-center gap-3"
      style={{
        border: "1px solid #F5E6EF",
        boxShadow: "0 2px 8px rgba(249,168,192,0.1)",
      }}
    >
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
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)" }}
        >
          📦
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="text-sm font-bold truncate" style={{ color: "#2D2D2D" }}>
            {product.name}
          </div>
          {(() => {
            const genre = getGenreByKey(product.productType || "other");
            return genre ? (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${genre.color}18`, color: genre.color, fontSize: "10px" }}
              >
                {genre.icon} {genre.label}
              </span>
            ) : null;
          })()}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>
          {product.brand}
        </div>
        <div className="flex gap-1 mt-1.5">
          {Array.from(categories).slice(0, 6).map((cat) => {
            const c = getCategoryByKey(cat);
            return c ? (
              <span
                key={cat}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: c.color + "20", color: c.color }}
              >
                {c.icon}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
          style={{ background: "#FFF3F3", color: "#F48C8C" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
