import { NextRequest, NextResponse } from "next/server";
import {
  createInviteOAuthToken,
  createInviteProofToken,
  INVITE_PROOF_COOKIE_NAME,
} from "@/lib/inviteProof";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(ip, 10 * 60_000, 10, "verify-invite", {
      failOpen: true,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          valid: false,
          error: "アクセスが集中しています。しばらくしてから再度お試しください。",
        },
        { status: 429 }
      );
    }

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
      .select("id, max_uses, used_count, is_active, expires_at")
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
        { valid: false, error: "この招待コードは現在利用できません。" },
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
        { valid: false, error: "この招待コードは利用上限に達しています。" },
        { status: 403 }
      );
    }

    // Invite validation only issues a signed proof cookie. The code is redeemed
    // atomically when profile creation succeeds.
    const response = NextResponse.json({
      valid: true,
      inviteToken: createInviteOAuthToken(data.id),
    });
    response.cookies.set(
      INVITE_PROOF_COOKIE_NAME,
      createInviteProofToken(data.id),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );
    response.cookies.set("hadami-invite-verified", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("verify-invite error:", error);
    return NextResponse.json(
      { valid: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
