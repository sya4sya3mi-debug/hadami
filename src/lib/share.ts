import { Ingredient, Product, RoutineType } from "@/types";
import { RARITY } from "./ingredients";

export function shareIngredientDiscovery(ingredient: Ingredient): string {
  const rarityInfo = RARITY[ingredient.rarity];
  const stars = "⭐".repeat(rarityInfo.star);
  return `【成分図鑑】${ingredient.nameJa}（${ingredient.nameInci}）を発見！
${stars} ${rarityInfo.label}
📌 ${ingredient.note}

#HADAMI #成分図鑑`;
}

export function shareProductCheck(product: Product, ingredientNames: string[]): string {
  const top3 = ingredientNames.slice(0, 3).join(" / ");
  return `【製品チェック】${product.name}（${product.brand}）
成分：${top3}

#HADAMI #成分チェック`;
}

export function shareDeck(
  routine: RoutineType,
  products: { emoji: string; name: string }[],
  categoryCount: number,
  ingredientCount: number
): string {
  const ROUTINE_LABEL: Record<RoutineType, string> = {
    morning: "☀️朝",
    night: "🌙夜",
    spring_summer: "🌸春夏",
    autumn_winter: "🍂秋冬",
  };
  const routineLabel = ROUTINE_LABEL[routine];
  const lines = products.map((p) => `${p.emoji} ${p.name}`).join("\n");
  return `【マイスキンケアルーティン】${routineLabel}

${lines}

📊 ${categoryCount}/6カテゴリカバー
🧪 ${ingredientCount}種の成分

#HADAMI #スキンケアデッキ`;
}

export function shareZukanProgress(discovered: number, total: number): string {
  const pct = Math.round((discovered / total) * 100);
  return `【成分図鑑】${discovered}/${total}種コンプリート！（${pct}%）

あなたはどこまで集めた？
#HADAMI #成分図鑑`;
}
