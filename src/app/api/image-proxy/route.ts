import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { resolveRakutenImageProxyTarget } from "@/lib/rakutenImage";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const BROWSER_CACHE_SECONDS = 60 * 60 * 24;
const CDN_CACHE_SECONDS = 60 * 60 * 24 * 7;
const STALE_SECONDS = 60 * 60 * 24 * 30;
const IMAGE_PROXY_WINDOW_MS = 60_000;
const IMAGE_PROXY_MAX_REQUESTS = 30;
const MAX_UPSTREAM_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_PROXY_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_DIMENSION = 300;
const MAX_INPUT_PIXELS = 4096 * 4096;

const ALLOWED_SOURCE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

class UpstreamTooLargeError extends Error {
  constructor() {
    super("upstream image exceeded max size");
    this.name = "UpstreamTooLargeError";
  }
}

async function readUpstreamImage(
  upstream: Response,
  maxBytes: number
): Promise<Buffer> {
  const contentLengthHeader = upstream.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new UpstreamTooLargeError();
    }
  }

  if (!upstream.body) {
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new UpstreamTooLargeError();
    }
    return buffer;
  }

  const reader = upstream.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new UpstreamTooLargeError();
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(ip, IMAGE_PROXY_WINDOW_MS, IMAGE_PROXY_MAX_REQUESTS, "image-proxy", {
    failOpen: false,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAfterMs: rl.retryAfterMs,
      },
      { status: 429 }
    );
  }

  const hostToken = request.nextUrl.searchParams.get("h");
  const imagePath = request.nextUrl.searchParams.get("p");
  const search = request.nextUrl.searchParams.get("s");

  const targetUrl = resolveRakutenImageProxyTarget(hostToken, imagePath, search);

  if (!targetUrl) {
    return NextResponse.json({ error: "invalid_image_request" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status || 404 });
    }

    const sourceContentType =
      upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";

    if (!ALLOWED_SOURCE_CONTENT_TYPES.has(sourceContentType)) {
      return NextResponse.json(
        { error: "unsupported_source_type" },
        { status: 415 }
      );
    }

    const srcBuffer = await readUpstreamImage(
      upstream,
      MAX_UPSTREAM_IMAGE_BYTES
    );
    const accept = request.headers.get("accept") || "";
    const supportsWebP = accept.includes("image/webp");

    let optimized: Buffer;
    let contentType: string;

    try {
      const pipeline = sharp(srcBuffer, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).resize(MAX_OUTPUT_DIMENSION, MAX_OUTPUT_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      });

      if (supportsWebP) {
        optimized = await pipeline.webp({ quality: 80 }).toBuffer();
        contentType = "image/webp";
      } else {
        optimized = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg";
      }
    } catch {
      optimized = srcBuffer;
      contentType = sourceContentType;
    }

    return new NextResponse(new Uint8Array(optimized), {
      status: 200,
      headers: {
        "Cache-Control": `public, max-age=${BROWSER_CACHE_SECONDS}`,
        "CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        "Vercel-CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        "Content-Disposition": "inline",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof UpstreamTooLargeError) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "upstream_timeout" }, { status: 504 });
    }

    console.error("Rakuten image proxy error:", error);
    return new NextResponse(null, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
