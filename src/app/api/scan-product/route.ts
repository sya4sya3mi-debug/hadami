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
import { getIngredientByInci, getIngredientByName } from "@/lib/ingredients";
import { resolveActiveIngredient } from "@/lib/mhlwActiveIngredients";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ScanDecision = "accepted" | "needs_more_image" | "rejected";

interface IdentifiedProduct {
  product: string;
  brand: string;
  lang: string;
  type: string;
}

interface SearchCandidate {
  likely_sales_name?: string;
  is_quasi_drug_candidate?: boolean;
  ingredients_text_candidate?: string;
  active_ingredients_candidate?: string[];
  source_urls?: string[];
}

interface IngredientRecord {
  raw: string;
  cleaned: string;
}

interface PageEvidence {
  url: string;
  host: string;
  ingredientRecord?: IngredientRecord;
  activeIngredients: string[];
  isQuasiDrug: boolean;
  salesName?: string;
  evidenceText?: string;
  score: number;
}

interface ProductEvidenceResult {
  found: boolean;
  ingredients: string;
  isQuasiDrug: boolean;
  activeIngredients: string[];
  activeEvidenceText?: string;
  salesName?: string;
  sourceUrls: string[];
  decision: ScanDecision;
  confidenceScore: number;
}

const SUSPICIOUS_HOST_FRAGMENTS = [
  "lips",
  "rakuten",
  "amazon",
  "yahoo",
  "lohaco",
  "qoo10",
  "wowma",
  "shoplist",
];

const REVIEW_HOST_FRAGMENTS = [
  "cosme.net",
  "atcosme",
];

const INGREDIENT_LABEL = "\\u6210\\u5206";
const ACTIVE_LABEL = "\\u6709\\u52B9\\u6210\\u5206";
const SALES_NAME_LABEL =
  "(?:\\u8CA9\\u58F2\\u540D(?:\\(\\u85AC\\u4E8B\\u8CA9\\u58F2\\u540D\\))?|\\u85AC\\u4E8B\\u8CA9\\u58F2\\u540D)";
const QUASI_DRUG_TEXT = "\u533b\u85ac\u90e8\u5916\u54c1";
const INGREDIENT_TEXT = "\u6210\u5206";
const ACTIVE_TEXT = "\u6709\u52B9\u6210\u5206";
const SALES_NAME_TEXT = "\u8CA9\u58F2\u540D";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function parseIdentifiedProducts(text: string): IdentifiedProduct[] {
  const products: IdentifiedProduct[] = [];
  const productMatches = text.match(/PRODUCT\d*:\s*.+/g);

  if (productMatches && productMatches.length > 1) {
    for (let i = 0; i < productMatches.length; i += 1) {
      const num = i + 1;
      const product = text.match(new RegExp(`PRODUCT${num}:\\s*(.+)`))?.[1]?.trim() || "";
      const brand = text.match(new RegExp(`BRAND${num}:\\s*(.+)`))?.[1]?.trim() || "";
      const lang =
        text.match(new RegExp(`LANG${num}:\\s*(.+)`))?.[1]?.trim().toLowerCase() || "ja";
      const type = text.match(new RegExp(`TYPE${num}:\\s*(.+)`))?.[1]?.trim() || "other";

      if (product || brand) {
        products.push({ product, brand, lang, type });
      }
    }
  }

  if (products.length === 0) {
    const product = text.match(/PRODUCT:\s*(.+)/)?.[1]?.trim() || "";
    const brand = text.match(/BRAND:\s*(.+)/)?.[1]?.trim() || "";
    const lang = text.match(/LANG:\s*(.+)/)?.[1]?.trim().toLowerCase() || "ja";
    const type = text.match(/TYPE:\s*(.+)/)?.[1]?.trim() || "other";

    if (product || brand) {
      products.push({ product, brand, lang, type });
    }
  }

  return products;
}

function normalizeForCompare(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z\u00c0-\u024f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/gi, "");
}

