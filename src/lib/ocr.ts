import { getIngredientByName, getIngredientByInci } from "./ingredients";

export async function extractIngredients(ocrText: string): Promise<{
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
}> {
  // Normalize text: full-width → half-width, remove parenthetical concentrations, split by common delimiters
  const normalized = ocrText
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\([^)]*\)/g, "")
    .replace(/\u3001/g, ",")
    .replace(/\u30fb/g, ",")
    .replace(/[/|｜—–]/g, ",")
    .replace(/\n/g, ",");

  const tokens = normalized
    .split(",")
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter((t) => {
      if (t.length < 3) return false;
      if (/^\d[\d.]*%?$/.test(t)) return false;
      if (/^[A-Z]{1,2}$/.test(t)) return false;
      return true;
    });

  const found: { ingredientId: string; orderIndex: number }[] = [];
  const unknown: string[] = [];

  tokens.forEach((token) => {
    const match = getIngredientByName(token) || getIngredientByInci(token);

    if (match) {
      if (!found.some((f) => f.ingredientId === match!.id)) {
        found.push({ ingredientId: match.id, orderIndex: found.length });
      }
    } else if (token.length >= 3) {
      unknown.push(token);
    }
  });

  return { found, unknown };
}
