# HADAMI 楽天アフィリエイト連携 実装指示書

## 概要

HADAMIアプリに楽天アフィリエイト連携機能を追加する。ユーザーのスキャン履歴を蓄積し、2軸のパーソナライズドレコメンドで商品を提案する。

- **軸1（似た成分）**：ユーザーがよく出会う成分カテゴリの商品を提案
- **軸2（未知成分）**：ユーザーがまだ出会っていない高レアリティ成分の商品を提案

---

## Phase 1: DB設計（Supabase Migration）

### 新規テーブル

既存テーブルとの関係：
- `products` テーブル（既存）：user_id, name, brand, product_type, ingredient_ids[]
- `ingredients` マスタ（既存参照）：id（ingredient_ids[]の参照先）

```sql
-- ================================================
-- 1. scan_history: スキャン履歴
-- ================================================
CREATE TABLE scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT,
  brand TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scan_history_user ON scan_history(user_id);
CREATE INDEX idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- RLS
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan history"
  ON scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history"
  ON scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan history"
  ON scan_history FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- 2. scan_ingredients: スキャンで検出された成分
-- ================================================
CREATE TABLE scan_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES scan_history(id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL,
  detected BOOLEAN NOT NULL DEFAULT true, -- true=含有, false=不含
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scan_ingredients_scan ON scan_ingredients(scan_id);
CREATE INDEX idx_scan_ingredients_ingredient ON scan_ingredients(ingredient_id);

-- RLS（scan_historyのuser_idを参照して制御）
ALTER TABLE scan_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan ingredients"
  ON scan_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scan_history sh
      WHERE sh.id = scan_ingredients.scan_id
      AND sh.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan ingredients"
  ON scan_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_history sh
      WHERE sh.id = scan_ingredients.scan_id
      AND sh.user_id = auth.uid()
    )
  );

-- ================================================
-- 3. user_ingredient_profile: 成分プロファイル（Materialized View）
-- ================================================
-- ※ ingredients テーブルのカラム名は実際のスキーマに合わせて調整すること
CREATE MATERIALIZED VIEW user_ingredient_profile AS
SELECT
  sh.user_id,
  si.ingredient_id,
  -- ↓ ingredientsテーブルのカラム名を実スキーマに合わせる
  -- i.name AS ingredient_name,
  -- i.category,
  -- i.rarity,
  COUNT(*) AS encounter_count,
  MAX(sh.scanned_at) AS last_seen_at
FROM scan_ingredients si
JOIN scan_history sh ON si.scan_id = sh.id
-- JOIN ingredients i ON si.ingredient_id = i.id  -- ingredientsテーブルがある場合
WHERE si.detected = true
GROUP BY sh.user_id, si.ingredient_id;

CREATE UNIQUE INDEX idx_uip_user_ingredient
  ON user_ingredient_profile(user_id, ingredient_id);

-- プロファイルの更新（スキャン後に呼び出す）
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_ingredient_profile;

-- ================================================
-- 4. rakuten_product_cache: 楽天API検索結果キャッシュ
-- ================================================
CREATE TABLE rakuten_product_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_keyword TEXT NOT NULL,
  results JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX idx_rakuten_cache_keyword ON rakuten_product_cache(search_keyword);
CREATE INDEX idx_rakuten_cache_expires ON rakuten_product_cache(expires_at);

-- publicアクセス可（キャッシュは全ユーザー共有）
ALTER TABLE rakuten_product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product cache"
  ON rakuten_product_cache FOR SELECT
  USING (true);

-- service_role のみ INSERT/UPDATE（API Routeから）
CREATE POLICY "Service role can manage cache"
  ON rakuten_product_cache FOR ALL
  USING (auth.role() = 'service_role');
```

### 実装時の注意

- `ingredients` テーブルの実際のスキーマ（カラム名・型）を先に `\d ingredients` で確認してからMaterialized Viewを調整すること
- 既存の `products.ingredient_ids[]` 配列との整合性を確認すること
- Materialized Viewが重い場合は、代わりに通常テーブル + トリガーでリアルタイム更新する方式に変更可

---

## Phase 2: 楽天API連携（API Route）

### 環境変数（.env.local に追加）

```
RAKUTEN_APP_ID=xxxxxxxxxxxxx
RAKUTEN_AFFILIATE_ID=xxxxxxxxxxxxx
```

Vercelの環境変数にも同様に設定すること。

### 楽天アプリID取得手順（運営者メモ）

1. https://webservice.rakuten.co.jp/ でアカウント作成
2. アプリ登録で「アプリID」取得
3. https://affiliate.rakuten.co.jp/ でアフィリエイトID取得

### API Route: `/app/api/rakuten/search/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RAKUTEN_API_URL =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RakutenItem {
  itemName: string;
  itemPrice: number;
  mediumImageUrls: { imageUrl: string }[];
  affiliateUrl: string;
  reviewAverage: number;
  shopName: string;
  itemUrl: string;
}

