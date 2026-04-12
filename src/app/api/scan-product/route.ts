import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import {
  tryReserveScan,
  rollbackScan,
  getScanCountByEmail,
  getAccountScanLimit,
} from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  lookupIngredientCacheFull,
  saveIngredientCache,
} from "@/lib/ingredientCache";
import { MASTER_INGREDIENTS, getIngredientByName, getIngredientByInci } from "@/lib/ingredients";
import { resolveActiveIngredient } from "@/lib/mhlwActiveIngredients";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const IDENTIFY_MODEL = process.env.GEMINI_IDENTIFY_MODEL || "gemini-2.5-flash-lite";

// ── ユーティリティ ──

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/** 成分名リストを生成（Geminiプロンプト用） */
function buildIngredientNameList(): string {
  const names = MASTER_INGREDIENTS.map((i) => i.nameJa);
  return names.join(", ");
}

/** Geminiが返した成分名をマスターDBのIDに解決 */
function resolveIngredientNames(names: string[]): {
  ingredientIds: string[];
  ingredientNames: string[];
} {
  const ids: string[] = [];
  const resolved: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    // MHLW辞書 → マスターDB名前 → INCI名の順で解決
    const mhlw = resolveActiveIngredient(trimmed);
    const match = mhlw
      ? { id: mhlw.masterDbId }
      : getIngredientByName(trimmed) || getIngredientByInci(trimmed);

    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      ids.push(match.id);
      resolved.push(trimmed);
    }
  }

  return { ingredientIds: ids, ingredientNames: resolved };
}

// ── STEP 1: 商品識別 ──

interface IdentifiedProduct {
  product: string;
  brand: string;
  lang: string;
  type: string;
}

function extractField(text: string, field: string, suffix?: string): string {
  const sfx = suffix || "";
  const patterns = [
    new RegExp(`\\*{0,2}${field}${sfx}\\*{0,2}\\s*[:\uFF1A]\\s*(.+)`, "im"),
    new RegExp(`[-\u30FB]\\s*${field}${sfx}\\s*[:\uFF1A]\\s*(.+)`, "im"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\*+$/g, "").replace(/^["']+|["']+$/g, "").trim();
    }
  }
  return "";
}

function parseIdentifiedProducts(text: string): IdentifiedProduct[] {
  const products: IdentifiedProduct[] = [];

  const multiCheck = text.match(/PRODUCT\d+\s*[:\uFF1A]/gi);
  if (multiCheck && multiCheck.length > 1) {
    for (let i = 1; i <= multiCheck.length; i += 1) {
      const product = extractField(text, "PRODUCT", String(i));
      const brand = extractField(text, "BRAND", String(i));
      const lang = extractField(text, "LANG", String(i)).toLowerCase() || "ja";
      const type = extractField(text, "TYPE", String(i)) || "other";
      if (product || brand) {
        products.push({ product, brand, lang, type });
      }
    }
  }

  if (products.length === 0) {
    const product = extractField(text, "PRODUCT");
    const brand = extractField(text, "BRAND");
    const lang = extractField(text, "LANG").toLowerCase() || "ja";
    const type = extractField(text, "TYPE") || "other";
    if (product || brand) {
      products.push({ product, brand, lang, type });
    }
  }

  return products;
}

const IDENTIFY_PROMPT = [
  "Two images of the same cosmetic product package are shown.",
  "Image 1: color photo. Image 2: contrast-enhanced grayscale for text readability.",
  "Read the text on the package and return:",
  "",
  "PRODUCT: product name",
  "BRAND: brand name",
  "LANG: ja|ko|en",
  "TYPE: cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
  "",
  "For multiple products use PRODUCT1/BRAND1/LANG1/TYPE1 format.",
  "Always return at least one PRODUCT line.",
].join("\n");

const IDENTIFY_PROMPT_SINGLE = [
  "Identify the cosmetic product in this photo.",
  "Read the text on the package and return:",
  "",
  "PRODUCT: product name",
  "BRAND: brand name",
  "LANG: ja|ko|en",
  "TYPE: cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
  "",
  "For multiple products use PRODUCT1/BRAND1/LANG1/TYPE1 format.",
  "Always return at least one PRODUCT line.",
].join("\n");

function buildImageParts(colorBase64: string, enhancedBase64?: string) {
  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
  parts.push({ inlineData: { mimeType: "image/jpeg", data: colorBase64 } });
  if (enhancedBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: enhancedBase64 } });
    parts.push({ text: IDENTIFY_PROMPT });
  } else {
    parts.push({ text: IDENTIFY_PROMPT_SINGLE });
  }
  return parts;
}

