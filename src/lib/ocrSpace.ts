import sharp from "sharp";

const OCR_SPACE_URL = "https://api.ocr.space/parse/image";
const MAX_BYTES = 900 * 1024; // 900KB（1MB制限に余裕を持たせる）

/**
 * base64画像をOCR.space無料版の制限（1MB未満）に収まるようリサイズする。
 * 既に900KB以下ならそのまま返す。
 */
export async function resizeForOcrSpace(base64Data: string): Promise<string> {
  let buf: Buffer<ArrayBuffer> = Buffer.from(base64Data, "base64");

  if (buf.byteLength <= MAX_BYTES) return base64Data;

  // 段階的に縮小: 解像度を下げつつJPEG品質も下げる
  const steps: { maxSide: number; quality: number }[] = [
    { maxSide: 1024, quality: 75 },
    { maxSide: 800, quality: 70 },
    { maxSide: 600, quality: 65 },
  ];

  for (const { maxSide, quality } of steps) {
    buf = await sharp(buf)
      .resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer() as Buffer<ArrayBuffer>;

    if (buf.byteLength <= MAX_BYTES) break;
  }

  console.log(`[ocrSpace] resized to ${(buf.byteLength / 1024).toFixed(0)}KB`);
  return buf.toString("base64");
}

/**
 * OCR.space API で画像からテキストを抽出する。
 * 日本語テキスト用にEngine 2を使用。
 */
export async function ocrSpaceExtract(base64Data: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    console.error("[ocrSpace] OCR_SPACE_API_KEY is not set");
    return "";
  }

  const resized = await resizeForOcrSpace(base64Data);

  const params = new URLSearchParams({
    apikey: apiKey,
    base64Image: `data:image/jpeg;base64,${resized}`,
    language: "jpn",
    OCREngine: "2",
    scale: "true",
    isOverlayRequired: "false",
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(OCR_SPACE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[ocrSpace] HTTP error:", response.status);
      return "";
    }

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      console.error("[ocrSpace] API error:", data.ErrorMessage);
      return "";
    }

    const parsedText = (data.ParsedResults || [])
      .map((r: { ParsedText?: string }) => r.ParsedText || "")
      .join("\n")
      .trim();

    console.log(
      "[ocrSpace] extracted %d chars",
      parsedText.length,
    );

    return parsedText;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[ocrSpace] request timed out");
    } else {
      console.error("[ocrSpace] fetch error:", error);
    }
    return "";
  }
}
