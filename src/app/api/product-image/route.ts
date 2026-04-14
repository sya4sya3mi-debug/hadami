import { NextResponse } from "next/server";
import sharp from "sharp";
import { authenticateRequest, validateImagePayload } from "@/lib/apiAuth";
import {
  PRODUCT_IMAGE_THUMB_SIZE,
  getProductImagePath,
  getProductImageThumbPath,
} from "@/lib/productImages";
import { r2Upload, r2Delete, r2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

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
  const bytes = Buffer.from(validation.base64Data, "base64");
  let thumbBytes: Buffer;

  try {
    thumbBytes = await sharp(bytes)
      .resize(PRODUCT_IMAGE_THUMB_SIZE, PRODUCT_IMAGE_THUMB_SIZE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error("Failed to generate product thumbnail:", error);
    return NextResponse.json(
      { error: "画像サムネイルの生成に失敗しました" },
      { status: 500 }
    );
  }

  try {
    await Promise.all([
      r2Upload(filePath, bytes, "image/webp"),
      r2Upload(thumbPath, thumbBytes, "image/webp"),
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

  return NextResponse.json({
    imageUrl: r2PublicUrl(filePath),
    filePath,
    thumbPath,
  });
}
