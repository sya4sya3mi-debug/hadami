/**
 * 有効成分リゾルバー
 *
 * OCR構造検出 / Web検索 / マスターDB の3層から得た情報を統合し、
 * 信頼度スコア付きの有効成分リストを生成する。
 */

import {
  resolveQuasiDrugCosmeticActiveIngredient,
  getQuasiDrugCosmeticActiveByMasterDbId,
} from "./mhlwActiveIngredients";
import { getIngredientById } from "./ingredients";

// ── 信頼度 ──
export type ActiveConfidence = "confirmed" | "high" | "medium";

// ── 検出ソース ──
export type ActiveSource = "ocr_label" | "web_search" | "master_db";

// ── 解決済み有効成分 ──
export interface ResolvedActiveIngredient {
  ingredientId: string;
  nameJa: string;
  confidence: ActiveConfidence;
  sources: ActiveSource[];
  mhlwCategory?: string; // 主承認用途（"美白" 等）
}

// ── 入力パラメータ ──
export interface ResolveParams {
  /** OCR の【有効成分】セクションから検出された成分名 */
  ocrActiveNames: string[];
  /** Web検索で有効成分として返された成分名 */
  webActiveNames: string[];
  /** 全成分マッチで見つかった ingredientId 一覧 */
  allFoundIds: string[];
  /** OCR で医薬部外品と判定されたか */
  isQuasiDrugOcr: boolean;
  /** Web検索で医薬部外品と判定されたか */
  isQuasiDrugWeb: boolean;
}

/**
 * 3層の検出結果を統合して有効成分リストを返す。
 *
 * 信頼度ルール:
 * - confirmed: OCR【有効成分】セクション AND 薬用化粧品リスト一致
 * - high:      Web検索で有効成分確認 AND 薬用化粧品リスト一致
 * - medium:    製品が医薬部外品 AND 薬用化粧品有効成分マスター一致
 */
export function resolveActiveIngredients(
  params: ResolveParams,
): ResolvedActiveIngredient[] {
  const {
    ocrActiveNames,
    webActiveNames,
    allFoundIds,
    isQuasiDrugOcr,
    isQuasiDrugWeb,
  } = params;

  const isQuasiDrug = isQuasiDrugOcr || isQuasiDrugWeb;
  const resultMap = new Map<string, ResolvedActiveIngredient>();

  // ── Layer 1: OCR【有効成分】セクション（confirmed） ──
  for (const name of ocrActiveNames) {
    const mhlw = resolveQuasiDrugCosmeticActiveIngredient(name);
    if (!mhlw) continue;

    const ing = getIngredientById(mhlw.masterDbId);
    if (!ing) continue;

    resultMap.set(mhlw.masterDbId, {
      ingredientId: mhlw.masterDbId,
      nameJa: ing.nameJa,
      confidence: "confirmed",
      sources: ["ocr_label"],
      mhlwCategory: mhlw.approvedUses[0],
    });
  }

  // ── Layer 2: Web検索（high） ──
  for (const name of webActiveNames) {
    const mhlw = resolveQuasiDrugCosmeticActiveIngredient(name);
    if (!mhlw) continue;

    const ing = getIngredientById(mhlw.masterDbId);
    if (!ing) continue;

    const existing = resultMap.get(mhlw.masterDbId);
    if (existing) {
      // 既にOCRで confirmed → ソースを追加するだけ
      if (!existing.sources.includes("web_search")) {
        existing.sources.push("web_search");
      }
    } else {
      resultMap.set(mhlw.masterDbId, {
        ingredientId: mhlw.masterDbId,
        nameJa: ing.nameJa,
        confidence: "high",
        sources: ["web_search"],
        mhlwCategory: mhlw.approvedUses[0],
      });
    }
  }

  // ── Layer 3: マスターDB推定（medium） ──
  const hasExplicitSignals = ocrActiveNames.length > 0 || webActiveNames.length > 0;
  if (isQuasiDrug && hasExplicitSignals) {
    for (const id of allFoundIds) {
      if (resultMap.has(id)) continue; // 上位レイヤーで既に検出済み

      const ing = getIngredientById(id);
      const mhlw = getQuasiDrugCosmeticActiveByMasterDbId(id);
      if (!ing || !mhlw) continue;

      resultMap.set(id, {
        ingredientId: id,
        nameJa: ing.nameJa,
        confidence: "medium",
        sources: ["master_db"],
        mhlwCategory: mhlw?.approvedUses[0],
      });
    }
  }

  // confirmed → high → medium の順でソートして返す
  const order: Record<ActiveConfidence, number> = {
    confirmed: 0,
    high: 1,
    medium: 2,
  };
  return Array.from(resultMap.values()).sort(
    (a, b) => order[a.confidence] - order[b.confidence],
  );
}
