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
  caps,
  value,
  sub,
}: {
  label: string;
  caps: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--hd-line)",
        padding: "16px 14px",
        background: "var(--hd-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div className="hd-serif" style={{ fontSize: 26, lineHeight: 1.05 }}>
        {value}
      </div>
      <div
        className="hd-mono"
        style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)", marginTop: 4 }}
      >
        {caps}
      </div>
      <div style={{ fontSize: 11, color: "var(--hd-ink)", fontFamily: "var(--hd-sans)" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ jp, caps }: { jp: string; caps: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, marginTop: 24 }}>
      <h2 className="hd-serif" style={{ fontSize: 14 }}>{jp}</h2>
      <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
        {caps}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--hd-line)" }} />
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

  const monthLabel = stats ? `${stats.currentMonth.replace("-", "年")}月` : "";

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="hd-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          ダッシュボード
        </h1>
        <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
          DASHBOARD
        </span>
      </div>

      {error && (
        <div
          style={{
            border: "1px solid var(--hd-terra)",
            padding: "10px 14px",
            marginBottom: 16,
            textAlign: "center",
            fontSize: 12,
            color: "var(--hd-terra)",
            fontFamily: "var(--hd-sans)",
          }}
        >
          {error}
        </div>
      )}

      {fetching ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          読み込み中...
        </div>
      ) : stats ? (
        <>
          <SectionHeader jp="ユーザー" caps="USERS" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatCard caps="TOTAL" label="総ユーザー数" value={stats.totalUsers} />
            <StatCard caps="ACTIVE" label="今月アクティブ" value={stats.activeUsersThisMonth} sub={`${monthLabel} スキャン`} />
          </div>

          <SectionHeader jp="スキャン" caps="SCANS" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatCard caps="THIS MONTH" label="今月のスキャン数" value={stats.scansThisMonth} sub={monthLabel} />
            <StatCard caps="LIFETIME" label="累計スキャン数" value={stats.totalScans} />
          </div>

          <SectionHeader jp="コンテンツ" caps="CONTENT" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatCard caps="PRODUCTS" label="登録商品数" value={stats.totalProducts} />
            <StatCard caps="INGREDIENTS" label="成分発見数" value={stats.totalDiscoveries} />
          </div>

          <SectionHeader jp="招待コード" caps="INVITES" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatCard caps="ACTIVE" label="有効コード数" value={stats.activeInviteCodes} />
            <StatCard caps="USED" label="累計招待使用数" value={stats.totalInviteUses} />
          </div>

          <div
            className="hd-mono"
            style={{
              marginTop: 24,
              textAlign: "center",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--hd-ink-40)",
            }}
          >
            UPDATED {new Date().toLocaleTimeString("ja-JP")}
            <button
              onClick={fetchStats}
              className="hd-mono"
              style={{
                marginLeft: 12,
                padding: "4px 10px",
                background: "transparent",
                border: "1px solid var(--hd-line)",
                color: "var(--hd-ink-60)",
                cursor: "pointer",
                fontSize: 9,
                letterSpacing: "0.2em",
              }}
            >
              REFRESH
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
