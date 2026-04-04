import { Ingredient } from "@/types";
import { RARITY } from "@/lib/ingredients";

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
  index: number;
  isRecent?: boolean;
  foundCount?: number;
}

export default function IngredientCard({ ingredient, discovered, index, isRecent, foundCount = 0 }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];

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

  return (
    <div
      className={`rounded-2xl p-3 flex flex-col items-center justify-center aspect-square relative${isRecent ? " animate-recent-glow" : ""}`}
      style={{
        background: `linear-gradient(145deg, ${ingredient.color}18, ${ingredient.color}08)`,
        border: isRecent ? `2px solid ${ingredient.color}` : `1px solid ${ingredient.color}25`,
        boxShadow: isRecent ? `0 0 12px ${ingredient.color}40` : undefined,
      }}
    >
      <span className="text-[9px] font-medium absolute top-1.5 left-2" style={{ color: ingredient.color + "99" }}>
        No.{index}
      </span>
      {foundCount > 0 && (
        <span
          className="absolute top-1.5 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: ingredient.color + "20", color: ingredient.color }}
        >
          ×{foundCount}
        </span>
      )}
      <span className="text-2xl">{rarityInfo.icon}</span>
      <span
        className="text-[11px] font-medium mt-1 text-center leading-tight"
        style={{ color: "#2D2D2D" }}
      >
        {ingredient.nameJa}
      </span>
      <span
        className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full"
        style={{ background: rarityInfo.color + "20", color: rarityInfo.color }}
      >
        {rarityInfo.label}
      </span>
    </div>
  );
}
