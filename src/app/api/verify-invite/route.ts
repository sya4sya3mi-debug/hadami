import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "招待コードを入力してください。" },
        { status: 400 }
      );
    }

    const trimmed = code.trim().toUpperCase();

    const { data, error } = await supabaseAdmin
      .from("invitation_codes")
      .select("id, code, max_uses, used_count, is_active, expires_at")
      .eq("code", trimmed)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { valid: false, error: "招待コードが見つかりません。" },
        { status: 404 }
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { valid: false, error: "この招待コードは無効になっています。" },
        { status: 403 }
      );
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "この招待コードは期限切れです。" },
        { status: 403 }
      );
    }

    if (data.max_uses > 0 && data.used_count >= data.max_uses) {
      return NextResponse.json(
        { valid: false, error: "この招待コードは使用上限に達しています。" },
        { status: 403 }
      );
    }

    // used_count をインクリメント
    await supabaseAdmin
      .from("invitation_codes")
      .update({ used_count: data.used_count + 1 })
      .eq("id", data.id);

    // Cookie にフラグを設定（24時間有効 — サインアップ完了まで保持）
    const response = NextResponse.json({ valid: true });
    response.cookies.set("hadami-invite-verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24時間
    });

    return response;
  } catch (e) {
    console.error("verify-invite error:", e);
    return NextResponse.json(
      { valid: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
