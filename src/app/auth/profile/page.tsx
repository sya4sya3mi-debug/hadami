"use client";

import "@/styles/hadami-tokens.css";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { useUser } from "@/lib/auth";
import { BETA_USER_LIMIT } from "@/lib/limits";

type ProfileSetupResult = {
  allowed?: boolean;
  reason?: string;
};

function getProfileErrorMessage(reason?: string) {
  switch (reason) {
    case "invite_proof_invalid":
      return "招待コードの確認期限が切れました。もう一度やり直してください。";
    case "invite_invalid":
      return "この招待コードは無効です。";
    case "invite_exhausted":
      return "この招待コードは利用上限に達しています。";
    case "invite_required":
      return "プロフィール作成には招待コードの確認が必要です。";
    case "limit_reached":
      return "現在ベータ版の新規登録は上限に達しています。";
    default:
      return "プロフィールの作成に失敗しました。しばらくしてからお試しください。";
  }
}

function ProfileSetupPageInner() {
  const { user, supabase } = useUser();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("ニックネームを入力してください。");
      return;
    }
    if (nickname.trim().length > 20) {
      setError("ニックネームは20文字以内で入力してください。");
      return;
    }
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const claimBody = inviteToken ? JSON.stringify({ invite_token: inviteToken }) : undefined;
      const claimResponse = await fetch("/api/invite/claim", {
        method: "POST",
        headers: claimBody ? { "Content-Type": "application/json" } : undefined,
        body: claimBody,
      }).catch(() => null);

      if (claimResponse && !claimResponse.ok && claimResponse.status !== 500) {
        const claimData = (await claimResponse.json().catch(() => null)) as { error?: string } | null;
        setError(getProfileErrorMessage(claimData?.error));
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase.rpc("complete_profile_with_invite", {
        p_display_name: nickname.trim(),
        p_limit: BETA_USER_LIMIT,
      });

      if (dbError) {
        console.error("profile save error:", dbError);
        setError("プロフィールの作成に失敗しました。しばらくしてからお試しください。");
        setLoading(false);
        return;
      }

      const result = data as ProfileSetupResult | null;
      if (!result?.allowed) {
        setError(getProfileErrorMessage(result?.reason));
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (submitError) {
      console.error("profile setup failed:", submitError);
      setError("プロフィールの作成に失敗しました。しばらくしてからお試しください。");
      setLoading(false);
    }
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
            Profile · プロフィール
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
              No. 03
            </span>
            <span className="hd-serif" style={{ fontSize: 16 }}>
              ニックネームを設定
            </span>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--hd-ink-60)",
              marginBottom: 20,
              lineHeight: 1.7,
              fontFamily: "var(--hd-sans)",
              textAlign: "center",
            }}
          >
            ようこそ。あなたのことを教えてください。
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <label
                className="hd-mono hd-caps"
                style={{
                  color: "var(--hd-ink-40)",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Nickname · ニックネーム
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                style={{
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
                }}
              />
            </div>

            <p
              style={{
                fontSize: 11,
                color: "var(--hd-ink-40)",
                marginBottom: 18,
                fontFamily: "var(--hd-sans)",
                lineHeight: 1.6,
              }}
            >
              20文字以内で入力してください。あとから変更できます。
            </p>

            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--hd-terra)",
                  marginBottom: 12,
                  textAlign: "center",
                  fontFamily: "var(--hd-sans)",
                  lineHeight: 1.6,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                border: "none",
                fontFamily: "var(--hd-sans)",
                fontSize: 14,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span>{loading ? "保存中..." : "はじめる"}</span>
              <span
                className="hd-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}
              >
                START →
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSetupPageInner />
    </Suspense>
  );
}
