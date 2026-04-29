"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/auth";
import { isAdminClient } from "@/lib/adminConfig";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  isBanned: boolean;
  products: number;
  scansThisMonth: number;
  discoveries: number;
  monthlyScanLimit: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso)
    .toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })
    .replace("/", ".");
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid var(--hd-line)",
  background: "var(--hd-bg)",
  color: "var(--hd-ink)",
  fontFamily: "var(--hd-sans)",
  fontSize: 13,
  outline: "none",
  borderRadius: 0,
};

const stepBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  background: "transparent",
  border: "1px solid var(--hd-line)",
  color: "var(--hd-ink)",
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1,
  fontFamily: "var(--hd-sans)",
};

export default function AdminUsersPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [banningId, setBanningId] = useState<string | null>(null);
  const [limitDrafts, setLimitDrafts] = useState<Record<string, number>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      const loadedUsers = (data.users ?? []) as AdminUser[];
      setUsers(loadedUsers);
      setLimitDrafts(
        Object.fromEntries(loadedUsers.map((u) => [u.id, u.monthlyScanLimit]))
      );
    } catch {
      setError("データの取得に失敗しました。");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdminClient(user.id)) fetchUsers();
  }, [user, fetchUsers]);

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
        prev.map((u) => (u.id === targetUser.id ? { ...u, isBanned: !u.isBanned } : u))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setBanningId(null);
    }
  };

  const adjustLimitDraft = (targetUserId: string, delta: number) => {
    setLimitDrafts((prev) => {
      const base = prev[targetUserId] ?? 30;
      const next = Math.min(9999, Math.max(1, base + delta));
      return { ...prev, [targetUserId]: next };
    });
  };

  const handleSaveLimit = async (targetUser: AdminUser) => {
    const nextLimit = limitDrafts[targetUser.id] ?? targetUser.monthlyScanLimit;
    if (nextLimit === targetUser.monthlyScanLimit) return;
    setSavingLimitId(targetUser.id);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUser.id, monthlyScanLimit: nextLimit }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "上限の更新に失敗しました");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, monthlyScanLimit: nextLimit } : u))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "上限の更新に失敗しました。");
      setLimitDrafts((prev) => ({ ...prev, [targetUser.id]: targetUser.monthlyScanLimit }));
    } finally {
      setSavingLimitId(null);
    }
  };

  if (!user) return null;

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));
  const activeCount = users.filter((u) => !u.isBanned).length;
  const bannedCount = users.filter((u) => u.isBanned).length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="hd-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          ユーザー管理
        </h1>
        <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
          USERS
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {[
          { caps: "TOTAL", value: users.length, jp: "総ユーザー" },
          { caps: "ACTIVE", value: activeCount, jp: "アクティブ" },
          { caps: "BANNED", value: bannedCount, jp: "BAN" },
        ].map((s) => (
          <div
            key={s.caps}
            style={{
              border: "1px solid var(--hd-line)",
              padding: "14px 10px",
              textAlign: "center",
              background: "var(--hd-bg)",
            }}
          >
            <div className="hd-serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>
              {s.value}
            </div>
            <div className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)", marginBottom: 2 }}>
              {s.caps}
            </div>
            <div style={{ fontSize: 10, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>{s.jp}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="メールアドレスで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
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
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          {search ? "該当するユーザーがいません" : "ユーザーがいません"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((u) => (
            <div
              key={u.id}
              style={{
                border: "1px solid var(--hd-line)",
                borderLeft: `2px solid ${u.isBanned ? "var(--hd-terra)" : "var(--hd-ink)"}`,
                padding: 14,
                background: "var(--hd-bg)",
                opacity: u.isBanned ? 0.65 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span
                      className="hd-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--hd-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.email}
                    </span>
                    {u.isBanned && (
                      <span
                        className="hd-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          color: "var(--hd-terra)",
                          border: "1px solid var(--hd-terra)",
                          padding: "2px 6px",
                        }}
                      >
                        BANNED
                      </span>
                    )}
                  </div>
                  <div
                    className="hd-mono"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      color: "var(--hd-ink-60)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>JOINED {formatDate(u.createdAt)}</span>
                    <span>·</span>
                    <span>SEEN {formatDate(u.lastSignIn)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBanToggle(u)}
                  disabled={banningId === u.id}
                  className="hd-mono"
                  style={{
                    flexShrink: 0,
                    padding: "6px 10px",
                    background: "transparent",
                    color: u.isBanned ? "var(--hd-ink)" : "var(--hd-terra)",
                    border: `1px solid ${u.isBanned ? "var(--hd-ink)" : "var(--hd-terra)"}`,
                    cursor: "pointer",
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    opacity: banningId === u.id ? 0.5 : 1,
                  }}
                >
                  {banningId === u.id ? "..." : u.isBanned ? "UNBAN" : "BAN"}
                </button>
              </div>

              {/* Stats */}
              <div
                className="hd-mono"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "var(--hd-ink-60)",
                  marginTop: 6,
                }}
              >
                <span>PRODUCTS {u.products}</span>
                <span>·</span>
                <span>SCANS {u.scansThisMonth}</span>
                <span>·</span>
                <span>INGREDIENTS {u.discoveries}</span>
              </div>

              {/* Monthly limit */}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--hd-line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  className="hd-mono"
                  style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}
                >
                  MONTHLY LIMIT
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => adjustLimitDraft(u.id, -1)}
                    style={stepBtnStyle}
                    aria-label="上限を減らす"
                    disabled={savingLimitId === u.id}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={limitDrafts[u.id] ?? u.monthlyScanLimit}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      setLimitDrafts((prev) => ({
                        ...prev,
                        [u.id]: Number.isFinite(value) && value > 0 ? Math.min(9999, value) : 1,
                      }));
                    }}
                    className="hd-mono"
                    style={{
                      width: 56,
                      textAlign: "center",
                      fontSize: 12,
                      border: "1px solid var(--hd-line)",
                      padding: "4px 0",
                      background: "var(--hd-bg)",
                      color: "var(--hd-ink)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => adjustLimitDraft(u.id, 1)}
                    style={stepBtnStyle}
                    aria-label="上限を増やす"
                    disabled={savingLimitId === u.id}
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleSaveLimit(u)}
                    disabled={
                      savingLimitId === u.id ||
                      (limitDrafts[u.id] ?? u.monthlyScanLimit) === u.monthlyScanLimit
                    }
                    className="hd-mono"
                    style={{
                      padding: "5px 10px",
                      background: "var(--hd-ink)",
                      color: "var(--hd-bg)",
                      border: "1px solid var(--hd-ink)",
                      cursor: "pointer",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      opacity:
                        savingLimitId === u.id ||
                        (limitDrafts[u.id] ?? u.monthlyScanLimit) === u.monthlyScanLimit
                          ? 0.4
                          : 1,
                    }}
                  >
                    {savingLimitId === u.id ? "..." : "SAVE"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
