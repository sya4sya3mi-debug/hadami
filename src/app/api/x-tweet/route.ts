import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/apiAuth";
import { getOAuthHeaders } from "@/lib/xAuth";

const DAILY_LIMIT = 3;

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) return auth.response;

  const userId = auth.user.id;

  // Check daily tweet limit
  const { data: allowed } = await auth.supabase.rpc("check_daily_tweet_limit", {
    p_user_id: userId,
    p_limit: DAILY_LIMIT,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: `本日の投稿上限（${DAILY_LIMIT}件）に達しました` },
      { status: 429 }
    );
  }

  // Get X tokens
  const { data: tokens } = await auth.supabase
    .from("x_auth_tokens")
    .select("access_token, access_token_secret")
    .eq("user_id", userId)
    .single();

  if (!tokens) {
    return NextResponse.json({ error: "X連携が必要です" }, { status: 403 });
  }

  const body = await request.json();
  const { text, imageBase64 } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "テキストが必要です" }, { status: 400 });
  }

  const token = { key: tokens.access_token, secret: tokens.access_token_secret };

  // Upload image if provided
  let mediaId: string | undefined;
  if (imageBase64 && typeof imageBase64 === "string") {
    // Strip data URL prefix if present
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";

    const boundary = `----FormBoundary${Date.now()}`;
    const uploadBody = [
      `--${boundary}\r\nContent-Disposition: form-data; name="media_data"\r\n\r\n${base64Data}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="media_category"\r\n\r\ntweet_image\r\n`,
      `--${boundary}--\r\n`,
    ].join("");

    const uploadHeaders = getOAuthHeaders(uploadUrl, "POST", token);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadHeaders.Authorization,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: uploadBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("X media upload failed:", errText);
      return NextResponse.json({ error: "画像アップロードに失敗しました" }, { status: 502 });
    }

    const uploadData = await uploadRes.json();
    mediaId = uploadData.media_id_string;
  }

  // Post tweet
  const tweetUrl = "https://api.twitter.com/2/tweets";
  const tweetBody: Record<string, unknown> = { text };
  if (mediaId) {
    tweetBody.media = { media_ids: [mediaId] };
  }

  const tweetHeaders = getOAuthHeaders(tweetUrl, "POST", token);

  const tweetRes = await fetch(tweetUrl, {
    method: "POST",
    headers: {
      Authorization: tweetHeaders.Authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetBody),
  });

  if (!tweetRes.ok) {
    const errText = await tweetRes.text();
    console.error("X tweet failed:", errText);
    return NextResponse.json({ error: "ツイート投稿に失敗しました" }, { status: 502 });
  }

  const tweetData = await tweetRes.json();

  // Log the tweet
  await auth.supabase.from("x_tweet_log").insert({ user_id: userId });

  // Get remaining tweets today
  const { count } = await auth.supabase
    .from("x_tweet_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("tweeted_at", new Date(new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })).toISOString());

  return NextResponse.json({
    success: true,
    tweetId: tweetData.data?.id,
    remaining: Math.max(0, DAILY_LIMIT - (count || 0)),
  });
}
