import type { SupabaseClient } from "@supabase/supabase-js";

function isDirectUrl(path: string): boolean {
  return (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/") ||
    path.startsWith("data:")
  );
}

/** 複数パスの署名付きURLを /api/signed-url 経由で取得 */
export async function getSignedImageUrls(
  _supabase: SupabaseClient,
  filePaths: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expiresIn?: number
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const keysToSign: string[] = [];

  for (const fp of filePaths) {
    if (isDirectUrl(fp)) {
      result[fp] = fp;
    } else {
      keysToSign.push(fp);
    }
  }

  if (keysToSign.length === 0) return result;

  try {
    const res = await fetch("/api/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: keysToSign }),
    });

    if (res.ok) {
      const data = await res.json();
      const urls: Record<string, string> = data.urls ?? {};
      for (const [k, v] of Object.entries(urls)) {
        result[k] = v;
      }
    }
  } catch {
    // ネットワークエラー時は null のまま
  }

  return result;
}

/**
 * ストレージパスから署名付きURLを生成する。
 * フル URL（既存データの後方互換）が渡された場合はそのまま返す。
 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  filePath: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expiresIn?: number
): Promise<string | null> {
  if (isDirectUrl(filePath)) return filePath;
  const urls = await getSignedImageUrls(supabase, [filePath]);
  return urls[filePath] ?? null;
}

/** キャッシュクリア */
export function clearImageUrlCache() {
  // no-op: client-side cache is managed in useSignedImageUrl hook
}
