import { Category } from "@/types";

export const CATEGORIES: readonly Category[] = [
  { key: "moisturizing", label: "保湿",     icon: "🫧", color: "#4FC3F7", desc: "肌に水分を与え、うるおいを保つ成分です。乾燥を防ぎ、しっとりとした肌触りに導きます。" },
  { key: "brightening",  label: "整肌",     icon: "✨", color: "#CE93D8", desc: "肌のトーンを整え、透明感のある印象へ導く成分です。くすみが気になるときに注目したいカテゴリです。" },
  { key: "turnover",     label: "ハリ・弾力", icon: "💪", color: "#FFB74D", desc: "コラーゲンやエラスチンの産生をサポートし、ハリと弾力のある肌を目指す成分です。エイジングケアの主役です。" },
  { key: "barrier",      label: "バリア",   icon: "🛡️", color: "#81C784", desc: "肌のバリア機能を強化し、外部刺激から守る成分です。セラミドなどの脂質成分が中心です。" },
  { key: "soothing",     label: "鎮静",     icon: "🍃", color: "#80CBC4", desc: "肌荒れや赤みを落ち着かせ、やさしくいたわる成分です。敏感肌の方に特におすすめのカテゴリです。" },
  { key: "keratin",      label: "角質ケア", icon: "🧹", color: "#90A4AE", desc: "古い角質をおだやかに取り除き、なめらかな肌へ導く成分です。AHA・BHA・PHAなどの酸が中心です。" },
] as const;

export function getCategoryByKey(key: string): Category | undefined {
  return CATEGORIES.find(c => c.key === key);
}
