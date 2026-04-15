import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { r2GetSignedUrls } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_KEYS = 50;

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const body = await request.json();
  const keys: unknown = body.keys;

  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json(
      { error: "keys は空でない配列で指定してください" },
      { status: 400 }
    );
  }

  if (keys.length > MAX_KEYS) {
    return NextResponse.json(
      { error: `一度に取得できるURLは${MAX_KEYS}件までです` },
      { status: 400 }
    );
  }

  const userId = auth.user.id;
  const validKeys = keys.filter(
    (k): k is string =>
      typeof k === "string" && k.length > 0 && k.startsWith(`${userId}/`)
  );

  if (validKeys.length === 0) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  const urls = await r2GetSignedUrls(validKeys);

  return NextResponse.json(
    { urls },
    {
      headers: {
        "Cache-Control": "private, max-age=3000, stale-while-revalidate=600",
      },
    }
  );
}
