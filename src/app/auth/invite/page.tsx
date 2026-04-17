"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InvitePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        router.push("/auth/login");
      } else {
        setError(data.error || "招待コードが無効です。");
      }
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bo-cream">
      <div className="mb-8 text-center flex flex-col items-center">
        <Image
          src="/hadami-logo.png"
          alt="HADAMI"
          width={64}
          height={64}
          className="rounded-2xl mb-2"
        />
        <h1 className="text-[28px] font-black font-serif text-bo-accent m-0">
          HADAMI
        </h1>
        <p className="text-[13px] text-bo-ink-muted mt-1">
          クローズドベータ版
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-r2 py-7 px-6 shadow-bo2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3DC] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4A853"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <h2 className="text-[18px] font-bold mb-2 text-center text-bo-ink">
          招待コードを入力
        </h2>
        <p className="text-[13px] text-bo-ink-muted text-center mb-5 leading-relaxed">
          HADAMIベータ版をご利用いただくには
          <br />
          招待コードが必要です。
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="招待コードを入力"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              autoFocus
              autoComplete="off"
              className="w-full p-3 border-[1.5px] border-bo-parchment rounded-r1 text-[15px] text-center font-bold tracking-[0.1em] bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors placeholder:font-normal placeholder:tracking-normal"
            />
          </div>

          {error && (
            <p className="text-[13px] mb-3 text-center text-bo-caution">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3.5 bg-bo-accent text-white border-none rounded-r1 text-[15px] font-bold cursor-pointer shadow-bo-accent disabled:opacity-70 hover:bg-bo-accent-dark transition-colors"
          >
            {loading ? "確認中..." : "次へ進む"}
          </button>
        </form>

        <p className="text-center mt-4 text-[13px] text-bo-ink-muted">
          すでにアカウントをお持ちの方は
          <Link
            href="/auth/login"
            className="text-bo-accent font-bold ml-1 no-underline"
          >
            ログイン
          </Link>
        </p>
      </div>

      <p className="text-center mt-4 text-[11px] text-bo-ink-faint max-w-[360px] leading-relaxed">
        招待コードをお持ちでない方は、公式SNSまたはお知り合いの方からお受け取りください。
      </p>
    </div>
  );
}
