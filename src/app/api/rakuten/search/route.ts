import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { searchRakutenCached } from "@/lib/rakuten";
import type { RakutenProduct } from "@/types";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const ip = getClientIp(request);
  const rl = rateLimit(ip, 60_000, 10);
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

    // 楽天APIのレートリミット対策: 順次実行（1秒1リクエスト制限）
    const results: Record<string, RakutenProduct[]> = {};
    for (const keyword of keywords.slice(0, 5)) {
      results[keyword] = await searchRakutenCached(keyword);
      // 楽天APIは1秒1リクエスト制限
      await new Promise((resolve) => setTimeout(resolve, 1100));
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
