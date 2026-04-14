"use client";

import { useMemo } from "react";
import { useUser } from "@/lib/auth";

const BUCKET = "product-images";

/**
 * 画像パスからパブリックURLを同期的に解決するフック。
 * 既にHTTP URLの場合はそのまま返す。
 */
export function useSignedImageUrl(path: string | undefined): string | undefined {
  const { supabase } = useUser();

  return useMemo(() => {
    if (!path) return undefined;
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("/") ||
      path.startsWith("data:")
    ) return path;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }, [path, supabase]);
}
