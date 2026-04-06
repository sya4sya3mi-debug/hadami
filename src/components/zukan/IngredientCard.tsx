import { Ingredient } from "@/types";
import { RARITY } from "@/lib/ingredients";

/* Card texture backgrounds per category type */
const CARD_TEXTURES: Record<string, { bg: string; color: string; emoji: string; label: string }> = {
  moisturizing: { bg: "linear-gradient(145deg, #E3F4EE 0%, #D4EDE3 50%, #C5E8D8 100%)", color: "#3A7D65", emoji: "💧", label: "保湿" },
  soothing: { bg: "linear-gradient(145deg, #E8EFE3 0%, #D8E6CF 50%, #C8DEC0 100%)", color: "#5A7A4A", emoji: "🌿", label: "鎮静" },
  turnover: { bg: "linear-gradient(145deg, #EDE3F0 0%, #E0D4EB 50%, #D5C8E2 100%)", color: "#6B4A8A", emoji: "🔬", label: "修復" },
  brightening: { bg: "linear-gradient(145deg, #FFF5E5 0%, #FDECC8 50%, #FBE3B0 100%)", color: "#A07A30", emoji: "✨", label: "美白" },
  barrier: { bg: "linear-gradient(145deg, #FDE8E0 0%, #F5D8CC 50%, #EECABC 100%)", color: "#A05A40", emoji: "🧪", label: "基剤" },
  keratin: { bg: "linear-gradient(145deg, #E8E3F0 0%, #DAD4EB 50%, #CCC5E0 100%)", color: "#5A4A7A", emoji: "🧬", label: "角質" },
};

const DEFAULT_TEXTURE = { bg: "linear-gradient(145deg, #FDE8E0 0%, #F5D8CC 50%, #EECABC 100%)", color: "#A05A40", emoji: "🧪", label: "その他" };

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
  index: number;
  isRecent?: boolean;
  foundCount?: number;
}

export default function IngredientCard({ ingredient, discovered, index, isRecent, foundCount = 0 }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];
  const mainCat = ingredient.categories?.[0] || "";
  const tex = CARD_TEXTURES[mainCat] || DEFAULT_TEXTURE;

  const rarityColors = ["", "#7E9389", "#6B8E7B", "#D4A853", "#C77DBA", "#E8A04C"];
  const rarityIdx = rarityInfo.star;

  if (!discovered) {
    return (
      <div
        className="rounded-2xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-1 p-2"
        style={{
          aspectRatio: "3/4",
          background: "#E8F0EC",
          border: "1.5px dashed #B5C7BE",
        }}
      >
        <div className="text-xl opacity-25">🔒</div>
        <div className="text-[7px] text-[#D4A853] tracking-wider">
          {"★".repeat(rarityIdx)}{"☆".repeat(5 - rarityIdx)}
        </div>
        <div className="text-[8px] text-bo-ink-faint font-sans">
          #{String(index).padStart(3, "0")}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-1 p-2"
      style={{
        aspectRatio: "3/4",
        background: tex.bg,
        border: `1.5px solid ${tex.color}20`,
        boxShadow: rarityIdx >= 4 ? `0 4px 16px ${rarityColors[rarityIdx]}25` : "0 1px 3px rgba(27,38,32,0.06)",
      }}
    >
      {/* Number */}
      <div
        className="absolute top-1.5 left-2 text-[8px] font-black font-serif opacity-50"
        style={{ color: tex.color }}
      >
        #{String(index).padStart(3, "0")}
      </div>

      {/* NEW dot */}
      {isRecent && (
        <div className="absolute top-1.5 right-2 w-[7px] h-[7px] rounded-full bg-bo-accent" />
      )}

      {/* Found count */}
      {foundCount > 1 && (
        <span
          className="absolute top-1.5 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: tex.color + "20", color: tex.color }}
        >
          ×{foundCount}
        </span>
      )}

      {/* Icon */}
      <div
        className="text-2xl"
        style={{
          filter: rarityIdx >= 4 ? `drop-shadow(0 0 6px ${rarityColors[rarityIdx]}60)` : "none",
        }}
      >
        {tex.emoji}
      </div>

      {/* Name */}
      <div
        className="text-[9px] font-bold text-bo-ink font-sans text-center leading-tight max-w-[90%] overflow-hidden line-clamp-2"
      >
        {ingredient.nameJa}
      </div>

      {/* Stars */}
      <div className="text-[7px] text-[#D4A853] tracking-wider">
        {"★".repeat(rarityIdx)}{"☆".repeat(5 - rarityIdx)}
      </div>
    </div>
  );
}