function parseSearchCandidate(text: string): SearchCandidate {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    const parsed = JSON.parse(jsonMatch[0]) as SearchCandidate;
    return {
      likely_sales_name: parsed.likely_sales_name?.trim(),
      is_quasi_drug_candidate: parsed.is_quasi_drug_candidate === true,
      ingredients_text_candidate: parsed.ingredients_text_candidate?.trim(),
      active_ingredients_candidate: Array.isArray(parsed.active_ingredients_candidate)
        ? parsed.active_ingredients_candidate.filter((item) => typeof item === "string")
        : [],
      source_urls: Array.isArray(parsed.source_urls)
        ? parsed.source_urls.filter((item) => typeof item === "string")
        : [],
    };
  } catch {
    return {};
  }
}

function parseGroundingUrls(response: unknown): string[] {
  const chunks =
    (response as {
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string } }>;
        };
      }>;
    })?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return uniqueStrings(chunks.map((chunk) => chunk.web?.uri));
}

function getHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

function isSuspiciousHost(host: string): boolean {
  return SUSPICIOUS_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
}

function isReviewHost(host: string): boolean {
  return REVIEW_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|li|h\d|section|article|tr|td|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

function cleanIngredientToken(value: string): string {
  return value
    .replace(new RegExp(`^(?:${INGREDIENT_LABEL}|${ACTIVE_LABEL}|ingredients?|active ingredients?)\\s*[:\\uFF1A]\\s*`, "i"), "")
    .replace(/[*\uFF0A]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeIngredientNames(value: string): string[] {
  return uniqueStrings(
    value
      .split(/[\u3001,\uFF0C;/]/)
      .map((token) => cleanIngredientToken(token))
      .filter((token) => token.length >= 2),
  );
}

function canonicalizeActiveName(value: string): string | null {
  const cleaned = cleanIngredientToken(value);
  if (!cleaned) return null;

  const mhlw = resolveActiveIngredient(cleaned);
  if (mhlw) return mhlw.canonicalName;

  const ingredient = getIngredientByName(cleaned) || getIngredientByInci(cleaned);
  if (ingredient) return ingredient.nameJa;

  return cleaned;
}

function normalizeActiveNames(values: string[]): string[] {
  return uniqueStrings(values.map((value) => canonicalizeActiveName(value) || undefined));
}

function extractIngredientRecord(lines: string[]): IngredientRecord | undefined {
  const labelPattern = new RegExp(`^(?:${INGREDIENT_LABEL}|ingredients?)\\s*[:\\uFF1A]`, "i");
  const stripPattern = new RegExp(`^(?:${INGREDIENT_LABEL}|ingredients?)\\s*[:\\uFF1A]\\s*`, "i");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!labelPattern.test(line)) continue;

    let raw = line.replace(stripPattern, "").trim();
    if (!raw && lines[i + 1]) raw = lines[i + 1].trim();
    if (!raw) continue;

    const cleaned = raw
      .replace(/(?:[*\uFF0A])\u306F.*$/, "")
      .replace(/\u7121\u8868\u793A\u306F.*$/, "")
      .trim();

    return { raw, cleaned };
  }

  return undefined;
}

function extractSalesName(lines: string[]): string | undefined {
  const sameLinePattern = new RegExp(`${SALES_NAME_LABEL}\\s*[:\\uFF1A]?\\s*(.+)$`);
  const lineOnlyPattern = new RegExp(`${SALES_NAME_LABEL}$`);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const sameLine = line.match(sameLinePattern);

    if (sameLine?.[1]) {
      const candidate = sameLine[1].trim();
      if (candidate && !candidate.includes("\u8CA9\u58F2\u540D")) return candidate;
    }

    if (lineOnlyPattern.test(line)) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && nextLine.length <= 80) return nextLine;
    }
  }

  return undefined;
}

function extractDirectActiveIngredients(lines: string[]): string[] {
  const matches: string[] = [];
  const pattern = new RegExp(`^(?:${ACTIVE_LABEL}|active ingredients?)\\s*[:\\uFF1A]\\s*(.+)$`, "i");

  for (const line of lines) {
    const match = line.match(pattern);
    if (!match?.[1]) continue;
    matches.push(...tokenizeIngredientNames(match[1]));
  }

  return normalizeActiveNames(matches);
}

