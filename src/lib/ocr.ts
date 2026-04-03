import { MASTER_INGREDIENTS } from "./ingredients";

export async function extractIngredients(ocrText: string): Promise<{
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
}> {
  // Normalize text: full-width → half-width, split by common delimiters
  const normalized = ocrText
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3001/g, ",")
    .replace(/\u30fb/g, ",")
    .replace(/\//g, ",")
    .replace(/\n/g, ",");

  const tokens = normalized
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const found: { ingredientId: string; orderIndex: number }[] = [];
  const unknown: string[] = [];

  tokens.forEach((token) => {
    const match = MASTER_INGREDIENTS.find(
      (ing) =>
        ing.nameJa === token ||
        ing.nameInci.toLowerCase() === token.toLowerCase() ||
        ing.nameJa.includes(token) ||
        token.includes(ing.nameJa) ||
        ing.nameInci.toLowerCase().includes(token.toLowerCase()) ||
        token.toLowerCase().includes(ing.nameInci.toLowerCase())
    );

    if (match) {
      if (!found.some((f) => f.ingredientId === match.id)) {
        found.push({ ingredientId: match.id, orderIndex: found.length });
      }
    } else if (token.length >= 2) {
      unknown.push(token);
    }
  });

  return { found, unknown };
}
