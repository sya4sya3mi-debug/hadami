"use client";

import { useMemo } from "react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

/**
 * 画像パスからR2パブリックURLを同期的に解決するフック。
 * 既にHTTP URLの場合はそのまま返す。
 */
export function useSignedImageUrl(path: string | undefined): string | undefined {
  return useMemo(() => {
    if (!path) return undefined;
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("/") ||
      path.startsWith("data:")
    ) return path;

    return `${R2_PUBLIC_URL}/${path}`;
  }, [path]);
}
