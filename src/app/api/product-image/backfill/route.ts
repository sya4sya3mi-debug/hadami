import { NextResponse } from "next/server";
import sharp from "sharp";
import { authenticateRequest } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import {
  PRODUCT_IMAGE_BACKFILL_BATCH_SIZE,
  PRODUCT_IMAGE_DISPLAY_SIZE,
  PRODUCT_IMAGE_SHARE_SIZE,
  getProductImageDisplayPath,
  getProductImageSharePath,
  getProductImageDisplayPathFromStoredPath,
  getProductImageSharePathFromStoredPath,
} from "@/lib/productImages";
import { r2Upload, r2Download, r2Delete } from "@/lib/r2";

const WEBP_DISPLAY_QUALITY = 75;
const WEBP_SHARE_QUALITY = 88;
const WEBP_EFFORT = 4;
const WEBP_CONTENT_TYPE = "image/webp";
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
    console.error("Failed to fetch products for image backfill:", error);
    return NextResponse.json({ error: "image_backfill_failed" }, { status: 500 });
  }

  const rows = (products ?? []) as Array<{
    id: string;
    package_image_url: string | null;
  }>;

  const results = await Promise.allSettled(
    rows.map(async (product) => {
      if (!product.package_image_url) return null;

      const storedPath = product.package_image_url;
      const displayPath = getProductImageDisplayPath(auth.user.id, product.id);
      const sharePath = getProductImageSharePath(auth.user.id, product.id);
      const isAlreadyMigrated = storedPath === displayPath;

      if (!forceRegenerate && isAlreadyMigrated) {
        // 既に新フォーマットの場合、share バリアントの存在のみ確認する
        const existingShare = await r2Download(sharePath);
        if (existingShare) {
          return { productId: product.id, displayPath, sharePath };
        }
      }

      // 元画像を入力として読み込む。優先順位: 新display → 旧storedPath → 旧display派生
      const candidatePaths = Array.from(
        new Set(
          [
            storedPath,
            getProductImageDisplayPathFromStoredPath(storedPath),
            getProductImageSharePathFromStoredPath(storedPath),
          ].filter((value): value is string => typeof value === "string")
        )
      );

      let original: Buffer | null = null;
      for (const candidate of candidatePaths) {
        original = await r2Download(candidate);
        if (original) break;
      }

      if (!original) {
        throw new Error("original image missing");
      }

      const rotated = sharp(original).rotate();
      const [displayBytes, shareBytes] = await Promise.all([
        rotated
          .clone()
          .resize(PRODUCT_IMAGE_DISPLAY_SIZE, PRODUCT_IMAGE_DISPLAY_SIZE, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_DISPLAY_QUALITY, effort: WEBP_EFFORT })
          .toBuffer(),
        rotated
          .clone()
          .resize(PRODUCT_IMAGE_SHARE_SIZE, PRODUCT_IMAGE_SHARE_SIZE, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_SHARE_QUALITY, effort: WEBP_EFFORT })
          .toBuffer(),
      ]);

      await Promise.all([
        r2Upload(displayPath, displayBytes, WEBP_CONTENT_TYPE),
        r2Upload(sharePath, shareBytes, WEBP_CONTENT_TYPE),
      ]);

      if (!isAlreadyMigrated) {
        const { error: updateError } = await auth.supabase
          .from("products")
          .update({ package_image_url: displayPath })
          .eq("id", product.id)
          .eq("user_id", auth.user.id);

        if (updateError) {
          await r2Delete([displayPath, sharePath]).catch(() => {});
          throw updateError;
        }

        // 旧フォーマットの残骸を削除（新しい display/share と異なるキーのみ）
        const stalePaths = new Set<string>([storedPath, ...candidatePaths]);
        stalePaths.delete(displayPath);
        stalePaths.delete(sharePath);
        if (stalePaths.size > 0) {
          await r2Delete(Array.from(stalePaths)).catch((err) => {
            console.error("Failed to delete legacy image files:", err);
          });
        }
      }

      return { productId: product.id, displayPath, sharePath };
    })
  );

  const created = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        productId: string;
        displayPath: string;
        sharePath: string;
      } | null> => result.status === "fulfilled"
    )
    .map((result) => result.value)
    .filter(
      (value): value is { productId: string; displayPath: string; sharePath: string } =>
        Boolean(value)
    );

  results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .forEach((result) => {
      console.error("Product image backfill failed:", result.reason);
    });

  return NextResponse.json({ created });
}
