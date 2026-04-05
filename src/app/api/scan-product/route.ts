import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import { tryReserveScan, rollbackScan, getScanCountByEmail, getAccountScanLimit } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface IdentifiedProduct {
  product: string;
  brand: string;
  lang: string;
  type: string;
}

function parseIdentifiedProducts(text: string): IdentifiedProduct[] {
  const products: IdentifiedProduct[] = [];

  // Try multi-product format first: "PRODUCT1: ...", "PRODUCT2: ..."
  const productMatches = text.match(/PRODUCT\d*:\s*.+/g);
  if (productMatches && productMatches.length > 1) {
    // Multi-product detected
    for (let i = 0; i < productMatches.length; i++) {
      const num = i + 1;
      const product = text.match(new RegExp(`PRODUCT${num}:\\s*(.+)`))?.[1]?.trim() || "";
      const brand = text.match(new RegExp(`BRAND${num}:\\s*(.+)`))?.[1]?.trim() || "";
      const lang = text.match(new RegExp(`LANG${num}:\\s*(.+)`))?.[1]?.trim().toLowerCase() || "ja";
      const type = text.match(new RegExp(`TYPE${num}:\\s*(.+)`))?.[1]?.trim() || "その他";
      if (product || brand) {
        products.push({ product, brand, lang, type });
      }
    }
  }

  // Fallback to single-product format
  if (products.length === 0) {
    const product = text.match(/PRODUCT:\s*(.+)/)?.[1]?.trim() || "";
    const brand = text.match(/BRAND:\s*(.+)/)?.[1]?.trim() || "";
    const lang = text.match(/LANG:\s*(.+)/)?.[1]?.trim().toLowerCase() || "ja";
    const type = text.match(/TYPE:\s*(.+)/)?.[1]?.trim() || "その他";
    if (product || brand) {
      products.push({ product, brand, lang, type });
    }
  }

  return products;
}

async function searchIngredients(product: string, brand: string, lang: string) {
  const searchQueries: string[] = [];
  if (lang === "ko") {
    searchQueries.push(`${brand} ${product} 전성분`);
    searchQueries.push(`${brand} ${product} 全成分`);
    searchQueries.push(`${brand} ${product} ingredients`);
  } else if (lang === "en") {
    searchQueries.push(`${brand} ${product} ingredients list`);
    searchQueries.push(`${brand} ${product} 全成分`);
  } else {
    searchQueries.push(`${brand} ${product} 全成分`);
    searchQueries.push(`${brand} ${product} ingredients`);
  }

  const searchMsg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `化粧品「${brand} ${product}」の全成分リストをネットで検索してください。

以下の検索クエリを順番に試してください（見つかったらそこで止めてOK）：
${searchQueries.map((q, i) => `${i + 1}. 「${q}」`).join("\n")}

見つけた成分リストを以下のフォーマットで回答してください：

FOUND: true
INGREDIENTS: 水, グリセリン, BG, ...（カンマ区切り、1行で）

見つからなかった場合：
FOUND: false
INGREDIENTS:

重要な注意：
- 成分名は日本語の化粧品表示名で記載（韓国語→日本語に翻訳すること）
- 例：정제수→水、글리세린→グリセリン、나이아신아마이드→ナイアシンアミド、부틸렌글라이콜→BG
- INCI名（英語）しかわからない場合はそのまま記載
- 余計な説明は不要、上記フォーマットだけ回答してください`,
          },
        ],
      },
    ],
  });

  const allTextBlocks = searchMsg.content.filter((b) => b.type === "text");
  const allText = allTextBlocks.map((b) => (b as { type: "text"; text: string }).text).join("\n");

  const foundMatch = allText.match(/FOUND:\s*(true|false)/i);
  const found = foundMatch?.[1]?.toLowerCase() === "true";

  let ingredientsRaw = "";
  if (found) {
    const ingMatch = allText.match(/INGREDIENTS:\s*([\s\S]+?)(?:\n\n|$)/);
    if (ingMatch) {
      ingredientsRaw = ingMatch[1]
        .replace(/\n/g, ", ")
        .replace(/、/g, ", ")
        .replace(/,\s*,/g, ",")
        .trim();
    }
  }

  return { found, ingredients: ingredientsRaw };
}

