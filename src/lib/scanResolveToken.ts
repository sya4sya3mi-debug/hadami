import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 15 * 60;
const TOKEN_VERSION = 1;

interface TokenPayload {
  v: number;
  userId: string;
  productName: string;
  brand: string;
  productType: string;
  exp: number;
}

function getTokenSecret(): string {
  const secret =
    process.env.SCAN_SELECTION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY;

  if (!secret) {
    throw new Error("Missing scan resolve token secret");
  }

  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createScanResolveToken(input: {
  userId: string;
  productName: string;
  brand: string;
  productType: string;
}): string {
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    userId: input.userId,
    productName: input.productName,
    brand: input.brand,
    productType: input.productType,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyScanResolveToken(
  token: string,
  expected: {
    userId: string;
    productName: string;
    brand: string;
    productType: string;
  },
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
    ) as Partial<TokenPayload>;

    if (
      payload.v !== TOKEN_VERSION ||
      payload.userId !== expected.userId ||
      payload.productName !== expected.productName ||
      payload.brand !== expected.brand ||
      payload.productType !== expected.productType ||
      typeof payload.exp !== "number"
    ) {
      return false;
    }

    return payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
