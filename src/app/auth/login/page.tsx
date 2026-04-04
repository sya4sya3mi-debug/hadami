"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("確認メールを送信しました。メールのリンクをクリックしてください。");
      }
    } else {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("メールアドレスまたはパスワードが正しくありません");
      } else if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", authData.user.id)
          .single();
        window.location.href = profile?.display_name ? "/" : "/auth/profile";
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setMessage(error.message);
    setLoading(false);
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
      {/* ロゴ */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🌿</div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--primary)", margin: 0 }}>
          HADAMI
        </h1>
        <p style={{ fontSize: "13px", color: "var(--sub)", marginTop: "4px" }}>
          成分図鑑・スキンケアデッキ
        </p>
      </div>

      {/* カード */}
      <div style={{
        width: "100%",
        maxWidth: "360px",
        background: "var(--card)",
        borderRadius: "16px",
        padding: "28px 24px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", textAlign: "center" }}>
          {isSignUp ? "新規登録" : "ログイン"}
        </h2>

        {/* Googleログイン */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "12px",
            border: "1.5px solid var(--border)",
            borderRadius: "12px",
            background: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Googleでログイン
        </button>

        {/* 区切り */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "12px", color: "var(--sub)" }}>または</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* メール・パスワード */}
        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: "12px" }}>
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
          <div style={{ marginBottom: "16px" }}>
            <input
              type="password"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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

          {message && (
            <p style={{
              fontSize: "13px",
              color: message.includes("送信") ? "var(--primary)" : "var(--warning)",
              marginBottom: "12px",
              textAlign: "center",
            }}>
              {message}
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
            {loading ? "処理中..." : isSignUp ? "登録する" : "ログイン"}
          </button>
        </form>

        {/* 切り替え */}
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--sub)" }}>
          {isSignUp ? "すでにアカウントをお持ちの方は" : "アカウントをお持ちでない方は"}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "13px",
              marginLeft: "4px",
            }}
          >
            {isSignUp ? "ログイン" : "新規登録"}
          </button>
        </p>
      </div>
    </div>
  );
}
