import { RarityKey } from "@/types";
import { RARITY } from "@/lib/ingredients";

interface BadgeProps {
  rarity: RarityKey;
  size?: "sm" | "md";
}

export function StarIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function Badge({ rarity, size = "md" }: BadgeProps) {
  if (rarity === "common" || rarity === "uncommon") return null;
  const info = RARITY[rarity];
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";
  const starSize = size === "sm" ? 9 : 11;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold ${sizeClass}`}
      style={{ backgroundColor: info.color + "18", color: info.color }}
    >
      <span className="inline-flex items-center gap-px">
        {Array.from({ length: info.star }).map((_, i) => (
          <StarIcon key={i} color={info.color} size={starSize} />
        ))}
      </span>
    </span>
  );
}
