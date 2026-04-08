import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getOAuthHeaders } from "@/lib/xAuth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const callbackUrl = process.env.X_CALLBACK_URL;
  if (!callbackUrl) {
    console.error("X_CALLBACK_URL is not set");
    return NextResponse.json({ error: "X連携の設定に問題があります" }, { status: 500 });
  }

  try {
    const requestTokenUrl = "https://api.twitter.com/oauth/request_token";
    const oauthData = { oauth_callback: callbackUrl };

    const headers = getOAuthHeaders(requestTokenUrl, "POST", undefined, oauthData);

    const res = await fetch(requestTokenUrl, {
      method: "POST",
      headers: { Authorization: headers.Authorization },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("X request token failed:", errText);
      return NextResponse.json({ error: "Xとの通信に失敗しました" }, { status: 500 });
    }

    const body = await res.text();
    const params = new URLSearchParams(body);
    const oauthToken = params.get("oauth_token");
    const oauthTokenSecret = params.get("oauth_token_secret");

    if (!oauthToken || !oauthTokenSecret) {
      return NextResponse.json({ error: "Xからの応答が不正です" }, { status: 500 });
    }

    // Store token secret in httpOnly cookie for callback verification
    const response = NextResponse.json({
      authUrl: `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`,
    });

    response.cookies.set("x_oauth_token_secret", oauthTokenSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("X request-token error:", e);
    return NextResponse.json({ error: "X連携の設定に問題があります" }, { status: 500 });
  }
}