async function identifyProducts(
  base64Data: string,
  enhancedData?: string,
): Promise<IdentifiedProduct[]> {
  const response = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [{ role: "user", parts: buildImageParts(base64Data, enhancedData) }],
      config: { maxOutputTokens: 1024 },
    }),
    15000,
    "Timed out while identifying product",
  ).catch(() => null);

  const text = response?.text ?? "";
  console.log("[scan-product] identify:", text.slice(0, 500));

  const products = parseIdentifiedProducts(text);
  if (products.length > 0) return products;

  // リトライ: 強調画像のみ
  const retryImage = enhancedData || base64Data;
  const retryResponse = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: retryImage } },
            { text: "Read the text on this cosmetic package.\n\nPRODUCT: (name)\nBRAND: (brand)\nLANG: ja\nTYPE: other" },
          ],
        },
      ],
      config: { maxOutputTokens: 512 },
    }),
    15000,
    "Timed out while identifying product (retry)",
  ).catch(() => null);

  return parseIdentifiedProducts(retryResponse?.text ?? "");
}

// ── STEP 2: 有効成分検索 (Gemini + Google Search) ──

interface SearchResult {
  found: boolean;
  ingredients: string;
  isQuasiDrug: boolean;
  activeIngredients: string[];
  matchedIngredientIds: string[];
}

async function searchKeyIngredients(
  product: string,
  brand: string,
): Promise<SearchResult> {
  const query = [brand, product].filter(Boolean).join(" ").trim();
  const ingredientList = buildIngredientNameList();

  const prompt = [
    "あなたは化粧品成分の専門家です。Google検索を使って以下の製品の成分情報を調べてください。",
    "",
    `製品: ${query}`,
    "",
    "@cosme、メーカー公式サイト、美容メディアなどを参考にしてください。",
    "",
    "この製品に含まれる成分を、以下のリストの中から該当するものだけ選んでください：",
    ingredientList,
    "",
    "JSON形式のみで回答（マークダウン不要）：",
    "{",
    '  "matched_ingredients": ["成分名1", "成分名2", ...],',
    '  "is_quasi_drug": false,',
    '  "active_ingredients": ["有効成分として明記されている成分のみ"]',
    "}",
    "",
    "ルール：",
    "- matched_ingredients: 上記リストに含まれる成分名のみ使用（リストにない名前は書かない）",
    "- active_ingredients: 「有効成分」と明記されている成分のみ（一般化粧品の場合は空配列）",
    "- is_quasi_drug: 医薬部外品の場合はtrue",
    "- 成分情報が見つからない場合は matched_ingredients を空配列で返す",
  ].join("\n");

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: IDENTIFY_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 2048,
        },
      }),
      20000,
      "Timed out while searching for ingredients",
    );

    const text = response.text ?? "";
    console.log("[scan-product] search result:", text.slice(0, 800));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { found: false, ingredients: "", isQuasiDrug: false, activeIngredients: [], matchedIngredientIds: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const matchedNames: string[] = Array.isArray(parsed.matched_ingredients)
      ? parsed.matched_ingredients.filter((v: unknown) => typeof v === "string")
      : [];
    const activeNames: string[] = Array.isArray(parsed.active_ingredients)
      ? parsed.active_ingredients.filter((v: unknown) => typeof v === "string")
      : [];
    const isQuasiDrug = parsed.is_quasi_drug === true;

    const { ingredientIds, ingredientNames } = resolveIngredientNames(matchedNames);
    const { ingredientNames: resolvedActiveNames } = resolveIngredientNames(activeNames);

    return {
      found: ingredientIds.length > 0,
      ingredients: ingredientNames.join(", "),
      isQuasiDrug,
      activeIngredients: resolvedActiveNames,
      matchedIngredientIds: ingredientIds,
    };
  } catch (error) {
    console.warn("[scan-product] searchKeyIngredients failed:", error);
    return { found: false, ingredients: "", isQuasiDrug: false, activeIngredients: [], matchedIngredientIds: [] };
  }
}

