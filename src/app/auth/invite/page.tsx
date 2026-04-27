"use client";

import "@/styles/hadami-tokens.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

export default function InvitePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [authLoading, router, user]);

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
      const data = (await res.json()) as { valid?: boolean; error?: string };
      if (data.valid) router.push("/auth/profile");
      else setError(data.error || "招待コードが無効です。");
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="hd-root hd-softa" data-density="compact">
      <div
        className="hd"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 48px",
          background: "var(--hd-bg)",
          color: "var(--hd-ink)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <Image
            src="/hadami-app-icon.png"
            alt="HADAMI"
            width={56}
            height={56}
            style={{ borderRadius: 12, marginBottom: 12 }}
          />
          <div
            className="hd-serif"
            style={{
              fontSize: 26,
              letterSpacing: "0.06em",
              fontStyle: "italic",
            }}
          >
            HADAMI
          </div>
          <div
            className="hd-mono hd-caps"
            style={{ color: "var(--hd-ink-40)", marginTop: 12 }}
          >
            Invite Code · 招待コード
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: "var(--hd-surface)",
            border: "1px solid var(--hd-ink)",
            padding: "28px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "1px solid var(--hd-ink)",
              paddingBottom: 12,
              marginBottom: 18,
            }}
          >
            <span className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
              No. 02
            </span>
            <span className="hd-serif" style={{ fontSize: 16 }}>
              招待コードを入力
            </span>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--hd-ink-60)",
              textAlign: "center",
              marginBottom: 6,
              lineHeight: 1.7,
              fontFamily: "var(--hd-sans)",
            }}
          >
            アカウントに招待コードを紐づけます。
          </p>
          <p
            className="hd-mono"
            style={{
              fontSize: 11,
              color: "var(--hd-ink-40)",
              textAlign: "center",
              marginBottom: 22,
              letterSpacing: "0.04em",
            }}
          >
            {user.email}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="例: HADAMI-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                autoFocus
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid var(--hd-line)",
                  borderRadius: 0,
                  fontSize: 15,
                  textAlign: "center",
                  letterSpacing: "0.18em",
                  background: "var(--hd-bg)",
                  outline: "none",
                  fontFamily: "var(--hd-mono)",
                  boxSizing: "border-box",
                  color: "var(--hd-ink)",
                }}
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: 12,
                  marginBottom: 12,
                  textAlign: "center",
                  color: "var(--hd-terra)",
                  fontFamily: "var(--hd-sans)",
                  lineHeight: 1.6,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                border: "none",
                fontFamily: "var(--hd-sans)",
                fontSize: 14,
                cursor: "pointer",
                opacity: loading || !code.trim() ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span>{loading ? "確認中..." : "次へ進む"}</span>
              <span
                className="hd-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
              >
                NEXT →
              </span>
            </button>
          </form>
        </div>

        <p
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 11,
            color: "var(--hd-ink-40)",
            marginTop: 28,
            textAlign: "center",
            lineHeight: 1.7,
            maxWidth: 380,
          }}
        >
          ※ 招待コードは{" "}
          <a
            href="https://x.com/miomio_beauty"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--hd-moss)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            X（@miomio_beauty）
          </a>
          にDMでお問い合わせください。
        </p>
      </div>
    </div>
  );
}
