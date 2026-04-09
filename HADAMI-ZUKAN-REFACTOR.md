# HADAMI 成分図鑑（集めるタブ）リファクタリング指示書

## 概要

`src/app/zukan/page.tsx` を全面リファクタリングする。
現在のジャンル別グリッド表示を、**2タブ構成（ジャンル別 / 肌悩みから探す）**のスタイリッシュなUIに刷新する。

リファレンスUI: `hadami-zukan-completion.jsx`（リポジトリルートに配置済み）

---

## 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/zukan/page.tsx` | 全面書き換え（2タブ構成） |
| `src/components/zukan/ZukanProgress.tsx` | 削除 → ヘッダーをpage.tsx内にインライン化 |
| `src/components/zukan/IngredientCard.tsx` | 削除 → リスト行コンポーネントに置換 |
| `src/lib/ingredients.ts` | `INGREDIENT_COUNT`, `getIngredientIndex`, `getGenreTotal` を追加（現在未定義でpage.tsxがimportしている） |
| `src/lib/concerns.ts` | **新規作成** — 肌悩みデータ定義 |
| `src/types/index.ts` | `SkinConcern` 型を追加 |

---

## 設計仕様

### ヘッダー（共通）

```
┌─────────────────────────────────────┐
│ 成分図鑑              28% 93/323    │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────┘
```

- 左: 「成分図鑑」テキスト（font-sans, font-bold, text-bo-ink）
- 右: パーセント（font-serif, font-extrabold, text-bo-accent, text-2xl） + 発見数/総数
- 下: プログレスバー1本（h-[5px], bg-bo-parchment, 中身はaccent→safeのgradient）
- 背景: `linear-gradient(180deg, accentPale → cream)`
- padding: `pt-[50px] px-5 pb-4`
- **コレクター称号/レベルシステムは不要**

### タブ切り替え

2タブ: 「ジャンル別」「肌悩みから探す」
- `border-b border-bo-parchment`
- アクティブ: `text-bo-accent font-bold border-b-[2.5px] border-bo-accent`
- 非アクティブ: `text-bo-ink-muted font-medium`

---

### Tab 1: ジャンル別

#### ジャンル横スクロールセレクター

```
[💧うるおい 43%] [🧬アミノ酸 30%] [🍊ビタミン 28%] ...
```

- 横スクロール（`overflow-x-auto`, `flex`, `gap-1`）
- 各アイテム: 縦並び（アイコン + ラベル + %）
- 選択中: `bg-white shadow-bo2 rounded-2xl`
- 未選択: `bg-transparent`
- アイコン: `w-[34px] h-[34px] rounded-[10px]` に各ジャンルのcolor背景
- データ源: `INGREDIENT_GENRES` + `MASTER_INGREDIENTS` から集計

#### 選択ジャンルの成分リスト

選択したジャンルの成分を**レアリティ高い順**（legendary→rare→uncommon→common、同レアリティ内は発見済み優先）で表示。

各行のレイアウト:
```
[★★★★]  銅トリペプチド-1                    
         GHK-Cu。コラーゲン合成促進           
```

- `flex items-center gap-2.5`
- 左: ★表示（各レアリティのcolor）、w-[34px]テキストセンター
- 中: 成分名（font-sans, font-semibold, text-[13px]）+ 1行メモ（text-[10px], text-bo-ink-muted, truncate）
- 未発見: 名前は「？？？」、メモは「💡 ヒントテキスト」（color: #B08D3A）、opacity-50
- レジェンダリー＆発見済み: shimmerアニメーション背景
- 背景: 発見済み → レアリティのbg色、未発見 → `bg-bo-parchment/40`
- `rounded-[13px] px-3 py-2.5`
- ジャンルヘッダー行: ジャンル名（font-serif, font-extrabold, text-base）+ 発見数/総数 + ミニプログレスバー（w-[72px]）

#### データ取得ロジック

```typescript
// ジャンルごとの成分をフィルタ＆ソート
const genreIngredients = useMemo(() => {
  const items = MASTER_INGREDIENTS.filter(i => i.genre === selectedGenre);
  const RARITY_ORDER: RarityKey[] = ["legendary", "rare", "uncommon", "common"];
  return items.sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity);
    const rb = RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    const aDisc = discoveredIds.includes(a.id) ? 0 : 1;
    const bDisc = discoveredIds.includes(b.id) ? 0 : 1;
    return aDisc - bDisc;
  });
}, [selectedGenre, discoveredIds]);
```

---

### Tab 2: 肌悩みから探す

3階層ドリルダウン: **悩み選択 → 注目成分リスト → Myコスメ逆引き**

#### Step 1: 悩み一覧

5つの肌悩みカード:

```
[🏜️] 乾燥              Myコスメカバー 3/4  [75]
[✨] くすみ             Myコスメカバー 2/3  [67]
[📐] ハリ               Myコスメカバー 2/3  [67]
[🔍] 毛穴               Myコスメカバー 2/3  [67]
[🛡️] 敏感               Myコスメカバー 3/3  [100]
```

- 各カード: `rounded-2xl border border-bo-parchment bg-white shadow-bo1`
- 左アイコン: `w-10 h-10 rounded-xl` に各悩みのcolor背景
- 右: カバー率%（font-serif, font-extrabold, 各悩みのcolor）
- タップで Step 2 に遷移

#### Step 2: 注目成分リスト

```
[←] 🏜️ 乾燥                              75%

💡 水分→NMF→油分の3層保湿が鍵

[✅] ヒアルロン酸Na  ★          [2件]  ← タップで展開
[✅] セラミドNP      ★★★        [1件]
[✅] スクワラン      ★          [1件]
[🔒] ？？？          ★★★      [未発見]
```

