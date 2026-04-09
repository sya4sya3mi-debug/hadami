"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/storage";

/**
 * 画像パスから署名付きURLを遅延取得するフック。
 * コンポーネントが実際にレンダーされたときだけURLを解決する。
 * 既にHTTP URLの場合はそのまま返す。
 */
export function useSignedImageUrl(path: string | undefined): string | undefined {
  const { supabase } = useUser();
  const [url, setUrl] = useState<string | undefined>(() => {
    if (!path) return undefined;
    // Already a full URL (legacy data or already resolved)
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("/") ||
      path.startsWith("data:")
    ) return path;
    return undefined;
  });

  useEffect(() => {
    if (!path) return;
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("/") ||
      path.startsWith("data:")
    ) {
      setUrl(path);
      return;
    }

    let cancelled = false;
    getSignedImageUrl(supabase, path).then((signedUrl) => {
      if (!cancelled && signedUrl) setUrl(signedUrl);
    });
    return () => { cancelled = true; };
  }, [path, supabase]);

  return url;
}
