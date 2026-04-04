"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";

export default function ProfileSetupPage() {
  const { user, supabase, refreshProfile } = useUser();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("ニックネームを入力してください");
      return;
    }
    if (nickname.trim().length > 20) {
      setError("ニックネームは20文字以内で入力してください");
      return;
    }
    if (!user) return;

    setLoading(true);
    setError("");

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ display_name: nickname.trim() })
      .eq("id", user.id);

    if (dbError) {
      setError("保存に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    refreshProfile?.();
    window.location.href = "/";
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--background)",
    }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🌿</div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--primary)", margin: 0 }}>
          HADAMI
        </h1>
        <p style={{ fontSize: "13px", color: "var(--sub)", marginTop: "4px" }}>
          ようこそ！あなたのことを教えてください
        </p>
      </div>

      <div style={{
        width: "100%",
        maxWidth: "360px",
        background: "var(--card)",
        borderRadius: "16px",
        padding: "28px 24px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", textAlign: "center" }}>
          プロフィール設定
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)", marginBottom: "6px", display: "block" }}>
              ニックネーム
            </label>
            <input
              type="text"
              placeholder="例：こっぺ"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              style={{
                width: "100%",
                padding: "12px",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontSize: "15px",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <p style={{ fontSize: "11px", color: "var(--sub)", marginBottom: "16px" }}>
            20文字以内で入力してください。後から変更できます。
          </p>

          {error && (
            <p style={{
              fontSize: "13px",
              color: "var(--warning)",
              marginBottom: "12px",
              textAlign: "center",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "保存中..." : "はじめる"}
          </button>
        </form>
      </div>
    </div>
  );
}
