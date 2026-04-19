# -*- coding: utf-8 -*-
"""
Update ingredients.ts:
1. Add 23 new ingredients
2. Reset activeIngredient flags: only the new 100 get true
3. Add Excel enrichment data to all 100 active ingredients
"""
import sys, re, json
sys.stdout.reconfigure(encoding="utf-8")

INGREDIENTS_PATH = r"C:\Users\user\Desktop\アプリ開発 （Claud）\美容成分アプリ\hadami\src\lib\ingredients.ts"
EXCEL_DATA_PATH = r"C:\Users\user\Desktop\アプリ開発 （Claud）\美容成分アプリ\hadami\scripts\excel_100_data.json"

# ── Name-to-ID mapping for the 100 ingredients ──
# 77 existing + 23 new
NAME_TO_ID = {
    "ヒアルロン酸Na": "sodium-hyaluronate",
    "加水分解ヒアルロン酸": "hydrolyzed-hyaluronate",
    "アセチルヒアルロン酸Na": "acetyl-hyaluronate",
    "ヒアルロン酸クロスポリマーNa": "hyaluronic-acid-crosspolymer",
    "グリセリン": "glycerin",
    "PCA-Na": "pca-na",
    "乳酸Na": "sodium-lactate",
    "ベタイン": "betaine",
    "トレハロース": "trehalose",
    "ソルビトール": "sorbitol",
    "尿素": "urea",
    "セラミドNP": "ceramide-np",
    "セラミドAP": "ceramide-ap",
    "セラミドEOP": "ceramide-eop",
    "セラミドNG": "ceramide-ng",
    "コレステロール": "cholesterol",
    "フィトスフィンゴシン": "phytosphingosine",
    "スクワラン": "squalane",
    "シア脂": "shea-butter",
    "ポリグルタミン酸": "polyglutamic-acid",
    "パンテノール": "panthenol",
    "アラントイン": "allantoin",
    "β-グルカン": "beta-glucan",
    "エクトイン": "ectoin",
    "コロイド性オートミール": "colloidal-oatmeal",
    "アロエベラ葉エキス": "aloe-vera-leaf-extract",
    "ツボクサエキス": "centella-asiatica-extract",
    "マデカッソシド": "madecassoside",
    "アシアチコシド": "asiaticoside",
    "グリチルリチン酸2K": "dipotassium-glycyrrhizate",
    "グリチルレチン酸ステアリル": "stearyl-glycyrrhetinate",
    "ドクダミエキス": "houttuynia-cordata-extract",
    "カミツレ花エキス": "chamomilla-extract",
    "カレンデュラ花エキス": "calendula-flower-extract",
    "ビサボロール": "bisabolol",
    "ナイアシンアミド": "niacinamide",
    "アスコルビン酸": "ascorbic-acid",
    "3-O-エチルアスコルビン酸": "ethyl-ascorbic-acid",
    "アスコルビルグルコシド": "ascorbyl-glucoside",
    "リン酸アスコルビルMg": "magnesium-ascorbyl-phosphate",
    "パルミチン酸アスコルビルリン酸3Na": "trisodium-ascorbyl-palmitate-phosphate",
    "テトラヘキシルデカン酸アスコルビル": "ascorbyl-tetraisopalmitate",
    "トコフェロール": "tocopherol",
    "トコフェロール酢酸エステル": "tocopheryl-acetate",
    "ユビキノン": "ubiquinone",
    "フェルラ酸": "ferulic-acid",
    "レスベラトロール": "resveratrol",
    "フラーレン": "fullerene",
    "緑茶エキス": "green-tea-extract",
    "アスタキサンチン": "astaxanthin",
    "アルブチン": "arbutin",
    "α-アルブチン": "alpha-arbutin",
    "コウジ酸": "kojic-acid",
    "トラネキサム酸": "tranexamic-acid",
    "4MSK": "4msk",
    "エラグ酸": "ellagic-acid",
    "ルシノール": "rucinol",
    "アゼライン酸": "azelaic-acid",
    "N-アセチルグルコサミン": "n-acetyl-glucosamine",
    "グルタチオン": "glutathione",
    "アスコルビルリン酸Na": "sodium-ascorbyl-phosphate",
    "プラセンタエキス": "placenta-extract",
    "レチノール": "retinol",
    "レチナール": "retinal",
    "レチニルパルミテート": "retinyl-palmitate",
    "レチノイン酸トコフェリル": "tocopheryl-retinoate",
    "バクチオール": "bakuchiol",
    "アデノシン": "adenosine",
    "パルミトイルトリペプチド-1": "palmitoyl-tripeptide-1",
    "パルミトイルテトラペプチド-7": "palmitoyl-tetrapeptide-7",
    "アセチルヘキサペプチド-8": "acetyl-hexapeptide-8",
    "銅トリペプチド-1": "copper-tripeptide-1",
    "オリゴペプチド-1": "oligopeptide-1",
    "アセチルテトラペプチド-5": "acetyl-tetrapeptide-5",
    "パルミトイルペンタペプチド-4": "palmitoyl-pentapeptide-4",
    "加水分解コラーゲン": "hydrolyzed-collagen",
    "サリチル酸": "salicylic-acid",
    "カプリロイルサリチル酸": "capryloyl-salicylic-acid",
    "グリコール酸": "glycolic-acid",
    "乳酸": "lactic-acid",
    "マンデル酸": "mandelic-acid",
    "グルコノラクトン": "gluconolactone",
    "ラクトビオン酸": "lactobionic-acid",
    "クエン酸": "citric-acid",
    "硫黄": "sulfur",
    "亜鉛PCA": "zinc-pca",
    "ピロクトンオラミン": "piroctone-olamine",
    "イソプロピルメチルフェノール": "isopropylmethylphenol",
    "ティーツリー葉油": "tea-tree-oil",
    "カオリン": "kaolin",
    "ベントナイト": "bentonite",
    "酸化亜鉛": "zinc-oxide",
    "酸化チタン": "titanium-dioxide",
    "トコフェロールニコチン酸エステル": "tocopheryl-nicotinate",
    "水溶性プロテオグリカン": "water-soluble-proteoglycan",
    "カフェイン": "caffeine",
    "グリシルグリシン": "glycyl-glycine",
    "フィチン酸": "phytic-acid",
    "フェニルエチルレゾルシノール": "phenylethyl-resorcinol",
    "イデベノン": "idebenone",
}

