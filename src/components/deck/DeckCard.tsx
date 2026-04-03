import { Product } from "@/types";
import { getIngredientById } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";

interface DeckCardProps {
  product: Product;
  onRemove: () => void;
}

export default function DeckCard({ product, onRemove }: DeckCardProps) {
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    ing?.categories.forEach((c) => categories.add(c));
  });

  return (
    <div
      className="min-w-[130px] h-[130px] bg-white rounded-2xl p-3 relative shrink-0 flex flex-col justify-between"
      style={{ border: "1px solid #F5E6EF", boxShadow: "0 2px 8px rgba(249,168,192,0.1)" }}
    >
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: "#F48C8C", color: "#fff" }}
      >
        ✕
      </button>
      <div className="text-center text-2xl">📦</div>
      <div>
        <div className="text-[11px] font-bold truncate text-center" style={{ color: "#2D2D2D" }}>{product.name}</div>
        <div className="text-[10px] text-center mt-0.5" style={{ color: "#9B9B9B" }}>{product.brand}</div>
      </div>
      <div className="flex gap-1 justify-center flex-wrap">
        {Array.from(categories).slice(0, 4).map((cat) => {
          const c = getCategoryByKey(cat);
          return c ? (
            <span
              key={cat}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ) : null;
        })}
      </div>
    </div>
  );
}
