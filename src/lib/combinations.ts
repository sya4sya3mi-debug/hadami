import { Combination } from "@/types";

export const COMBINATIONS: readonly Combination[] = [
  {
    pair: ["ナイアシンアミド", "ヒアルロン酸Na"],
    type: "recommended",
    label: "保湿+バリアの定番組み合わせ",
    desc: "美容の専門書で頻繁に推奨される組み合わせです。",
    source: "皮膚科学の教科書等で言及",
  },
  {
    pair: ["アスコルビン酸", "トコフェロール"],
    type: "recommended",
    label: "ビタミンC+Eの定番組み合わせ",
    desc: "多くの研究論文で併用が検討されている組み合わせです。",
    source: "J. Am. Acad. Dermatol. 等で言及",
  },
  {
    pair: ["レチノール", "サリチル酸"],
    type: "note",
    label: "刺激性成分の重複にご注意",
    desc: "どちらも角質に作用する成分のため、皮膚科医は同時使用に注意を促しています。",
    source: "AAD（米国皮膚科学会）のガイドライン",
  },
  {
    pair: ["ナイアシンアミド", "セラミドNP"],
    type: "recommended",
    label: "バリア強化の定番組み合わせ",
    desc: "バリア機能に関わる成分同士の組み合わせとして文献で言及されています。",
    source: "皮膚科学の教科書等で言及",
  },
  {
    pair: ["アスコルビン酸", "レチノール"],
    type: "note",
    label: "使用タイミングの分離を推奨",
    desc: "どちらも活性が高い成分のため、朝晩で分けて使用することが一般的です。",
    source: "皮膚科医の一般的な推奨事項",
  },
] as const;

export function findCombinations(ingredientNames: string[]): Combination[] {
  return COMBINATIONS.filter(combo =>
    combo.pair.every(name => ingredientNames.includes(name))
  );
}
