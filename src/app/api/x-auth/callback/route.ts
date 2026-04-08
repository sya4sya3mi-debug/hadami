import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getOAuthHeaders } from "@/lib/xAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const oauthToken = request.nextUrl.searchParams.get("oauth_token");
  const oauthVerifier = request.nextUrl.searchParams.get("oauth_verifier");
  const tokenSecret = request.cookies.get("x_oauth_token_secret")?.value;

  if (!oauthToken || !oauthVerifier || !tokenSecret) {
    return NextResponse.redirect(new URL("/settings?x_error=missing_params", request.url));
  }

  // Exchange for access token
  const accessTokenUrl = "https://api.twitter.com/oauth/access_token";
  const verifierData = { oauth_verifier: oauthVerifier };
  const headers = getOAuthHeaders(accessTokenUrl, "POST", {
    key: oauthToken,
    secret: tokenSecret,
  }, verifierData);

  const res = await fetch(accessTokenUrl, {
    method: "POST",
    headers: { Authorization: headers.Authorization },
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL("/settings?x_error=token_exchange", request.url));
  }

  const body = await res.text();
  const params = new URLSearchParams(body);
  const accessToken = params.get("oauth_token");
  const accessTokenSecret = params.get("oauth_token_secret");
  const xUserId = params.get("user_id");
  const xScreenName = params.get("screen_name");

  if (!accessToken || !accessTokenSecret || !xUserId) {
    return NextResponse.redirect(new URL("/settings?x_error=invalid_token", request.url));
  }

  // Save to Supabase
  const { error: dbError } = await auth.supabase
    .from("x_auth_tokens")
    .upsert({
      user_id: auth.user.id,
      access_token: accessToken,
      access_token_secret: accessTokenSecret,
      x_user_id: xUserId,
      x_screen_name: xScreenName || null,
      updated_at: new Date().toISOString(),
    });

  if (dbError) {
    return NextResponse.redirect(new URL("/settings?x_error=save_failed", request.url));
  }

  // Clear the temp cookie and redirect
  const response = NextResponse.redirect(new URL("/settings?x_linked=true", request.url));
  response.cookies.delete("x_oauth_token_secret");
  return response;
}