export async function POST(req: NextRequest) {
  // 1. IP rate limit
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 60_000, 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてからお試しください" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // 2. Auth check
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  // 3. Early body size check (reject before reading into memory)
  const MAX_BODY_BYTES = 8 * 1024 * 1024; // ~8MB (5MB image base64-encoded + JSON overhead)
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "リクエストサイズが大きすぎます" },
      { status: 413 }
    );
  }

  // 4. Payload validation
  let body: { imageBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

  // 4. Atomic scan quota check + reserve
  const reserved = await tryReserveScan(auth.supabase, auth.user.id, auth.user.email!);
  if (!reserved) {
    const count = await getScanCountByEmail(auth.supabase, auth.user.email!);
    const limit = getAccountScanLimit();
    return NextResponse.json(
      { error: "スキャン回数の上限に達しました", count, limit },
      { status: 429 }
    );
  }

  try {
    // Step 1: Identify product(s) from package photo
    const identifyMsg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: validation.base64Data,
              },
            },
            {
              type: "text",
              text: `この写真に写っている化粧品を全て特定してください。
韓国語・英語・日本語のいずれでもOKです。

重要：日本のメーカー・ブランドの場合は、製品名・ブランド名を日本語で記載してください。
例：SHISEIDO → 資生堂、KOSE → コーセー、SK-II → SK-II（そのまま）
海外ブランドの場合はパッケージ表記のままでOKです。

■ 製品が1つの場合：
PRODUCT: [製品名]
BRAND: [ブランド名]
LANG: [パッケージの主な言語: ja/ko/en]
TYPE: [製品タイプ: 化粧水/乳液/クリーム/美容液/洗顔/クレンジング/日焼け止め/パック/ミスト/その他]

■ 製品が複数の場合（番号付きで全て列挙）：
PRODUCT1: [製品名]
BRAND1: [ブランド名]
LANG1: [言語]
TYPE1: [製品タイプ]
PRODUCT2: [製品名]
BRAND2: [ブランド名]
LANG2: [言語]
TYPE2: [製品タイプ]
...

余計な説明は不要、上記フォーマットだけ回答してください。`,
            },
          ],
        },
      ],
    });

    const identifyText =
      identifyMsg.content.find((b) => b.type === "text")?.text || "";

    const identifiedProducts = parseIdentifiedProducts(identifyText);

    console.log(`[identify] Found ${identifiedProducts.length} product(s):`, identifiedProducts);

    if (identifiedProducts.length === 0) {
      // 製品を特定できなかった場合、スキャン枠を返却（OCRフォールバックで再予約される）
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
      return NextResponse.json({
        products: [],
        productName: "",
        brand: "",
        found: false,
        ingredients: "",
      });
    }

    // Step 2: Search ingredients for each product (in parallel)
    const results = await Promise.all(
      identifiedProducts.map(async (p) => {
        const { found, ingredients } = await searchIngredients(p.product, p.brand, p.lang);
        return {
          productName: p.product,
          brand: p.brand,
          productType: p.type,
          found,
          ingredients,
        };
      })
    );

    console.log(`[results] ${results.length} product(s) processed`);

    // 成分が1件も見つからなかった場合、スキャン枠を返却（OCRフォールバックで再予約される）
    const hasUsableResult = results.some(r => r.found && r.ingredients);
    if (!hasUsableResult) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    // Return backward-compatible response (first product) + full products array
    const first = results[0];
    return NextResponse.json({
      // Backward compatible fields (for single product)
      productName: first.productName,
      brand: first.brand,
      productType: first.productType,
      found: first.found,
      ingredients: first.ingredients,
      // New: full array for multi-product
      products: results,
    });
  } catch (error) {
    await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    console.error("Scan product error:", error);
    return NextResponse.json(
      { error: "Failed to identify product" },
      { status: 500 }
    );
  }
}
