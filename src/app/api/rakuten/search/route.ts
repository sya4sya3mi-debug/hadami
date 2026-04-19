import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { batchGetCached, fetchAndCacheRakuten } from "@/lib/rakuten";
import type { RakutenProduct } from "@/types";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const ip = getClientIp(request);
  const rl = await rateLimit(ip, 60_000, 10, "rakuten-search");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 }
    );
  }

  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "keywords array required" },
        { status: 400 }
      );
    }

    const targetKeywords: string[] = keywords.slice(0, 3);

    // 1. 全キーワードのキャッシュを1回のDBクエリで一括取得
    const results: Record<string, RakutenProduct[]> = await batchGetCached(
      targetKeywords,
      auth.supabase
    );

    // 2. キャッシュにないキーワードのみAPIを順次呼び出し
    const uncached = targetKeywords.filter((kw) => !results[kw]);
    for (let i = 0; i < uncached.length; i++) {
      results[uncached[i]] = await fetchAndCacheRakuten(uncached[i], auth.supabase);
      // 次のリクエストがある場合のみ1.1秒待機（楽天APIレートリミット対策）
      if (i < uncached.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Rakuten search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
