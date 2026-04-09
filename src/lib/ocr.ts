import { getIngredientByName, getIngredientByInci } from "./ingredients";
import {
  isQuasiDrugCosmeticActiveByMasterDbId,
  resolveQuasiDrugCosmeticActiveIngredient,
} from "./mhlwActiveIngredients";

// ── 抽出結果の型 ──
export interface ExtractionResult {
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
  isQuasiDrug: boolean;
  activeIngredientIds: string[];
}

/** 2文字以下でもマッチ対象にする既知の短い成分名 */
const SHORT_INGREDIENTS = new Set(["BG"]);

/** テキストをトークン化する共通ロジック */
function tokenize(text: string): string[] {
  const normalized = text
    .replace(/[\uff01-\uff5e]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\([^)]*\)/g, "")
    .replace(/\u3001/g, ",")
    .replace(/\u30fb/g, ",")
    .replace(/[/|｜—–]/g, ",")
    .replace(/\n/g, ",");

  return normalized
    .split(",")
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter((t) => {
      const upper = t.toUpperCase();
      if (t.length < 3 && !SHORT_INGREDIENTS.has(upper)) return false;
      if (/^\d[\d.]*%?$/.test(t)) return false;
      if (/^[A-Z]{1,2}$/.test(t) && !SHORT_INGREDIENTS.has(upper)) return false;
      return true;
    });
}

/** トークン列をマスターDBとマッチングする */
function matchTokens(tokens: string[]): {
  found: { ingredientId: string; orderIndex: number }[];
  unknown: string[];
} {
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

/**
 * OCRテキストから成分を抽出する（後方互換あり）。
 *
 * ocrActiveNames が渡された場合、厚労省エイリアス辞書で解決して
 * activeIngredientIds を返す。
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

  // OCR が【有効成分】セクションを検出した場合
  if (opts?.ocrActiveNames) {
    for (const name of opts.ocrActiveNames) {
      // まず MHLW エイリアス辞書で解決
      const mhlw = resolveQuasiDrugCosmeticActiveIngredient(name);
      if (mhlw) {
        if (!activeIngredientIds.includes(mhlw.masterDbId)) {
          activeIngredientIds.push(mhlw.masterDbId);
        }
        // found に含まれていなければ追加
        if (!found.some((f) => f.ingredientId === mhlw.masterDbId)) {
          found.push({ ingredientId: mhlw.masterDbId, orderIndex: found.length });
        }
        continue;
      }
      // MHLW にない場合、マスターDB で直接マッチ
      const match = getIngredientByName(name) || getIngredientByInci(name);
      if (match && isQuasiDrugCosmeticActiveByMasterDbId(match.id)) {
        if (!activeIngredientIds.includes(match.id)) {
          activeIngredientIds.push(match.id);
        }
        if (!found.some((f) => f.ingredientId === match.id)) {
          found.push({ ingredientId: match.id, orderIndex: found.length });
        }
      }
    }
  }

  return { found, unknown, isQuasiDrug, activeIngredientIds };
}
