"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

interface Stats {
  totalUsers: number;
  scansThisMonth: number;
  activeUsersThisMonth: number;
  totalScans: number;
  totalProducts: number;
  totalDiscoveries: number;
  totalRoutines: number;
  activeInviteCodes: number;
  totalInviteUses: number;
  currentMonth: string;
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

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-r2 py-4 px-4 shadow-bo1 flex flex-col gap-1">
      <div
        className={`text-2xl font-black font-serif ${
          accent ? "text-bo-accent" : "text-bo-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] font-bold text-bo-ink font-sans">{label}</div>
      {sub && <div className="text-[10px] text-bo-ink-muted font-sans">{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user && ADMIN_IDS.includes(user.id);

  const fetchStats = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("取得失敗");
      setStats(await res.json());
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
    if (isAdmin) fetchStats();
  }, [loading, isAdmin, router, fetchStats]);

  if (loading || !isAdmin) return null;

  const monthLabel = stats
    ? `${stats.currentMonth.replace("-", "年")}月`
    : "";

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
              Admin ダッシュボード
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center text-lg">
            📊
          </div>
        </div>

        <AdminNav current="/admin/dashboard" />

        {error && (
          <div className="bg-bo-danger-bg border border-bo-danger rounded-r1 py-2.5 px-4 mb-4 text-center text-[13px] text-bo-danger">
            {error}
          </div>
        )}

        {fetching ? (
          <div className="text-center py-12 text-bo-ink-muted text-sm font-sans">
            読み込み中...
          </div>
        ) : stats ? (
          <>
            {/* ユーザー */}
            <div className="mb-2">
              <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
                ユーザー
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  label="総ユーザー数"
                  value={stats.totalUsers}
                  accent
                />
                <StatCard
                  label="今月アクティブ"
                  value={stats.activeUsersThisMonth}
                  sub={`${monthLabel} スキャンしたユーザー`}
                />
              </div>
            </div>

            {/* スキャン */}
            <div className="mb-2 mt-4">
              <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
                スキャン
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  label="今月のスキャン数"
                  value={stats.scansThisMonth}
                  sub={monthLabel}
                  accent
                />
                <StatCard
                  label="累計スキャン数"
                  value={stats.totalScans}
                />
              </div>
            </div>

            {/* コンテンツ */}
            <div className="mb-2 mt-4">
              <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
                コンテンツ
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                <StatCard label="登録商品数" value={stats.totalProducts} />
                <StatCard label="成分発見数" value={stats.totalDiscoveries} />
                <StatCard label="ルーティン数" value={stats.totalRoutines} />
              </div>
            </div>

            {/* 招待 */}
            <div className="mb-2 mt-4">
              <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
                招待コード
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  label="有効コード数"
                  value={stats.activeInviteCodes}
                />
                <StatCard
                  label="累計招待使用数"
                  value={stats.totalInviteUses}
                />
              </div>
            </div>

            <div className="mt-5 text-center text-[10px] text-bo-ink-faint font-sans">
              最終更新: {new Date().toLocaleTimeString("ja-JP")}
              <button
                onClick={fetchStats}
                className="ml-3 underline text-bo-ink-muted bg-transparent border-none cursor-pointer text-[10px] font-sans"
              >
                更新
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
