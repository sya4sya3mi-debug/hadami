import { Category } from "@/types";

export const CATEGORIES: readonly Category[] = [
  { key: "moisturizing", label: "保湿系",     icon: "💧", color: "#4FC3F7", desc: "保湿に分類される成分" },
  { key: "brightening",  label: "整肌系",     icon: "🌸", color: "#CE93D8", desc: "肌を整える成分" },
  { key: "turnover",     label: "ハリ・弾力系", icon: "🔄", color: "#FFB74D", desc: "ターンオーバーに関わる成分" },
  { key: "barrier",      label: "バリア系",   icon: "🛡️", color: "#81C784", desc: "バリア機能に関わる成分" },
  { key: "soothing",     label: "鎮静系",     icon: "🌿", color: "#80CBC4", desc: "肌荒れ防止成分" },
  { key: "keratin",      label: "角質ケア系", icon: "🧹", color: "#90A4AE", desc: "角質に作用する成分" },
] as const;

export function getCategoryByKey(key: string): Category | undefined {
  return CATEGORIES.find(c => c.key === key);
}