- 戻るボタン: `w-[30px] h-[30px] rounded-[9px] border border-bo-parchment bg-white`
- 注目成分は `src/lib/concerns.ts` に定義
- 各成分行: 発見状態アイコン + 名前 + ★ + Myコスメ件数バッジ
- 件数バッジ: `text-bo-accent bg-bo-accent/[0.08] rounded-md px-2 py-0.5 text-[10px] font-bold`
- 「未配合」「未発見」: `text-bo-ink-faint`

#### Step 3: Myコスメ展開（アコーディオン）

成分行タップで下に展開:

```
  この成分が入っているMyコスメ
  ┌─────────────────────────────┐
  │ 📦 HEARTLEAF 80 AMPOULE     │
  │    anua                      │
  ├─────────────────────────────┤
  │ 📦 PDRN CAPSULE MASK        │
  │    ANUA                      │
  └─────────────────────────────┘
```

- 展開アニメーション: `max-height` transition
- 製品カード: `bg-bo-accent-pale rounded-[10px] px-2.5 py-2`
- 製品がない場合: 「📸 スキャンして探す」ボタン（bg-bo-accent, text-white, rounded-[10px]）

#### Myコスメ逆引きのデータ取得ロジック

```typescript
// concerns.tsの各keyIngredientに対して、productsストアから逆引き
const getProductsWithIngredient = (ingredientId: string): Product[] => {
  return products.filter(p => 
    p.ingredients.some(ing => ing.ingredientId === ingredientId)
  );
};
```

- `useProductStore` の `products` から `ingredients[].ingredientId` でフィルタ
- Product型の `ingredients: ProductIngredient[]` を使う（`ProductIngredient.ingredientId`）

#### 下部カバー率バー

```
▓▓▓▓▓▓▓▓▓▓▓░░░░░  3/4 カバー
```

---

## 新規ファイル: `src/lib/concerns.ts`

```typescript
import { RarityKey } from "@/types";

export interface SkinConcernKeyIngredient {
  id: string;        // MASTER_INGREDIENTSのid
  name: string;      // 表示名
  rarity: RarityKey;
  role: string;      // 1行の説明（例: "水分を抱え込む王道保湿"）
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
      { id: "proteoglycan", name: "プロテオグリカン", rarity: "rare", role: "ヒアルロン酸超えの保水力" },
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
    ],
  },
  {
    label: "毛穴",
    icon: "🔍",
    color: "#90A4AE",
    tip: "BHA/PHA→鎮静→保湿の3ステップ",
    keyIngredients: [
      { id: "lactobionic-acid", name: "ラクトビオン酸", rarity: "uncommon", role: "敏感肌OKのPHA角質ケア" },
      { id: "centella-asiatica-extract", name: "ツボクサエキス", rarity: "uncommon", role: "CICA。ピーリング後の鎮静に" },
      { id: "salicylic-acid", name: "サリチル酸", rarity: "rare", role: "BHA。毛穴の皮脂を溶かすエース" },
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
    ],
  },
];
```

---

## `src/lib/ingredients.ts` に追加すべきエクスポート

現在 `src/app/zukan/page.tsx` がimportしているが未定義の関数:

```typescript
// MASTER_INGREDIENTSの総数
export const INGREDIENT_COUNT = MASTER_INGREDIENTS.length;

// IDからMASTER_INGREDIENTS内のインデックスを取得（図鑑番号用）
const _indexById = new Map(MASTER_INGREDIENTS.map((i, idx) => [i.id, idx]));
export function getIngredientIndex(id: string): number {
  return _indexById.get(id) ?? -1;
}

// ジャンルごとの成分総数
export function getGenreTotal(genre: IngredientGenre): number {
  return MASTER_INGREDIENTS.filter(i => i.genre === genre).length;
}
```

---

## Tailwindカスタムクラス（既存のtailwind.configで定義済み）

```
bg-bo-cream      → #F4F9F6
bg-bo-parchment  → #E8F0EC
bg-bo-accent      → #3A8F7A
bg-bo-accent-soft → #D6EDE6
bg-bo-accent-pale → #EAF5F1
text-bo-ink       → #1B2620
text-bo-ink-soft  → #3D4F45
text-bo-ink-muted → #7E9389
text-bo-ink-faint → #B5C7BE
shadow-bo1        → 0 1px 4px rgba(27,38,32,0.05)
shadow-bo2        → 0 4px 16px rgba(27,38,32,0.08)
font-serif        → Shippori Mincho
font-sans         → Zen Kaku Gothic New
rounded-r2        → 18px（カード用）
```

---

## 削除するもの

- `src/components/zukan/ZukanProgress.tsx` のコレクターレベルシステム（Lv.1〜7）
- 実績バッジ（achievements）の表示
- ジャンルごとのカードテクスチャ背景（`CARD_TEXTURES`）
- 底部の統計3カラム（発見済み/未発見/完了ジャンル）

---

## アニメーション

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- ジャンル成分リスト: ジャンル切り替え時に `fadeUp 0.2s ease`
- レジェンダリー成分: `shimmer 3.5s infinite`（発見済みのみ）
- 肌悩みドリルダウン遷移: `fadeUp 0.2s ease`
- Myコスメ展開: `max-height` transition 0.3s ease

---

## 実装順序

1. `src/lib/ingredients.ts` に `INGREDIENT_COUNT`, `getIngredientIndex`, `getGenreTotal` を追加
2. `src/lib/concerns.ts` を新規作成
3. `src/types/index.ts` に `SkinConcern` 型を追加
4. `src/app/zukan/page.tsx` を全面書き換え
5. 不要になった `ZukanProgress.tsx` のコレクターレベル部分を削除（コンプリート率バーはヘッダーにインライン化）
6. `IngredientCard.tsx` は他画面（DiscoveryModal等）で使っている場合は残す
