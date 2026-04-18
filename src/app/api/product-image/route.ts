import { NextResponse } from "next/server";
import sharp from "sharp";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import {
  PRODUCT_IMAGE_MAX_DIMENSION,
  PRODUCT_IMAGE_THUMB_SIZE,
  getProductImagePath,
  getProductImageThumbPath,
  getProductImageThumbPathFromStoredPath,
} from "@/lib/productImages";
import { r2Upload, r2Delete, r2Download } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

const AVIF_FULL_QUALITY = 50;
const AVIF_THUMB_QUALITY = 45;
const AVIF_EFFORT = 3;
const AVIF_CONTENT_TYPE = "image/avif";

function getContentTypeFromKey(key: string) {
  if (key.endsWith(".avif")) return "image/avif";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const key = new URL(request.url).searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key が必要です" }, { status: 400 });
  }

  if (!key.startsWith(`${auth.user.id}/`)) {
    return NextResponse.json({ error: "アクセス権がありません" }, { status: 403 });
  }

  const image = await r2Download(key);
  if (!image) {
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Cache-Control": "private, max-age=3000, stale-while-revalidate=600",
      "Content-Type": getContentTypeFromKey(key),
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  let body: { productId?: unknown; imageBase64?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  if (!body.productId || typeof body.productId !== "string") {
    return NextResponse.json({ error: "productId が不正です" }, { status: 400 });
  }

  const validation = validateImagePayload(body);
  if (!validation.valid) return validation.response;

  const { data: product, error: productError } = await auth.supabase
    .from("products")
    .select("id, package_image_url")
    .eq("id", body.productId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (productError) {
    console.error("Failed to verify product ownership:", productError);
    return NextResponse.json({ error: "商品の確認に失敗しました" }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "対象の商品が見つかりません" }, { status: 404 });
  }

  const filePath = getProductImagePath(auth.user.id, body.productId);
  const thumbPath = getProductImageThumbPath(auth.user.id, body.productId);
  const inputBytes = Buffer.from(validation.base64Data, "base64");
  let fullBytes: Buffer;
  let thumbBytes: Buffer;

  try {
    const rotated = sharp(inputBytes).rotate();
    const [full, thumb] = await Promise.all([
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
    fullBytes = full;
    thumbBytes = thumb;
  } catch (error) {
    console.error("Failed to encode product image:", error);
    return NextResponse.json(
      { error: "画像の変換に失敗しました" },
      { status: 500 }
    );
  }

  try {
    await Promise.all([
      r2Upload(filePath, fullBytes, AVIF_CONTENT_TYPE),
      r2Upload(thumbPath, thumbBytes, AVIF_CONTENT_TYPE),
    ]);
  } catch (error) {
    console.error("R2 upload failed:", error);
    return NextResponse.json({ error: "画像の保存に失敗しました" }, { status: 500 });
  }

  const { error: updateError } = await auth.supabase
    .from("products")
    .update({ package_image_url: filePath })
    .eq("id", body.productId)
    .eq("user_id", auth.user.id);

  if (updateError) {
    console.error("Failed to persist product image path:", updateError);
    if (product.package_image_url !== filePath) {
      await r2Delete([filePath, thumbPath]);
    }
    return NextResponse.json({ error: "画像情報の保存に失敗しました" }, { status: 500 });
  }

  if (product.package_image_url && product.package_image_url !== filePath) {
    const staleThumb = getProductImageThumbPathFromStoredPath(product.package_image_url);
    await r2Delete([product.package_image_url, staleThumb]).catch((error) => {
      console.error("Failed to delete stale product image:", error);
    });
  }

  return NextResponse.json({
    filePath,
    thumbPath,
  });
}
