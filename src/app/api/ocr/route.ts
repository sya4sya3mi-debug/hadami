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
import { geminiVisionExtractIngredients } from "@/lib/geminiVision";
import {
  SCAN_RESERVATION_COOKIE_NAME,
  clearScanReservationCookie,
  verifyScanReservationToken,
} from "@/lib/scanReservationToken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const RESERVATION_COMPAT_LIMIT_OVERRIDE = 1_000_000;

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
    const { isQuasiDrug, activeIngredients, otherIngredients } =
      await geminiVisionExtractIngredients(validation.base64Data);

    const text = [...activeIngredients, ...otherIngredients].join(", ");

    if (!text.trim()) {
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

    const result = NextResponse.json({
      text,
      isQuasiDrug,
      activeIngredients,
      otherIngredients,
    });

    if (hasExistingReservation) {
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
