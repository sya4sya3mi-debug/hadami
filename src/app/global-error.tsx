"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  const handleClearAndRetry = () => {
    try {
      const keysToRemove = Object.keys(localStorage).filter((k) =>
        k.startsWith("hadami-")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FBF8F3" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div style={{ maxWidth: 360, textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
              エラーが発生しました
            </h1>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>
              申し訳ありません。アプリの読み込みに失敗しました。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={reset}
                style={{ width: "100%", padding: "12px 0", background: "#3A8F7A", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                もう一度試す
              </button>
              <button
                onClick={handleClearAndRetry}
                style={{ width: "100%", padding: "12px 0", background: "white", color: "#1a1a1a", border: "1px solid #e0d8cc", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                キャッシュをクリアして再読み込み
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
