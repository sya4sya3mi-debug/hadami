import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import {
  tryReserveScan,
  getMonthlyScanCount,
  getAccountScanLimit,
} from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  lookupIngredientCacheFull,
  saveIngredientCache,
} from "@/lib/ingredientCache";
import { MASTER_INGREDIENTS, getIngredientByName, getIngredientByInci } from "@/lib/ingredients";
import { resolveActiveIngredient } from "@/lib/mhlwActiveIngredients";
import { normalizeIngredientName } from "@/lib/normalize";
import { ocrSpaceExtract } from "@/lib/ocrSpace";
import { createScanResolveToken, verifyScanResolveToken } from "@/lib/scanResolveToken";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const IDENTIFY_MODEL = process.env.GEMINI_IDENTIFY_MODEL || "gemini-2.5-flash-lite";
const SEARCH_MODEL = process.env.GEMINI_SEARCH_MODEL || "gemini-2.5-flash";

// ── ユーティリティ ──

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function logScanInfo(
  event: string,
  details?: Record<string, string | number | boolean>,
) {
  if (details) {
    console.info(`[scan-product] ${event}`, details);
    return;
  }

  console.info(`[scan-product] ${event}`);
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

/** 生の成分テキストからマスターDBにマッチする成分を抽出（ローカル照合） */
function matchIngredientsLocally(rawText: string): {
  ingredientIds: string[];
  ingredientNames: string[];
} {
  const ids: string[] = [];
  const names: string[] = [];
  const seen = new Set<string>();
  const normalizedText = normalizeIngredientName(rawText);

  for (const ingredient of MASTER_INGREDIENTS) {
    if (seen.has(ingredient.id)) continue;

    // nameJa でマッチ
    if (rawText.includes(ingredient.nameJa) ||
        normalizedText.includes(normalizeIngredientName(ingredient.nameJa))) {
      seen.add(ingredient.id);
      ids.push(ingredient.id);
      names.push(ingredient.nameJa);
      continue;
    }

    // INCI名でマッチ (大文字小文字無視)
    if (normalizedText.includes(normalizeIngredientName(ingredient.nameInci))) {
      seen.add(ingredient.id);
      ids.push(ingredient.id);
      names.push(ingredient.nameJa);
      continue;
    }

    // aliases でマッチ
    if (ingredient.aliases) {
      const aliasMatch = ingredient.aliases.some(
        (alias) =>
          rawText.includes(alias) ||
          normalizedText.includes(normalizeIngredientName(alias))
      );
      if (aliasMatch) {
        seen.add(ingredient.id);
        ids.push(ingredient.id);
        names.push(ingredient.nameJa);
      }
    }
  }

  return { ingredientIds: ids, ingredientNames: names };
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

function buildIdentifyPrompt(ocrText: string): string {
  return [
    "以下のOCRテキストは化粧品パッケージから読み取ったものです。",
    "製品情報を特定してください。",
    "",
    "OCRテキスト:",
    ocrText,
    "",
    "回答フォーマット:",
    "PRODUCT: product name",
    "BRAND: brand name",
    "LANG: ja|ko|en",
    "TYPE: cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
    "",
    "For multiple products use PRODUCT1/BRAND1/LANG1/TYPE1 format.",
    "Always return at least one PRODUCT line.",
  ].join("\n");
}

async function identifyProducts(
  base64Data: string,
  enhancedData?: string,
): Promise<IdentifiedProduct[]> {
  // OCR.space でテキスト抽出（強調画像優先）
  let ocrText = await ocrSpaceExtract(enhancedData || base64Data);

  // 空ならカラー画像でリトライ
  if (!ocrText && enhancedData) {
    logScanInfo("ocr_retry_with_color_image");
    ocrText = await ocrSpaceExtract(base64Data);
  }

  if (!ocrText) {
    logScanInfo("ocr_returned_empty_text");
    return [];
  }

  logScanInfo("ocr_text_extracted", {
    textLength: ocrText.length,
  });

  // Gemini（テキストのみ）で商品情報を解析
  const response = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [{ role: "user", parts: [{ text: buildIdentifyPrompt(ocrText) }] }],
      config: {
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    15000,
    "Timed out while identifying product",
  ).catch(() => null);

  const text = response?.text ?? "";
  const identifiedProducts = parseIdentifiedProducts(text);
  logScanInfo("identify_completed", {
    outputLength: text.length,
    productCount: identifiedProducts.length,
  });

  return identifiedProducts;
}

// ── STEP 2: 有効成分検索 (Gemini + Google Search) ──

interface SearchResult {
  found: boolean;
  ingredients: string;
  isQuasiDrug: boolean;
  activeIngredients: string[];
  matchedIngredientIds: string[];
}

interface ResolvedScanProduct extends SearchResult {
  productName: string;
  brand: string;
  productType: string;
}

function extractJsonObject(text: string): string | null {
  const candidates = [
    text.match(/```json\s*([\s\S]*?)```/i)?.[1],
    text.match(/```\s*([\s\S]*?)```/)?.[1],
    text.match(/\{[\s\S]*\}/)?.[0],
    text,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // Try the next extraction strategy.
    }
  }

  return null;
}

/** STEP 2a: Gemini + Google Search で生の全成分テキストを取得 */
async function fetchRawIngredients(
  query: string,
): Promise<{ rawText: string; isQuasiDrug: boolean; activeNames: string[] } | null> {
  const prompt = [
    "あなたは化粧品成分の専門家です。Google検索を使って以下の製品の全成分リストを調べてください。",
    "",
    `製品: ${query}`,
    "",
    "検索のヒント：",
    `- 「${query} 全成分」「${query} 成分一覧」で検索してください`,
    "- @cosme、メーカー公式サイト、美容メディア、LOHACO、Amazon等を参考に",
    "- 製品名が正式名称と異なる場合は、類似する製品名でも検索してください",
    "",
    "JSON形式のみで回答（マークダウン不要）：",
    "{",
    '  "full_ingredients": "水、グリセリン、BG、ナイアシンアミド、...",',
    '  "is_quasi_drug": false,',
    '  "active_ingredients": ["有効成分として明記されている成分名のみ"]',
    "}",
    "",
    "ルール：",
    "- full_ingredients: 見つけた全成分を、カンマ区切りでそのまま転記（省略しないこと）",
    "- active_ingredients: 「有効成分」と明記されている成分のみ（一般化粧品の場合は空配列）",
    "- is_quasi_drug: 医薬部外品の場合はtrue",
    "- 成分情報が見つからない場合は full_ingredients を空文字で返す",
  ].join("\n");

  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: SEARCH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      30000,
      "Timed out while searching for ingredients",
    );

    const text = response.text ?? "";
    const jsonText = extractJsonObject(text);
    logScanInfo("ingredient_search_completed", {
      outputLength: text.length,
      hasJson: Boolean(jsonText),
    });
    if (!jsonText) return null;

    const parsed = JSON.parse(jsonText);
    const rawText = typeof parsed.full_ingredients === "string" ? parsed.full_ingredients : "";
    const isQuasiDrug = parsed.is_quasi_drug === true;
    const activeNames: string[] = Array.isArray(parsed.active_ingredients)
      ? parsed.active_ingredients.filter((v: unknown) => typeof v === "string")
      : [];

    return rawText.trim() ? { rawText, isQuasiDrug, activeNames } : null;
  } catch (error) {
    console.warn(
      "[scan-product] fetchRawIngredients failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function resolveScannedProduct(
  supabase: SupabaseClient,
  identified: IdentifiedProduct,
): Promise<ResolvedScanProduct> {
  const cached = await lookupIngredientCacheFull(
    supabase,
    identified.product,
    identified.brand,
  );

  if (cached?.ingredients) {
    logScanInfo("ingredient_cache_hit");
    const activeNames = (cached.activeIngredients || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const { ingredientIds } = matchIngredientsLocally(cached.ingredients);

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

  logScanInfo("ingredient_cache_miss");
  const searchResult = await searchKeyIngredients(identified.product, identified.brand);

  if (searchResult.found) {
    await saveIngredientCache(
      supabase,
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
}

async function searchKeyIngredients(
  product: string,
  brand: string,
): Promise<SearchResult> {
  const emptyResult: SearchResult = {
    found: false,
    ingredients: "",
    isQuasiDrug: false,
    activeIngredients: [],
    matchedIngredientIds: [],
  };

  // 1回目: ブランド＋商品名で検索
  const query = [brand, product].filter(Boolean).join(" ").trim();
  let raw = await fetchRawIngredients(query);

  // 2回目: 商品名のみでリトライ
  if (!raw) {
    const retryQuery = product || brand;
    if (retryQuery && retryQuery !== query) {
      logScanInfo("ingredient_search_retry_with_fallback_query");
      raw = await fetchRawIngredients(retryQuery);
    }
  }

  if (!raw) return emptyResult;

  // STEP 2b: ローカルでマスターDB照合（nameJa, INCI, aliases すべて使用）
  const { ingredientIds, ingredientNames } = matchIngredientsLocally(raw.rawText);
  logScanInfo("local_match_completed", {
    matchedIngredientCount: ingredientIds.length,
    rawTextLength: raw.rawText.length,
  });

  // 有効成分も解決
  const { ingredientNames: resolvedActiveNames } = resolveIngredientNames(raw.activeNames);

  return {
    found: ingredientIds.length > 0,
    ingredients: ingredientNames.join(", "),
    isQuasiDrug: raw.isQuasiDrug,
    activeIngredients: resolvedActiveNames,
    matchedIngredientIds: ingredientIds,
  };
}

// ── メインハンドラ ──

export async function POST(req: NextRequest) {
  // 1. レート制限
  const ip = getClientIp(req);
  const rl = await rateLimit(ip, 60_000, 10, "scan-product");
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
  let body: {
    imageBase64?: unknown;
    enhancedBase64?: unknown;
    productName?: unknown;
    brand?: unknown;
    productType?: unknown;
    resolveToken?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  if (
    typeof body.resolveToken === "string" &&
    typeof body.productName === "string" &&
    typeof body.brand === "string" &&
    typeof body.productType === "string"
  ) {
    const productName = body.productName.trim();
    const brand = body.brand.trim();
    const productType = body.productType.trim() || "other";

    if (!productName && !brand) {
      return NextResponse.json({ error: "Missing product to resolve" }, { status: 400 });
    }

    if (
      !verifyScanResolveToken(body.resolveToken, {
        userId: auth.user.id,
        productName,
        brand,
        productType,
      })
    ) {
      return NextResponse.json({ error: "Invalid resolve token" }, { status: 403 });
    }

    try {
      const resolved = await resolveScannedProduct(auth.supabase, {
        product: productName,
        brand,
        type: productType,
        lang: "ja",
      });
      return NextResponse.json(resolved);
    } catch (error) {
      console.error(
        "Resolve scan product error:",
        error instanceof Error ? error.message : error,
      );
      return NextResponse.json({ error: "Failed to resolve product" }, { status: 500 });
    }
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
    const count = await getMonthlyScanCount(auth.supabase, auth.user.id);
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
    if (identifiedProducts.length > 1) {
      const unresolvedProducts = identifiedProducts.map((identified) => {
        const productName = identified.product.trim();
        const brand = identified.brand.trim();
        const productType = identified.type.trim() || "other";

        return {
          productName,
          brand,
          productType,
          found: false,
          ingredients: "",
          isQuasiDrug: false,
          activeIngredients: [] as string[],
          matchedIngredientIds: [] as string[],
          requiresResolve: true,
          resolveToken: createScanResolveToken({
            userId: auth.user.id,
            productName,
            brand,
            productType,
          }),
        };
      });

      const first = unresolvedProducts[0];
      return NextResponse.json({
        productName: first?.productName || "",
        brand: first?.brand || "",
        productType: first?.productType || "other",
        found: false,
        ingredients: "",
        isQuasiDrug: false,
        activeIngredients: [],
        needsSelection: true,
        products: unresolvedProducts,
      });
    }

    const first = await resolveScannedProduct(auth.supabase, identifiedProducts[0]);
    return NextResponse.json({
      productName: first.productName,
      brand: first.brand,
      productType: first.productType,
      found: first.found,
      ingredients: first.ingredients,
      isQuasiDrug: first.isQuasiDrug,
      activeIngredients: first.activeIngredients,
      needsSelection: false,
      products: [first],
    });
  } catch (error) {
    console.error("Scan product error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to identify product" }, { status: 500 });
  }
}
