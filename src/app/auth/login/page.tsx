"use client";

import "@/styles/hadami-tokens.css";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toJaAuthErrorMessage } from "@/lib/authErrorMessage";

type EmailMode = "login" | "signup";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid var(--hd-line)",
  borderRadius: 0,
  fontSize: 14,
  background: "var(--hd-bg)",
  outline: "none",
  fontFamily: "var(--hd-sans)",
  boxSizing: "border-box",
  color: "var(--hd-ink)",
};

function LoginPageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState("");
  const [showResetHint, setShowResetHint] = useState(false);
  const registrationClosed = searchParams.get("error") === "registration_limit_reached";
  const resetPasswordHref = email
    ? `/auth/reset-password?email=${encodeURIComponent(email)}`
    : "/auth/reset-password";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const hasRecoveryParams =
      searchParams.get("type") === "recovery" ||
      searchParams.get("flow") === "recovery" ||
      Boolean(searchParams.get("token_hash")) ||
      Boolean(searchParams.get("code")) ||
      hashParams.get("type") === "recovery" ||
      Boolean(hashParams.get("access_token"));
    if (!hasRecoveryParams) return;
    const nextUrl = new URL(`${window.location.origin}/auth/reset-password`);
    nextUrl.searchParams.set("mode", "update");
    ["code", "token_hash", "type", "flow", "recovery_error"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) nextUrl.searchParams.set(key, value);
    });
    const nextHash = hashParams.toString();
    if (nextHash) nextUrl.hash = nextHash;
    window.location.replace(nextUrl.toString());
  }, [searchParams]);

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true);
    setMessage("");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const callbackUrl = new URL(`${siteUrl}/auth/callback`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString(), queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setMessage(toJaAuthErrorMessage(error.message, "Googleログインに失敗しました。"));
      setLoadingGoogle(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    setMessage("");
    setShowResetHint(false);
    if (emailMode === "signup") {
      const registrationRes = await fetch("/api/check-registration").catch(() => null);
      if (registrationRes) {
        const { allowed } = (await registrationRes.json().catch(() => ({ allowed: true }))) as { allowed?: boolean };
        if (!allowed) {
          setMessage("現在ベータ版の新規登録は上限に達しています。");
          setLoadingEmail(false);
          return;
        }
      }
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const callbackUrl = new URL(`${siteUrl}/auth/callback`);
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (error) {
        setMessage(toJaAuthErrorMessage(error.message, "新規登録に失敗しました。"));
      } else if (data.user && data.user.identities?.length === 0) {
        setMessage("このメールアドレスは既に登録されています。ログインしてください。");
      } else {
        setMessage("確認メールを送信しました。メール内リンクからログイン後、招待コード入力に進んでください。");
      }
      setLoadingEmail(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setShowResetHint(/invalid login credentials/i.test(error.message));
      setMessage(toJaAuthErrorMessage(error.message, "ログインに失敗しました。"));
      setLoadingEmail(false);
      return;
    }
    window.location.href = "/";
  };

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
        {registrationClosed && (
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              border: "1px solid var(--hd-terra)",
              padding: "12px 16px",
              marginBottom: 24,
              textAlign: "center",
              fontSize: 12,
              color: "var(--hd-terra)",
              fontFamily: "var(--hd-sans)",
              lineHeight: 1.7,
            }}
          >
            現在ベータ版の新規登録は上限に達しています。<br />
            招待枠の追加までお待ちください。
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <Image
            src="/hadami-logo.png"
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
            Sign In · ログイン
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
              marginBottom: 20,
            }}
          >
            <span className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
              No. 01
            </span>
            <span className="hd-serif" style={{ fontSize: 16 }}>
              アカウント認証
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loadingGoogle}
            style={{
              width: "100%",
              padding: "13px 16px",
              border: "1px solid var(--hd-line)",
              background: "var(--hd-bg)",
              fontSize: 14,
              color: "var(--hd-ink)",
              cursor: "pointer",
              opacity: loadingGoogle ? 0.7 : 1,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontFamily: "var(--hd-sans)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C40.9 35.7 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            <span>{loadingGoogle ? "Googleへ接続中..." : "Googleでログイン"}</span>
            <span
              className="hd-mono"
              style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--hd-ink-40)" }}
            >
              →
            </span>
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "16px 0",
            }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--hd-hair)" }} />
            <span
              className="hd-mono hd-caps"
              style={{ color: "var(--hd-ink-40)" }}
            >
              or · email
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--hd-hair)" }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid var(--hd-ink)",
              marginBottom: 16,
            }}
          >
            {(["login", "signup"] as const).map((m) => {
              const on = emailMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setEmailMode(m);
                    setMessage("");
                  }}
                  style={{
                    padding: "10px 0",
                    background: on ? "var(--hd-ink)" : "transparent",
                    color: on ? "var(--hd-bg)" : "var(--hd-ink)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--hd-sans)",
                    fontSize: 12,
                  }}
                >
                  {m === "login" ? "ログイン" : "新規登録"}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleEmailSubmit}>
            <div style={{ marginBottom: 10 }}>
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <input
                type="password"
                placeholder="パスワード（6文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            {emailMode === "login" && (
              <div style={{ marginBottom: 16, textAlign: "right" }}>
                <Link
                  href={resetPasswordHref}
                  className="hd-mono hd-caps"
                  style={{
                    color: "var(--hd-ink-60)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Forgot password? · 再設定
                </Link>
              </div>
            )}

            {message && (
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
                {message}
              </p>
            )}

            {emailMode === "login" && showResetHint && (
              <div style={{ marginBottom: 12, textAlign: "center" }}>
                <p
                  style={{
                    marginBottom: 6,
                    fontSize: 12,
                    color: "var(--hd-terra)",
                    fontFamily: "var(--hd-sans)",
                  }}
                >
                  パスワードが分からない場合は、再設定へ進んでください。
                </p>
                <Link
                  href={resetPasswordHref}
                  className="hd-mono hd-caps"
                  style={{
                    color: "var(--hd-ink)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Reset · パスワードを再設定
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingEmail}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                border: "none",
                fontFamily: "var(--hd-sans)",
                fontSize: 14,
                cursor: "pointer",
                opacity: loadingEmail ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span>
                {loadingEmail
                  ? "処理中..."
                  : emailMode === "signup"
                  ? "メールで新規登録"
                  : "メールでログイン"}
              </span>
              <span
                className="hd-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
              >
                →
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
          ※ Googleアカウントがない場合はメールで新規登録できます。
          <br />
          初回ログイン後、招待コードの入力に進みます。
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
