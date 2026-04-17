"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

interface UnknownItem {
  name: string;
  count: number;
  dismissed: boolean;
  dismissedAt: string | null;
}

const ADMIN_IDS = ["751ac531-dcdb-4e77-a3ea-67a01677c432"];

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/users", label: "ユーザー管理", icon: "👥" },
  { href: "/admin/invites", label: "招待コード", icon: "🔑" },
  { href: "/admin/unknown-ingredients", label: "未識別成分", icon: "🔬" },
];

function AdminNav({ current }: { current: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold font-sans border-none cursor-pointer transition-colors ${
            current === item.href
              ? "bg-bo-accent text-white shadow-bo-accent"
              : "bg-white text-bo-ink-muted hover:bg-bo-parchment shadow-bo1"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminUnknownIngredientsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<UnknownItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);
  const [processingName, setProcessingName] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isAdmin = user && ADMIN_IDS.includes(user.id);

  const fetchItems = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/unknown-ingredients");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError("データの取得に失敗しました。");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (isAdmin) fetchItems();
  }, [loading, isAdmin, router, fetchItems]);

  const handleDismiss = async (name: string, currentlyDismissed: boolean) => {
    setProcessingName(name);
    setError("");
    try {
      const res = await fetch("/api/admin/unknown-ingredients", {
        method: currentlyDismissed ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("更新失敗");
      setItems((prev) =>
        prev.map((item) =>
          item.name === name
            ? {
                ...item,
                dismissed: !currentlyDismissed,
                dismissedAt: currentlyDismissed ? null : new Date().toISOString(),
              }
            : item
        )
      );
    } catch {
      setError("操作に失敗しました。");
    } finally {
      setProcessingName(null);
    }
  };

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading || !isAdmin) return null;

  const visible = items.filter((i) => showDismissed || !i.dismissed);
  const activeCount = items.filter((i) => !i.dismissed).length;
  const dismissedCount = items.filter((i) => i.dismissed).length;
  const totalOccurrences = items
    .filter((i) => !i.dismissed)
    .reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="min-h-screen bg-bo-cream">
      <div className="max-w-[600px] mx-auto px-5 pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-[11px] text-bo-ink-muted mb-1 bg-transparent border-none cursor-pointer p-0 font-sans"
            >
              ← 戻る
            </button>
            <h1 className="text-xl font-extrabold font-serif text-bo-ink m-0">
              未識別成分
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center text-lg">
            🔬
          </div>
        </div>

        <AdminNav current="/admin/unknown-ingredients" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-accent">{activeCount}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">要確認</div>
          </div>
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-ink">{totalOccurrences}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">総出現回数</div>
          </div>
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-ink-muted">{dismissedCount}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">無視済み</div>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-[#FFF8EC] border border-[#F0DBA8] rounded-r2 p-3.5 mb-5 text-[12px] text-bo-ink-muted font-sans leading-relaxed">
          <span className="font-bold text-bo-ink">使い方: </span>
          出現回数が多い成分から優先的に成分マスタへの追加を検討してください。誤認識・ノイズは「無視」で非表示にできます。成分名をコピーしてコードに追加してください。
        </div>

        {error && (
          <div className="bg-bo-danger-bg border border-bo-danger rounded-r1 py-2.5 px-4 mb-4 text-center text-[13px] text-bo-danger">
            {error}
          </div>
        )}

        {/* フィルター */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold font-sans text-bo-ink">
            成分一覧 ({visible.length})
          </h2>
          <button
            onClick={() => setShowDismissed((v) => !v)}
            className="text-[11px] text-bo-ink-muted font-sans bg-transparent border-none cursor-pointer underline"
          >
            {showDismissed ? "無視済みを隠す" : "無視済みも表示"}
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-12 text-bo-ink-muted text-sm font-sans">
            読み込み中...
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-bo-ink-muted text-sm font-sans">
            {items.length === 0
              ? "未識別成分はありません"
              : "表示できる成分がありません（すべて無視済み）"}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((item) => (
              <div
                key={item.name}
                className={`bg-white rounded-r2 px-4 py-3 shadow-bo1 flex items-center gap-3 transition-opacity ${
                  item.dismissed ? "opacity-50 border-l-[3px] border-l-bo-ink-faint" : "border-l-[3px] border-l-bo-accent"
                }`}
              >
                {/* 出現回数バッジ */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black font-serif ${
                    item.count >= 5
                      ? "bg-[#FFF3DC] text-bo-accent"
                      : "bg-bo-cream text-bo-ink-muted"
                  }`}
                >
                  {item.count}
                </div>

                {/* 成分名 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold font-sans truncate ${
                        item.dismissed ? "line-through text-bo-ink-muted" : "text-bo-ink"
                      }`}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => handleCopy(item.name)}
                      className="shrink-0 bg-transparent border-none cursor-pointer p-0.5 text-bo-ink-faint hover:text-bo-accent transition-colors"
                      title="コピー"
                    >
                      {copied === item.name ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3A8F7A" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">
                    {item.count}件の商品で検出
                    {item.dismissed && item.dismissedAt && (
                      <span className="ml-2">
                        · 無視: {new Date(item.dismissedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* 無視ボタン */}
                <button
                  onClick={() => handleDismiss(item.name, item.dismissed)}
                  disabled={processingName === item.name}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors font-sans disabled:opacity-50 ${
                    item.dismissed
                      ? "bg-bo-accent-soft text-bo-accent hover:bg-emerald-100"
                      : "bg-bo-cream text-bo-ink-muted hover:bg-bo-parchment"
                  }`}
                >
                  {processingName === item.name
                    ? "..."
                    : item.dismissed
                    ? "元に戻す"
                    : "無視"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
