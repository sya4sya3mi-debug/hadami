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

// Match "PRODUCT:", "PRODUCT：", "**PRODUCT:**", "- PRODUCT:" etc.
function extractField(text: string, field: string, suffix?: string): string {
  const sfx = suffix || "";
  // Try various delimiter formats: ASCII colon, full-width colon, with/without markdown
  const patterns = [
    new RegExp(`\\*{0,2}${field}${sfx}\\*{0,2}\\s*[:\\uFF1A]\\s*(.+)`, "im"),
    new RegExp(`[-\\u30FB]\\s*${field}${sfx}\\s*[:\\uFF1A]\\s*(.+)`, "im"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      // Strip trailing markdown, quotes, etc.
      return match[1].replace(/\*+$/g, "").replace(/^["']+|["']+$/g, "").trim();
    }
  }
  return "";
}

function parseIdentifiedProducts(text: string): IdentifiedProduct[] {
  const products: IdentifiedProduct[] = [];

  // Check for multi-product format (PRODUCT1, PRODUCT2, ...)
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

  // Single-product format
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

/** Block private / loopback / link-local / metadata IPs to prevent SSRF. */
function isSafePublicUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  // Block non-default ports (only 80/443 allowed)
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") return false;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  // Blocked hostnames
  const blockedHosts = ["localhost", "metadata.google.internal", "metadata.goog"];
  if (blockedHosts.includes(hostname.toLowerCase())) return false;

  // IPv4 check
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (ipv4Match) {
    const [, a, b, c] = ipv4Match.map(Number);
    if (
      a === 127 ||                           // 127.0.0.0/8  loopback
      a === 10 ||                            // 10.0.0.0/8   private
      (a === 172 && b >= 16 && b <= 31) ||   // 172.16.0.0/12 private
      (a === 192 && b === 168) ||            // 192.168.0.0/16 private
      (a === 169 && b === 254) ||            // 169.254.0.0/16 link-local
      a === 0 ||                             // 0.0.0.0/8
      (a === 100 && b >= 64 && b <= 127) ||  // 100.64.0.0/10 CGNAT
      (a === 198 && (b === 18 || b === 19))  // 198.18.0.0/15 benchmarking
    ) {
      return false;
    }
    // Block if last octet gives broadcast-like patterns (0.0.0.0)
    if (a === 0 && b === 0 && c === 0) return false;
    return true;
  }

  // IPv6 check — block loopback (::1) and private ranges (fc00::/7, fe80::/10)
  if (hostname.includes(":")) {
    const lower = hostname.toLowerCase();
    if (
      lower === "::1" ||
      lower === "0:0:0:0:0:0:0:1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    ) {
      return false;
    }
  }

  return true;
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

async function safeFetch(url: string, timeoutMs: number): Promise<Response | null> {
  const MAX_REDIRECTS = 3;
  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!isSafePublicUrl(currentUrl)) {
      console.warn(`[scan-product] Blocked unsafe URL: ${currentUrl}`);
      return null;
    }
    const response = await withTimeout(
      fetch(currentUrl, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; HadamiBot/1.0)" },
        redirect: "manual",
      }),
      timeoutMs,
      `Timed out while fetching ${currentUrl}`,
    );
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      // Resolve relative redirects
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }
    return response;
  }
  console.warn(`[scan-product] Too many redirects for: ${url}`);
  return null;
}

async function fetchPageEvidence(
  url: string,
  product: string,
  brand: string,
): Promise<PageEvidence | null> {
  try {
    const response = await safeFetch(url, 8000);

    if (!response || !response.ok) return null;

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
      .filter(isSafePublicUrl)
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

const IDENTIFY_MODEL = process.env.GEMINI_IDENTIFY_MODEL || "gemini-3.1-flash-lite-preview";

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

const IMAGE_OCR_PROMPT = [
  "Extract the ingredient list from this cosmetic product image.",
  "Look for 成分, 全成分, INGREDIENTS, or similar labels.",
  "If there is a 有効成分 (active ingredients) section, extract it separately.",
  "",
  "Return JSON only:",
  '{"ingredients_text": "full comma-separated list", "active_ingredients": ["name1"], "is_quasi_drug": false}',
  "",
  "If no ingredients visible:",
  '{"ingredients_text": "", "active_ingredients": [], "is_quasi_drug": false}',
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

async function identifyProductsWithRetry(
  base64Data: string,
  enhancedData?: string,
): Promise<IdentifiedProduct[]> {
  // Attempt 1: dual-image (color + enhanced) or single-image
  const firstResponse = await withTimeout(
    client.models.generateContent({
      model: IDENTIFY_MODEL,
      contents: [{ role: "user", parts: buildImageParts(base64Data, enhancedData) }],
      config: { maxOutputTokens: 1024 },
    }),
    15000,
    "Timed out while identifying product",
  ).catch(() => null);

  const responseText = firstResponse?.text ?? "";
  console.log("[scan-product] identify response:", responseText.slice(0, 500));

  const products = parseIdentifiedProducts(responseText);
  if (products.length > 0) return products;

  // Attempt 2: retry with enhanced image only (better text contrast)
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

  const retryText = retryResponse?.text ?? "";
  console.log("[scan-product] identify retry response:", retryText.slice(0, 500));

  return parseIdentifiedProducts(retryText);
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

  let body: { imageBase64?: unknown; enhancedBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

  // Extract optional enhanced (grayscale+contrast) image
  let enhancedData: string | undefined;
  if (typeof body.enhancedBase64 === "string" && body.enhancedBase64) {
    enhancedData = body.enhancedBase64.includes(",")
      ? body.enhancedBase64.split(",")[1]
      : body.enhancedBase64;
  }

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
    const identifiedProducts = await identifyProductsWithRetry(validation.base64Data, enhancedData);

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
