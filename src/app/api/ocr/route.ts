import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import {
  tryReserveScan,
  tryReserveScanFallback,
  getMonthlyScanCount,
  getUserMonthlyScanLimit,
  rollbackScan,
} from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { ocrSpaceExtract } from "@/lib/ocrSpace";
import {
  SCAN_RESERVATION_COOKIE_NAME,
  clearScanReservationCookie,
  verifyScanReservationToken,
} from "@/lib/scanReservationToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const RESERVATION_COMPAT_LIMIT_OVERRIDE = 1_000_000;

function buildOcrParsePrompt(ocrText: string): string {
  return `The following OCR text was extracted from a cosmetic ingredient label.
Extract the ingredient list and return only the format below.

QUASI_DRUG: true|false
ACTIVE: ingredient 1, ingredient 2
OTHER: ingredient 1, ingredient 2, ingredient 3

Rules:
- Set QUASI_DRUG to true only when the text explicitly indicates quasi-drug / 医薬部外品.
- ACTIVE must include only explicitly labeled active ingredients / 有効成分.
- OTHER must include all remaining ingredients.
- If there are no active ingredients, leave ACTIVE blank.
- If the ingredient list cannot be identified, return QUASI_DRUG: false, ACTIVE:, OTHER:.

OCR TEXT:
${ocrText}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(ip, 60_000, 10, "ocr");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてからお試しください。" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
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
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

  const reservationToken = req.cookies.get(SCAN_RESERVATION_COOKIE_NAME)?.value;
  const hasExistingReservation =
    typeof reservationToken === "string" &&
    verifyScanReservationToken(reservationToken, { userId: auth.user.id });

  let reservedForThisRequest = false;

  if (!hasExistingReservation) {
    const userMonthlyLimit = await getUserMonthlyScanLimit(supabaseAdmin, auth.user.id);
    const reserved = await tryReserveScan(
      auth.supabase,
      auth.user.id,
      auth.user.email!,
      userMonthlyLimit,
    );
    if (!reserved) {
      const count = await getMonthlyScanCount(auth.supabase, auth.user.id);
      if (count >= userMonthlyLimit) {
        return NextResponse.json(
          { error: "スキャン回数の上限に達しました", count, limit: userMonthlyLimit },
          { status: 429 },
        );
      }

      const compatibilityReserved = await tryReserveScan(
        auth.supabase,
        auth.user.id,
        auth.user.email!,
        RESERVATION_COMPAT_LIMIT_OVERRIDE,
      );
      const fallbackReserved = compatibilityReserved
        ? true
        : await tryReserveScanFallback(
            supabaseAdmin,
            auth.user.id,
            auth.user.email!,
            userMonthlyLimit
          );

      if (!fallbackReserved) {
        return NextResponse.json(
          {
            error: "スキャン枠の確認に失敗しました。少し待ってから再度お試しください。",
            count,
            limit: userMonthlyLimit,
          },
          { status: 503 },
        );
      }
    }

    reservedForThisRequest = true;
  }

  try {
    const ocrText = await ocrSpaceExtract(validation.base64Data);

    if (!ocrText) {
      if (reservedForThisRequest) {
        await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
      }

      return NextResponse.json({
        text: "",
        isQuasiDrug: false,
        activeIngredients: [],
        otherIngredients: [],
      });
    }

    const response = await client.models.generateContent({
      model: process.env.GEMINI_IDENTIFY_MODEL || "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [{ text: buildOcrParsePrompt(ocrText) }],
        },
      ],
      config: {
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const rawText = response.text ?? "";
    const isQuasiDrug = /QUASI_DRUG:\s*true/i.test(rawText);

    const activeIngredients =
      rawText.match(/ACTIVE:\s*(.*)/i)?.[1]
        ?.split(/[,、]/)
        .map((value) => value.trim())
        .filter(Boolean) ?? [];

    const otherIngredients =
      rawText.match(/OTHER:\s*([\s\S]*?)(?:\n\n|$)/i)?.[1]
        ?.replace(/\n/g, ",")
        .split(/[,、]/)
        .map((value) => value.trim())
        .filter(Boolean) ?? [];

    const text = [...activeIngredients, ...otherIngredients].join(", ");
    const result = NextResponse.json({
      text,
      isQuasiDrug,
      activeIngredients,
      otherIngredients,
    });

    if (!text.trim() && reservedForThisRequest) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    if (text.trim() && hasExistingReservation) {
      return clearScanReservationCookie(result);
    }

    return result;
  } catch (error) {
    console.error("OCR API error:", error);

    if (reservedForThisRequest) {
      await rollbackScan(auth.supabase, auth.user.id, auth.user.email!);
    }

    return NextResponse.json(
      { error: "OCR処理に失敗しました" },
      { status: 500 },
    );
  }
}
