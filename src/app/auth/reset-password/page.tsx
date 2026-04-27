"use client";

import "@/styles/hadami-tokens.css";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/auth";
import { toJaAuthErrorMessage } from "@/lib/authErrorMessage";
import {
  createRecoveryRequestClient,
  createRecoverySessionClient,
} from "@/lib/supabaseRecovery";

function getPasswordValidationMessage(
  password: string,
  confirmPassword?: string,
) {
  if (password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (typeof confirmPassword === "string" && password !== confirmPassword) {
    return "確認用パスワードが一致しません。";
  }
  return "";
}

function cleanupRecoveryParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  [
    "code", "token_hash", "type", "flow",
    "access_token", "refresh_token", "expires_in",
    "expires_at", "token_type", "recovery_error",
  ].forEach((key) => url.searchParams.delete(key));
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    ["access_token", "refresh_token", "expires_in", "expires_at", "token_type", "type"].forEach(
      (key) => hashParams.delete(key),
    );
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
  }
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

const RECOVERY_LINK_ERROR_MESSAGE =
  "この再設定リンクを確認できません。もう一度最新のメールを送信して開いてください。";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid var(--hd-line)",
  borderRadius: 0,
  fontSize: 15,
  background: "var(--hd-bg)",
  outline: "none",
  fontFamily: "var(--hd-sans)",
  boxSizing: "border-box",
  color: "var(--hd-ink)",
};

