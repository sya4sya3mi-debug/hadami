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
  // ─── 乾燥（22成分） ─────────────────────────────────
  {
    label: "乾燥",
    icon: "🏜️",
    color: "#4FC3F7",
    tip: "水分→NMF→油分の3層保湿が鍵",
    keyIngredients: [
      { id: "acetylated-hyaluronate", name: "アセチル化ヒアルロン酸Na", rarity: "rare", role: "肌なじみのよい保湿型ヒアルロン酸" },
      { id: "pca-na", name: "PCA-Na", rarity: "common", role: "天然保湿因子NMFの構成成分" },
      { id: "beta-glucan", name: "β-グルカン", rarity: "uncommon", role: "うるおいを守りながら肌を整える" },
      { id: "aloe-vera-leaf-extract", name: "アロエベラ葉エキス", rarity: "common", role: "みずみずしい保湿の植物成分" },
      { id: "cholesterol", name: "コレステロール", rarity: "uncommon", role: "セラミドと協働する角層脂質" },
      { id: "shea-butter", name: "シア脂", rarity: "uncommon", role: "こっくり油分で乾燥を防ぐ" },
      { id: "squalane", name: "スクワラン", rarity: "uncommon", role: "皮脂に近い油分でフタ" },
      { id: "ceramide-1", name: "セラミド1", rarity: "rare", role: "角層バリアを支える脂質" },
      { id: "ceramide-ap", name: "セラミドAP", rarity: "rare", role: "バリア機能を補強するセラミド" },
      { id: "ceramide-eop", name: "セラミドEOP", rarity: "rare", role: "角層脂質バランスを支える" },
      { id: "ceramide-eos", name: "セラミドEOS", rarity: "rare", role: "長鎖セラミドでバリア強化" },
      { id: "trehalose", name: "トレハロース", rarity: "uncommon", role: "水分保持でカサつきを防ぐ" },
      { id: "betaine", name: "ベタイン", rarity: "common", role: "水分バランスを整えるやさしい保湿" },
      { id: "jojoba-oil", name: "ホホバ種子油", rarity: "uncommon", role: "肌なじみのよい植物性油分" },
      { id: "polyquaternium-51", name: "ポリクオタニウム-51", rarity: "rare", role: "リピジュア。高保湿の人工脂質" },
      { id: "sodium-polyglutamate", name: "ポリグルタミン酸Na", rarity: "uncommon", role: "保湿膜をつくり持続保湿" },
      { id: "linoleic-acid", name: "リノール酸", rarity: "common", role: "肌バリアを支える必須脂肪酸" },
      { id: "hydrolyzed-collagen", name: "加水分解コラーゲン", rarity: "uncommon", role: "肌表面をしっとりなめらかに" },
      { id: "hydrolyzed-elastin", name: "加水分解エラスチン", rarity: "uncommon", role: "弾力感をサポートする保湿成分" },
      { id: "urea", name: "尿素", rarity: "common", role: "保水＋角質軟化のダブル効果" },
      { id: "water-soluble-proteoglycan", name: "水溶性プロテオグリカン", rarity: "rare", role: "ヒアルロン酸超えの保水力" },
      { id: "phytosphingosine", name: "フィトスフィンゴシン", rarity: "rare", role: "角層環境を整える補助脂質" },
    ],
  },

  // ─── くすみ（21成分） ────────────────────────────────
  {
    label: "くすみ",
    icon: "✨",
    color: "#CE93D8",
    tip: "ビタミンC＋ナイアシンアミドの併用で透明感",
    keyIngredients: [
      { id: "ascorbic-acid", name: "アスコルビン酸", rarity: "uncommon", role: "最も高活性なビタミンC" },
      { id: "ethyl-ascorbic-acid", name: "3-O-エチルアスコルビン酸", rarity: "rare", role: "安定性と活性を両立したVC誘導体" },
      { id: "ascorbyl-glucoside", name: "アスコルビルグルコシド", rarity: "uncommon", role: "穏やかで毎日使いやすいVC誘導体" },
      { id: "sodium-ascorbyl-phosphate", name: "アスコルビルリン酸Na", rarity: "uncommon", role: "安定性を高めたVC誘導体" },
      { id: "ascorbyl-tetraisopalmitate", name: "テトラヘキシルデカン酸アスコルビル", rarity: "rare", role: "油溶性VCでハリ・くすみケア" },
      { id: "trisodium-ascorbyl-palmitate-phosphate", name: "パルミチン酸アスコルビルリン酸3Na", rarity: "rare", role: "APPS。浸透感と安定性を両立" },
      { id: "magnesium-ascorbyl-phosphate", name: "リン酸アスコルビルMg", rarity: "uncommon", role: "皮脂・くすみケアのVC誘導体" },
      { id: "alpha-arbutin", name: "α-アルブチン", rarity: "rare", role: "安定性の高い透明感ケア成分" },
      { id: "arbutin", name: "アルブチン", rarity: "rare", role: "くすみ・色ムラケアの定番" },
      { id: "kojic-acid", name: "コウジ酸", rarity: "uncommon", role: "日本発の美白ケア成分" },
      { id: "tranexamic-acid", name: "トラネキサム酸", rarity: "rare", role: "肝斑にも使われる整肌成分" },
      { id: "ellagic-acid", name: "エラグ酸", rarity: "rare", role: "くすみ・色ムラへのアプローチ成分" },
      { id: "niacinamide", name: "ナイアシンアミド", rarity: "common", role: "メラニン輸送抑制の万能選手" },
      { id: "niacinamide-high", name: "ナイアシンアミド（高濃度）", rarity: "rare", role: "高濃度で攻めの透明感ケア" },
      { id: "phenylethyl-resorcinol", name: "フェニルエチルレゾルシノール", rarity: "rare", role: "次世代の美白ケア原料" },
      { id: "mulberry-extract", name: "クワエキス", rarity: "uncommon", role: "桑白皮由来の透明感サポート" },
      { id: "licorice-glabridin", name: "グラブリジン", rarity: "rare", role: "甘草由来の高機能整肌成分" },
      { id: "resorcinol", name: "レゾルシン", rarity: "uncommon", role: "角質ケア・整肌の多機能成分" },
      { id: "glutathione", name: "グルタチオン", rarity: "legendary", role: "抗酸化＋透明感ケアの注目成分" },
      { id: "acetyl-glucosamine", name: "アセチルグルコサミン", rarity: "uncommon", role: "保湿しながら明るさケア" },
      { id: "azelaic-acid", name: "アゼライン酸", rarity: "uncommon", role: "毛穴・ニキビ・色ムラの万能酸" },
    ],
  },

  // ─── ハリ（23成分） ──────────────────────────────────
  {
    label: "ハリ",
    icon: "📐",
    color: "#FFB74D",
    tip: "レチノール（夜）＋ペプチド（朝晩）で攻めのケア",
    keyIngredients: [
      { id: "retinol", name: "レチノール", rarity: "rare", role: "ターンオーバー促進のビタミンA" },
      { id: "retinal", name: "レチナール", rarity: "legendary", role: "レチノールより高活性なビタミンA" },
      { id: "retinyl-palmitate", name: "レチニルパルミテート", rarity: "uncommon", role: "穏やかなレチノール入門成分" },
      { id: "tocopheryl-retinoate", name: "レチノイン酸トコフェリル", rarity: "rare", role: "レチノール＋VEのハイブリッド" },
      { id: "retinyl-retinoate", name: "レチニルレチノエート", rarity: "rare", role: "穏やかな次世代レチノイド" },
      { id: "hydroxypinacolone-retinoate", name: "ヒドロキシピナコロンレチノエート", rarity: "rare", role: "高効率の新世代レチノイド" },
      { id: "palmitoyl-tripeptide-1", name: "パルミトイルトリペプチド-1", rarity: "rare", role: "コラーゲン産生を助けるペプチド" },
      { id: "tripeptide-1", name: "トリペプチド-1", rarity: "rare", role: "ハリ・弾力感を支えるペプチド" },
      { id: "peptide", name: "ペプチド", rarity: "legendary", role: "コラーゲン合成のキー成分" },
      { id: "acetyl-hexapeptide-8", name: "アセチルヘキサペプチド-8", rarity: "legendary", role: "表情ジワケアのアルジルリン" },
      { id: "oligopeptide-1", name: "オリゴペプチド-1", rarity: "legendary", role: "EGF様の高機能ペプチド" },
      { id: "acetyl-tetrapeptide-5", name: "アセチルテトラペプチド-5", rarity: "rare", role: "目元ケアのアイセリル" },
      { id: "adenosine", name: "アデノシン", rarity: "rare", role: "シワ改善の医薬部外品有効成分" },
      { id: "tocopherol", name: "トコフェロール", rarity: "uncommon", role: "抗酸化で肌をすこやかに保つVE" },
      { id: "tocopheryl-acetate", name: "トコフェロール酢酸エステル", rarity: "common", role: "安定性の高いVE誘導体" },
      { id: "tocopheryl-nicotinate", name: "トコフェロールニコチン酸エステル", rarity: "uncommon", role: "VE＋ナイアシンの複合体" },
      { id: "ubiquinone", name: "ユビキノン", rarity: "rare", role: "CoQ10。ハリ・つや感のケア" },
      { id: "ferulic-acid", name: "フェルラ酸", rarity: "uncommon", role: "VC・VEと協働する抗酸化成分" },
      { id: "resveratrol", name: "レスベラトロール", rarity: "rare", role: "植物由来の抗酸化ポリフェノール" },
      { id: "fullerene", name: "フラーレン", rarity: "legendary", role: "高い抗酸化力の先端成分" },
      { id: "astaxanthin", name: "アスタキサンチン", rarity: "legendary", role: "赤い色素の強力抗酸化成分" },
      { id: "carnosine", name: "カルノシン", rarity: "uncommon", role: "抗糖化・抗酸化のジペプチド" },
      { id: "caffeine", name: "カフェイン", rarity: "uncommon", role: "引き締め・むくみケア成分" },
    ],
  },

  // ─── 毛穴（13成分） ──────────────────────────────────
  {
    label: "毛穴",
    icon: "🔍",
    color: "#90A4AE",
    tip: "BHA/PHA→鎮静→保湿の3ステップ",
    keyIngredients: [
      { id: "salicylic-acid", name: "サリチル酸", rarity: "uncommon", role: "BHA。毛穴の皮脂を溶かすエース" },
      { id: "capryloyl-salicylic-acid", name: "カプリロイルサリチル酸", rarity: "rare", role: "LHA。穏やかなBHA系角質ケア" },
      { id: "glycolic-acid", name: "グリコール酸", rarity: "uncommon", role: "AHAの代表。角質ケアの定番" },
      { id: "lactic-acid", name: "乳酸", rarity: "uncommon", role: "保湿感もあるやさしいAHA" },
      { id: "mandelic-acid", name: "マンデル酸", rarity: "uncommon", role: "敏感肌OKのゆるやかAHA" },
      { id: "malic-acid", name: "リンゴ酸", rarity: "uncommon", role: "穏やかな角質ケアのフルーツ酸" },
      { id: "gluconolactone", name: "グルコノラクトン", rarity: "uncommon", role: "敏感肌でも使えるPHA" },
      { id: "lactobionic-acid", name: "ラクトビオン酸", rarity: "uncommon", role: "保湿力のあるPHA角質ケア" },
      { id: "citric-acid", name: "クエン酸", rarity: "common", role: "肌表面をなめらかに整える" },
      { id: "zinc-pca", name: "亜鉛PCA", rarity: "uncommon", role: "皮脂バランスを整える毛穴ケア成分" },
      { id: "glycyl-glycine", name: "グリシルグリシン", rarity: "uncommon", role: "毛穴の開き・キメを整えるジペプチド" },
      { id: "papain", name: "パパイン", rarity: "uncommon", role: "たんぱく質分解で角質をオフする酵素" },
      { id: "bentonite", name: "ベントナイト", rarity: "common", role: "皮脂・汚れ吸着のクレイ成分" },
    ],
  },

  // ─── 敏感（13成分） ──────────────────────────────────
  {
    label: "敏感",
    icon: "🛡️",
    color: "#81C784",
    tip: "バリア強化＋鎮静で守りのスキンケア",
    keyIngredients: [
      { id: "allantoin", name: "アラントイン", rarity: "uncommon", role: "肌あれを防ぎなめらかに整える" },
      { id: "dipotassium-glycyrrhizate", name: "グリチルリチン酸2K", rarity: "uncommon", role: "甘草由来の鎮静成分" },
      { id: "stearyl-glycyrrhetinate", name: "グリチルレチン酸ステアリル", rarity: "uncommon", role: "油性ベースでも使える鎮静成分" },
      { id: "colloidal-oatmeal", name: "コロイド性オートミール", rarity: "uncommon", role: "肌荒れ・かゆみ感を鎮める整肌成分" },
      { id: "oat-extract", name: "エンバクエキス", rarity: "uncommon", role: "やさしい保湿と肌あれ防止" },
      { id: "asiaticoside", name: "アシアチコシド", rarity: "uncommon", role: "ツボクサ由来の鎮静成分" },
      { id: "cica", name: "CICA", rarity: "uncommon", role: "ツボクサエキスの鎮静ケア" },
      { id: "calendula-extract", name: "カレンデュラエキス", rarity: "common", role: "おだやかに整える植物成分" },
      { id: "calendula-flower-extract", name: "カレンデュラ花エキス", rarity: "uncommon", role: "肌を守るマリーゴールド由来" },
      { id: "bisabolol", name: "ビサボロール", rarity: "uncommon", role: "カモミール由来の鎮静成分" },
      { id: "azulene", name: "アズレン", rarity: "uncommon", role: "青い色素の抗炎症成分" },
      { id: "green-tea-extract", name: "チャ葉エキス", rarity: "uncommon", role: "カテキンで肌を穏やかに整える" },
      { id: "titanium-dioxide", name: "酸化チタン", rarity: "common", role: "敏感肌向けの紫外線散乱剤" },
    ],
  },

  // ─── ニキビ（8成分） ─────────────────────────────────
  {
    label: "ニキビ",
    icon: "🫧",
    color: "#EF9A9A",
    tip: "殺菌＋皮脂吸着＋鎮静のトリプルケア",
    keyIngredients: [
      { id: "azelaic-acid", name: "アゼライン酸", rarity: "uncommon", role: "毛穴・ニキビ・色ムラの万能酸" },
      { id: "sulfur", name: "硫黄", rarity: "uncommon", role: "皮脂吸着・殺菌の定番成分" },
      { id: "hinokitiol", name: "ヒノキチオール", rarity: "uncommon", role: "天然由来の殺菌・整肌成分" },
      { id: "salicylic-acid", name: "サリチル酸", rarity: "uncommon", role: "BHA。ニキビケアのエース" },
      { id: "zinc-pca", name: "亜鉛PCA", rarity: "uncommon", role: "皮脂コントロールでニキビ予防" },
      { id: "niacinamide", name: "ナイアシンアミド", rarity: "common", role: "皮脂バランス＋肌荒れ防止の万能選手" },
      { id: "green-tea-extract", name: "チャ葉エキス", rarity: "uncommon", role: "殺菌・清潔サポートの植物成分" },
      { id: "bentonite", name: "ベントナイト", rarity: "common", role: "皮脂・汚れ吸着のクレイ成分" },
    ],
  },
];