// ── メインハンドラ ──

export async function POST(req: NextRequest) {
  // 1. レート制限
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 60_000, 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再度お試しください。" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // 2. 認証
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  // 3. ボディサイズチェック
  const maxBodyBytes = 8 * 1024 * 1024;
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > maxBodyBytes) {
    return NextResponse.json({ error: "リクエストサイズが大きすぎます。" }, { status: 413 });
  }

  // 4. ペイロード検証
  let body: { imageBase64?: unknown; enhancedBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

  let enhancedData: string | undefined;
  if (typeof body.enhancedBase64 === "string" && body.enhancedBase64) {
    enhancedData = body.enhancedBase64.includes(",")
      ? body.enhancedBase64.split(",")[1]
      : body.enhancedBase64;
  }

  // 5. スキャン枠予約
  const reserved = await tryReserveScan(auth.supabase, auth.user.id, auth.user.email!);
  if (!reserved) {
    const count = await getScanCountByEmail(auth.supabase, auth.user.email!);
    const limit = getAccountScanLimit();
    return NextResponse.json(
      { error: "スキャン回数の上限に達しました", count, limit },
      { status: 429 },
    );
  }

  try {
    // ── STEP 1: 商品識別 (Gemini Vision) ──
    const identifiedProducts = await identifyProducts(validation.base64Data, enhancedData);

    if (identifiedProducts.length === 0) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
      return NextResponse.json({
        products: [],
        productName: "",
        brand: "",
        found: false,
        ingredients: "",
        isQuasiDrug: false,
        activeIngredients: [],
      });
    }

    // ── STEP 2: 各製品の成分検索 ──
    const results = await Promise.all(
      identifiedProducts.map(async (identified) => {
        // STEP 1.5: キャッシュ確認（無条件信頼）
        const cached = await lookupIngredientCacheFull(
          auth.supabase,
          identified.product,
          identified.brand,
        );

        if (cached?.ingredients) {
          console.log("[scan-product] cache HIT:", identified.product);
          const activeNames = (cached.activeIngredients || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          const { ingredientIds } = resolveIngredientNames(
            cached.ingredients.split(",").map((v) => v.trim()).filter(Boolean),
          );

          return {
            productName: identified.product,
            brand: identified.brand,
            productType: identified.type,
            found: true,
            ingredients: cached.ingredients,
            isQuasiDrug: cached.isQuasiDrug ?? false,
            activeIngredients: activeNames,
            matchedIngredientIds: ingredientIds,
          };
        }

        // キャッシュMISS → Gemini + Google Search
        console.log("[scan-product] cache MISS, searching:", identified.product);
        const searchResult = await searchKeyIngredients(identified.product, identified.brand);

        // 成分が見つかったらキャッシュ保存
        if (searchResult.found) {
          await saveIngredientCache(
            auth.supabase,
            identified.product,
            identified.brand,
            searchResult.ingredients,
            searchResult.isQuasiDrug,
            searchResult.activeIngredients.join(", "),
          );
        }

        return {
          productName: identified.product,
          brand: identified.brand,
          productType: identified.type,
          found: searchResult.found,
          ingredients: searchResult.ingredients,
          isQuasiDrug: searchResult.isQuasiDrug,
          activeIngredients: searchResult.activeIngredients,
          matchedIngredientIds: searchResult.matchedIngredientIds,
        };
      }),
    );

    // 成分が1つも見つからなかった場合、スキャン枠返却
    const hasUsableResult = results.some((r) => r.found);
    if (!hasUsableResult) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    const first = results[0];
    return NextResponse.json({
      productName: first.productName,
      brand: first.brand,
      productType: first.productType,
      found: first.found,
      ingredients: first.ingredients,
      isQuasiDrug: first.isQuasiDrug,
      activeIngredients: first.activeIngredients,
      products: results,
    });
  } catch (error) {
    await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    console.error("Scan product error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to identify product" }, { status: 500 });
  }
}
