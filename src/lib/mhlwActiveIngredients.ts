/**
 * 厚労省承認 医薬部外品有効成分マスター＋エイリアス辞書
 *
 * - canonicalName: ingredients.ts の nameJa と一致する正規名
 * - mhlwName:      厚労省告示の医薬部外品表示名称（パッケージ記載名）
 * - aliases:       表記ゆれ全パターン（OCR/Web検索で拾い得る名称）
 * - inciNames:     INCI名
 * - approvedUses:  承認用途 ("美白","肌荒れ防止","シワ改善","紫外線防止","殺菌","保湿","制汗","育毛","角質ケア")
 * - masterDbId:    ingredients.ts の id
 */

export interface MhlwActiveIngredient {
  canonicalName: string;
  mhlwName: string;
  aliases: string[];
  inciNames: string[];
  approvedUses: string[];
  masterDbId: string;
}

// スキンケア用途の薬用化粧品として扱う承認用途のみを表示対象にする。
const QUASI_DRUG_COSMETIC_APPROVED_USES = new Set([
  "美白",
  "肌荒れ防止",
  "シワ改善",
  "紫外線防止",
  "保湿",
  "角質ケア",
]);

// 薬用化粧品ではなく医薬品寄りの扱いになる代表例は明示的に除外する。
const EXCLUDED_QUASI_DRUG_COSMETIC_MASTER_DB_IDS = new Set([
  "heparinoid",
]);

// ────────────────────────────────────────────────────────────────
// 有効成分リスト
// ────────────────────────────────────────────────────────────────