function extractMarkedActiveIngredients(record?: IngredientRecord): string[] {
  if (!record?.raw || !/[*\uFF0A]/.test(record.raw)) return [];

  const body = record.raw
    .replace(/(?:[*\uFF0A])\u306F.*$/, "")
    .replace(/\u7121\u8868\u793A\u306F.*$/, "");

  const marked = body
    .split(/[\u3001,\uFF0C]/)
    .filter((token) => /[*\uFF0A]/.test(token))
    .map((token) => cleanIngredientToken(token));

  return normalizeActiveNames(marked);
}

function buildSearchQueries(product: string, brand: string, lang: string): string[] {
  const exact = [brand, product].filter(Boolean).join(" ").trim();
  const queries = [
    `"${exact}" 全成分`,
    `"${exact}" ${QUASI_DRUG_TEXT} ${ACTIVE_TEXT}`,
    `"${exact}" ${SALES_NAME_TEXT} ${INGREDIENT_TEXT}`,
    `"${exact}" 全成分表示`,
    `"${exact}" "*\u306F\u300C${ACTIVE_TEXT}\u300D"`,
    `site:pmda.go.jp "${exact}"`,
  ];

  if (lang === "en") {
    queries.push(`"${exact}" active ingredient quasi-drug`);
    queries.push(`"${exact}" full ingredients list`);
  }

  return queries;
}

function scoreEvidence(
  text: string,
  product: string,
  brand: string,
  host: string,
  ingredientRecord: IngredientRecord | undefined,
  activeIngredients: string[],
  isQuasiDrug: boolean,
  salesName?: string,
): number {
  const normalizedText = normalizeForCompare(text);
  const normalizedBrand = normalizeForCompare(brand);
  const normalizedProduct = normalizeForCompare(product);
  let score = 0;

  if (ingredientRecord?.cleaned) score += 18;
  if (activeIngredients.length > 0) score += 38;
  if (isQuasiDrug) score += 10;
  if (salesName) score += 12;
  if (normalizedBrand && normalizedText.includes(normalizedBrand)) score += 5;
  if (normalizedProduct && normalizedText.includes(normalizedProduct)) score += 7;

  if (host.endsWith("pmda.go.jp")) score += 12;
  else if (host.endsWith("mhlw.go.jp")) score += 10;
  else if (isReviewHost(host)) score -= 8;
  else if (!isSuspiciousHost(host) && host) score += 14;

  if (isSuspiciousHost(host)) score -= 24;
  if (isQuasiDrug && activeIngredients.length === 0) score -= 6;

  return Math.max(0, Math.min(100, score));
}

async function fetchPageEvidence(
  url: string,
  product: string,
  brand: string,
): Promise<PageEvidence | null> {
  try {
    const response = await withTimeout(
      fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; HadamiBot/1.0)",
        },
      }),
      8000,
      `Timed out while fetching ${url}`,
    );

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|text\/plain/i.test(contentType)) return null;

    const html = await withTimeout(response.text(), 8000, `Timed out while reading ${url}`);
    const text = htmlToText(html);
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const ingredientRecord = extractIngredientRecord(lines);
    const directActiveIngredients = extractDirectActiveIngredients(lines);
    const markedActiveIngredients = extractMarkedActiveIngredients(ingredientRecord);
    const activeIngredients = normalizeActiveNames([
      ...directActiveIngredients,
      ...markedActiveIngredients,
    ]);
    const salesName = extractSalesName(lines);
    const isQuasiDrug = lines.some((line) => line.includes(QUASI_DRUG_TEXT));

    const evidenceLinePattern = new RegExp(
      `^(?:${ACTIVE_LABEL}|active ingredients?)\\s*[:\\uFF1A]`,
      "i",
    );
    const evidenceText =
      lines.find((line) => evidenceLinePattern.test(line)) ||
      (ingredientRecord?.raw && activeIngredients.length > 0
        ? `${INGREDIENT_TEXT}：${ingredientRecord.raw}`
        : undefined);

    return {
      url,
      host: getHost(url),
      ingredientRecord,
      activeIngredients,
      isQuasiDrug,
      salesName,
      evidenceText,
      score: scoreEvidence(
        text,
        product,
        brand,
        getHost(url),
        ingredientRecord,
        activeIngredients,
        isQuasiDrug,
        salesName,
      ),
    };
  } catch (error) {
    console.warn("[scan-product] fetchPageEvidence failed:", url, error);
    return null;
  }
}