async function searchRakuten(keyword: string) {
  // 1. キャッシュ確認
  const { data: cached } = await supabaseAdmin
    .from("rakuten_product_cache")
    .select("results")
    .eq("search_keyword", keyword)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    return cached.results;
  }

  // 2. 楽天API呼び出し
  const params = new URLSearchParams({
    applicationId: process.env.RAKUTEN_APP_ID!,
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID!,
    keyword,
    genreId: "100939", // コスメ・美容ジャンル
    hits: "5",
    sort: "+reviewCount",
    imageFlag: "1",
  });

  const res = await fetch(`${RAKUTEN_API_URL}?${params}`);

  if (!res.ok) {
    console.error("Rakuten API error:", res.status);
    return [];
  }

  const data = await res.json();

  const products = (data.Items || []).map(
    ({ Item }: { Item: RakutenItem }) => ({
      name: Item.itemName,
      price: Item.itemPrice,
      imageUrl: Item.mediumImageUrls?.[0]?.imageUrl || null,
      affiliateUrl: Item.affiliateUrl,
      reviewScore: Item.reviewAverage,
      shopName: Item.shopName,
    })
  );

  // 3. キャッシュ保存
  await supabaseAdmin.from("rakuten_product_cache").upsert(
    {
      search_keyword: keyword,
      results: products,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "search_keyword" }
  );

  return products;
}

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "keywords array required" },
        { status: 400 }
      );
    }

    // 楽天APIのレートリミット対策: 順次実行（1秒1リクエスト制限）
    const results: Record<string, any[]> = {};
    for (const keyword of keywords.slice(0, 5)) {
      results[keyword] = await searchRakuten(keyword);
      // 楽天APIは1秒1リクエスト制限
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Rakuten search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### API Route: `/app/api/recommendations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. ユーザーの成分プロファイル取得
  // ※ Materialized Viewまたは直接クエリ
  const { data: profile } = await supabase
    .from("user_ingredient_profile")
    .select("*")
    .eq("user_id", user.id)
    .order("encounter_count", { ascending: false });

  if (!profile || profile.length === 0) {
    return NextResponse.json({
      similar: { label: "スキャン履歴が増えると提案が始まります", products: [] },
      discovery: { label: "スキャン履歴が増えると提案が始まります", products: [] },
    });
  }

  const knownIngredientIds = new Set(profile.map((p) => p.ingredient_id));

  // 2. 軸1: 似た成分（よく出会うカテゴリの商品）
  // ※ ingredientsテーブルのカテゴリカラム名を実スキーマに合わせる
  // TODO: ingredientsテーブルのスキーマ確認後に実装
  const topKeywords = profile
    .slice(0, 3)
    .map((p) => `${p.ingredient_name || ""} スキンケア 人気`)
    .filter((k) => k.trim() !== "スキンケア 人気");

  // 3. 軸2: 未知成分（まだ出会っていない高レアリティ成分）
  // TODO: ingredientsテーブルからレアリティ4以上の未知成分を取得
  // const { data: unknownIngredients } = await supabase
  //   .from("ingredients")
  //   .select("*")
  //   .not("id", "in", `(${[...knownIngredientIds].join(",")})`)
  //   .gte("rarity", 4)
  //   .order("rarity", { ascending: false })
  //   .limit(3);

  // 4. 楽天API検索
  const rakutenRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/rakuten/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: [
          ...topKeywords.slice(0, 2),
          // ...unknownIngredients.map(i => `${i.name} 配合 化粧品`)
        ],
      }),
    }
  );

  const rakutenData = await rakutenRes.json();

  return NextResponse.json({
    similar: {
      label: "あなたの好みに近いアイテム",
      products: Object.values(rakutenData.results || {})
        .flat()
        .slice(0, 3),
    },
    discovery: {
      label: "まだ出会っていない注目成分",
      products: [], // TODO: 軸2の結果
    },
    profile: {
      totalScans: profile.length,
      knownIngredientCount: knownIngredientIds.size,
    },
  });
}
```

---

## Phase 3: スキャン時の履歴保存

既存のスキャン処理フローに、scan_history / scan_ingredients への保存処理を追加する。

### 実装箇所

既存のスキャン結果保存処理（`products` テーブルにINSERTしている箇所）の**直後**に以下を追加：

```typescript
// スキャン結果をproductsテーブルに保存した後に実行