function ResetPasswordPageInner() {
  const { user, supabase } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const recoveryClientRef =
    useRef<ReturnType<typeof createRecoverySessionClient> | null>(null);

  if (!recoveryClientRef.current) {
    recoveryClientRef.current = createRecoverySessionClient();
  }

  const recoveryClient = recoveryClientRef.current;
  const mode = searchParams.get("mode") === "update" ? "update" : "request";
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const recoveryCode = searchParams.get("code");
  const recoveryTokenHash = searchParams.get("token_hash");
  const recoveryType = searchParams.get("type");
  const recoveryError = searchParams.get("recovery_error");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preparingRecovery, setPreparingRecovery] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);
  const processedRecoveryKeyRef = useRef<string | null>(null);
  const recoveryReadyRef = useRef(false);
  const canEditPassword =
    mode !== "update" || Boolean(user) || recoverySessionReady;
  const showUpdatePasswordForm =
    mode === "update" && !preparingRecovery && canEditPassword;
  const requestResetHref = email
    ? `/auth/reset-password?email=${encodeURIComponent(email)}`
    : "/auth/reset-password";

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (mode !== "update" || !user) return;
    recoveryReadyRef.current = true;
    setRecoverySessionReady(true);
    setPreparingRecovery(false);
    setError("");
  }, [mode, user]);

  useEffect(() => {
    if (mode !== "update" || recoveryError !== "invalid") return;
    setError(RECOVERY_LINK_ERROR_MESSAGE);
  }, [mode, recoveryError]);

  useEffect(() => {
    if (mode !== "update" || user) return;
    let cancelled = false;
    let fallbackTimer: number | null = null;
    const {
      data: { subscription },
    } = recoveryClient.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return;
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "PASSWORD_RECOVERY"
      ) {
        recoveryReadyRef.current = true;
        setRecoverySessionReady(true);
        setPreparingRecovery(false);
        setError("");
        cleanupRecoveryParams();
      }
    });

    async function markRecoverySessionReady() {
      const { data } = await recoveryClient.auth.getSession();
      if (cancelled || !data.session) return false;
      recoveryReadyRef.current = true;
      setRecoverySessionReady(true);
      setPreparingRecovery(false);
      setError("");
      cleanupRecoveryParams();
      return true;
    }

    function startRecoveryTimeout() {
      if (typeof window === "undefined") return;
      fallbackTimer = window.setTimeout(() => {
        void (async () => {
          if (cancelled || recoveryReadyRef.current) return;
          const ready = await markRecoverySessionReady();
          if (cancelled || ready || recoveryReadyRef.current) return;
          setPreparingRecovery(false);
          setError(RECOVERY_LINK_ERROR_MESSAGE);
        })();
      }, 4000);
    }

    async function prepareRecoverySession() {
      if (await markRecoverySessionReady()) return;
      const hashParams =
        typeof window === "undefined"
          ? new URLSearchParams()
          : new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");
      const hasHashRecovery =
        Boolean(accessToken) && Boolean(refreshToken) && hashType === "recovery";
      const hasTokenRecovery =
        Boolean(recoveryTokenHash) && recoveryType === "recovery";
      const hasCodeRecovery = Boolean(recoveryCode);

      if (!hasHashRecovery && !hasTokenRecovery && !hasCodeRecovery) {
        setPreparingRecovery(false);
        return;
      }

      setPreparingRecovery(true);
      setError("");
      startRecoveryTimeout();

      if (hasHashRecovery && accessToken && refreshToken) {
        const recoveryKey = `hash:${accessToken}`;
        if (processedRecoveryKeyRef.current !== recoveryKey) {
          processedRecoveryKeyRef.current = recoveryKey;
          const { error: setSessionError } = await recoveryClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;
          if (setSessionError) {
            setError(
              toJaAuthErrorMessage(setSessionError.message, RECOVERY_LINK_ERROR_MESSAGE),
            );
            setPreparingRecovery(false);
            return;
          }
        }
        if (await markRecoverySessionReady()) return;
      }

      if (hasTokenRecovery && recoveryTokenHash) {
        const recoveryKey = `token:${recoveryTokenHash}`;
        if (processedRecoveryKeyRef.current !== recoveryKey) {
          processedRecoveryKeyRef.current = recoveryKey;
          const { error: verifyError } = await recoveryClient.auth.verifyOtp({
            token_hash: recoveryTokenHash,
            type: "recovery",
          });
          if (cancelled) return;
          if (verifyError) {
            setError(
              toJaAuthErrorMessage(verifyError.message, RECOVERY_LINK_ERROR_MESSAGE),
            );
            setPreparingRecovery(false);
            return;
          }
        }
        if (await markRecoverySessionReady()) return;
      }

      if (hasCodeRecovery && recoveryCode) {
        const recoveryKey = `code:${recoveryCode}`;
        if (processedRecoveryKeyRef.current !== recoveryKey) {
          processedRecoveryKeyRef.current = recoveryKey;
          const { error: exchangeError } =
            await recoveryClient.auth.exchangeCodeForSession(recoveryCode);
          if (cancelled) return;
          if (exchangeError) {
            setError(
              toJaAuthErrorMessage(exchangeError.message, RECOVERY_LINK_ERROR_MESSAGE),
            );
            setPreparingRecovery(false);
            return;
          }
        }
        if (await markRecoverySessionReady()) return;
      }

      if (cancelled) return;
      setPreparingRecovery(false);
      setError(RECOVERY_LINK_ERROR_MESSAGE);
    }

    void prepareRecoverySession();

    return () => {
      cancelled = true;
      if (fallbackTimer !== null && typeof window !== "undefined") {
        window.clearTimeout(fallbackTimer);
      }
      subscription.unsubscribe();
    };
  }, [mode, recoveryClient, recoveryCode, recoveryTokenHash, recoveryType, user]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const requestClient = createRecoveryRequestClient();
    const { error: resetError } = await requestClient.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${siteUrl}/auth/reset-password?mode=update` },
    );
    if (resetError) {
      setError(
        toJaAuthErrorMessage(
          resetError.message,
          "再設定メールの送信に失敗しました。時間を置いて再度お試しください。",
        ),
      );
      setSubmitting(false);
      return;
    }
    setMessage(
      "再設定メールを送信しました。メール内のリンクから新しいパスワードを設定してください。",
    );
    setSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    const validationMessage = getPasswordValidationMessage(password, confirmPassword);
    if (validationMessage) {
      setError(validationMessage);
      setSubmitting(false);
      return;
    }
    const [{ data: recoverySessionData }, { data: defaultSessionData }] =
      await Promise.all([
        recoveryClient.auth.getSession(),
        supabase.auth.getSession(),
      ]);
    const authClient = recoverySessionData.session
      ? recoveryClient
      : defaultSessionData.session
        ? supabase
        : recoveryClient;
    if (!recoverySessionData.session && !defaultSessionData.session) {
      setError(RECOVERY_LINK_ERROR_MESSAGE);
      setSubmitting(false);
      return;
    }
    const { error: updateError } = await authClient.auth.updateUser({ password });
    if (updateError) {
      setError(
        toJaAuthErrorMessage(
          updateError.message,
          "パスワードの更新に失敗しました。もう一度お試しください。",
        ),
      );
      setSubmitting(false);
      return;
    }
    setMessage("新しいパスワードを保存しました。");
    setSubmitting(false);
    window.setTimeout(() => router.replace("/"), 800);
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
            style={{ fontSize: 26, letterSpacing: "0.06em", fontStyle: "italic" }}
          >
            HADAMI
          </div>
          <div
            className="hd-mono hd-caps"
            style={{ color: "var(--hd-ink-40)", marginTop: 12 }}
          >
            {mode === "update" ? "Update · パスワード再設定" : "Reset · パスワード再設定"}
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
              {mode === "update" ? "Step 02" : "Step 01"}
            </span>
            <span className="hd-serif" style={{ fontSize: 16 }}>
              {mode === "update" ? "新しいパスワードを設定" : "再設定メールを送信"}
            </span>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--hd-ink-60)",
              marginBottom: 18,
              lineHeight: 1.7,
              fontFamily: "var(--hd-sans)",
            }}
          >
            {mode === "update"
              ? "パスワードは6文字以上で入力してください。"
              : "登録済みメールアドレスに再設定リンクをお送りします。"}
          </p>

          <form
            onSubmit={mode === "update" ? handleUpdatePassword : handleRequestReset}
          >
            {mode === "request" ? (
              <div style={{ marginBottom: 14 }}>
                <label
                  className="hd-mono hd-caps"
                  style={{
                    color: "var(--hd-ink-40)",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Email · メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            ) : preparingRecovery ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  border: "1px solid var(--hd-line)",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  lineHeight: 1.7,
                }}
              >
                再設定リンクを確認しています。少しお待ちください。
              </div>
            ) : !canEditPassword ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  border: "1px solid var(--hd-line)",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  color: "var(--hd-ink-60)",
                  lineHeight: 1.7,
                }}
              >
                このリンクのセッションが確認できません。再度「パスワードをお忘れですか？」から最新のメールを送信してください。
                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <Link
                    href={requestResetHref}
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink)",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    Reset Mail · 再送信画面へ
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink-40)",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="6文字以上"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label
                    className="hd-mono hd-caps"
                    style={{
                      color: "var(--hd-ink-40)",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="もう一度入力"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

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

            {message && (
              <p
                style={{
                  fontSize: 12,
                  marginBottom: 12,
                  textAlign: "center",
                  color: "var(--hd-moss)",
                  fontFamily: "var(--hd-sans)",
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
            )}

            {(mode === "request" || showUpdatePasswordForm) && (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  background: "var(--hd-ink)",
                  color: "var(--hd-bg)",
                  border: "none",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 14,
                  cursor: "pointer",
                  opacity: submitting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <span>
                  {submitting
                    ? "処理中..."
                    : mode === "update"
                      ? "新しいパスワードを保存"
                      : "再設定メールを送る"}
                </span>
                <span
                  className="hd-mono"
                  style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
                >
                  →
                </span>
              </button>
            )}
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontFamily: "var(--hd-sans)",
            fontSize: 12,
            color: "var(--hd-ink-60)",
          }}
        >
          <Link
            href="/auth/login"
            className="hd-mono hd-caps"
            style={{
              color: "var(--hd-ink)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            ← Sign In · ログイン画面に戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