function buildCachedResult(cached: {
  ingredients: string;
  isQuasiDrug?: boolean;
  activeIngredients?: string;
}): ProductEvidenceResult {
  const activeIngredients = normalizeActiveNames(
    (cached.activeIngredients || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const isQuasiDrug = cached.isQuasiDrug === true;
  const decision: ScanDecision =
    activeIngredients.length > 0 ? "accepted" : isQuasiDrug ? "needs_more_image" : "rejected";

  return {
    found: Boolean(cached.ingredients),
    ingredients: cached.ingredients,
    isQuasiDrug,
    activeIngredients,
    activeEvidenceText: undefined,
    salesName: undefined,
    sourceUrls: [],
    decision,
    confidenceScore: activeIngredients.length > 0 ? 90 : isQuasiDrug ? 52 : 45,
  };
}

async function searchProductEvidence(
  product: string,
  brand: string,
  lang: string,
): Promise<ProductEvidenceResult> {
  const queryText = [brand, product].filter(Boolean).join(" ").trim();
  const searchQueries = buildSearchQueries(product, brand, lang);

  try {
    const searchResponse = await withTimeout(
      client.models.generateContent({
        model: IDENTIFY_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You are a cosmetic ingredient researcher. Use Google Search to find the COMPLETE ingredient list for this product.",
                  "Search for the product on manufacturer sites, official stores, PMDA, and MHLW. Avoid marketplaces.",
                  "",
                  `Product: ${queryText}`,
                  "Search hints:",
                  ...searchQueries.map((query, index) => `${index + 1}. ${query}`),
                  "",
                  "CRITICAL: Extract the FULL ingredient list exactly as written on the product or official source.",
                  "Do NOT truncate or summarize — copy every single ingredient name.",
                  "",
                  "Return JSON only (no markdown, no extra text):",
                  "{",
                  '  "likely_sales_name": "exact product sales name if found, else empty string",',
                  '  "is_quasi_drug_candidate": false,',
                  '  "ingredients_text_candidate": "FULL comma-separated ingredient list here — do not shorten",',
                  '  "active_ingredients_candidate": ["only ingredients explicitly labeled as 有効成分 or active ingredient"],',
                  '  "source_urls": ["url1", "url2"]',
                  "}",
                  "",
                  "Rules:",
                  "- ingredients_text_candidate: include ALL ingredients, comma-separated, exactly as listed",
                  "- If the product is 医薬部外品 (quasi-drug), set is_quasi_drug_candidate to true",
                  "- active_ingredients_candidate: ONLY explicitly labeled active/有効 ingredients, NOT all ingredients",
                  "- If no ingredient list is found anywhere, return empty string for ingredients_text_candidate",
                ].join("\n"),
              },
            ],
          },
        ],
        config: {
          tools: [{ googleSearch: {} }],
          maxOutputTokens: 4096,
        },
      }),
      20000,
      "Timed out while searching for product evidence",
    );

    const parsedCandidate = parseSearchCandidate(searchResponse.text ?? "");
    const candidateUrls = uniqueStrings([
      ...(parsedCandidate.source_urls || []),
      ...parseGroundingUrls(searchResponse),
    ])
      .filter(isHttpUrl)
      .slice(0, 4);

    const pageEvidence = (
      await Promise.all(candidateUrls.map((url) => fetchPageEvidence(url, product, brand)))
    ).filter((value): value is PageEvidence => value !== null);

    const bestEvidence = [...pageEvidence].sort((left, right) => {
      const leftPriority = left.activeIngredients.length > 0 ? 1 : 0;
      const rightPriority = right.activeIngredients.length > 0 ? 1 : 0;
      return rightPriority - leftPriority || right.score - left.score;
    })[0];

    const ingredients =
      bestEvidence?.ingredientRecord?.cleaned || parsedCandidate.ingredients_text_candidate || "";
    const isQuasiDrug =
      bestEvidence?.isQuasiDrug || parsedCandidate.is_quasi_drug_candidate === true;
    const explicitActiveIngredients = normalizeActiveNames(bestEvidence?.activeIngredients || []);
    const fallbackScore =
      (candidateUrls.length > 0 ? 24 : 0) +
      (parsedCandidate.is_quasi_drug_candidate ? 10 : 0) +
      (ingredients ? 10 : 0);
    const confidenceScore = Math.max(bestEvidence?.score || 0, fallbackScore);

    let decision: ScanDecision = "rejected";
    let activeIngredients: string[] = [];

    if (explicitActiveIngredients.length > 0 && confidenceScore >= 60) {
      decision = "accepted";
      activeIngredients = explicitActiveIngredients;
    } else if (isQuasiDrug && confidenceScore >= 40) {
      decision = "needs_more_image";
    }

    return {
      found: Boolean(ingredients),
      ingredients,
      isQuasiDrug,
      activeIngredients,
      activeEvidenceText: bestEvidence?.evidenceText,
      salesName: bestEvidence?.salesName || parsedCandidate.likely_sales_name,
      sourceUrls: uniqueStrings([
        ...(bestEvidence ? [bestEvidence.url] : []),
        ...(parsedCandidate.source_urls || []),
        ...candidateUrls,
      ]).slice(0, 6),
      decision,
      confidenceScore,
    };
  } catch (error) {
    console.warn("[scan-product] searchProductEvidence failed:", error);
    return {
      found: false,
      ingredients: "",
      isQuasiDrug: false,
      activeIngredients: [],
      activeEvidenceText: undefined,
      salesName: undefined,
      sourceUrls: [],
      decision: "rejected",
      confidenceScore: 0,
    };
  }
}

