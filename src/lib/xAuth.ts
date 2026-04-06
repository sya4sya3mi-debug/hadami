import OAuth from "oauth-1.0a";
import crypto from "crypto";

export function createOAuthClient() {
  return new OAuth({
    consumer: {
      key: process.env.X_API_KEY!,
      secret: process.env.X_API_SECRET!,
    },
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
