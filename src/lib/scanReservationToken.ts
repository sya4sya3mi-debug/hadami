import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

const TOKEN_VERSION = 1;
const TOKEN_TTL_SECONDS = 5 * 60;

export const SCAN_RESERVATION_COOKIE_NAME = "hadami_scan_reservation";

interface ScanReservationPayload {
  v: number;
  kind: "scan_reservation";
  userId: string;
  exp: number;
}

function getTokenSecret(): string {
  const secret =
    process.env.SCAN_SELECTION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY;

  if (!secret) {
    throw new Error("Missing scan reservation token secret");
  }

  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createScanReservationToken(input: { userId: string }): string {
  const payload: ScanReservationPayload = {
    v: TOKEN_VERSION,
    kind: "scan_reservation",
    userId: input.userId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyScanReservationToken(
  token: string,
  expected: { userId: string },
): boolean {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<ScanReservationPayload>;

    if (
      payload.v !== TOKEN_VERSION ||
      payload.kind !== "scan_reservation" ||
      payload.userId !== expected.userId ||
      typeof payload.exp !== "number"
    ) {
      return false;
    }

    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function setScanReservationCookie(
  response: NextResponse,
  userId: string,
): NextResponse {
  response.cookies.set({
    name: SCAN_RESERVATION_COOKIE_NAME,
    value: createScanReservationToken({ userId }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });

  return response;
}

export function clearScanReservationCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SCAN_RESERVATION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