const IDENTIFY_MODEL = process.env.GEMINI_IDENTIFY_MODEL || "gemini-2.5-flash";

const STANDARD_IDENTIFY_PROMPT = [
  "You are an expert at reading text on Japanese cosmetic product packages.",
  "",
  "STEP 1 — Read ALL text visible on this package photo.",
  "Japanese cosmetics typically display text in this order:",
  "  - BRAND name: usually a logo or large styled text at the top or center (often in English, katakana, or a mix)",
  "  - Series / line name: sometimes written below the brand",
  "  - Product name: describes the product function (e.g. 化粧水, 美容液, クリーム, UV, etc.)",
  "  - Volume (mL, g): sometimes near the bottom",
  "Text may be in Japanese (kanji, hiragana, katakana), English, Korean, or mixed.",
  "Text may be vertical, curved, small, or partially obscured — read it all anyway.",
  "",
  "STEP 2 — From the text you read, determine:",
  "  - BRAND: the manufacturer or brand name (e.g. 資生堂, SHISEIDO, SK-II, ロート, 無印良品, Dior, etc.)",
  "  - PRODUCT: the full product name including series and variant (e.g. エリクシール シュペリエル リフトモイスト ローション T II)",
  "  - Do NOT include volume (mL, g) in the product name.",
  "",
  "STEP 3 — Return EXACTLY in this format (no extra text):",
  "",
  "Use TYPE values from this list:",
  "cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
  "",
  "Single product:",
  "PRODUCT: ...",
  "BRAND: ...",
  "LANG: ja|ko|en",
  "TYPE: ...",
  "",
  "Multiple products:",
  "PRODUCT1: ...",
  "BRAND1: ...",
  "LANG1: ja|ko|en",
  "TYPE1: ...",
  "PRODUCT2: ...",
  "BRAND2: ...",
  "LANG2: ja|ko|en",
  "TYPE2: ...",
  "",
  "IMPORTANT: You MUST return at least one PRODUCT line. Even if unsure, give your best reading of the text.",
  "Do not say you cannot identify it. Do not add commentary.",
].join("\n");

const RETRY_IDENTIFY_PROMPT = [
  "This is a photo of a cosmetic or skincare product package.",
  "Your job is to READ EVERY PIECE OF TEXT visible in this image — no matter how small, blurry, tilted, or partially hidden.",
  "",
  "Common text locations on cosmetic packages:",
  "- Front center or top: brand name / logo (often English or katakana)",
  "- Below brand: series name or product line name",
  "- Center or bottom: product type description (化粧水, 乳液, クリーム, セラム, 美容液, 日焼け止め, etc.)",
  "- Small text: volume (mL, g), ingredients, warnings",
  "",
  "After reading all text, classify:",
  "- BRAND: the brand/manufacturer name",
  "- PRODUCT: the product name (combine series + product type if visible)",
  "",
  "Return in EXACTLY this format:",
  "PRODUCT: (your best reading of the product name)",
  "BRAND: (your best reading of the brand name)",
  "LANG: ja|ko|en",
  "TYPE: cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
  "",
  "You MUST return at least one PRODUCT line. Partial or approximate readings are acceptable.",
  "Do NOT say you cannot identify it. Do NOT add commentary.",
].join("\n");

