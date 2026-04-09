import { memo } from "react";
import { Ingredient } from "@/types";
import { RARITY, getIngredientCategoryInfo } from "@/lib/ingredients";

const RARITY_COLORS = ["", "#9E9E9E", "#6B8E7B", "#D4A853", "#C77DBA", "#E8A04C"];

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
  index: number;
  isRecent?: boolean;
  foundCount?: number;
}

function IngredientCard({ ingredient, discovered, index, isRecent, foundCount = 0 }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];
  const catInfo = getIngredientCategoryInfo(ingredient);
  const rarityIdx = rarityInfo.star;

  if (!discovered) {
    return (
      <div
        className="rounded-xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-0.5 p-1.5"
        style={{
          aspectRatio: "1/1",
          background: "#e0e0e0",
          border: "1px dashed #B5C7BE",
        }}
      >
        <div className="text-lg opacity-25">🔒</div>
        <div className="text-[7px] text-[#D4A853] tracking-wider leading-none">
          {"★".repeat(rarityIdx)}{"☆".repeat(4 - rarityIdx)}
        </div>
        <div className="text-[7px] text-bo-ink-faint font-sans leading-none">
          #{String(index).padStart(3, "0")}
        </div>
      </div>
    );
  }

  const bgColor = catInfo?.color || "#90A4AE";
  const bg = `linear-gradient(145deg, ${bgColor}18 0%, ${bgColor}10 50%, ${bgColor}08 100%)`;

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-0.5 p-1.5"
      style={{
        aspectRatio: "1/1",
        background: bg,
        border: `1px solid ${bgColor}20`,
        boxShadow: rarityIdx >= 4 ? `0 2px 8px ${RARITY_COLORS[rarityIdx]}25` : "0 1px 2px rgba(27,38,32,0.04)",
      }}
    >
      {/* Number */}
      <div
        className="absolute top-0.5 left-1 text-[6px] font-black font-serif opacity-40"
        style={{ color: bgColor }}
      >
        #{String(index).padStart(3, "0")}
      </div>

      {/* NEW dot */}
      {isRecent && (
        <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-bo-accent" />
      )}

      {/* Found count */}
      {foundCount > 1 && (
        <span
          className="absolute top-0.5 right-1 text-[6px] font-bold px-1 rounded-full leading-tight"
          style={{ background: bgColor + "20", color: bgColor }}
        >
          ×{foundCount}
        </span>
      )}

      {/* Icon */}
      <div
        className="text-xl"
        style={{
          filter: rarityIdx >= 4 ? `drop-shadow(0 0 4px ${RARITY_COLORS[rarityIdx]}60)` : "none",
        }}
      >
        {catInfo?.icon || "🧪"}
      </div>

      {/* Name */}
      <div
        className="text-[8px] font-bold text-bo-ink font-sans text-center leading-tight max-w-[95%] overflow-hidden line-clamp-2"
      >
        {ingredient.nameJa}
      </div>

      {/* Stars */}
      <div className="text-[7px] text-[#D4A853] tracking-wider leading-none">
        {"★".repeat(rarityIdx)}{"☆".repeat(4 - rarityIdx)}
      </div>
    </div>
  );
}

export default memo(IngredientCard);
