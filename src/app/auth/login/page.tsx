"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [inviteVerified, setInviteVerified] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("error") === "registration_limit_reached") {
      setRegistrationClosed(true);
    }
    // 招待コード検証済みCookieの確認（Cookie名で簡易チェック）
    setInviteVerified(document.cookie.includes("hadami-invite-verified"));
  }, [searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      // 招待コード未検証 → 招待コード入力ページへ
      if (!inviteVerified) {
        router.push("/auth/invite");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/check-registration");
      const { allowed } = await res.json();
      if (!allowed) {
        setMessage("現在ベータ版の新規登録を停止しています。");
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(error.message);
      } else if (signUpData.user && signUpData.user.identities?.length === 0) {
        setMessage("このメールアドレスは既に登録されています。ログインしてください。");
      } else {
        setMessage("確認メールを送信しました。メールのリンクをクリックしてください。");
      }
    } else {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message?.includes("Email not confirmed")) {
          setMessage("メールアドレスが未確認です。確認メールのリンクをクリックしてください。");
        } else if (error.message?.includes("Invalid login credentials")) {
          setMessage("メールアドレスまたはパスワードが正しくありません。");
        } else if (error.status === 429 || error.message?.includes("rate")) {
          setMessage("ログイン試行回数が上限に達しました。しばらく待ってからもう一度お試しください。");
        } else {
          setMessage("ログインに失敗しました。しばらく待ってからもう一度お試しください。");
        }
      } else if (authData.user) {
        router.push("/");
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    // 新規登録モードで招待コード未検証 → 招待コード入力へ
    if (isSignUp && !inviteVerified) {
      router.push("/auth/invite");
      return;
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bo-cream">
      {registrationClosed && (
        <div className="w-full max-w-[360px] bg-bo-danger-bg border border-bo-danger rounded-r1 py-3 px-4 mb-4 text-center text-[13px] text-bo-danger">
          現在ベータ版の新規登録を停止しています。<br />
          登録受付再開をお待ちください。
        </div>
      )}

{/* 招待コード未検証で新規登録モードに入った場合は強制的にログインモードに戻す */}

      <div className="mb-8 text-center flex flex-col items-center">
        <Image src="/hadami-logo.png" alt="HADAMI" width={64} height={64} className="rounded-2xl mb-2" />
        <h1 className="text-[28px] font-black font-serif text-bo-accent m-0">
          HADAMI
        </h1>
        <p className="text-[13px] text-bo-ink-muted mt-1">
          成分図鑑・スキンケアルーティン
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-r2 py-7 px-6 shadow-bo2">
        <h2 className="text-[18px] font-bold mb-5 text-center text-bo-ink">
          {isSignUp ? "新規登録" : "ログイン"}
        </h2>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 border-[1.5px] border-bo-parchment rounded-r1 bg-white text-[15px] font-semibold cursor-pointer mb-5 hover:bg-bo-cream/50 transition-colors disabled:opacity-70"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Google{isSignUp ? "で登録" : "でログイン"}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-bo-parchment" />
          <span className="text-xs text-bo-ink-muted">または</span>
          <div className="flex-1 h-px bg-bo-parchment" />
        </div>

        <form onSubmit={handleEmailAuth}>
          <div className="mb-3">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-[1.5px] border-bo-parchment rounded-r1 text-[15px] bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border-[1.5px] border-bo-parchment rounded-r1 text-[15px] bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors"
            />
          </div>

          {message && (
            <p className={`text-[13px] mb-3 text-center ${message.includes("送信") ? "text-bo-accent" : "text-bo-caution"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-bo-accent text-white border-none rounded-r1 text-[15px] font-bold cursor-pointer shadow-bo-accent disabled:opacity-70 hover:bg-bo-accent-dark transition-colors"
          >
            {loading ? "処理中..." : isSignUp ? "登録する" : "ログイン"}
          </button>
        </form>

        <p className="text-center mt-4 text-[13px] text-bo-ink-muted">
          {isSignUp ? (
            <>
              すでにアカウントをお持ちの方は
              <button
                onClick={() => { setIsSignUp(false); setMessage(""); }}
                className="bg-transparent border-none text-bo-accent font-bold cursor-pointer text-[13px] ml-1"
              >
                ログイン
              </button>
            </>
          ) : inviteVerified ? (
            <>
              アカウントをお持ちでない方は
              <button
                onClick={() => { setIsSignUp(true); setMessage(""); }}
                className="bg-transparent border-none text-bo-accent font-bold cursor-pointer text-[13px] ml-1"
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              新規登録には
              <Link href="/auth/invite" className="text-bo-accent font-bold ml-1 no-underline">
                招待コード
              </Link>
              が必要です
            </>
          )}
        </p>
      </div>

      <p className="text-center mt-4 text-[11px] text-bo-ink-faint max-w-[360px] leading-relaxed">
        登録することで、<Link href="/privacy" className="text-bo-accent font-semibold">プライバシーポリシー</Link>と<Link href="/terms" className="text-bo-accent font-semibold">利用規約</Link>に同意したものとみなします。
      </p>
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
