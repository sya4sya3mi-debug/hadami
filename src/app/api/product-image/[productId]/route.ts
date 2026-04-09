import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";

export const runtime = "nodejs";

const BUCKET = "product-images";

function getProductImagePath(userId: string, productId: string) {
  return `${userId}/${productId}.webp`;
}

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const { productId } = params;
  if (!productId) {
    return NextResponse.json({ error: "productId が不正です" }, { status: 400 });
  }

  const { data: product, error: productError } = await auth.supabase
    .from("products")
    .select("id, package_image_url")
    .eq("id", productId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (productError) {
    console.error("Failed to verify product image access:", productError);
    return NextResponse.json({ error: "画像の確認に失敗しました" }, { status: 500 });
  }

  if (!product?.package_image_url) {
    return NextResponse.json({ error: "画像が見つかりません" }, { status: 404 });
  }

  const filePath = getProductImagePath(auth.user.id, productId);
  const { data, error } = await auth.supabase.storage
    .from(BUCKET)
    .download(filePath);

  if (error || !data) {
    console.error("Failed to download product image:", error);
    return NextResponse.json({ error: "画像の取得に失敗しました" }, { status: 404 });
  }

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": data.type || "image/webp",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
