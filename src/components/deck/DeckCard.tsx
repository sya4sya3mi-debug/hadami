import Image from "next/image";
import { Product } from "@/types";
import { getIngredientById } from "@/lib/ingredients";
import { getCategoryByKey } from "@/lib/categories";

interface DeckCardProps {
  product: Product;
  onRemove?: () => void;
  comboColors?: string[];   // A・B用: この製品が参加している相性ペアのカラー配列
}

export default function DeckCard({ product, onRemove, comboColors = [] }: DeckCardProps) {
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    ing?.categories.forEach((c) => categories.add(c));
  });

  const primaryColor = comboColors[0];
  const hasCombo = comboColors.length > 0;

  return (
    <div
      className="bg-white rounded-2xl p-3.5 relative flex items-center gap-3 overflow-hidden"
      style={{
        border: "1px solid #F5E6EF",
        boxShadow: "0 2px 8px rgba(249,168,192,0.1)",
      }}
    >
      {/* B: 左ボーダーストライプ（相性カラー） */}
      {primaryColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: primaryColor }}
        />
      )}

      {product.packageImage ? (
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 relative" style={{ marginLeft: primaryColor ? 4 : 0 }}>
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
          style={{ background: "linear-gradient(135deg, #E8FAF8, #FFF0F5)", marginLeft: primaryColor ? 4 : 0 }}
        >
          📦
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: "#2D2D2D" }}>
          {product.name}
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

      {/* A: 相性バッジ（右上） */}
      {hasCombo && (
        <div
          className="absolute top-2 right-8 flex gap-0.5"
        >
          {comboColors.slice(0, 3).map((color, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pill-glow"
              style={{ background: color + "22", color, border: `1px solid ${color}55` }}
            >
              ✦
            </span>
          ))}
        </div>
      )}

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
