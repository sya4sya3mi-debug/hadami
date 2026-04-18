import { createHmac, timingSafeEqual } from "node:crypto";

const INVITE_PROOF_TTL_SECONDS = 24 * 60 * 60;
const INVITE_PROOF_VERSION = 1;

export const INVITE_PROOF_COOKIE_NAME = "hadami-invite-proof";

type InviteProofPayload = {
  v: number;
  invitationCodeId: string;
  exp: number;
};

function getInviteProofSecret(): string {
  const secret =
    process.env.INVITE_PROOF_SECRET ||
    process.env.SCAN_SELECTION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY;

  if (!secret) {
    throw new Error("Missing invite proof secret");
  }

  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getInviteProofSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createInviteProofToken(invitationCodeId: string): string {
  const payload: InviteProofPayload = {
    v: INVITE_PROOF_VERSION,
    invitationCodeId,
    exp: Math.floor(Date.now() / 1000) + INVITE_PROOF_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyInviteProofToken(token: string): string | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<InviteProofPayload>;

    if (
      payload.v !== INVITE_PROOF_VERSION ||
      typeof payload.invitationCodeId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload.invitationCodeId;
  } catch {
    return null;
  }
}
