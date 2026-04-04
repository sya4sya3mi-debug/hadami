import { Combination } from "@/types";

export const COMBINATIONS: readonly Combination[] = [
  // ─── 参考になる組み合わせ ─────────────────────────────────
  {
    pair: ["ナイアシンアミド", "ヒアルロン酸Na"],
    type: "recommended",
    label: "保湿成分どうしの組み合わせ",
    desc: "保湿とバリア系の文脈で併記されることが多い組み合わせです。",
    source: "皮膚科学・スキンケア解説で言及",
  },
  {
    pair: ["アスコルビン酸", "トコフェロール"],
    type: "recommended",
    label: "ビタミンC+Eの定番組み合わせ",
    desc: "多くの研究論文で併用が検討されている組み合わせです。",
    source: "J. Am. Acad. Dermatol. 等で言及",
  },
  {
    pair: ["ナイアシンアミド", "セラミドNP"],
    type: "recommended",
    label: "バリア系成分の組み合わせ",
    desc: "バリア機能に関わる成分同士の組み合わせとして文献で言及されています。",
    source: "皮膚科学・スキンケア解説で言及",
  },
  {
    pair: ["ヒアルロン酸Na", "セラミドNP"],
    type: "recommended",
    label: "保湿+バリア系の組み合わせ",
    desc: "保湿成分と細胞間脂質に関わる成分をあわせた組み合わせです。",
    source: "皮膚科学・スキンケア解説で言及",
  },
  {
    pair: ["グリセリン", "スクワラン"],
    type: "recommended",
    label: "水性+油性の保湿バランス",
    desc: "水分を引き込むグリセリンと油分で蓋をするスクワランの相補的な組み合わせです。",
    source: "スキンケアの基礎原則",
  },
  {
    pair: ["ナイアシンアミド", "アルブチン"],
    type: "recommended",
    label: "整肌成分の組み合わせ",
    desc: "異なる特徴を持つ整肌成分を組み合わせた例です。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["ナイアシンアミド", "α-アルブチン"],
    type: "recommended",
    label: "整肌成分どうしの組み合わせ",
    desc: "安定性の高いα-アルブチンとナイアシンアミドをあわせた組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["レチノール", "ペプチド"],
    type: "recommended",
    label: "ハリ系成分の組み合わせ",
    desc: "ビタミンAとペプチドをあわせたハリ系成分の組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["パンテノール", "アラントイン"],
    type: "recommended",
    label: "整肌成分の組み合わせ",
    desc: "どちらも整肌目的で使われることがある成分の組み合わせです。",
    source: "皮膚科学・スキンケア解説で言及",
  },
  {
    pair: ["セラミドNP", "コレステロール"],
    type: "recommended",
    label: "細胞間脂質に着目した組み合わせ",
    desc: "セラミドとコレステロールをあわせた、バリア成分の例として紹介される組み合わせです。",
    source: "皮膚科学の教科書（Elias PM等）",
  },
  {
    pair: ["グリコール酸", "ヒアルロン酸Na"],
    type: "recommended",
    label: "角質ケア後の保湿補充",
    desc: "角質ケア後に保湿成分を重ねる例として紹介される組み合わせです。",
    source: "スキンケア解説で言及",
  },
  {
    pair: ["バクチオール", "ヒアルロン酸Na"],
    type: "recommended",
    label: "バクチオール+保湿成分の組み合わせ",
    desc: "バクチオールに保湿成分をあわせた組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["ナイアシンアミド", "グリチルリチン酸2K"],
    type: "recommended",
    label: "整肌成分どうしの組み合わせ",
    desc: "整肌成分を組み合わせた例として紹介されることがあります。",
    source: "皮膚科学・スキンケア解説で言及",
  },
  {
    pair: ["アデノシン", "ペプチド"],
    type: "recommended",
    label: "ハリ系成分どうしの組み合わせ",
    desc: "異なる特徴を持つハリ系成分をあわせた組み合わせです。",
    source: "皮膚科学の研究文献",
  },

  // ─── 注意したい組み合わせ ──────────────────────────────
  {
    pair: ["レチノール", "サリチル酸"],
    type: "note",
    label: "刺激性成分の重複にご注意",
    desc: "どちらも角質に作用する成分のため、皮膚科医は同時使用に注意を促しています。",
    source: "AAD（米国皮膚科学会）のガイドライン",
  },
  {
    pair: ["アスコルビン酸", "レチノール"],
    type: "note",
    label: "使用タイミングを分ける例があります",
    desc: "どちらも活性が高い成分のため、朝晩で分けて使用することが一般的です。",
    source: "皮膚科領域の一般的な注意喚起",
  },
  {
    pair: ["グリコール酸", "レチノール"],
    type: "note",
    label: "AHA+レチノールの刺激に注意",
    desc: "どちらも角質ケアに関わる成分のため、重複使用は刺激が出やすいとされています。",
    source: "皮膚科領域の一般的な注意喚起",
  },
  {
    pair: ["乳酸", "レチノール"],
    type: "note",
    label: "酸系とレチノールの同時使用に注意",
    desc: "AHAとレチノールは、併用タイミングをずらして紹介されることがある組み合わせです。",
    source: "皮膚科領域の一般的な注意喚起",
  },
  {
    pair: ["サリチル酸", "グリコール酸"],
    type: "note",
    label: "複数の剥離酸の重複使用に注意",
    desc: "BHAとAHAを同時に使用すると過剰な角質除去になる場合があります。",
    source: "皮膚科領域の一般的な注意喚起",
  },
  {
    pair: ["レチナール", "サリチル酸"],
    type: "note",
    label: "高活性成分の重複にご注意",
    desc: "高い活性を持つレチナールと角質ケア成分の重複は刺激が出やすいとされています。",
    source: "皮膚科領域の一般的な注意喚起",
  },
  {
    pair: ["アスコルビン酸", "グリコール酸"],
    type: "note",
    label: "高濃度酸の重複に注意",
    desc: "どちらも酸性の成分で、高濃度での重複使用は刺激になることがあります。",
    source: "皮膚科領域の一般的な注意喚起",
  },
] as const;

export function findCombinations(ingredientNames: string[]): Combination[] {
  return COMBINATIONS.filter(combo =>
    combo.pair.every(name => ingredientNames.includes(name))
  );
}