async function saveScanHistory(
  userId: string,
  productName: string,
  brand: string,
  ingredientIds: number[],
  detectedIds: number[], // 検出された成分ID
  missingIds: number[] // 不含だった成分ID（あれば）
) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. scan_history に記録
  const { data: scan, error: scanError } = await supabase
    .from("scan_history")
    .insert({
      user_id: userId,
      product_name: productName,
      brand: brand,
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    console.error("Failed to save scan history:", scanError);
    return;
  }

  // 2. scan_ingredients に成分ごとの記録
  const ingredientRecords = [
    ...detectedIds.map((id) => ({
      scan_id: scan.id,
      ingredient_id: id,
      detected: true,
    })),
    ...missingIds.map((id) => ({
      scan_id: scan.id,
      ingredient_id: id,
      detected: false,
    })),
  ];

  if (ingredientRecords.length > 0) {
    const { error: ingError } = await supabase
      .from("scan_ingredients")
      .insert(ingredientRecords);

    if (ingError) {
      console.error("Failed to save scan ingredients:", ingError);
    }
  }

  // 3. Materialized Viewの更新（非同期でOK）
  // ※ Supabase の service_role で実行する必要あり
  // await supabaseAdmin.rpc('refresh_user_ingredient_profile');
}
```

### Materialized View 更新用のRPC関数

```sql
CREATE OR REPLACE FUNCTION refresh_user_ingredient_profile()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_ingredient_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 4: フロントエンド（レコメンドUI）

### コンポーネント配置

```
src/
├── app/
│   ├── api/
│   │   ├── rakuten/
│   │   │   └── search/
│   │   │       └── route.ts     ← Phase 2
│   │   └── recommendations/
│   │       └── route.ts         ← Phase 2
│   └── scan/
│       └── result/
│           └── page.tsx         ← 既存のスキャン結果画面を改修
├── components/
│   ├── recommendations/
│   │   ├── RecommendSection.tsx  ← 新規: レコメンドセクション
│   │   ├── RakutenProductCard.tsx ← 新規: 商品カード
│   │   └── SkeletonLoader.tsx    ← 新規: スケルトンUI
│   └── ...
└── hooks/
    └── useRecommendations.ts     ← 新規: レコメンドデータ取得hook
```

### デザインルール（CLAUDE.md のデザインシステムに準拠）

- カラー: ボタニカルグリーン基調（accent: #3A7D44, accentDark: #2B5E33）
- PRラベル: 右上に `fontSize: 9, fontWeight: 700, color: #B88A2D, bg: #FDF6E3`
- 商品カード: 角丸10px, border 1px solid #D4E4D1, ホバーで影
- 「powered by 楽天市場」表示を各セクション下部に配置
- スケルトンUI: shimmerアニメーション、楽天API応答待ち中に表示
- レコメンドセクションは2つ:
  - 「🔄 あなたの好みに近いアイテム」（グリーン系背景）
  - 「🧬 まだ出会っていない注目成分」（オレンジ系背景 #FFF7F0）
- 選出ロジックをバッジで表示:
  - 軸1: 「スキャンN回の傾向から」
  - 軸2: 「N成分と未重複」

### UIリファレンス

`docs/hadami-scan-v2.jsx` を参照。このモックのRecommendSection / RakutenProductCard のデザインをTailwindクラスに変換して実装すること。

---

## Phase 5: 利用規約・プライバシーポリシー更新

`docs/HADAMI_利用規約.md` と `docs/HADAMI_プライバシーポリシー.md` の内容を、設定画面の法的情報リンク先に反映する。

### 追加が必要なUIフロー

1. 設定画面の「プライバシーポリシー」「利用規約」のリンク先をアプリ内WebViewまたは別画面で表示
2. 設定画面に「パーソナライズ設定」トグルを追加（ON/OFFでレコメンドの表示を制御）
3. 設定画面に「スキャン履歴の削除」ボタンを追加（scan_history + scan_ingredients を削除）

---

## 実装順序

```
Step 1: 楽天アプリID・アフィリエイトID取得（手動）
Step 2: 環境変数を .env.local と Vercel に設定（手動）
Step 3: Phase 1 の SQL を Supabase で実行
  → まず ingredients テーブルのスキーマを \d ingredients で確認
  → Materialized View のカラム名を実スキーマに合わせて調整
Step 4: Phase 2 の API Route を実装
Step 5: Phase 3 の履歴保存を既存スキャンフローに組み込む
Step 6: Phase 4 の フロントエンドを実装
Step 7: 動作テスト（楽天APIのレスポンス確認、キャッシュ動作確認）
Step 8: Phase 5 の規約更新
```

---

## 注意事項

- 楽天APIのレートリミット: **1秒1リクエスト**。`Promise.all` ではなく順次実行 + sleep
- 楽天APIレスポンスの `affiliateUrl` をそのまま使う（自前でリンク生成しない）
- `rakuten_product_cache` の有効期限は24時間。期限切れキャッシュの定期削除は Supabase の pg_cron 等で対応
- 商品カードには必ず「PR」ラベルを表示（ステマ規制対応）
- 「powered by 楽天市場」の表示は楽天アフィリエイト利用規約で必須
- 免責注記「※ 効果効能を保証するものではありません」を表示
- `ingredient_ids[]` と `scan_ingredients.ingredient_id` の型を揃えること（INT想定だが実スキーマを確認）
