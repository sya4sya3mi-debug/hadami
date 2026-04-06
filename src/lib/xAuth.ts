import OAuth from "oauth-1.0a";
import crypto from "crypto";

export function createOAuthClient() {
  const key = process.env.X_API_KEY;
  const secret = process.env.X_API_SECRET;
  if (!key || !secret) {
    throw new Error("X API環境変数が未設定です: X_API_KEY, X_API_SECRET");
  }
  return new OAuth({
    consumer: { key, secret },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

export function getOAuthHeaders(
  url: string,
  method: string,
  token?: { key: string; secret: string },
  data?: Record<string, string>
) {
  const oauth = createOAuthClient();
  const requestData = { url, method, data };
  return oauth.toHeader(oauth.authorize(requestData, token));
}
