"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  isBanned: boolean;
  products: number;
  scansThisMonth: number;
  discoveries: number;
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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsersPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [banningId, setBanningId] = useState<string | null>(null);

  const isAdmin = user && ADMIN_IDS.includes(user.id);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setUsers(data.users ?? []);
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
    if (isAdmin) fetchUsers();
  }, [loading, isAdmin, router, fetchUsers]);

  const handleBanToggle = async (targetUser: AdminUser) => {
    const action = targetUser.isBanned ? "BAN解除" : "BAN";
    if (!confirm(`${targetUser.email} を${action}しますか？`)) return;

    setBanningId(targetUser.id);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUser.id, ban: !targetUser.isBanned }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "更新失敗");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isBanned: !u.isBanned } : u
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setBanningId(null);
    }
  };

  if (loading || !isAdmin) return null;

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => !u.isBanned).length;
  const bannedCount = users.filter((u) => u.isBanned).length;

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
              ユーザー管理
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center text-lg">
            👥
          </div>
        </div>

        <AdminNav current="/admin/users" />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-accent">{users.length}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">総ユーザー</div>
          </div>
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-ink">{activeCount}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">アクティブ</div>
          </div>
          <div className="bg-white rounded-r2 py-3 px-3 text-center shadow-bo1">
            <div className="text-lg font-black font-serif text-bo-danger">{bannedCount}</div>
            <div className="text-[10px] text-bo-ink-muted font-sans mt-0.5">BAN</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="メールアドレスで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors font-sans"
          />
        </div>

        {error && (
          <div className="bg-bo-danger-bg border border-bo-danger rounded-r1 py-2.5 px-4 mb-4 text-center text-[13px] text-bo-danger">
            {error}
          </div>
        )}

        {/* User list */}
        {fetching ? (
          <div className="text-center py-12 text-bo-ink-muted text-sm font-sans">
            読み込み中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-bo-ink-muted text-sm font-sans">
            {search ? "該当するユーザーがいません" : "ユーザーがいません"}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                className={`bg-white rounded-r2 p-4 shadow-bo1 border-l-[3px] transition-opacity ${
                  u.isBanned
                    ? "border-l-bo-danger opacity-70"
                    : "border-l-bo-accent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold font-sans text-bo-ink truncate">
                        {u.email}
                      </span>
                      {u.isBanned && (
                        <span className="text-[10px] bg-bo-danger-bg text-bo-danger px-1.5 py-0.5 rounded font-bold font-sans shrink-0">
                          BAN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-bo-ink-muted font-sans flex-wrap">
                      <span>登録: {formatDate(u.createdAt)}</span>
                      <span>•</span>
                      <span>最終ログイン: {formatDate(u.lastSignIn)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBanToggle(u)}
                    disabled={banningId === u.id}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors font-sans disabled:opacity-50 ${
                      u.isBanned
                        ? "bg-bo-accent-soft text-bo-accent hover:bg-emerald-100"
                        : "bg-bo-danger-bg text-bo-danger hover:bg-red-100"
                    }`}
                  >
                    {banningId === u.id
                      ? "処理中..."
                      : u.isBanned
                      ? "BAN解除"
                      : "BAN"}
                  </button>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-3 text-[10px] text-bo-ink-muted font-sans mt-1">
                  <span>商品 {u.products}</span>
                  <span>•</span>
                  <span>今月スキャン {u.scansThisMonth}</span>
                  <span>•</span>
                  <span>成分 {u.discoveries}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