const IMAGE_OCR_PROMPT = [
  "Look carefully at this cosmetic product package image.",
  "Find and extract the ingredient list (成分, 全成分, INGREDIENTS, or similar).",
  "If there is a 有効成分 (active ingredients) section, extract it separately.",
  "",
  "Return JSON only (no markdown):",
  "{",
  '  "ingredients_text": "full comma-separated ingredient list, exactly as written",',
  '  "active_ingredients": ["active ingredient 1", "active ingredient 2"],',
  '  "is_quasi_drug": false',
  "}",
  "",
  "If no ingredient list is visible in the image, return:",
  '{"ingredients_text": "", "active_ingredients": [], "is_quasi_drug": false}',
  "",
  "Do NOT guess or add ingredients not visible in the image.",
].join("\n");

const OCR_FALLBACK_IDENTIFY_PROMPT = [
  "Read ALL text visible in this cosmetic product package photo.",
  "List every text element you can see, then determine the brand and product name.",
  "",
  "Output format (strictly follow this):",
  "PRODUCT: (product name — combine series name + product type if both are visible)",
  "BRAND: (brand or manufacturer name)",
  "LANG: ja|ko|en",
  "TYPE: cleansing / face_wash / toner / serum / emulsion / cream / sunscreen / mask_pack / eye_care / oil / mist / other",
  "",
  "Rules:",
  "- If you can only read partial text, still return your best guess.",
  "- If you see ONLY a brand name and no product name, return BRAND with the brand and PRODUCT with whatever descriptive text you see.",
  "- If you see text but cannot determine brand vs product, put the most prominent text in PRODUCT and any secondary text in BRAND.",
  "- You MUST always return at least PRODUCT and BRAND lines. NEVER return empty.",
].join("\n");

async function identifyProductsWithRetry(base64Data: string): Promise<IdentifiedProduct[]> {
  // Attempt 1: primary model + standard prompt (detailed Japanese-focused)
  const firstResponse = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: STANDARD_IDENTIFY_PROMPT },
          ],
        },
      ],
      config: { maxOutputTokens: 1024 },
    }),
    15000,
    "Timed out while identifying product (attempt 1)",
  ).catch(() => null);

  const firstProducts = parseIdentifiedProducts(firstResponse?.text ?? "");
  if (firstProducts.length > 0) return firstProducts;

  // Attempt 2: same model + retry prompt (more lenient, text-reading focused)
  const retryResponse = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: RETRY_IDENTIFY_PROMPT },
          ],
        },
      ],
      config: { maxOutputTokens: 1024 },
    }),
    15000,
    "Timed out while identifying product (attempt 2)",
  ).catch(() => null);

  const retryProducts = parseIdentifiedProducts(retryResponse?.text ?? "");
  if (retryProducts.length > 0) return retryProducts;

  // Attempt 3: OCR fallback — pure text extraction approach
  const ocrResponse = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: OCR_FALLBACK_IDENTIFY_PROMPT },
          ],
        },
      ],
      config: { maxOutputTokens: 1024 },
    }),
    15000,
    "Timed out while identifying product (attempt 3 — OCR fallback)",
  ).catch(() => null);

  return parseIdentifiedProducts(ocrResponse?.text ?? "");
}

