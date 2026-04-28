import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash-lite";

export interface VisionIdentifiedProduct {
  product: string;
  brand: string;
  lang: string;
  type: string;
}

export interface VisionIngredientResult {
  isQuasiDrug: boolean;
  activeIngredients: string[];
  otherIngredients: string[];
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function extractJson<T>(text: string): T | null {
  const candidates = [
    text.match(/```json\s*([\s\S]*?)```/i)?.[1],
    text.match(/```\s*([\s\S]*?)```/)?.[1],
    text.match(/\{[\s\S]*\}/)?.[0],
    text,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // try next strategy
    }
  }
  return null;
}

const IDENTIFY_PROMPT = [
  "あなたは化粧品パッケージ識別の専門家です。",
  "添付した化粧品パッケージの画像から、商品名・ブランド名・分類を特定してください。",
  "",
  "回答は次のJSONのみで返してください（マークダウン不要）：",
  "{",
  '  "products": [',
  '    { "product": "商品名", "brand": "ブランド名", "lang": "ja|ko|en", "type": "cleansing|face_wash|toner|serum|emulsion|cream|sunscreen|mask_pack|eye_care|oil|mist|other" }',
  "  ]",
  "}",
  "",
  "ルール：",
  "- 1枚の画像に複数製品が写っている場合は products 配列に複数入れる",
  "- 商品名・ブランドが読み取れない場合でも、推測可能なら入れる",
  "- 全く判別できない場合は products を空配列で返す",
  "- 公式表記の日本語が読める場合はそれを優先",
].join("\n");

const INGREDIENT_PROMPT = [
  "あなたは化粧品の成分表記を読み取る専門家です。",
  "添付した画像は化粧品の成分表（裏面ラベル）です。記載されている全成分を漏れなく抽出してください。",
  "",
  "回答は次のJSONのみで返してください（マークダウン不要）：",
  "{",
  '  "isQuasiDrug": false,',
  '  "activeIngredients": ["有効成分として明記されている成分名のみ"],',
  '  "otherIngredients": ["水", "グリセリン", "..."]',
  "}",
  "",
  "ルール：",
  "- 「医薬部外品」と明記されている場合のみ isQuasiDrug を true",
  "- 「有効成分」と明記された成分のみ activeIngredients に入れる（一般化粧品なら空配列）",
  "- otherIngredients は表記順に、配合成分すべてを記載順のまま列挙",
  "- (カッコ書き) は除いた成分名のみ抽出",
  "- 読み取れない場合は activeIngredients と otherIngredients を空配列で返す",
].join("\n");

/**
 * 表面パッケージ画像から商品情報を識別する。
 */
export async function geminiVisionIdentifyProduct(
  base64Jpeg: string,
): Promise<VisionIdentifiedProduct[]> {
  try {
    console.info("[geminiVision] identifyProduct start", {
      model: VISION_MODEL,
      base64Bytes: base64Jpeg.length,
    });
    const response = await withTimeout(
      client.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Jpeg } },
              { text: IDENTIFY_PROMPT },
            ],
          },
        ],
        config: {
          maxOutputTokens: 512,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      20_000,
      "Timed out while identifying product",
    );

    const text = response.text ?? "";
    console.info("[geminiVision] identifyProduct response", {
      length: text.length,
      preview: text.slice(0, 200),
    });
    const parsed = extractJson<{ products?: unknown }>(text);
    const rawProducts = Array.isArray(parsed?.products) ? parsed.products : [];

    return rawProducts
      .map((entry): VisionIdentifiedProduct | null => {
        if (typeof entry !== "object" || entry === null) return null;
        const obj = entry as Record<string, unknown>;
        const product = typeof obj.product === "string" ? obj.product.trim() : "";
        const brand = typeof obj.brand === "string" ? obj.brand.trim() : "";
        const lang =
          typeof obj.lang === "string" && obj.lang.trim() ? obj.lang.trim().toLowerCase() : "ja";
        const type =
          typeof obj.type === "string" && obj.type.trim() ? obj.type.trim() : "other";
        if (!product && !brand) return null;
        return { product, brand, lang, type };
      })
      .filter((p): p is VisionIdentifiedProduct => p !== null);
  } catch (error) {
    console.warn(
      "[geminiVision] identifyProduct failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * 裏面（成分表）画像から全成分を抽出する。
 */
export async function geminiVisionExtractIngredients(
  base64Jpeg: string,
): Promise<VisionIngredientResult> {
  const empty: VisionIngredientResult = {
    isQuasiDrug: false,
    activeIngredients: [],
    otherIngredients: [],
  };

  try {
    console.info("[geminiVision] extractIngredients start", {
      model: VISION_MODEL,
      base64Bytes: base64Jpeg.length,
    });
    const response = await withTimeout(
      client.models.generateContent({
        model: VISION_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Jpeg } },
              { text: INGREDIENT_PROMPT },
            ],
          },
        ],
        config: {
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      25_000,
      "Timed out while extracting ingredients",
    );

    const text = response.text ?? "";
    console.info("[geminiVision] extractIngredients response", {
      length: text.length,
      preview: text.slice(0, 200),
    });
    const parsed = extractJson<{
      isQuasiDrug?: unknown;
      activeIngredients?: unknown;
      otherIngredients?: unknown;
    }>(text);
    if (!parsed) return empty;

    const isQuasiDrug = parsed.isQuasiDrug === true;
    const activeIngredients = Array.isArray(parsed.activeIngredients)
      ? parsed.activeIngredients
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
    const otherIngredients = Array.isArray(parsed.otherIngredients)
      ? parsed.otherIngredients
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    return { isQuasiDrug, activeIngredients, otherIngredients };
  } catch (error) {
    console.warn(
      "[geminiVision] extractIngredients failed:",
      error instanceof Error ? error.message : error,
    );
    return empty;
  }
}
