import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { claimInviteCodeForUser } from "@/lib/inviteClaims";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }

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

    const claimResult = await claimInviteCodeForUser(auth.user.id, code);
    if (!claimResult.ok) {
      if (claimResult.reason === "invite_exhausted") {
        return NextResponse.json(
          {
            valid: false,
            error: "この招待コードは利用上限に達しています。",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { valid: false, error: "招待コードが見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json({ valid: true, claimed: true });
  } catch (error) {
    console.error("verify-invite error:", error);
    return NextResponse.json(
      { valid: false, error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
