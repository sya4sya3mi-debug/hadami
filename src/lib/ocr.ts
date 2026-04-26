import { getIngredientByName, getIngredientByInci } from "./ingredients";
import {
  isQuasiDrugCosmeticActiveByMasterDbId,
  resolveQuasiDrugCosmeticActiveIngredient,
} from "./mhlwActiveIngredients";

export interface ExtractionResult {
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
  isQuasiDrug: boolean;
  activeIngredientIds: string[];
}

const SHORT_INGREDIENTS = new Set(["BG"]);

function tokenize(text: string): string[] {
  const normalized = text
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/\([^)]*\)/g, "")
    .replace(/\u3001/g, ",")
    .replace(/\u30fb/g, ",")
    .replace(/[\/|｜—–・､，、]/g, ",")
    .replace(/\n/g, ",");

  return normalized
    .split(",")
    .map((token) => token.trim().replace(/\s+/g, " "))
    .filter((token) => {
      const upper = token.toUpperCase();
      if (token.length < 3 && !SHORT_INGREDIENTS.has(upper)) return false;
      if (/^\d[\d.]*%?$/.test(token)) return false;
      if (/^[A-Z]{1,2}$/.test(token) && !SHORT_INGREDIENTS.has(upper)) return false;
      return true;
    });
}

function matchTokens(tokens: string[]): {
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
} {
  const found: { ingredientId: string; orderIndex: number }[] = [];
  const unknown: string[] = [];

  tokens.forEach((token) => {
    const match = getIngredientByName(token) || getIngredientByInci(token);

    if (match) {
      if (!found.some((item) => item.ingredientId === match.id)) {
        found.push({ ingredientId: match.id, orderIndex: found.length });
      }
    } else if (token.length >= 3) {
      unknown.push(token);
    }
  });

  return { found, unknown };
}

/**
 * Extract ingredients from recognized text.
 * `found` is always limited to ingredients matched from the text tokens.
 * Quasi-drug active names are resolved separately into `activeIngredientIds`.
 */
export async function extractIngredients(
  ocrText: string,
  opts?: {
    isQuasiDrug?: boolean;
    ocrActiveNames?: string[];
  },
): Promise<ExtractionResult> {
  const tokens = tokenize(ocrText);
  const { found, unknown } = matchTokens(tokens);

  const isQuasiDrug = opts?.isQuasiDrug ?? false;
  const activeIngredientIds: string[] = [];

  if (opts?.ocrActiveNames) {
    for (const name of opts.ocrActiveNames) {
      const mhlw = resolveQuasiDrugCosmeticActiveIngredient(name);
      if (mhlw) {
        if (!activeIngredientIds.includes(mhlw.masterDbId)) {
          activeIngredientIds.push(mhlw.masterDbId);
        }
        continue;
      }

      const match = getIngredientByName(name) || getIngredientByInci(name);
      if (match && isQuasiDrugCosmeticActiveByMasterDbId(match.id)) {
        if (!activeIngredientIds.includes(match.id)) {
          activeIngredientIds.push(match.id);
        }
      }
    }
  }

  return { found, unknown, isQuasiDrug, activeIngredientIds };
}
