import { RarityKey } from "@/types";
import { RARITY } from "@/lib/ingredients";

interface BadgeProps {
  rarity: RarityKey;
  size?: "sm" | "md";
}

export default function Badge({ rarity, size = "md" }: BadgeProps) {
  const info = RARITY[rarity];
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";
  const stars = "⭐".repeat(info.star);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClass}`}
      style={{ backgroundColor: info.color + "18", color: info.color }}
    >
      <span className="text-[8px] leading-none">{stars}</span>
      <span>{info.label}</span>
    </span>
  );
}
