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

  // 5. Call Gemini OCR（医薬部外品の有効成分セクション検出対応）
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
              text: `この画像から化粧品の成分表を抽出してください。

■ 医薬部外品（薬用化粧品）の場合：
成分表が「有効成分」と「その他の成分」のセクションに分かれています。
「有効成分」「薬用成分」「Active Ingredient」等のラベルがある場合、または
「医薬部外品」「薬用」の記載がある場合は医薬部外品と判断してください。

以下のフォーマットで回答してください：
QUASI_DRUG: true
ACTIVE: 有効成分名1, 有効成分名2
OTHER: その他の成分名1, その他の成分名2, ...

■ 一般化粧品の場合（セクション分けがない）：
QUASI_DRUG: false
ACTIVE:
OTHER: 成分名1, 成分名2, ...

重要な注意：
- 成分名のみを記載（ブランド名・説明文・住所・注意書きは除外）
- 成分表が見当たらない場合は QUASI_DRUG: false と空の OTHER: のみ返す
- 余計な説明は不要、上記フォーマットだけ回答してください`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 1024 },
    });

    const rawText = response.text ?? "";

    // パース: 新フォーマット (QUASI_DRUG / ACTIVE / OTHER) を検出
    const isQuasiDrug = /QUASI_DRUG:\s*true/i.test(rawText);

    let activeIngredients: string[] = [];
    let otherIngredients: string[] = [];

    const activeMatch = rawText.match(/ACTIVE:\s*(.*)/i);
    if (activeMatch?.[1]) {
      activeIngredients = activeMatch[1]
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const otherMatch = rawText.match(/OTHER:\s*([\s\S]*?)(?:\n\n|$)/i);
    if (otherMatch?.[1]) {
      otherIngredients = otherMatch[1]
        .replace(/\n/g, ",")
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // 後方互換: text フィールドは全成分カンマ区切り
    const allIngredients = [...activeIngredients, ...otherIngredients];
    const text = allIngredients.join(", ");

    // OCRで成分を読み取れなかった場合、スキャン枠を返却
    const trimmed = text.replace(/[\s,、]/g, "");
    if (!trimmed) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    return NextResponse.json({
      text,
      isQuasiDrug,
      activeIngredients,
      otherIngredients,
    });
  } catch (error) {
    await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "OCR処理に失敗しました" },
      { status: 500 }
    );
  }
}
