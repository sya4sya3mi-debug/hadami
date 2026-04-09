/**
 * 成分名の正規化関数
 * OCR表記揺れ・全角半角・スペース差異を吸収して一致率を向上させる
 */
export function normalizeIngredientName(s: string): string {
  return s
    .normalize("NFKC") // 全角→半角統一、互換文字の正規化
    .replace(/[\s\-\u2010-\u2015]/g, "") // スペース・ハイフン系除去
    .replace(/ヂ/g, "ジ")
    .replace(/ヅ/g, "ズ") // カタカナOCR誤認識の頻出パターン
    .replace(/ヰ/g, "イ")
    .replace(/ヱ/g, "エ")
    .toLowerCase();
}
