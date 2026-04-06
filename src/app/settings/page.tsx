"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import { clearCachedUserData } from "@/lib/userData";


export default function SettingsPage() {
  const { user, profile, supabase, loading, refreshProfile } = useUser();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [xLinked, setXLinked] = useState<boolean | null>(null);
  const [xScreenName, setXScreenName] = useState<string | null>(null);
  const [xUnlinking, setXUnlinking] = useState(false);
  const [xLinkError, setXLinkError] = useState("");

  useEffect(() => {
    fetch("/api/x-auth/status")
      .then((r) => r.json())
      .then((d) => {
        setXLinked(d.linked);
        setXScreenName(d.screenName);
      })
      .catch(() => setXLinked(false));
  }, []);

  const handleXLink = async () => {
    setXLinkError("");
    try {
      const res = await fetch("/api/x-auth/request-token");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setXLinkError(data.error || "X連携に失敗しました");
      }
    } catch {
      setXLinkError("通信エラーが発生しました");
    }
  };

  const handleXUnlink = async () => {
    if (!user) return;
    setXUnlinking(true);
    await supabase.from("x_auth_tokens").delete().eq("user_id", user.id);
    setXLinked(false);
    setXScreenName(null);
    setXUnlinking(false);
  };

  const handleNicknameSave = async () => {
    if (!user) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError("ニックネームを入力してください");
      return;
    }
    if (trimmed.length > 20) {
      setNicknameError("20文字以内で入力してください");
      return;
    }
    setNicknameSaving(true);
    setNicknameError("");

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id);

    if (dbError) {
      setNicknameError("保存に失敗しました");
      setNicknameSaving(false);
      return;
    }

    await refreshProfile();
    setEditingNickname(false);
    setNicknameSaving(false);
  };

  const clearLocalData = () => {
    clearCachedUserData();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setError("");

    try {
      const { error: fnError } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });

      if (fnError) {
        throw new Error("アカウント削除に失敗しました");
      }

      try {
        await supabase.from("deck_items").delete().eq("user_id", user.id);
        await supabase.from("products").delete().eq("user_id", user.id);
        await supabase.from("zukan_discoveries").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("id", user.id);

        const { data: files } = await supabase.storage
          .from("product-images")
          .list(user.id);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${user.id}/${f.name}`);
          await supabase.storage.from("product-images").remove(paths);
        }
      } catch {
        // best-effort
      }

      clearLocalData();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageLoading message="設定を読み込んでいます..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bo-cream">
        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-[10px] bg-bo-parchment border-none flex items-center justify-center cursor-pointer shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D4F45" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-extrabold font-serif text-bo-ink m-0">設定</h1>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-5 mb-3">
            <h2 className="text-[13px] font-bold text-bo-ink font-sans mb-3.5">アカウント情報</h2>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-bo-accent-soft to-bo-parchment flex items-center justify-center text-2xl shrink-0">
                🌿
              </div>
              <div className="flex-1">
                {editingNickname ? (
                  <div>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={20}
                      autoFocus
                      className="w-full text-sm font-bold font-sans text-bo-ink border-[1.5px] border-bo-accent rounded-[10px] py-2 px-3 outline-none bg-bo-cream"
                    />
                    {nicknameError && (
                      <p className="text-xs text-bo-danger mt-1">{nicknameError}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleNicknameSave}
                        disabled={nicknameSaving}
                        className="px-4 py-1.5 rounded-lg border-none bg-bo-accent text-white text-[11px] font-bold font-sans cursor-pointer disabled:opacity-70"
                      >
                        {nicknameSaving ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={() => { setEditingNickname(false); setNicknameError(""); }}
                        className="px-4 py-1.5 rounded-lg border-none bg-bo-parchment text-bo-ink-muted text-[11px] font-semibold font-sans cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-bold text-bo-ink font-sans">
                        {profile?.display_name || "未設定"}
                      </div>
                      <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">ニックネーム</div>
                    </div>
                    <button
                      onClick={() => { setNickname(profile?.display_name || ""); setEditingNickname(true); }}
                      className="px-3.5 py-1 rounded-full border-none bg-bo-accent-soft text-bo-accent text-[10px] font-bold font-sans cursor-pointer"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="py-3 px-3.5 rounded-[10px] bg-bo-cream">
              <div className="text-[10px] text-bo-ink-muted font-sans mb-0.5">メールアドレス</div>
              <div className="text-[13px] font-semibold text-bo-ink font-sans">{user.email}</div>
            </div>
          </div>

          {/* X Integration */}
          <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-5 mb-3">
            <h2 className="text-[13px] font-bold text-bo-ink font-sans mb-3.5">X（Twitter）連携</h2>

            {xLinked === null ? (
              <p className="text-xs text-bo-ink-muted font-sans">読み込み中...</p>
            ) : xLinked ? (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-bo-safe" />
                    <div>
                      <div className="text-[13px] font-bold text-bo-ink font-sans">連携済み</div>
                      {xScreenName && (
                        <div className="text-[11px] text-bo-ink-muted font-sans">@{xScreenName}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleXUnlink}
                    disabled={xUnlinking}
                    className="px-3.5 py-1 rounded-full border-none bg-[#FFEBEE] text-[#E57373] text-[10px] font-bold font-sans cursor-pointer"
                  >
                    {xUnlinking ? "解除中..." : "連携解除"}
                  </button>
                </div>
                <div className="text-[10px] text-bo-ink-muted font-sans py-2 px-3 bg-bo-cream rounded-lg leading-relaxed">
                  シェア画面から画像付きでXに投稿できます（1日3件まで）
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-bo-ink-muted font-sans leading-relaxed mb-3">
                  Xアカウントを連携すると、成分図鑑やデッキの情報を画像付きでXに投稿できます。
                </p>
                {xLinkError && (
                  <p className="text-xs text-bo-danger font-sans mb-2">{xLinkError}</p>
                )}
                <button
                  onClick={handleXLink}
                  className="w-full py-3 rounded-r1 border-none bg-[#1DA1F2] text-white text-[13px] font-bold font-sans cursor-pointer"
                >
                  Xアカウントを連携する
                </button>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-5 mb-3">
            <h2 className="text-[13px] font-bold text-bo-ink font-sans mb-3.5">利用状況</h2>
            <div className="flex gap-2.5">
              {[
                { label: "スキャン回数", icon: "📸" },
                { label: "保存コスメ", icon: "📦" },
              ].map((s, i) => (
                <div key={i} className="flex-1 py-3.5 px-3 rounded-r1 bg-bo-cream text-center">
                  <div className="text-sm mb-1">{s.icon}</div>
                  <div className="text-sm font-black font-serif text-bo-accent">—</div>
                  <div className="text-[9px] text-bo-ink-muted font-sans mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={async () => { clearLocalData(); await supabase.auth.signOut(); window.location.href = "/"; }}
            className="w-full bg-white rounded-r2 border border-bo-parchment shadow-bo1 py-3.5 px-5 mb-3 flex items-center gap-3 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A8F7A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="text-[13px] font-bold text-bo-accent font-sans">ログアウト</span>
          </button>

          {/* Legal */}
          <div className="bg-white rounded-r2 border border-bo-parchment shadow-bo1 p-5 mb-3">
            <h2 className="text-[13px] font-bold text-bo-ink font-sans mb-3.5">法的情報</h2>
            {["プライバシーポリシー", "利用規約"].map((item, i) => (
              <div key={i}>
                {i > 0 && <div className="h-px bg-bo-parchment -mx-5" />}
                <Link
                  href={i === 0 ? "/privacy" : "/terms"}
                  className="flex items-center justify-between py-3 cursor-pointer no-underline"
                >
                  <span className="text-[13px] font-semibold text-bo-ink font-sans">{item}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5C7BE" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-r2 border border-[rgba(229,115,115,0.2)] shadow-bo1 p-5">
            <h2 className="text-[13px] font-bold text-[#E57373] font-sans mb-3.5">アカウント削除</h2>
            <p className="text-[11px] text-bo-ink-muted font-sans leading-relaxed mb-3.5">
              アカウントを削除すると、保存したコスメ・図鑑データ・写真がすべて完全に削除されます。この操作は取り消せません。
            </p>

            {showConfirm ? (
              <div className="p-4 rounded-r1 bg-[#FFF5F5] animate-fade-up">
                <div className="text-[13px] font-bold text-[#E57373] font-sans mb-3">
                  本当に削除しますか？
                </div>
                {error && (
                  <p className="text-xs text-[#E57373] mb-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-[10px] border-none bg-[#E57373] text-white text-xs font-bold font-sans cursor-pointer disabled:opacity-70"
                  >
                    {deleting ? "削除中..." : "完全に削除する"}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-[10px] border border-bo-parchment bg-white text-bo-ink-muted text-xs font-semibold font-sans cursor-pointer"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="py-2 px-4.5 rounded-[10px] border border-[#E57373] bg-transparent text-[#E57373] text-xs font-semibold font-sans cursor-pointer"
              >
                アカウントを削除する
              </button>
            )}
          </div>

          {/* Version */}
          <div className="text-center mt-5 pb-5">
            <div className="text-[10px] text-bo-ink-faint font-sans">HADAMI v0.1.0 β</div>
            <div className="text-[9px] text-bo-ink-faint font-sans mt-0.5">クローズドβ版 — 15名限定</div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
