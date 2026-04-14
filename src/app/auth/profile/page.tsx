"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { BETA_USER_LIMIT } from "@/lib/limits";

export default function ProfileSetupPage() {
  const { user, supabase } = useUser();
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

    const { data, error: dbError } = await supabase.rpc("upsert_profile_with_limit", {
      p_display_name: nickname.trim(),
      p_limit: BETA_USER_LIMIT,
    });

    if (dbError) {
      console.error("profile save error:", dbError);
      setError(`保存に失敗しました: ${dbError.message}`);
      setLoading(false);
      return;
    }

    const result = data as { allowed?: boolean } | null;
    if (!result?.allowed) {
      setError("現在ベータ版の新規登録を停止しています。");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bo-cream">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">H</div>
        <h1 className="text-[28px] font-black font-serif text-bo-accent m-0">
          HADAMI
        </h1>
        <p className="text-[13px] text-bo-ink-muted mt-1">
          ようこそ。あなたのことを教えてください
        </p>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-r2 py-7 px-6 shadow-bo2">
        <h2 className="text-[18px] font-bold mb-5 text-center text-bo-ink">
          プロフィール設定
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="text-[13px] font-semibold text-bo-ink mb-1.5 block">
              ニックネーム
            </label>
            <input
              type="text"
              placeholder="みお"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full p-3 border-[1.5px] border-bo-parchment rounded-r1 text-[15px] bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors"
            />
          </div>

          <p className="text-[11px] text-bo-ink-muted mb-4">
            20文字以内で入力してください。あとから変更できます。
          </p>

          {error && (
            <p className="text-[13px] text-bo-caution mb-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-bo-accent text-white border-none rounded-r1 text-[15px] font-bold cursor-pointer shadow-bo-accent disabled:opacity-70 hover:bg-bo-accent-dark transition-colors"
          >
            {loading ? "保存中..." : "はじめる"}
          </button>
        </form>
      </div>
    </div>
  );
}
