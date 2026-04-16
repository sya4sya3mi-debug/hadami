import { RarityKey } from "@/types";

export interface SkinConcernKeyIngredient {
  id: string;        // MASTER_INGREDIENTSのid
  name: string;      // 表示名
  rarity: RarityKey;
  role: string;      // 1行の説明
}

export interface SkinConcern {
  label: string;
  icon: string;
  color: string;
  tip: string;       // 1行のアドバイス
  keyIngredients: SkinConcernKeyIngredient[];
}

export const SKIN_CONCERNS: SkinConcern[] = [
  {
    label: "乾燥",
    icon: "🏜️",
    color: "#4FC3F7",
    tip: "水分→NMF→油分の3層保湿が鍵",
    keyIngredients: [
      { id: "sodium-hyaluronate", name: "ヒアルロン酸Na", rarity: "common", role: "水分を抱え込む王道保湿" },
      { id: "ceramide-np", name: "セラミドNP", rarity: "rare", role: "角層バリアを修復する脂質" },
      { id: "squalane", name: "スクワラン", rarity: "common", role: "皮脂に近い油分でフタ" },
      { id: "water-soluble-proteoglycan", name: "水溶性プロテオグリカン", rarity: "rare", role: "ヒアルロン酸超えの保水力" },
      { id: "ectoin", name: "エクトイン", rarity: "uncommon", role: "環境ストレスから肌を守る保護成分" },
    ],
  },
  {
    label: "くすみ",
    icon: "✨",
    color: "#CE93D8",
    tip: "ビタミンC+ナイアシンアミドの併用で透明感",
    keyIngredients: [
      { id: "niacinamide", name: "ナイアシンアミド", rarity: "common", role: "メラニン輸送抑制の万能選手" },
      { id: "ascorbic-acid", name: "アスコルビン酸", rarity: "uncommon", role: "最も高活性なビタミンC" },
      { id: "tranexamic-acid", name: "トラネキサム酸", rarity: "rare", role: "肝斑にも使われる整肌成分" },
      { id: "alpha-arbutin", name: "α-アルブチン", rarity: "rare", role: "安定性の高い透明感ケア成分" },
      { id: "phenylethyl-resorcinol", name: "フェニルエチルレゾルシノール", rarity: "rare", role: "次世代の美白ケア原料" },
    ],
  },
  {
    label: "ハリ",
    icon: "📐",
    color: "#FFB74D",
    tip: "レチノール（夜）+ペプチド（朝晩）で攻めのケア",
    keyIngredients: [
      { id: "retinol", name: "レチノール", rarity: "rare", role: "ターンオーバー促進のビタミンA" },
      { id: "copper-tripeptide-1", name: "銅トリペプチド-1", rarity: "legendary", role: "コラーゲン合成の伝説ペプチド" },
      { id: "adenosine", name: "アデノシン", rarity: "uncommon", role: "シワ改善の医薬部外品有効成分" },
      { id: "palmitoyl-tripeptide-1", name: "パルミトイルトリペプチド-1", rarity: "rare", role: "コラーゲン産生を助けるペプチド" },
      { id: "bakuchiol", name: "バクチオール", rarity: "rare", role: "植物由来のレチノール代替" },
    ],
  },
  {
    label: "毛穴",
    icon: "🔍",
    color: "#90A4AE",
    tip: "BHA/PHA→鎮静→保湿の3ステップ",
    keyIngredients: [
      { id: "salicylic-acid", name: "サリチル酸", rarity: "rare", role: "BHA。毛穴の皮脂を溶かすエース" },
      { id: "lactobionic-acid", name: "ラクトビオン酸", rarity: "uncommon", role: "敏感肌OKのPHA角質ケア" },
      { id: "glycyl-glycine", name: "グリシルグリシン", rarity: "uncommon", role: "毛穴の開き・キメを整えるジペプチド" },
      { id: "zinc-pca", name: "亜鉛PCA", rarity: "uncommon", role: "皮脂バランスを整える毛穴ケア成分" },
      { id: "centella-asiatica-extract", name: "ツボクサエキス", rarity: "uncommon", role: "CICA。ピーリング後の鎮静に" },
    ],
  },
  {
    label: "敏感",
    icon: "🛡️",
    color: "#81C784",
    tip: "バリア強化+鎮静で守りのスキンケア",
    keyIngredients: [
      { id: "panthenol", name: "パンテノール", rarity: "common", role: "ビタミンB5。バリア修復の万能選手" },
      { id: "madecassoside", name: "マデカッソシド", rarity: "uncommon", role: "CICAの活性成分" },
      { id: "dipotassium-glycyrrhizate", name: "グリチルリチン酸2K", rarity: "common", role: "甘草由来の鎮静成分" },
      { id: "colloidal-oatmeal", name: "コロイド性オートミール", rarity: "uncommon", role: "肌荒れ・かゆみ感を鎮める整肌成分" },
      { id: "allantoin", name: "アラントイン", rarity: "common", role: "肌あれを防ぎ、なめらかに整える" },
    ],
  },
  {
    label: "ニキビ",
    icon: "🫧",
    color: "#EF9A9A",
    tip: "殺菌+皮脂吸着+鎮静のトリプルケア",
    keyIngredients: [
      { id: "azelaic-acid", name: "アゼライン酸", rarity: "uncommon", role: "毛穴・ニキビ・色ムラの万能酸" },
      { id: "isopropylmethylphenol", name: "イソプロピルメチルフェノール", rarity: "uncommon", role: "殺菌・ニキビケアの有効成分" },
      { id: "tea-tree-oil", name: "ティーツリー葉油", rarity: "common", role: "清潔感サポートの人気精油" },
      { id: "sulfur", name: "硫黄", rarity: "uncommon", role: "皮脂吸着・殺菌の定番成分" },
      { id: "houttuynia-cordata-extract", name: "ドクダミエキス", rarity: "common", role: "皮脂バランスを整える和漢植物" },
    ],
  },
];
