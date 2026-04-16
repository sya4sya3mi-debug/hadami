import type { SupabaseClient } from "@supabase/supabase-js";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

function resolveUrl(_supabase: SupabaseClient, filePath: string): string | null {
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("/") ||
    filePath.startsWith("data:")
  ) {
    return filePath;
  }
  return `${R2_PUBLIC_URL}/${filePath}`;
}

/** 複数パスのパブリックURLを一括取得（ネットワーク不要） */
export async function getSignedImageUrls(
  supabase: SupabaseClient,
  filePaths: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expiresIn?: number
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const fp of filePaths) {
    result[fp] = resolveUrl(supabase, fp);
  }
  return result;
}

/**
 * ストレージパスからパブリックURLを生成する。
 * フル URL（既存データの後方互換）が渡された場合はそのまま返す。
 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  filePath: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expiresIn?: number
): Promise<string | null> {
  return resolveUrl(supabase, filePath);
}

/** キャッシュクリア — パブリックURL方式ではキャッシュ不要のため no-op */
export function clearImageUrlCache() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("hadami-img-cache");
  }
}
