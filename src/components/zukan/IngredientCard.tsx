import { memo } from "react";
import { Ingredient } from "@/types";
import { RARITY } from "@/lib/ingredients";

/* Card texture backgrounds per ingredient genre */
const CARD_TEXTURES: Record<string, { bg: string; color: string; emoji: string; label: string }> = {
  water:      { bg: "linear-gradient(145deg, #E3F4EE 0%, #D4EDE3 50%, #C5E8D8 100%)", color: "#3A7D65", emoji: "💧", label: "うるおい" },
  amino_acid: { bg: "linear-gradient(145deg, #E3E8F4 0%, #D4DBEB 50%, #C5CEE2 100%)", color: "#4A5A8A", emoji: "🧬", label: "アミノ酸" },
  vitamin:    { bg: "linear-gradient(145deg, #FFF5E5 0%, #FDECC8 50%, #FBE3B0 100%)", color: "#A07A30", emoji: "🍊", label: "ビタミン" },
  peptide:    { bg: "linear-gradient(145deg, #F4E3F0 0%, #EBD4E8 50%, #E2C5DF 100%)", color: "#8A4A7A", emoji: "🧪", label: "ペプチド" },
  botanical:  { bg: "linear-gradient(145deg, #E8EFE3 0%, #D8E6CF 50%, #C8DEC0 100%)", color: "#5A7A4A", emoji: "🌿", label: "ボタニカル" },
  oil_lipid:  { bg: "linear-gradient(145deg, #EAF0E5 0%, #DDE8D4 50%, #D0E0C5 100%)", color: "#4A7A55", emoji: "🫙", label: "オイル・脂質" },
  ferment:    { bg: "linear-gradient(145deg, #EDE3F0 0%, #E0D4EB 50%, #D5C8E2 100%)", color: "#6B4A8A", emoji: "🧫", label: "発酵・バイオ" },
  acid:       { bg: "linear-gradient(145deg, #E8E3F0 0%, #DAD4EB 50%, #CCC5E0 100%)", color: "#5A4A7A", emoji: "⚗️", label: "アシッド" },
  base:       { bg: "linear-gradient(145deg, #EDEDE8 0%, #E0E0D8 50%, #D5D5CC 100%)", color: "#6B6B5A", emoji: "⚙️", label: "ベース" },
};

const DEFAULT_TEXTURE = { bg: "linear-gradient(145deg, #EDEDE8 0%, #E0E0D8 50%, #D5D5CC 100%)", color: "#6B6B5A", emoji: "📦", label: "その他" };

const RARITY_COLORS = ["", "#7E9389", "#6B8E7B", "#D4A853", "#C77DBA", "#E8A04C"];

interface IngredientCardProps {
  ingredient: Ingredient;
  discovered: boolean;
  index: number;
  isRecent?: boolean;
  foundCount?: number;
}

function IngredientCard({ ingredient, discovered, index, isRecent, foundCount = 0 }: IngredientCardProps) {
  const rarityInfo = RARITY[ingredient.rarity];
  const tex = CARD_TEXTURES[ingredient.genre] || DEFAULT_TEXTURE;

  const rarityIdx = rarityInfo.star;

  if (!discovered) {
    return (
      <div
        className="rounded-xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-0.5 p-1.5"
        style={{
          aspectRatio: "1/1",
          background: "#E8F0EC",
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

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer relative flex flex-col items-center justify-center gap-0.5 p-1.5"
      style={{
        aspectRatio: "1/1",
        background: tex.bg,
        border: `1px solid ${tex.color}20`,
        boxShadow: rarityIdx >= 4 ? `0 2px 8px ${RARITY_COLORS[rarityIdx]}25` : "0 1px 2px rgba(27,38,32,0.04)",
      }}
    >
      {/* Number */}
      <div
        className="absolute top-0.5 left-1 text-[6px] font-black font-serif opacity-40"
        style={{ color: tex.color }}
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
          style={{ background: tex.color + "20", color: tex.color }}
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
        {tex.emoji}
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
