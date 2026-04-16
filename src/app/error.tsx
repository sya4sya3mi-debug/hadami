"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client error caught by boundary:", error);
  }, [error]);

  const handleClearAndRetry = () => {
    try {
      // キャッシュが壊れている場合に備えてクリア
      const keysToRemove = Object.keys(localStorage).filter((k) =>
        k.startsWith("hadami-")
      );
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // localStorage 自体がアクセスできない場合は無視
    }
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bo-cream">
      <div className="w-full max-w-[360px] text-center">
        <div className="w-16 h-16 rounded-[20px] mx-auto mb-4 flex items-center justify-center bg-bo-caution/10">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-lg font-bold text-bo-ink mb-2">
          エラーが発生しました
        </h1>
        <p className="text-sm text-bo-ink-muted mb-6 leading-relaxed">
          申し訳ありません。予期しないエラーが発生しました。
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3 bg-bo-accent text-white border-none rounded-r1 text-sm font-bold cursor-pointer"
          >
            もう一度試す
          </button>
          <button
            onClick={handleClearAndRetry}
            className="w-full py-3 bg-white text-bo-ink border border-bo-parchment rounded-r1 text-sm font-semibold cursor-pointer"
          >
            キャッシュをクリアして再読み込み
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-bo-ink-muted cursor-pointer">
              エラー詳細
            </summary>
            <pre className="mt-2 p-3 bg-white rounded-r1 text-xs text-bo-caution overflow-auto max-h-40 border border-bo-parchment">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
