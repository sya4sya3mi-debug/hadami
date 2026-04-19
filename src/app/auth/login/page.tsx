"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";

function LoginPageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const inviteToken = searchParams.get("invite_token");
  const hasInviteAccess =
    searchParams.get("invite") === "1" || Boolean(inviteToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(hasInviteAccess);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [registrationClosed] = useState(
    searchParams.get("error") === "registration_limit_reached"
  );
  const [inviteVerified] = useState(hasInviteAccess);

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