export const MHLW_ACTIVE_INGREDIENTS: MhlwActiveIngredient[] = [
  // ═══ 美白有効成分 ═══════════════════════════════════════════
  {
    canonicalName: "ナイアシンアミド",
    mhlwName: "ニコチン酸アミド",
    aliases: ["ナイアシンアミド", "ニコチン酸アミド", "ビタミンB3"],
    inciNames: ["Niacinamide", "Nicotinamide"],
    approvedUses: ["美白", "肌荒れ防止", "シワ改善"],
    masterDbId: "niacinamide",
  },
  {
    canonicalName: "ニコチン酸アミド",
    mhlwName: "ニコチン酸アミド",
    aliases: ["ニコチン酸アミド"],
    inciNames: ["Nicotinamide"],
    approvedUses: ["美白", "肌荒れ防止"],
    masterDbId: "nicotinamide",
  },
  {
    canonicalName: "アルブチン",
    mhlwName: "アルブチン",
    aliases: ["アルブチン", "α-アルブチン", "β-アルブチン"],
    inciNames: ["Arbutin", "Alpha-Arbutin"],
    approvedUses: ["美白"],
    masterDbId: "arbutin",
  },
  {
    canonicalName: "トラネキサム酸",
    mhlwName: "トラネキサム酸",
    aliases: ["トラネキサム酸", "m-トラネキサム酸"],
    inciNames: ["Tranexamic Acid"],
    approvedUses: ["美白", "肌荒れ防止"],
    masterDbId: "tranexamic-acid",
  },
  {
    canonicalName: "アスコルビルグルコシド",
    mhlwName: "L-アスコルビン酸 2-グルコシド",
    aliases: [
      "アスコルビルグルコシド",
      "L-アスコルビン酸 2-グルコシド",
      "L-アスコルビン酸2-グルコシド",
      "AA2G",
    ],
    inciNames: ["Ascorbyl Glucoside"],
    approvedUses: ["美白"],
    masterDbId: "ascorbyl-glucoside",
  },
  {
    canonicalName: "アスコルビン酸2-グルコシド",
    mhlwName: "L-アスコルビン酸 2-グルコシド",
    aliases: ["アスコルビン酸2-グルコシド"],
    inciNames: ["Ascorbic Acid 2-Glucoside"],
    approvedUses: ["美白"],
    masterDbId: "ascorbic-acid-2-glucoside",
  },
  {
    canonicalName: "3-O-エチルアスコルビン酸",
    mhlwName: "3-O-エチルアスコルビン酸",
    aliases: [
      "3-O-エチルアスコルビン酸",
      "VCエチル",
      "ビタミンCエチル",
    ],
    inciNames: ["3-O-Ethyl Ascorbic Acid"],
    approvedUses: ["美白"],
    masterDbId: "ethyl-ascorbic-acid",
  },
  {
    canonicalName: "コウジ酸",
    mhlwName: "コウジ酸",
    aliases: ["コウジ酸"],
    inciNames: ["Kojic Acid"],
    approvedUses: ["美白"],
    masterDbId: "kojic-acid",
  },
  {
    canonicalName: "4MSK",
    mhlwName: "4-メトキシサリチル酸カリウム塩",
    aliases: [
      "4MSK",
      "4-メトキシサリチル酸カリウム塩",
      "4-メトキシサリチル酸カリウム",
    ],
    inciNames: ["4-Methoxysalicylic Acid Potassium Salt"],
    approvedUses: ["美白"],
    masterDbId: "4msk",
  },
  {
    canonicalName: "エラグ酸",
    mhlwName: "エラグ酸",
    aliases: ["エラグ酸"],
    inciNames: ["Ellagic Acid"],
    approvedUses: ["美白"],
    masterDbId: "ellagic-acid",
  },
  {
    canonicalName: "リン酸アスコルビルMg",
    mhlwName: "リン酸L-アスコルビルマグネシウム",
    aliases: [
      "リン酸アスコルビルMg",
      "リン酸L-アスコルビルマグネシウム",
      "APM",
      "VC-PMG",
    ],
    inciNames: ["Magnesium Ascorbyl Phosphate"],
    approvedUses: ["美白"],
    masterDbId: "magnesium-ascorbyl-phosphate",
  },
  {
    canonicalName: "ルシノール",
    mhlwName: "4-n-ブチルレゾルシノール",
    aliases: [
      "ルシノール",
      "4-n-ブチルレゾルシノール",
    ],
    inciNames: ["4-n-Butylresorcinol"],
    approvedUses: ["美白"],
    masterDbId: "rucinol",
  },
  {
    canonicalName: "リノール酸",
    mhlwName: "リノール酸",
    aliases: ["リノール酸"],
    inciNames: ["Linoleic Acid"],
    approvedUses: ["美白"],
    masterDbId: "linoleic-acid",
  },
  {
    canonicalName: "プラセンタエキス",
    mhlwName: "プラセンタエキス(1)",
    aliases: [
      "プラセンタエキス",
      "プラセンタエキス(1)",
      "プラセンタエキス（1）",
    ],
    inciNames: ["Placenta Extract"],
    approvedUses: ["美白"],
    masterDbId: "placenta-extract",
  },
  {
    canonicalName: "カモミラET",
    mhlwName: "カモミラET",
    aliases: ["カモミラET", "カミツレエキス"],
    inciNames: ["Chamomilla Recutita Extract"],
    approvedUses: ["美白"],
    masterDbId: "chamomile-et",
  },
  {
    canonicalName: "マグノリグナン",
    mhlwName: "マグノリグナン",
    aliases: ["マグノリグナン"],
    inciNames: ["5,5'-Dipropyl-biphenyl-2,2'-diol"],
    approvedUses: ["美白"],
    masterDbId: "magnolignans",
  },
  {
    canonicalName: "トラネキサム酸セチル塩酸塩",
    mhlwName: "トラネキサム酸セチル塩酸塩",
    aliases: ["トラネキサム酸セチル塩酸塩", "TXC"],
    inciNames: ["Cetyl Tranexamate HCl"],
    approvedUses: ["美白"],
    masterDbId: "txc",
  },
  {
    canonicalName: "デクスパンテノールW",
    mhlwName: "デクスパンテノールW",
    aliases: ["デクスパンテノールW"],
    inciNames: ["Dexpanthenol"],
    approvedUses: ["美白"],
    masterDbId: "dexpanthenol-w",
  },
  {
    canonicalName: "ビタミンCエチルアミド",
    mhlwName: "ビタミンCエチルアミド",
    aliases: ["ビタミンCエチルアミド"],
    inciNames: ["Ascorbic Acid Ethylamide"],
    approvedUses: ["美白"],
    masterDbId: "ascorbyl-ethylamide",
  },
  {
    canonicalName: "アデノシン一リン酸二ナトリウムOT",
    mhlwName: "アデノシン一リン酸二ナトリウムOT",
    aliases: ["アデノシン一リン酸二ナトリウムOT", "ADM"],
    inciNames: ["Disodium Adenosine Monophosphate"],
    approvedUses: ["美白"],
    masterDbId: "adm",
  },
  {
    canonicalName: "リノール酸S",
    mhlwName: "リノール酸S",
    aliases: ["リノール酸S"],
    inciNames: ["Linoleic Acid S"],
    approvedUses: ["美白"],
    masterDbId: "linoleic-acid-s",
  },
  {
    canonicalName: "PCE-DP",
    mhlwName: "PCE-DP",
    aliases: ["PCE-DP"],
    inciNames: ["Retinol Palmitate Derivative"],
    approvedUses: ["美白", "シワ改善"],
    masterDbId: "pcx-1",
  },
  {
    canonicalName: "パルミチン酸アスコルビル",
    mhlwName: "パルミチン酸L-アスコルビル",
    aliases: [
      "パルミチン酸アスコルビル",
      "パルミチン酸L-アスコルビル",
    ],
    inciNames: ["Ascorbyl Palmitate"],
    approvedUses: ["美白"],
    masterDbId: "ascorbyl-palmitate",
  },
  {
    canonicalName: "L-アスコルビン酸リン酸エステルナトリウム",
    mhlwName: "L-アスコルビン酸リン酸エステルナトリウム",
    aliases: [
      "L-アスコルビン酸リン酸エステルナトリウム",
      "APS",
      "リン酸アスコルビルNa",
    ],
    inciNames: ["Sodium L-Ascorbyl-2-Phosphate"],
    approvedUses: ["美白"],
    masterDbId: "sodium-l-ascorbyl-2-phosphate",
  },

  // ═══ シワ改善有効成分 ═══════════════════════════════════════
  {
    canonicalName: "レチノール",
    mhlwName: "レチノール",
    aliases: ["レチノール", "純粋レチノール", "ビタミンA"],
    inciNames: ["Retinol"],
    approvedUses: ["シワ改善"],
    masterDbId: "retinol",
  },
  {
    canonicalName: "ニールワン",
    mhlwName: "三フッ化イソプロピルオキソプロピルアミノカルボニルピロリジンカルボニルメチルプロピルアミノカルボニルベンゾイルアミノ酢酸Na",
    aliases: ["ニールワン", "NEI-L1"],
    inciNames: ["Trifluoroacetyl Tripeptide-2"],
    approvedUses: ["シワ改善"],
    masterDbId: "niel-one",
  },
  {
    canonicalName: "ライスパワーNo.11+",
    mhlwName: "ライスパワーNo.11+",
    aliases: ["ライスパワーNo.11+", "ライスパワーNo.11＋", "ライスパワー®No.11+"],
    inciNames: ["Rice Ferment Filtrate No.11+"],
    approvedUses: ["シワ改善"],
    masterDbId: "rice-power-no11-plus",
  },
  {
    canonicalName: "VEP-M",
    mhlwName: "VEP-M",
    aliases: ["VEP-M"],
    inciNames: ["dl-alpha-Tocopheryl Phosphate Ester"],
    approvedUses: ["シワ改善"],
    masterDbId: "vep-m",
  },

  // ═══ 肌荒れ防止・抗炎症有効成分 ═══════════════════════════
  {
    canonicalName: "アラントイン",
    mhlwName: "アラントイン",
    aliases: ["アラントイン"],
    inciNames: ["Allantoin"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "allantoin",
  },
  {
    canonicalName: "グリチルリチン酸2K",
    mhlwName: "グリチルリチン酸ジカリウム",
    aliases: [
      "グリチルリチン酸2K",
      "グリチルリチン酸ジカリウム",
      "グリチルリチン酸二カリウム",
    ],
    inciNames: ["Dipotassium Glycyrrhizate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "dipotassium-glycyrrhizate",
  },
  {
    canonicalName: "グリチルレチン酸ステアリル",
    mhlwName: "グリチルレチン酸ステアリル",
    aliases: ["グリチルレチン酸ステアリル"],
    inciNames: ["Stearyl Glycyrrhetinate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "stearyl-glycyrrhetinate",
  },
  {
    canonicalName: "酢酸dl-α-トコフェロール",
    mhlwName: "酢酸dl-α-トコフェロール",
    aliases: [
      "酢酸dl-α-トコフェロール",
      "酢酸DL-α-トコフェロール",
      "酢酸トコフェロール",
    ],
    inciNames: ["dl-alpha-Tocopheryl Acetate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "dl-alpha-tocopheryl-acetate",
  },
  {
    canonicalName: "ピリドキシン塩酸塩",
    mhlwName: "ピリドキシン塩酸塩",
    aliases: ["ピリドキシン塩酸塩", "ビタミンB6塩酸塩"],
    inciNames: ["Pyridoxine HCl"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "pyridoxine-hcl",
  },
  {
    canonicalName: "グリチルリチン酸モノアンモニウム",
    mhlwName: "グリチルリチン酸モノアンモニウム",
    aliases: ["グリチルリチン酸モノアンモニウム"],
    inciNames: ["Ammonium Glycyrrhizinate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "glycyrrhizinate-monoammonium",
  },
  {
    canonicalName: "β-グリチルレチン酸",
    mhlwName: "β-グリチルレチン酸",
    aliases: ["β-グリチルレチン酸", "ベータグリチルレチン酸"],
    inciNames: ["beta-Glycyrrhetinic Acid"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "beta-glycyrrhetinic-acid",
  },
  {
    canonicalName: "ジフェンヒドラミン塩酸塩",
    mhlwName: "ジフェンヒドラミン塩酸塩",
    aliases: ["ジフェンヒドラミン塩酸塩"],
    inciNames: ["Diphenhydramine HCl"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "diphenhydramine-hcl",
  },
  {
    canonicalName: "dl-カンフル",
    mhlwName: "dl-カンフル",
    aliases: ["dl-カンフル", "dl-カンフォル", "カンフル", "樟脳"],
    inciNames: ["dl-Camphor"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "d-camphor",
  },
  {
    canonicalName: "ε-アミノカプロン酸",
    mhlwName: "ε-アミノカプロン酸",
    aliases: ["ε-アミノカプロン酸", "イプシロンアミノカプロン酸"],
    inciNames: ["epsilon-Aminocaproic Acid"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "epsilon-aminocaproic-acid",
  },
  {
    canonicalName: "アミノカプロン酸",
    mhlwName: "アミノカプロン酸",
    aliases: ["アミノカプロン酸"],
    inciNames: ["Aminocaproic Acid"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "aminocaproic-acid",
  },
  {
    canonicalName: "塩化リゾチーム",
    mhlwName: "塩化リゾチーム",
    aliases: ["塩化リゾチーム", "リゾチーム塩酸塩"],
    inciNames: ["Lysozyme Chloride"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "lysozyme-chloride",
  },
  {
    canonicalName: "クロルフェニラミンマレイン酸塩",
    mhlwName: "クロルフェニラミンマレイン酸塩",
    aliases: ["クロルフェニラミンマレイン酸塩", "マレイン酸クロルフェニラミン"],
    inciNames: ["Chlorpheniramine Maleate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "chlorpheniramine-maleate",
  },
  {
    canonicalName: "酸化亜鉛（収れん）",
    mhlwName: "酸化亜鉛",
    aliases: ["酸化亜鉛（収れん）", "酸化亜鉛"],
    inciNames: ["Zinc Oxide"],
    approvedUses: ["肌荒れ防止", "紫外線防止"],
    masterDbId: "zinc-oxide-active",
  },
  {
    canonicalName: "ビタミンA油",
    mhlwName: "ビタミンA油",
    aliases: ["ビタミンA油"],
    inciNames: ["Retinol Palmitate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "vitamin-a-oil",
  },
  {
    canonicalName: "グリチルリチン酸二カリウム（一水和物）",
    mhlwName: "グリチルリチン酸二カリウム（一水和物）",
    aliases: ["グリチルリチン酸二カリウム（一水和物）", "グリチルリチン酸ジカリウム（一水和物）"],
    inciNames: ["Dipotassium Glycyrrhizate Monohydrate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "dipotassium-glycyrrhizate-monohydrate",
  },
  {
    canonicalName: "グリチルリチン酸ジカリウム液",
    mhlwName: "グリチルリチン酸ジカリウム液",
    aliases: ["グリチルリチン酸ジカリウム液"],
    inciNames: ["Dipotassium Glycyrrhizate Solution"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "dipotassium-glycyrrhizate-liquid",
  },
  {
    canonicalName: "感光素201号",
    mhlwName: "感光素201号",
    aliases: ["感光素201号", "感光素201"],
    inciNames: ["Photosensitizer 201"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "photosensitizer-201",
  },
  {
    canonicalName: "グアイアズレンスルホン酸Na",
    mhlwName: "グアイアズレンスルホン酸ナトリウム",
    aliases: [
      "グアイアズレンスルホン酸Na",
      "グアイアズレンスルホン酸ナトリウム",
      "アズレンスルホン酸ナトリウム",
    ],
    inciNames: ["Sodium Guaiazulene Sulfonate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "guaiazulene-sulfonate",
  },
  {
    canonicalName: "フィトール",
    mhlwName: "フィトール",
    aliases: ["フィトール"],
    inciNames: ["Phytol"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "phytol",
  },
  {
    canonicalName: "グリチルリチン",
    mhlwName: "グリチルリチン",
    aliases: ["グリチルリチン"],
    inciNames: ["Glycyrrhizin"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "glycyrrhizin",
  },
  {
    canonicalName: "dl-α-トコフェロール",
    mhlwName: "dl-α-トコフェロール",
    aliases: [
      "dl-α-トコフェロール",
      "dl-アルファ-トコフェロール",
      "DL-α-トコフェロール",
      "トコフェロール",
    ],
    inciNames: ["dl-alpha-Tocopherol"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "tocopherol-acetate-dl",
  },
  {
    canonicalName: "酢酸トコフェロール",
    mhlwName: "酢酸トコフェロール",
    aliases: ["酢酸トコフェロール"],
    inciNames: ["Tocopheryl Acetate"],
    approvedUses: ["肌荒れ防止"],
    masterDbId: "tocopheryl-acetate",
  },

  // ═══ 殺菌有効成分 ═══════════════════════════════════════════
  {
    canonicalName: "イソプロピルメチルフェノール",
    mhlwName: "イソプロピルメチルフェノール",
    aliases: ["イソプロピルメチルフェノール", "IPMP"],
    inciNames: ["Isopropyl Methylphenol"],
    approvedUses: ["殺菌"],
    masterDbId: "isopropylmethylphenol",
  },
  {
    canonicalName: "塩化セチルピリジニウム",
    mhlwName: "塩化セチルピリジニウム",
    aliases: ["塩化セチルピリジニウム", "CPC"],
    inciNames: ["Cetylpyridinium Chloride"],
    approvedUses: ["殺菌"],
    masterDbId: "cetylpyridinium-chloride",
  },
  {
    canonicalName: "塩化ベンザルコニウム",
    mhlwName: "塩化ベンザルコニウム",
    aliases: ["塩化ベンザルコニウム"],
    inciNames: ["Benzalkonium Chloride"],
    approvedUses: ["殺菌"],
    masterDbId: "benzalkonium-chloride",
  },
  {
    canonicalName: "塩化ベンゼトニウム",
    mhlwName: "塩化ベンゼトニウム",
    aliases: ["塩化ベンゼトニウム"],
    inciNames: ["Benzethonium Chloride"],
    approvedUses: ["殺菌"],
    masterDbId: "benzethonium-chloride",
  },
  {
    canonicalName: "クロルヘキシジングルコン酸塩",
    mhlwName: "クロルヘキシジングルコン酸塩",
    aliases: ["クロルヘキシジングルコン酸塩", "グルコン酸クロルヘキシジン"],
    inciNames: ["Chlorhexidine Digluconate"],
    approvedUses: ["殺菌"],
    masterDbId: "chlorhexidine-gluconate",
  },
  {
    canonicalName: "トリクロサン",
    mhlwName: "トリクロサン",
    aliases: ["トリクロサン"],
    inciNames: ["Triclosan"],
    approvedUses: ["殺菌"],
    masterDbId: "triclosan",
  },
  {
    canonicalName: "ピロクトンオラミン",
    mhlwName: "ピロクトンオラミン",
    aliases: ["ピロクトンオラミン", "オクトピロックス"],
    inciNames: ["Piroctone Olamine"],
    approvedUses: ["殺菌"],
    masterDbId: "piroctone-olamine",
  },
  {
    canonicalName: "レゾルシン",
    mhlwName: "レゾルシン",
    aliases: ["レゾルシン", "レゾルシノール"],
    inciNames: ["Resorcinol"],
    approvedUses: ["殺菌", "角質ケア"],
    masterDbId: "resorcinol",
  },
  {
    canonicalName: "イオウ",
    mhlwName: "イオウ",
    aliases: ["イオウ", "硫黄"],
    inciNames: ["Sulfur"],
    approvedUses: ["殺菌", "角質ケア"],
    masterDbId: "sulfur-active",
  },
  {
    canonicalName: "過酸化ベンゾイル",
    mhlwName: "過酸化ベンゾイル",
    aliases: ["過酸化ベンゾイル", "BPO"],
    inciNames: ["Benzoyl Peroxide"],
    approvedUses: ["殺菌", "角質ケア"],
    masterDbId: "benzoyl-peroxide",
  },
  {
    canonicalName: "ミコナゾール硝酸塩",
    mhlwName: "ミコナゾール硝酸塩",
    aliases: ["ミコナゾール硝酸塩"],
    inciNames: ["Miconazole Nitrate"],
    approvedUses: ["殺菌"],
    masterDbId: "miconazole-nitrate",
  },
  {
    canonicalName: "トリクロカルバン",
    mhlwName: "トリクロカルバン",
    aliases: ["トリクロカルバン"],
    inciNames: ["Triclocarban"],
    approvedUses: ["殺菌"],
    masterDbId: "triclocarban",
  },
  {
    canonicalName: "ヒノキチオール",
    mhlwName: "ヒノキチオール",
    aliases: ["ヒノキチオール"],
    inciNames: ["Hinokitiol"],
    approvedUses: ["殺菌"],
    masterDbId: "hinokitiol",
  },
  {
    canonicalName: "ジフェニルグリコールエーテル",
    mhlwName: "ジフェニルグリコールエーテル",
    aliases: ["ジフェニルグリコールエーテル"],
    inciNames: ["Diphenyl Glycol Ether"],
    approvedUses: ["殺菌"],
    masterDbId: "glycol-diphenyl-ether",
  },
  {
    canonicalName: "ジンクピリチオン",
    mhlwName: "ジンクピリチオン",
    aliases: ["ジンクピリチオン", "ジンクピリチオン液"],
    inciNames: ["Zinc Pyrithione"],
    approvedUses: ["殺菌"],
    masterDbId: "zinc-pyrithione",
  },
  {
    canonicalName: "クリンバゾール",
    mhlwName: "クリンバゾール",
    aliases: ["クリンバゾール"],
    inciNames: ["Climbazole"],
    approvedUses: ["殺菌"],
    masterDbId: "climbazole",
  },

  // ═══ 紫外線防止有効成分 ═════════════════════════════════════
  {
    canonicalName: "メトキシケイヒ酸エチルヘキシル",
    mhlwName: "パラメトキシケイ皮酸2-エチルヘキシル",
    aliases: [
      "メトキシケイヒ酸エチルヘキシル",
      "パラメトキシケイ皮酸2-エチルヘキシル",
      "メトキシケイヒ酸オクチル",
    ],
    inciNames: ["Ethylhexyl Methoxycinnamate"],
    approvedUses: ["紫外線防止"],
    masterDbId: "ethylhexyl-methoxycinnamate",
  },
  {
    canonicalName: "酸化亜鉛",
    mhlwName: "酸化亜鉛",
    aliases: ["酸化亜鉛"],
    inciNames: ["Zinc Oxide"],
    approvedUses: ["紫外線防止"],
    masterDbId: "zinc-oxide",
  },
  {
    canonicalName: "酸化チタン",
    mhlwName: "酸化チタン",
    aliases: ["酸化チタン", "微粒子酸化チタン"],
    inciNames: ["Titanium Dioxide"],
    approvedUses: ["紫外線防止"],
    masterDbId: "titanium-dioxide",
  },
  {
    canonicalName: "t-ブチルメトキシジベンゾイルメタン",
    mhlwName: "t-ブチルメトキシジベンゾイルメタン",
    aliases: [
      "t-ブチルメトキシジベンゾイルメタン",
      "アボベンゾン",
    ],
    inciNames: ["Butyl Methoxydibenzoylmethane"],
    approvedUses: ["紫外線防止"],
    masterDbId: "avobenzone",
  },
  {
    canonicalName: "ビスエチルヘキシルオキシフェノールメトキシフェニルトリアジン",
    mhlwName: "ビスエチルヘキシルオキシフェノールメトキシフェニルトリアジン",
    aliases: [
      "ビスエチルヘキシルオキシフェノールメトキシフェニルトリアジン",
      "Tinosorb S",
      "ティノソーブS",
    ],
    inciNames: ["Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine"],
    approvedUses: ["紫外線防止"],
    masterDbId: "tinosorb-s",
  },
  {
    canonicalName: "オクトクリレン",
    mhlwName: "オクトクリレン",
    aliases: ["オクトクリレン"],
    inciNames: ["Octocrylene"],
    approvedUses: ["紫外線防止"],
    masterDbId: "octocrylene",
  },
  {
    canonicalName: "ユビナールAプラス",
    mhlwName: "ジエチルアミノヒドロキシベンゾイル安息香酸ヘキシル",
    aliases: [
      "ユビナールAプラス",
      "ジエチルアミノヒドロキシベンゾイル安息香酸ヘキシル",
    ],
    inciNames: ["Diethylamino Hydroxybenzoyl Hexyl Benzoate"],
    approvedUses: ["紫外線防止"],
    masterDbId: "uvinul-a-plus",
  },
  {
    canonicalName: "ビスオクトリゾール",
    mhlwName: "メチレンビスベンゾトリアゾリルテトラメチルブチルフェノール",
    aliases: [
      "ビスオクトリゾール",
      "メチレンビスベンゾトリアゾリルテトラメチルブチルフェノール",
      "Tinosorb M",
      "ティノソーブM",
    ],
    inciNames: ["Methylene Bis-Benzotriazolyl Tetramethylbutylphenol"],
    approvedUses: ["紫外線防止"],
    masterDbId: "bisoctrizole",
  },
  {
    canonicalName: "ホモサレート",
    mhlwName: "ホモサレート",
    aliases: ["ホモサレート"],
    inciNames: ["Homosalate"],
    approvedUses: ["紫外線防止"],
    masterDbId: "homosalate",
  },
  {
    canonicalName: "サリチル酸エチルヘキシル",
    mhlwName: "サリチル酸エチルヘキシル",
    aliases: ["サリチル酸エチルヘキシル", "オクチサレート"],
    inciNames: ["Ethylhexyl Salicylate"],
    approvedUses: ["紫外線防止"],
    masterDbId: "ethylhexyl-salicylate",
  },
  {
    canonicalName: "ベンゾフェノン-3",
    mhlwName: "オキシベンゾン",
    aliases: ["ベンゾフェノン-3", "オキシベンゾン"],
    inciNames: ["Benzophenone-3"],
    approvedUses: ["紫外線防止"],
    masterDbId: "benzophenone-3",
  },
  {
    canonicalName: "フェニルベンゾイミダゾールスルホン酸",
    mhlwName: "フェニルベンゾイミダゾールスルホン酸",
    aliases: ["フェニルベンゾイミダゾールスルホン酸", "エンスリゾール"],
    inciNames: ["Phenylbenzimidazole Sulfonic Acid"],
    approvedUses: ["紫外線防止"],
    masterDbId: "ensulizole",
  },
  {
    canonicalName: "ポリシリコーン-15",
    mhlwName: "ポリシリコーン-15",
    aliases: ["ポリシリコーン-15", "パーソルSQ"],
    inciNames: ["Polysilicone-15"],
    approvedUses: ["紫外線防止"],
    masterDbId: "polysilicone-15",
  },
  {
    canonicalName: "ドロメトリゾールトリシロキサン",
    mhlwName: "ドロメトリゾールトリシロキサン",
    aliases: ["ドロメトリゾールトリシロキサン", "メギゾリルXL"],
    inciNames: ["Drometrizole Trisiloxane"],
    approvedUses: ["紫外線防止"],
    masterDbId: "drometrizole-trisiloxane",
  },
  {
    canonicalName: "エチルヘキシルトリアゾン",
    mhlwName: "エチルヘキシルトリアゾン",
    aliases: ["エチルヘキシルトリアゾン", "ユビナールT150"],
    inciNames: ["Ethylhexyl Triazone"],
    approvedUses: ["紫外線防止"],
    masterDbId: "ethylhexyl-triazone",
  },
  {
    canonicalName: "ジエチルヘキシルブタミドトリアゾン",
    mhlwName: "ジエチルヘキシルブタミドトリアゾン",
    aliases: ["ジエチルヘキシルブタミドトリアゾン", "ユバソーブHEB"],
    inciNames: ["Diethylhexyl Butamido Triazone"],
    approvedUses: ["紫外線防止"],
    masterDbId: "diethylhexyl-butamido-triazone",
  },
  {
    canonicalName: "テレフタリリデンジカンフルスルホン酸",
    mhlwName: "テレフタリリデンジカンフルスルホン酸",
    aliases: ["テレフタリリデンジカンフルスルホン酸", "メギゾリルSX"],
    inciNames: ["Terephthalylidene Dicamphor Sulfonic Acid"],
    approvedUses: ["紫外線防止"],
    masterDbId: "terephthalylidene-dicamphor-sulfonic-acid",
  },
  {
    canonicalName: "イスコトリジノール",
    mhlwName: "イスコトリジノール",
    aliases: ["イスコトリジノール"],
    inciNames: ["Diethylhexyl Butamido Triazone"],
    approvedUses: ["紫外線防止"],
    masterDbId: "iscotrizinol",
  },

  // ═══ 保湿有効成分 ═══════════════════════════════════════════
  {
    canonicalName: "加水分解コラーゲン",
    mhlwName: "加水分解コラーゲン液",
    aliases: ["加水分解コラーゲン", "加水分解コラーゲン液"],
    inciNames: ["Hydrolyzed Collagen"],
    approvedUses: ["保湿"],
    masterDbId: "hydrolyzed-collagen",
  },
  {
    canonicalName: "ヒアルロン酸Na",
    mhlwName: "ヒアルロン酸ナトリウム(2)",
    aliases: [
      "ヒアルロン酸Na",
      "ヒアルロン酸ナトリウム",
      "ヒアルロン酸ナトリウム(2)",
    ],
    inciNames: ["Sodium Hyaluronate"],
    approvedUses: ["保湿"],
    masterDbId: "sodium-hyaluronate",
  },
  {
    canonicalName: "ヒアルロン酸Na-2",
    mhlwName: "ヒアルロン酸ナトリウム(2)",
    aliases: ["ヒアルロン酸Na-2"],
    inciNames: ["Sodium Hyaluronate (2)"],
    approvedUses: ["保湿"],
    masterDbId: "sodium-hyaluronate-2",
  },
  {
    canonicalName: "グリセリン",
    mhlwName: "濃グリセリン",
    aliases: ["グリセリン", "濃グリセリン"],
    inciNames: ["Glycerin"],
    approvedUses: ["保湿"],
    masterDbId: "glycerin",
  },
  {
    canonicalName: "パンテノール",
    mhlwName: "D-パンテノール",
    aliases: ["パンテノール", "D-パンテノール", "DL-パンテノール"],
    inciNames: ["Panthenol", "D-Panthenol"],
    approvedUses: ["保湿", "肌荒れ防止"],
    masterDbId: "panthenol",
  },
  {
    canonicalName: "ライスパワーNo.11",
    mhlwName: "ライスパワーNo.11",
    aliases: ["ライスパワーNo.11", "ライスパワー®No.11"],
    inciNames: ["Rice Ferment Filtrate No.11"],
    approvedUses: ["保湿"],
    masterDbId: "rice-power-no11",
  },
  {
    canonicalName: "ヘパリン類似物質",
    mhlwName: "ヘパリン類似物質",
    aliases: ["ヘパリン類似物質"],
    inciNames: ["Heparinoid"],
    approvedUses: ["保湿"],
    masterDbId: "heparinoid",
  },
  {
    canonicalName: "コンドロイチン硫酸Na",
    mhlwName: "コンドロイチン硫酸ナトリウム",
    aliases: ["コンドロイチン硫酸Na", "コンドロイチン硫酸ナトリウム"],
    inciNames: ["Sodium Chondroitin Sulfate"],
    approvedUses: ["保湿"],
    masterDbId: "chondroitin-sulfate-na",
  },
  {
    canonicalName: "dl-ピロリドンカルボン酸Na",
    mhlwName: "dl-ピロリドンカルボン酸ナトリウム液",
    aliases: [
      "dl-ピロリドンカルボン酸Na",
      "dl-ピロリドンカルボン酸ナトリウム液",
      "PCA-Na",
    ],
    inciNames: ["dl-Sodium PCA"],
    approvedUses: ["保湿"],
    masterDbId: "dl-pca-na",
  },
  {
    canonicalName: "ライスパワーNo.7",
    mhlwName: "ライスパワーNo.7",
    aliases: ["ライスパワーNo.7", "ライスパワー®No.7"],
    inciNames: ["Rice Ferment Filtrate No.7"],
    approvedUses: ["皮脂分泌抑制"],
    masterDbId: "rice-power-no7",
  },
  {
    canonicalName: "セチルPGヒドロキシエチルパルミタミド",
    mhlwName: "セチルPGヒドロキシエチルパルミタミド",
    aliases: ["セチルPGヒドロキシエチルパルミタミド", "疑似セラミド"],
    inciNames: ["Cetyl PG Hydroxyethyl Palmitamide"],
    approvedUses: ["保湿"],
    masterDbId: "cetyl-pg-hydroxyethyl-palmitamide",
  },

  // ═══ 角質ケア有効成分 ═══════════════════════════════════════
  {
    canonicalName: "サリチル酸",
    mhlwName: "サリチル酸",
    aliases: ["サリチル酸", "BHA"],
    inciNames: ["Salicylic Acid"],
    approvedUses: ["角質ケア"],
    masterDbId: "salicylic-acid",
  },

  // ═══ 制汗有効成分 ═══════════════════════════════════════════
  {
    canonicalName: "クロルヒドロキシアルミニウム",
    mhlwName: "クロルヒドロキシアルミニウム",
    aliases: ["クロルヒドロキシアルミニウム", "ACH"],
    inciNames: ["Aluminum Chlorohydrate"],
    approvedUses: ["制汗"],
    masterDbId: "aluminum-chlorohydrate",
  },
  {
    canonicalName: "セスキクロルヒドロキシアルミニウム",
    mhlwName: "セスキクロルヒドロキシアルミニウム",
    aliases: ["セスキクロルヒドロキシアルミニウム"],
    inciNames: ["Aluminum Sesquichlorohydrate"],
    approvedUses: ["制汗"],
    masterDbId: "aluminum-sesquichlorohydrate",
  },
  {
    canonicalName: "塩化アルミニウムジルコニウム",
    mhlwName: "塩化アルミニウムジルコニウム",
    aliases: ["塩化アルミニウムジルコニウム"],
    inciNames: ["Aluminum Zirconium Tetrachlorohydrex"],
    approvedUses: ["制汗"],
    masterDbId: "aluminum-zirconium",
  },
  {
    canonicalName: "フェノールスルホン酸亜鉛",
    mhlwName: "フェノールスルホン酸亜鉛",
    aliases: ["フェノールスルホン酸亜鉛"],
    inciNames: ["Zinc Phenolsulfonate"],
    approvedUses: ["制汗"],
    masterDbId: "phenolsulfonic-acid-zinc",
  },
  {
    canonicalName: "焼ミョウバン",
    mhlwName: "焼ミョウバン",
    aliases: ["焼ミョウバン", "ミョウバン", "カリウムミョウバン"],
    inciNames: ["Potassium Alum"],
    approvedUses: ["制汗"],
    masterDbId: "alum",
  },
  {
    canonicalName: "塩化アルミニウム",
    mhlwName: "塩化アルミニウム",
    aliases: ["塩化アルミニウム"],
    inciNames: ["Aluminum Chloride"],
    approvedUses: ["制汗"],
    masterDbId: "aluminum-chloride",
  },
  {
    canonicalName: "パラフェノールスルホン酸",
    mhlwName: "パラフェノールスルホン酸",
    aliases: ["パラフェノールスルホン酸"],
    inciNames: ["para-Phenolsulfonic Acid"],
    approvedUses: ["制汗"],
    masterDbId: "para-phenolsulfonic-acid",
  },

  // ═══ 育毛有効成分 ═══════════════════════════════════════════
  {
    canonicalName: "ミノキシジル",
    mhlwName: "ミノキシジル",
    aliases: ["ミノキシジル"],
    inciNames: ["Minoxidil"],
    approvedUses: ["育毛"],
    masterDbId: "minoxidil",
  },
  {
    canonicalName: "t-フラバノン",
    mhlwName: "t-フラバノン",
    aliases: ["t-フラバノン", "トランス-3,4'-ジメチル-3-ヒドロキシフラバノン"],
    inciNames: ["Trans-3,4'-Dimethyl-3-Hydroxyflavanone"],
    approvedUses: ["育毛"],
    masterDbId: "t-flavanone",
  },
  {
    canonicalName: "塩化カルプロニウム",
    mhlwName: "塩化カルプロニウム",
    aliases: ["塩化カルプロニウム", "カルプロニウム塩化物"],
    inciNames: ["Carpronium Chloride"],
    approvedUses: ["育毛"],
    masterDbId: "carpronium-chloride",
  },
  {
    canonicalName: "パントテニルエチルエーテル",
    mhlwName: "パントテニルエチルエーテル",
    aliases: ["パントテニルエチルエーテル"],
    inciNames: ["Pantothenyl Ethyl Ether"],
    approvedUses: ["育毛"],
    masterDbId: "pantothenyl-ethyl-ether",
  },
  {
    canonicalName: "β-シトステロール",
    mhlwName: "β-シトステロール",
    aliases: ["β-シトステロール", "ベータシトステロール"],
    inciNames: ["beta-Sitosterol"],
    approvedUses: ["育毛"],
    masterDbId: "sitosterol",
  },
  {
    canonicalName: "L-システイン塩酸塩",
    mhlwName: "L-システイン塩酸塩",
    aliases: ["L-システイン塩酸塩"],
    inciNames: ["L-Cysteine Hydrochloride"],
    approvedUses: ["育毛"],
    masterDbId: "cysteine-hcl",
  },
  {
    canonicalName: "ペンタデカン酸グリセリド",
    mhlwName: "ペンタデカン酸グリセリド",
    aliases: ["ペンタデカン酸グリセリド"],
    inciNames: ["Pentadecanoic Acid Glyceride"],
    approvedUses: ["育毛"],
    masterDbId: "pentadecanoic-acid-glyceride",
  },
  {
    canonicalName: "ヒノキ抽出液",
    mhlwName: "ヒノキ抽出液",
    aliases: ["ヒノキ抽出液", "ヒノキチオール抽出液"],
    inciNames: ["Chamaecyparis Obtusa Extract"],
    approvedUses: ["育毛"],
    masterDbId: "hinoki-extract-active",
  },
  {
    canonicalName: "センブリエキス",
    mhlwName: "センブリエキス",
    aliases: ["センブリエキス", "センブリ抽出液"],
    inciNames: ["Swertia Japonica Extract"],
    approvedUses: ["育毛"],
    masterDbId: "swertia-japonica-extract",
  },
  {
    canonicalName: "ニコチン酸",
    mhlwName: "ニコチン酸",
    aliases: ["ニコチン酸", "ナイアシン"],
    inciNames: ["Nicotinic Acid"],
    approvedUses: ["育毛"],
    masterDbId: "nicotinic-acid",
  },
  {
    canonicalName: "エストラジオール",
    mhlwName: "エストラジオール",
    aliases: ["エストラジオール"],
    inciNames: ["Estradiol"],
    approvedUses: ["育毛"],
    masterDbId: "estradiol",
  },
  {
    canonicalName: "パントテン酸カルシウム",
    mhlwName: "パントテン酸カルシウム",
    aliases: ["パントテン酸カルシウム", "パントテン酸Ca"],
    inciNames: ["Calcium Pantothenate"],
    approvedUses: ["育毛"],
    masterDbId: "calcium-pantothenate",
  },
  {
    canonicalName: "D-パントテニルアルコール",
    mhlwName: "D-パントテニルアルコール",
    aliases: ["D-パントテニルアルコール"],
    inciNames: ["D-Panthenol"],
    approvedUses: ["育毛", "保湿"],
    masterDbId: "d-pantothenyl-alcohol",
  },
  {
    canonicalName: "酢酸レチノール",
    mhlwName: "酢酸レチノール",
    aliases: ["酢酸レチノール"],
    inciNames: ["Retinyl Acetate"],
    approvedUses: ["育毛"],
    masterDbId: "retinyl-acetate",
  },
  {
    canonicalName: "レチニルパルミテート",
    mhlwName: "パルミチン酸レチノール",
    aliases: ["レチニルパルミテート", "パルミチン酸レチノール"],
    inciNames: ["Retinyl Palmitate"],
    approvedUses: ["育毛"],
    masterDbId: "retinyl-palmitate",
  },
  {
    canonicalName: "オクチルドデカノール",
    mhlwName: "オクチルドデカノール",
    aliases: ["オクチルドデカノール"],
    inciNames: ["Octyldodecanol"],
    approvedUses: ["保湿"],
    masterDbId: "glycol-octyl-decyl-ether",
  },
];

// ────────────────────────────────────────────────────────────────
// ルックアップ Maps（モジュール初期化時に構築）
// ────────────────────────────────────────────────────────────────

const _byCanonical = new Map<string, MhlwActiveIngredient>();
const _byMhlwName = new Map<string, MhlwActiveIngredient>();
const _byAlias = new Map<string, MhlwActiveIngredient>();
const _byInci = new Map<string, MhlwActiveIngredient>();
const _byMasterDbId = new Map<string, MhlwActiveIngredient>();

for (const entry of MHLW_ACTIVE_INGREDIENTS) {
  _byCanonical.set(entry.canonicalName, entry);
  _byMhlwName.set(entry.mhlwName, entry);
  _byMasterDbId.set(entry.masterDbId, entry);

  for (const alias of entry.aliases) {
    _byAlias.set(alias, entry);
  }
  for (const inci of entry.inciNames) {
    _byInci.set(inci.toLowerCase(), entry);
  }
}

/**
 * 任意の成分名表記から MHLW 有効成分を解決する。
 * canonicalName → mhlwName → alias → INCI の順に検索。
 */
export function resolveActiveIngredient(
  name: string,
): MhlwActiveIngredient | undefined {
  const trimmed = name.trim();
  return (
    _byCanonical.get(trimmed) ??
    _byMhlwName.get(trimmed) ??
    _byAlias.get(trimmed) ??
    _byInci.get(trimmed.toLowerCase())
  );
}

/**
 * masterDbId から MHLW 有効成分を取得する。
 */
export function getMhlwByMasterDbId(
  id: string,
): MhlwActiveIngredient | undefined {
  return _byMasterDbId.get(id);
}

export function isQuasiDrugCosmeticActiveIngredient(
  entry: MhlwActiveIngredient,
): boolean {
  if (EXCLUDED_QUASI_DRUG_COSMETIC_MASTER_DB_IDS.has(entry.masterDbId)) {
    return false;
  }

  return entry.approvedUses.length > 0
    && entry.approvedUses.every((use) => QUASI_DRUG_COSMETIC_APPROVED_USES.has(use));
}

export function resolveQuasiDrugCosmeticActiveIngredient(
  name: string,
): MhlwActiveIngredient | undefined {
  const entry = resolveActiveIngredient(name);
  return entry && isQuasiDrugCosmeticActiveIngredient(entry) ? entry : undefined;
}

export function getQuasiDrugCosmeticActiveByMasterDbId(
  id: string,
): MhlwActiveIngredient | undefined {
  const entry = getMhlwByMasterDbId(id);
  return entry && isQuasiDrugCosmeticActiveIngredient(entry) ? entry : undefined;
}

export function isQuasiDrugCosmeticActiveByMasterDbId(id: string): boolean {
  return getQuasiDrugCosmeticActiveByMasterDbId(id) !== undefined;
}

/**
 * MHLW 有効成分の総数。
 */
export const MHLW_ACTIVE_COUNT = MHLW_ACTIVE_INGREDIENTS.length;

export const QUASI_DRUG_COSMETIC_ACTIVE_COUNT = MHLW_ACTIVE_INGREDIENTS.filter(
  isQuasiDrugCosmeticActiveIngredient,
).length;
