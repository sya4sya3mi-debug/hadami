import { Combination } from "@/types";

export const COMBINATIONS: readonly Combination[] = [
  // ─── 推奨の組み合わせ ─────────────────────────────────────
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
    pair: ["ナイアシンアミド", "セラミドNP"],
    type: "recommended",
    label: "バリア強化の定番組み合わせ",
    desc: "バリア機能に関わる成分同士の組み合わせとして文献で言及されています。",
    source: "皮膚科学の教科書等で言及",
  },
  {
    pair: ["ヒアルロン酸Na", "セラミドNP"],
    type: "recommended",
    label: "水分保持+バリア修復の組み合わせ",
    desc: "水分保持と細胞間脂質補充を同時にアプローチする組み合わせです。",
    source: "皮膚科学の教科書等で言及",
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
    label: "整肌成分のダブルアプローチ",
    desc: "異なるメカニズムで整肌にアプローチする組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["ナイアシンアミド", "α-アルブチン"],
    type: "recommended",
    label: "整肌成分の相乗アプローチ",
    desc: "安定性の高いα-アルブチンとナイアシンアミドの組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["レチノール", "ペプチド"],
    type: "recommended",
    label: "ハリ・弾力の多角的アプローチ",
    desc: "ビタミンAとペプチドを組み合わせたハリ系成分の重ね使いです。",
    source: "アンチエイジング皮膚科学の研究",
  },
  {
    pair: ["パンテノール", "アラントイン"],
    type: "recommended",
    label: "肌荒れケアのダブル鎮静",
    desc: "どちらも穏やかな鎮静成分で、敏感肌のケアに向いている組み合わせです。",
    source: "皮膚科学の一般的推奨",
  },
  {
    pair: ["セラミドNP", "コレステロール"],
    type: "recommended",
    label: "細胞間脂質の再現組み合わせ",
    desc: "皮膚科学的に理想的なバリア成分の比率に近づける組み合わせです。",
    source: "皮膚科学の教科書（Elias PM等）",
  },
  {
    pair: ["グリコール酸", "ヒアルロン酸Na"],
    type: "recommended",
    label: "角質ケア後の保湿補充",
    desc: "角質ケアで整えた後に保湿成分を補充する理にかなった組み合わせです。",
    source: "スキンケアの一般的推奨",
  },
  {
    pair: ["バクチオール", "ヒアルロン酸Na"],
    type: "recommended",
    label: "低刺激ハリケア+保湿",
    desc: "植物由来のレチノール代替成分に保湿をプラスした刺激の少ない組み合わせです。",
    source: "皮膚科学の研究文献",
  },
  {
    pair: ["ナイアシンアミド", "グリチルリチン酸2K"],
    type: "recommended",
    label: "整肌+鎮静の敏感肌向け組み合わせ",
    desc: "肌を整えながら鎮静もサポートする、敏感肌にも使いやすい組み合わせです。",
    source: "皮膚科学の一般的推奨",
  },
  {
    pair: ["アデノシン", "ペプチド"],
    type: "recommended",
    label: "ハリ系成分の相乗効果",
    desc: "異なるアプローチでハリに働きかける成分同士の組み合わせです。",
    source: "アンチエイジング研究文献",
  },

  // ─── 注意が必要な組み合わせ ──────────────────────────────
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
    label: "使用タイミングの分離を推奨",
    desc: "どちらも活性が高い成分のため、朝晩で分けて使用することが一般的です。",
    source: "皮膚科医の一般的な推奨事項",
  },
  {
    pair: ["グリコール酸", "レチノール"],
    type: "note",
    label: "AHA+レチノールの刺激に注意",
    desc: "どちらも皮膚ターンオーバーに作用するため、重複使用は刺激が出やすいとされています。",
    source: "皮膚科医の一般的な推奨事項",
  },
  {
    pair: ["乳酸", "レチノール"],
    type: "note",
    label: "酸系とレチノールの同時使用に注意",
    desc: "AHAがレチノールの効果を不安定にする可能性があるため、使用タイミングの分離が推奨されます。",
    source: "皮膚科医の一般的な推奨事項",
  },
  {
    pair: ["サリチル酸", "グリコール酸"],
    type: "note",
    label: "複数の剥離酸の重複使用に注意",
    desc: "BHAとAHAを同時に使用すると過剰な角質除去になる場合があります。",
    source: "皮膚科医の一般的な推奨事項",
  },
  {
    pair: ["レチナール", "サリチル酸"],
    type: "note",
    label: "高活性成分の重複にご注意",
    desc: "高い活性を持つレチナールと角質ケア成分の重複は刺激が出やすいとされています。",
    source: "皮膚科医の一般的な推奨事項",
  },
  {
    pair: ["アスコルビン酸", "グリコール酸"],
    type: "note",
    label: "高濃度酸の重複に注意",
    desc: "どちらも酸性の成分で、高濃度での重複使用は刺激になることがあります。",
    source: "皮膚科医の一般的な推奨事項",
  },
] as const;

export function findCombinations(ingredientNames: string[]): Combination[] {
  return COMBINATIONS.filter(combo =>
    combo.pair.every(name => ingredientNames.includes(name))
  );
}
