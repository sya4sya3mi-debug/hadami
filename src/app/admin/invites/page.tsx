"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/users", label: "ユーザー管理", icon: "👥" },
  { href: "/admin/invites", label: "招待コード", icon: "🔑" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AdminNav({ current, router }: { current: string; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex gap-2 mb-6">
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

interface InviteCode {
  id: string;
  code: string;
  label: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

// Admin user IDs (client-side guard — server-side API also checks)
const ADMIN_IDS = [
  "751ac531-dcdb-4e77-a3ea-67a01677c432", // みお
];

export default function AdminInvitesPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isAdmin = user && ADMIN_IDS.includes(user.id);

  const fetchCodes = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/invites");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setCodes(data.codes ?? []);
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
    if (isAdmin) fetchCodes();
  }, [loading, isAdmin, router, fetchCodes]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined, maxUses }),
      });
      if (!res.ok) throw new Error("作成失敗");
      setLabel("");
      setMaxUses(1);
      await fetchCodes();
    } catch {
      setError("コードの作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("更新失敗");
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
      );
    } catch {
      setError("ステータスの更新に失敗しました。");
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading || !isAdmin) return null;

  const activeCodes = codes.filter((c) => c.is_active);
  const inactiveCodes = codes.filter((c) => !c.is_active);
  const totalUsed = codes.reduce((sum, c) => sum + c.used_count, 0);

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
              招待コード管理
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <AdminNav current="/admin/invites" router={router} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-white rounded-r2 py-3.5 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-accent">{activeCodes.length}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">有効コード</div>
          </div>
          <div className="bg-white rounded-r2 py-3.5 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-ink">{totalUsed}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">総使用回数</div>
          </div>
          <div className="bg-white rounded-r2 py-3.5 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-ink-muted">{inactiveCodes.length}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">無効コード</div>
          </div>
        </div>

        {/* Create new code */}
        <div className="bg-white rounded-r2 p-5 shadow-bo2 mb-6">
          <h2 className="text-sm font-bold font-sans text-bo-ink mb-3 flex items-center gap-2">
            <span className="text-base">✨</span> 新規コード発行
          </h2>
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="ラベル（例: みおさん用）"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors font-sans"
            />
            <div className="flex gap-2.5 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-bo-ink-muted font-sans mb-1 block">
                  使用回数上限
                </label>
                <select
                  value={maxUses}
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent font-sans"
                >
                  <option value={1}>1回（個人用）</option>
                  <option value={3}>3回</option>
                  <option value={5}>5回</option>
                  <option value={10}>10回</option>
                  <option value={50}>50回</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2.5 bg-bo-accent text-white border-none rounded-r1 text-sm font-bold cursor-pointer shadow-bo-accent disabled:opacity-70 hover:bg-bo-accent-dark transition-colors font-sans whitespace-nowrap"
              >
                {creating ? "発行中..." : "発行する"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-bo-danger-bg border border-bo-danger rounded-r1 py-2.5 px-4 mb-4 text-center text-[13px] text-bo-danger">
            {error}
          </div>
        )}

        {/* Code list */}
        <div className="mb-4">
          <h2 className="text-sm font-bold font-sans text-bo-ink mb-3">
            発行済みコード ({codes.length})
          </h2>

          {fetching ? (
            <div className="text-center py-8 text-bo-ink-muted text-sm font-sans">読み込み中...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-bo-ink-muted text-sm font-sans">
              まだコードがありません
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-r2 p-4 shadow-bo1 border-l-[3px] transition-opacity ${
                    c.is_active
                      ? "border-l-bo-accent"
                      : "border-l-bo-ink-faint opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-bold font-mono text-bo-ink tracking-wide">
                          {c.code}
                        </code>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="bg-transparent border-none cursor-pointer p-0.5 text-bo-ink-muted hover:text-bo-accent transition-colors shrink-0"
                          title="コピー"
                        >
                          {copied === c.code ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A8F7A" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {c.label && (
                        <div className="text-[11px] text-bo-ink-muted font-sans">
                          {c.label}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(c.id, c.is_active)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors font-sans ${
                        c.is_active
                          ? "bg-bo-danger-bg text-bo-danger hover:bg-red-100"
                          : "bg-bo-accent-soft text-bo-accent hover:bg-emerald-100"
                      }`}
                    >
                      {c.is_active ? "無効化" : "有効化"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-bo-ink-muted font-sans">
                    <span className={c.max_uses > 0 && c.used_count >= c.max_uses ? "text-bo-caution font-bold" : ""}>
                      使用 {c.used_count}/{c.max_uses > 0 ? c.max_uses : "∞"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(c.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                      })}
                      作成
                    </span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        c.is_active ? "text-bo-accent" : "text-bo-ink-faint"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? "bg-bo-accent" : "bg-bo-ink-faint"}`} />
                      {c.is_active ? "有効" : "無効"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
