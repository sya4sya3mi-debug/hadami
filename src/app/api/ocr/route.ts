import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import { tryReserveScan, rollbackScan, getScanCountByEmail, getAccountScanLimit } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  // 5. Call Gemini OCR
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: validation.base64Data,
              },
            },
            {
              text: `この画像から化粧品の成分表（全成分）のテキストだけを抽出してください。
成分名のみをカンマ区切りで列挙し、ブランド名・説明文・住所・注意書きなどは含めないでください。
成分表が見当たらない場合は空文字を返してください。
出力フォーマット: 成分名1,成分名2,成分名3,...`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 1024 },
    });

    const text = response.text ?? "";

    // OCRで成分を読み取れなかった場合、スキャン枠を返却
    const trimmed = text.replace(/[\s,、]/g, "");
    if (!trimmed) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    return NextResponse.json({ text });
  } catch (error) {
    await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "OCR処理に失敗しました" },
      { status: 500 }
    );
  }
}
