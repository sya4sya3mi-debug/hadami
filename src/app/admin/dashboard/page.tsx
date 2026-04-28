"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/auth";
import { isAdminClient } from "@/lib/adminConfig";

interface Stats {
  totalUsers: number;
  scansThisMonth: number;
  activeUsersThisMonth: number;
  totalScans: number;
  totalProducts: number;
  totalDiscoveries: number;
  activeInviteCodes: number;
  totalInviteUses: number;
  currentMonth: string;
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
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

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
    if (user && isAdminClient(user.id)) fetchStats();
  }, [user, fetchStats]);

  if (!user) return null;

  const monthLabel = stats
    ? `${stats.currentMonth.replace("-", "年")}月`
    : "";

  return (
    <>
      <h1 className="text-xl font-extrabold font-serif text-bo-ink mb-6">
        ダッシュボード
      </h1>

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
              <StatCard label="総ユーザー数" value={stats.totalUsers} accent />
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
              <StatCard label="累計スキャン数" value={stats.totalScans} />
            </div>
          </div>

          {/* コンテンツ */}
          <div className="mb-2 mt-4">
            <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
              コンテンツ
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="登録商品数" value={stats.totalProducts} />
              <StatCard label="成分発見数" value={stats.totalDiscoveries} />
            </div>
          </div>

          {/* 招待 */}
          <div className="mb-2 mt-4">
            <h2 className="text-xs font-bold text-bo-ink-muted font-sans uppercase tracking-wider mb-2">
              招待コード
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="有効コード数" value={stats.activeInviteCodes} />
              <StatCard label="累計招待使用数" value={stats.totalInviteUses} />
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
    </>
  );
}
