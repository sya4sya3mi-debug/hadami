"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";

export default function SettingsPage() {
  const { user, profile, supabase } = useUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setError("");

    try {
      // ユーザーデータを削除（RLSで自分のデータのみ削除可能）
      await supabase.from("deck_items").delete().eq("user_id", user.id);
      await supabase.from("products").delete().eq("user_id", user.id);
      await supabase.from("zukan_discoveries").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      // Storage内の写真を削除
      const { data: files } = await supabase.storage
        .from("product-images")
        .list(user.id);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("product-images").remove(paths);
      }

      // Edge Functionでauthユーザーを削除
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("アカウント削除に失敗しました");
      }

      // ログアウトしてトップへ
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--sub)" }}>
        ログインしてください
      </div>
    );
  }

  return (
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
            <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
              {profile?.display_name || "未設定"}
            </p>
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
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          className="w-full bg-white rounded-2xl p-4 mb-4 shadow-sm text-left"
          style={{ border: "1px solid #F5E6EF", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}
        >
          ログアウト
        </button>

        {/* アカウント削除 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: "1px solid #F5E6EF" }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: "#E57373" }}>アカウント削除</h2>
          <p className="text-xs mb-3" style={{ color: "var(--sub)" }}>
            アカウントを削除すると、保存した製品・図鑑データ・写真がすべて完全に削除されます。この操作は取り消せません。
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
  );
}
