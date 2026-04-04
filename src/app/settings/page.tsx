"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/auth";
import PageLoading from "@/components/ui/PageLoading";
import AuthGuard from "@/components/ui/AuthGuard";
import { clearCachedUserData } from "@/lib/userData";

export default function SettingsPage() {
  const { user, profile, supabase, loading, refreshProfile } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState("");

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
      // Step 1: Edge Functionでauthユーザーを先に削除
      // 失敗時はまだ何も消えていないので安全にリトライ可能
      const { error: fnError } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });

      if (fnError) {
        throw new Error("アカウント削除に失敗しました");
      }

      // Step 2: auth削除成功後、データをベストエフォートで削除
      // 失敗してもorphaned dataはRLSで他ユーザーから見えない
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
        // ベストエフォート: authユーザーは既に削除済みなので続行
      }

      // Step 3: ローカルデータをクリア
      clearLocalData();

      // Step 4: ログアウトしてトップへ
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
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)" }}>
      <div className="px-5 pt-8 pb-6">
        <h1 className="font-bold text-lg mb-6" style={{ color: "#2D2D2D" }}>
          設定
        </h1>

        {/* プロフィール情報 */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#2D2D2D" }}>アカウント情報</h2>
          <div className="mb-2">
            <span className="text-xs" style={{ color: "var(--sub)" }}>ニックネーム</span>
            {editingNickname ? (
              <div className="mt-1">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="w-full text-sm font-medium px-3 py-2 rounded-xl outline-none"
                  style={{ border: "1.5px solid var(--primary)", color: "#2D2D2D" }}
                  autoFocus
                />
                {nicknameError && (
                  <p className="text-xs mt-1" style={{ color: "var(--warning)" }}>{nicknameError}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleNicknameSave}
                    disabled={nicknameSaving}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "var(--primary)", opacity: nicknameSaving ? 0.7 : 1 }}
                  >
                    {nicknameSaving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => { setEditingNickname(false); setNicknameError(""); }}
                    className="px-4 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: "#F2F2F2", color: "var(--sub)" }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
                  {profile?.display_name || "未設定"}
                </p>
                <button
                  onClick={() => { setNickname(profile?.display_name || ""); setEditingNickname(true); }}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                >
                  編集
                </button>
              </div>
            )}
          </div>
          <div>
            <span className="text-xs" style={{ color: "var(--sub)" }}>メール</span>
            <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* ログアウト */}
        <button
          onClick={async () => { clearLocalData(); await supabase.auth.signOut(); window.location.href = "/"; }}
          className="w-full bg-white rounded-2xl p-4 mb-4 shadow-sm text-left"
          style={{ border: "1px solid #F5E6EF", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}
        >
          ログアウト
        </button>

        {/* 法的情報 */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#2D2D2D" }}>法的情報</h2>
          <Link
            href="/privacy"
            className="block text-sm font-medium py-2"
            style={{ color: "#5BBFAD" }}
          >
            プライバシーポリシー →
          </Link>
          <div style={{ height: "1px", background: "#F5E6EF" }} />
          <Link
            href="/terms"
            className="block text-sm font-medium py-2"
            style={{ color: "#5BBFAD" }}
          >
            利用規約 →
          </Link>
        </div>

        {/* アカウント削除 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: "#E57373" }}>アカウント削除</h2>
          <p className="text-xs mb-3" style={{ color: "var(--sub)" }}>
            アカウントを削除すると、保存した製品・図鑑データ・写真がすべて完全に削除されます。この操作は取り消せません。削除後に同じGoogleアカウントでログインすると、データが空の新しいアカウントが作成されます。
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "1px solid #E57373",
                borderRadius: "10px",
                color: "#E57373",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              アカウントを削除する
            </button>
          ) : (
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "#E57373" }}>
                本当に削除しますか？この操作は取り消せません。
              </p>
              {error && (
                <p className="text-xs mb-2" style={{ color: "#E57373" }}>{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    padding: "10px 20px",
                    background: "#E57373",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? "削除中..." : "完全に削除する"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--sub)",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