ACTIVE_100_IDS = set(NAME_TO_ID.values())

# ── Load Excel data ──
with open(EXCEL_DATA_PATH, "r", encoding="utf-8") as f:
    excel_data = json.load(f)

# Build name -> excel data map
excel_by_id = {}
for ed in excel_data:
    name = ed["name"]
    if name in NAME_TO_ID:
        excel_by_id[NAME_TO_ID[name]] = ed

# ── Read ingredients.ts ──
with open(INGREDIENTS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# ── Step 1: Reset activeIngredient flags ──
# Remove all existing activeIngredient: true lines
content = re.sub(r"\n\s*activeIngredient:\s*true,", "", content)

# For each of the 77 existing ingredients in the active 100, add activeIngredient: true
for active_id in ACTIVE_100_IDS:
    # Find the entry block for this id and add activeIngredient: true before the closing }
    pattern = rf'(id:\s*"{re.escape(active_id)}",\n(?:.*?\n)*?)(  \}})'
    match = re.search(pattern, content)
    if match:
        block = match.group(1)
        # Only add if not already there
        if "activeIngredient:" not in block:
            content = content[:match.end(1)] + "    activeIngredient: true,\n" + content[match.start(2):]

# ── Step 2: Add Excel enrichment data to active 100 ──
def escape_ts(s):
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

for active_id in ACTIVE_100_IDS:
    ed = excel_by_id.get(active_id)
    if not ed:
        continue

    # Find the activeIngredient: true line for this ingredient and add fields after it
    pattern = rf'(id:\s*"{re.escape(active_id)}",\n(?:.*?\n)*?    activeIngredient:\s*true,\n)(  \}})'
    match = re.search(pattern, content)
    if not match:
        continue

    enrichment_lines = []
    if ed["effect_summary"]:
        enrichment_lines.append(f'    effectSummary: "{escape_ts(ed["effect_summary"])}",')
    if ed["suitable_for"]:
        enrichment_lines.append(f'    suitableFor: "{escape_ts(ed["suitable_for"])}",')
    if ed["combination_caution"]:
        enrichment_lines.append(f'    combinationCaution: "{escape_ts(ed["combination_caution"])}",')
    if ed["synergy_partners"]:
        partners = ", ".join(f'"{escape_ts(p)}"' for p in ed["synergy_partners"])
        enrichment_lines.append(f"    synergyPartners: [{partners}],")
    if ed["synergy_summary"]:
        enrichment_lines.append(f'    synergySummary: "{escape_ts(ed["synergy_summary"])}",')
    if ed["reference_url"]:
        enrichment_lines.append(f'    referenceUrl: "{escape_ts(ed["reference_url"])}",')
    if ed["sub_cat_keys"]:
        sub_cats = ", ".join(f'"{c}"' for c in ed["sub_cat_keys"])
        enrichment_lines.append(f"    subCategories: [{sub_cats}],")

    if enrichment_lines:
        insertion = "\n".join(enrichment_lines) + "\n"
        content = content[:match.end(1)] + insertion + content[match.start(2):]

# ── Write back ──
with open(INGREDIENTS_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Updated {INGREDIENTS_PATH}")
print(f"Active 100 IDs: {len(ACTIVE_100_IDS)}")

# Verify
count_active = content.count("activeIngredient: true")
print(f"activeIngredient: true count = {count_active}")
count_effect = content.count("effectSummary:")
print(f"effectSummary fields = {count_effect}")
