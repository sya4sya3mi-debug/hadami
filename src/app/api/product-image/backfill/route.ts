import { NextResponse } from "next/server";
import sharp from "sharp";
import { authenticateRequest } from "@/lib/apiAuth";
import {
  PRODUCT_IMAGE_THUMB_SIZE,
  getProductImageThumbPathFromStoredPath,
} from "@/lib/productImages";
import { r2Upload, r2Download } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  let body: { productIds?: unknown; force?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const requestedIds = Array.isArray(body?.productIds)
    ? body?.productIds.filter((value): value is string => typeof value === "string")
    : null;

  const forceRegenerate = body?.force === true;

  let query = auth.supabase
    .from("products")
    .select("id, package_image_url")
    .eq("user_id", auth.user.id)
    .not("package_image_url", "is", null);

  if (requestedIds?.length) {
    query = query.in("id", requestedIds);
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

      const thumbPath = getProductImageThumbPathFromStoredPath(product.package_image_url);

      if (!forceRegenerate) {
        const existing = await r2Download(thumbPath);
        if (existing) {
          return { productId: product.id, thumbPath };
        }
      }

      const original = await r2Download(product.package_image_url);
      if (!original) {
        throw new Error("original image missing");
      }

      const thumbBytes = await sharp(original)
        .resize(PRODUCT_IMAGE_THUMB_SIZE, PRODUCT_IMAGE_THUMB_SIZE, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      await r2Upload(thumbPath, thumbBytes, "image/webp");

      return { productId: product.id, thumbPath };
    })
  );

  const created = results
    .filter(
      (result): result is PromiseFulfilledResult<{ productId: string; thumbPath: string } | null> =>
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
