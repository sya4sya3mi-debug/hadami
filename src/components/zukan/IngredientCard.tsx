import { Ingredient } from "@/types";
import { RARITY } from "@/lib/ingredients";

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
}

export default function IngredientCard({ ingredient, discovered }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];

  if (!discovered) {
    return (
      <div
        className="rounded-2xl p-3 flex flex-col items-center justify-center aspect-square"
        style={{ background: "#F5F5F5" }}
      >
        <span className="text-2xl">❓</span>
        <span className="text-[10px] mt-1" style={{ color: "#BDBDBD" }}>未発見</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center justify-center aspect-square"
      style={{
        background: `linear-gradient(145deg, ${ingredient.color}18, ${ingredient.color}08)`,
        border: `1px solid ${ingredient.color}25`,
      }}
    >
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
