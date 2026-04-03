const BANNED_WORDS = [
  "効く", "治る", "改善", "治療", "医療", "治す",
  "シミが消える", "シワが消える", "若返る",
  "アンチエイジング効果", "美白効果が高い",
  "最強", "No.1", "一番効く",
];

export function checkCompliance(text: string): { ok: boolean; issues: string[] } {
  const issues = BANNED_WORDS.filter(word => text.includes(word));
  return { ok: issues.length === 0, issues };
}

export const DISCLAIMER_TEXT =
  "※本アプリは成分の分類と一般的な特性を紹介するものであり、特定の製品の効能効果を評価・保証するものではありません。";
