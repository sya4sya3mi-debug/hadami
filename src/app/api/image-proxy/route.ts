import { NextRequest, NextResponse } from "next/server";
import { resolveRakutenImageProxyTarget } from "@/lib/rakutenImage";

export const runtime = "nodejs";

const BROWSER_CACHE_SECONDS = 60 * 60 * 24;
const CDN_CACHE_SECONDS = 60 * 60 * 24 * 7;
const STALE_SECONDS = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const hostToken = request.nextUrl.searchParams.get("h");
  const imagePath = request.nextUrl.searchParams.get("p");
  const search = request.nextUrl.searchParams.get("s");

  const targetUrl = resolveRakutenImageProxyTarget(hostToken, imagePath, search);

  if (!targetUrl) {
    return NextResponse.json({ error: "invalid_image_request" }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse(null, { status: upstream.status || 404 });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Cache-Control": `public, max-age=${BROWSER_CACHE_SECONDS}`,
        "CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        "Vercel-CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        "Content-Disposition": "inline",
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Rakuten image proxy error:", error);
    return new NextResponse(null, { status: 502 });
  }
}
