import { NextResponse } from "next/server";
import sharp from "sharp";
import { authenticateRequest } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import {
  PRODUCT_IMAGE_BACKFILL_BATCH_SIZE,
  PRODUCT_IMAGE_MAX_DIMENSION,
  PRODUCT_IMAGE_THUMB_SIZE,
  getProductImagePath,
  getProductImageThumbPath,
  getProductImageThumbPathFromStoredPath,
} from "@/lib/productImages";
import { r2Upload, r2Download, r2Delete } from "@/lib/r2";

const AVIF_FULL_QUALITY = 50;
const AVIF_THUMB_QUALITY = 45;
const AVIF_EFFORT = 3;
const AVIF_CONTENT_TYPE = "image/avif";
const BACKFILL_WINDOW_MS = 10 * 60_000;
const BACKFILL_MAX_REQUESTS = 12;

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const rl = await rateLimit(
    auth.user.id,
    BACKFILL_WINDOW_MS,
    BACKFILL_MAX_REQUESTS,
    "product-image-backfill",
    { failOpen: false }
  );

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAfterMs: rl.retryAfterMs,
      },
      { status: 429 }
    );
  }

  let body: { productIds?: unknown; force?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawRequestedIds = Array.isArray(body?.productIds) ? body.productIds : null;
  const requestedIds = rawRequestedIds
    ? Array.from(
        new Set(
          rawRequestedIds.filter((value): value is string => typeof value === "string")
        )
      )
    : null;

  if (
    requestedIds &&
    requestedIds.length > PRODUCT_IMAGE_BACKFILL_BATCH_SIZE
  ) {
    return NextResponse.json(
      {
        error: "too_many_products",
        maxProducts: PRODUCT_IMAGE_BACKFILL_BATCH_SIZE,
      },
      { status: 400 }
    );
  }

  const forceRegenerate = body?.force === true;

  let query = auth.supabase
    .from("products")
    .select("id, package_image_url")
    .eq("user_id", auth.user.id)
    .not("package_image_url", "is", null);

  if (requestedIds?.length) {
    query = query.in("id", requestedIds);
  } else {
    query = query.limit(PRODUCT_IMAGE_BACKFILL_BATCH_SIZE);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Failed to fetch products for thumbnail backfill:", error);
    return NextResponse.json({ error: "thumbnail_backfill_failed" }, { status: 500 });
  }

  const rows = (products ?? []) as Array<{
    id: string;
    package_image_url: string | null;
  }>;

  const results = await Promise.allSettled(
    rows.map(async (product) => {
      if (!product.package_image_url) return null;

      const storedPath = product.package_image_url;
      const isAvif = storedPath.endsWith(".avif");
      const filePath = isAvif ? storedPath : getProductImagePath(auth.user.id, product.id);
      const thumbPath = isAvif
        ? getProductImageThumbPathFromStoredPath(storedPath)
        : getProductImageThumbPath(auth.user.id, product.id);

      if (!forceRegenerate && isAvif) {
        const existing = await r2Download(thumbPath);
        if (existing) {
          return { productId: product.id, thumbPath };
        }
      }

      const original = await r2Download(storedPath);
      if (!original) {
        throw new Error("original image missing");
      }

      const rotated = sharp(original).rotate();
      const [fullBytes, thumbBytes] = await Promise.all([
        rotated
          .clone()
          .resize(PRODUCT_IMAGE_MAX_DIMENSION, PRODUCT_IMAGE_MAX_DIMENSION, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .avif({ quality: AVIF_FULL_QUALITY, effort: AVIF_EFFORT })
          .toBuffer(),
        rotated
          .clone()
          .resize(PRODUCT_IMAGE_THUMB_SIZE, PRODUCT_IMAGE_THUMB_SIZE, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .avif({ quality: AVIF_THUMB_QUALITY, effort: AVIF_EFFORT })
          .toBuffer(),
      ]);

      await Promise.all([
        r2Upload(filePath, fullBytes, AVIF_CONTENT_TYPE),
        r2Upload(thumbPath, thumbBytes, AVIF_CONTENT_TYPE),
      ]);

      if (!isAvif) {
        const { error: updateError } = await auth.supabase
          .from("products")
          .update({ package_image_url: filePath })
          .eq("id", product.id)
          .eq("user_id", auth.user.id);

        if (updateError) {
          await r2Delete([filePath, thumbPath]).catch(() => {});
          throw updateError;
        }

        const staleThumb = getProductImageThumbPathFromStoredPath(storedPath);
        await r2Delete([storedPath, staleThumb]).catch((err) => {
          console.error("Failed to delete legacy webp image:", err);
        });
      }

      return { productId: product.id, thumbPath };
    })
  );

  const created = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{ productId: string; thumbPath: string } | null> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value)
    .filter((value): value is { productId: string; thumbPath: string } => Boolean(value));

  results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .forEach((result) => {
      console.error("Product thumbnail backfill failed:", result.reason);
    });

  return NextResponse.json({ created });
}
