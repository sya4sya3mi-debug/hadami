import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getScanCountByEmail, getAccountScanLimit } from "./db";

type AuthSuccess = { authenticated: true; supabase: SupabaseClient; user: User };
type AuthFailure = { authenticated: false; response: NextResponse };

export async function authenticateRequest(): Promise<AuthSuccess | AuthFailure> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true, supabase, user };
}

/** @deprecated tryReserveScan (db.ts) に置き換え。原子操作でチェック＋加算を同時実行する。 */
export async function checkScanQuota(
  supabase: SupabaseClient,
  email: string
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const count = await getScanCountByEmail(supabase, email);
  const limit = getAccountScanLimit();

  if (count >= limit) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "スキャン回数の上限に達しました", count, limit },
        { status: 429 }
      ),
    };
  }

  return { allowed: true };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB decoded
const ALLOWED_DATA_URL_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImagePayload(
  body: { imageBase64?: unknown }
): { valid: true; base64Data: string } | { valid: false; response: NextResponse } {
  const { imageBase64 } = body;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "画像が提供されていません" },
        { status: 400 }
      ),
    };
  }

  // Check MIME from data URL prefix if present
  if (imageBase64.startsWith("data:")) {
    const mimeMatch = imageBase64.match(/^data:([^;,]+)/);
    if (mimeMatch && !ALLOWED_DATA_URL_MIMES.includes(mimeMatch[1])) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: "許可されていない画像形式です" },
          { status: 400 }
        ),
      };
    }
  }

  // Strip data URL prefix
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  if (!base64Data) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "画像データが不正です" },
        { status: 400 }
      ),
    };
  }

  // Check decoded size (base64 encodes 3 bytes as 4 chars)
  const estimatedBytes = Math.ceil(base64Data.length * 0.75);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: `画像サイズが上限(${MAX_IMAGE_BYTES / 1024 / 1024}MB)を超えています` },
        { status: 400 }
      ),
    };
  }

  return { valid: true, base64Data };
}
