import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getOAuthHeaders } from "@/lib/xAuth";

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const callbackUrl = process.env.X_CALLBACK_URL!;
  const requestTokenUrl = "https://api.twitter.com/oauth/request_token";

  const headers = getOAuthHeaders(requestTokenUrl, "POST", undefined, {
    oauth_callback: callbackUrl,
  });

  const res = await fetch(requestTokenUrl, {
    method: "POST",
    headers: { Authorization: headers.Authorization },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to get request token" }, { status: 500 });
  }

  const body = await res.text();
  const params = new URLSearchParams(body);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    return NextResponse.json({ error: "Invalid response from X" }, { status: 500 });
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
}