async function ocrIngredientsFromImage(base64Data: string): Promise<{
  ingredients_text: string;
  active_ingredients: string[];
  is_quasi_drug: boolean;
} | null> {
  try {
    const response = await withTimeout(
      client.models.generateContent({
        model: IDENTIFY_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
              { text: IMAGE_OCR_PROMPT },
            ],
          },
        ],
        config: { maxOutputTokens: 4096 },
      }),
      15000,
      "Timed out while OCR-ing ingredients from image",
    );

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.ingredients_text !== "string") return null;
    return {
      ingredients_text: parsed.ingredients_text,
      active_ingredients: Array.isArray(parsed.active_ingredients) ? parsed.active_ingredients : [],
      is_quasi_drug: parsed.is_quasi_drug === true,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 60_000, 10);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "リクエストが多すぎます。しばらくしてから再度お試しください。",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const maxBodyBytes = 8 * 1024 * 1024;
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > maxBodyBytes) {
    return NextResponse.json(
      { error: "リクエストサイズが大きすぎます。" },
      { status: 413 },
    );
  }

  let body: { imageBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

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
    let identifiedProducts = await identifyProductsWithRetry(validation.base64Data);

    // Even if all 3 identify attempts failed, try OCR from image to get at least product name/brand
    if (identifiedProducts.length === 0) {
      const imageOcr = await ocrIngredientsFromImage(validation.base64Data);
      // Return partial result so the user can at least see/edit the product name
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
      return NextResponse.json({
        products: [],
        productName: "",
        brand: "",
        found: Boolean(imageOcr?.ingredients_text),
        ingredients: imageOcr?.ingredients_text || "",
        isQuasiDrug: imageOcr?.is_quasi_drug || false,
        activeIngredients: imageOcr?.active_ingredients || [],
      });
    }

    const results = await Promise.all(
      identifiedProducts.map(async (identifiedProduct) => {
        const cached = await lookupIngredientCacheFull(
          auth.supabase,
          identifiedProduct.product,
          identifiedProduct.brand,
        );

        let evidence: ProductEvidenceResult | null = null;
        if (cached?.ingredients) {
          const cachedResult = buildCachedResult(cached);
          const shouldReuseCache =
            cachedResult.activeIngredients.length > 0 || cachedResult.isQuasiDrug === false;
          if (shouldReuseCache) evidence = cachedResult;
        }

        if (!evidence) {
          evidence = await searchProductEvidence(
            identifiedProduct.product,
            identifiedProduct.brand,
            identifiedProduct.lang,
          );
        }

        // Fallback: if web search found no ingredients, try OCR from the image
        if (!evidence.found || !evidence.ingredients) {
          const imageOcr = await ocrIngredientsFromImage(validation.base64Data);
          if (imageOcr?.ingredients_text) {
            evidence = {
              found: true,
              ingredients: imageOcr.ingredients_text,
              isQuasiDrug: imageOcr.is_quasi_drug,
              activeIngredients: normalizeActiveNames(imageOcr.active_ingredients),
              activeEvidenceText: undefined,
              salesName: evidence.salesName,
              sourceUrls: evidence.sourceUrls,
              decision: imageOcr.active_ingredients.length > 0 ? "accepted" : "rejected",
              confidenceScore: 50,
            };
          }
        }

        if (evidence.found && evidence.ingredients) {
          await saveIngredientCache(
            auth.supabase,
            identifiedProduct.product,
            identifiedProduct.brand,
            evidence.ingredients,
            evidence.isQuasiDrug,
            evidence.activeIngredients.join(", "),
          );
        }

        return {
          productName: identifiedProduct.product,
          brand: identifiedProduct.brand,
          productType: identifiedProduct.type,
          found: evidence.found,
          ingredients: evidence.ingredients,
          isQuasiDrug: evidence.isQuasiDrug,
          activeIngredients: evidence.activeIngredients,
          activeEvidenceText: evidence.activeEvidenceText,
          salesName: evidence.salesName,
          sourceUrls: evidence.sourceUrls,
          decision: evidence.decision,
          confidenceScore: evidence.confidenceScore,
        };
      }),
    );

    const hasUsableResult = results.some((result) => result.found && result.ingredients);
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
      activeEvidenceText: first.activeEvidenceText,
      salesName: first.salesName,
      sourceUrls: first.sourceUrls,
      decision: first.decision,
      confidenceScore: first.confidenceScore,
      products: results,
    });
  } catch (error) {
    await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    if (error instanceof Error) {
      console.error("Scan product error:", error.message, error.stack);
    } else {
      console.error("Scan product error (unknown):", JSON.stringify(error));
    }
    return NextResponse.json({ error: "Failed to identify product" }, { status: 500 });
  }
}
