import { Ingredient } from "@/types";
import { RARITY, getGenreInfo } from "@/lib/ingredients";
import { StarIcon } from "@/components/ui/Badge";

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
  index: number;
  isRecent?: boolean;
  foundCount?: number;
}

export default function IngredientCard({ ingredient, discovered, index, isRecent, foundCount = 0 }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];
  const genreInfo = getGenreInfo(ingredient.genre);

  if (!discovered) {
    return (
      <div
        className="rounded-2xl p-3 flex flex-col items-center justify-center aspect-square relative"
        style={{ background: "#F5F5F5" }}
      >
        <span className="text-[9px] font-medium absolute top-1.5 left-2" style={{ color: "#BDBDBD" }}>
          No.{index}
        </span>
        <span className="text-2xl">❓</span>
        <span className="text-[10px] mt-1" style={{ color: "#BDBDBD" }}>未発見</span>
      </div>
    );
  }

  const cardColor = genreInfo?.color || rarityInfo.color;

  return (
    <div
      className={`rounded-2xl p-2.5 flex flex-col items-center justify-center aspect-square relative${isRecent ? " animate-recent-glow" : ""}`}
      style={{
        background: `linear-gradient(145deg, ${cardColor}18, ${cardColor}08)`,
        border: isRecent ? `2px solid ${cardColor}` : `1px solid ${cardColor}25`,
        boxShadow: isRecent ? `0 0 12px ${cardColor}40` : undefined,
      }}
    >
      {/* No. label */}
      <span className="text-[9px] font-medium absolute top-1.5 left-2" style={{ color: cardColor + "99" }}>
        No.{index}
      </span>

      {/* Found count */}
      {foundCount > 0 && (
        <span
          className="absolute top-1.5 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: cardColor + "20", color: cardColor }}
        >
          ×{foundCount}
        </span>
      )}

      {/* Genre icon (large) */}
      <span className="text-2xl">{genreInfo?.icon || "📦"}</span>

      {/* Ingredient name */}
      <span
        className="text-[11px] font-medium mt-1 text-center leading-tight"
        style={{ color: "#2D2D2D" }}
      >
        {ingredient.nameJa}
      </span>

      {/* Rarity stars + label */}
      <div className="flex items-center gap-px mt-1">
        {Array.from({ length: rarityInfo.star }).map((_, i) => (
          <StarIcon key={i} color={rarityInfo.color} size={10} />
        ))}
      </div>
      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full"
        style={{ background: rarityInfo.color + "20", color: rarityInfo.color }}
      >
        {rarityInfo.label}
      </span>
    </div>
  );
}
