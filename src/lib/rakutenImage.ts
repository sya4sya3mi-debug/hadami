const HOST_TO_TOKEN = {
  "thumbnail.image.rakuten.co.jp": "thumb",
  "tshop.r10s.jp": "shop",
} as const;

const TOKEN_TO_HOST = {
  thumb: "thumbnail.image.rakuten.co.jp",
  shop: "tshop.r10s.jp",
} as const;

const ALLOWED_SEARCH_KEYS = new Set(["_ex", "fitin"]);

function sanitizeSearchParams(searchParams: URLSearchParams): string {
  const sanitized = new URLSearchParams();

  searchParams.forEach((value, key) => {
    if (ALLOWED_SEARCH_KEYS.has(key) && value) {
      sanitized.set(key, value);
    }
  });

  return sanitized.toString();
}

export function normalizeRakutenImageUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const normalizedProtocol = trimmed.startsWith("//")
    ? `https:${trimmed}`
    : trimmed.replace(/^http:\/\//i, "https://");

  try {
    const url = new URL(normalizedProtocol);

    // 画像サイズを200x200にアップグレード（Rakuten CDNはパラメータで指定）
    const exParam = url.searchParams.get("_ex");
    if (exParam) {
      url.searchParams.set("_ex", "300x300");
    }

    return url.toString();
  } catch {
    return normalizedProtocol;
  }
}

export function buildRakutenImageProxyUrl(imageUrl: string | null | undefined): string | null {
  const normalizedUrl = normalizeRakutenImageUrl(imageUrl);
  if (!normalizedUrl) return null;

  try {
    const url = new URL(normalizedUrl);
    const hostToken =
      HOST_TO_TOKEN[url.hostname as keyof typeof HOST_TO_TOKEN];

    if (!hostToken) {
      return normalizedUrl;
    }

    const params = new URLSearchParams({
      h: hostToken,
      p: url.pathname,
    });

    const sanitizedSearch = sanitizeSearchParams(url.searchParams);
    if (sanitizedSearch) {
      params.set("s", sanitizedSearch);
    }

    return `/api/image-proxy?${params.toString()}`;
  } catch {
    return normalizedUrl;
  }
}

export function resolveRakutenImageProxyTarget(
  hostToken: string | null,
  imagePath: string | null,
  search: string | null
): string | null {
  if (!hostToken || !imagePath || !imagePath.startsWith("/")) {
    return null;
  }

  const hostname = TOKEN_TO_HOST[hostToken as keyof typeof TOKEN_TO_HOST];
  if (!hostname) {
    return null;
  }

  const target = new URL(`https://${hostname}${imagePath}`);

  if (search) {
    const incomingSearch = new URLSearchParams(search);
    let isValid = true;

    incomingSearch.forEach((value, key) => {
      if (!ALLOWED_SEARCH_KEYS.has(key) || !value) {
        isValid = false;
        return;
      }
      target.searchParams.set(key, value);
    });

    if (!isValid) {
      return null;
    }
  }

  return target.toString();
}
