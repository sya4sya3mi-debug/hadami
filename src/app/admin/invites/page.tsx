"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/auth";
import { isAdminClient } from "@/lib/adminConfig";

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

export default function AdminInvitesPage() {
  const { user } = useUser();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    if (user && isAdminClient(user.id)) fetchCodes();
  }, [user, fetchCodes]);

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

  if (!user) return null;

  const activeCodes = codes.filter((c) => c.is_active);
  const inactiveCodes = codes.filter((c) => !c.is_active);
  const totalUsed = codes.reduce((sum, c) => sum + c.used_count, 0);

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

  return (
    <div className="hd-root" style={{ background: "var(--hd-bg)", color: "var(--hd-ink)", padding: "8px 0 32px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="hd-serif" style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em" }}>
          招待コード管理
        </h1>
        <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
          INVITES
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 28 }}>
        {[
          { label: "ACTIVE", value: activeCodes.length, jp: "有効コード" },
          { label: "USED", value: totalUsed, jp: "総使用回数" },
          { label: "INACTIVE", value: inactiveCodes.length, jp: "無効コード" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid var(--hd-line)",
              padding: "14px 10px",
              textAlign: "center",
              background: "var(--hd-bg)",
            }}
          >
            <div className="hd-serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)", marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 10, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>{s.jp}</div>
          </div>
        ))}
      </div>

      {/* Create new code */}
      <div style={{ border: "1px solid var(--hd-line)", padding: 20, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <h2 className="hd-serif" style={{ fontSize: 15 }}>新規コード発行</h2>
          <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
            CREATE
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="ラベル（例: みおさん用）"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label
                className="hd-mono"
                style={{ display: "block", fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)", marginBottom: 6 }}
              >
                MAX USES
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                style={inputStyle}
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
              style={{
                padding: "12px 22px",
                background: "var(--hd-ink)",
                color: "var(--hd-bg)",
                border: "1px solid var(--hd-ink)",
                cursor: creating ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: creating ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              <span className="hd-serif" style={{ fontSize: 13 }}>
                {creating ? "発行中" : "発行する"}
              </span>
              <span
                className="hd-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-bg)", opacity: 0.7 }}
              >
                →
              </span>
            </button>
          </div>
        </div>
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

      {/* Code list */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <h2 className="hd-serif" style={{ fontSize: 15 }}>発行済みコード</h2>
          <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
            {String(codes.length).padStart(2, "0")} ITEMS
          </span>
        </div>

        {fetching ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--hd-ink-60)", fontSize: 12, fontFamily: "var(--hd-sans)" }}>
            読み込み中...
          </div>
        ) : codes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--hd-ink-60)", fontSize: 12, fontFamily: "var(--hd-sans)" }}>
            まだコードがありません
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {codes.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid var(--hd-line)",
                  borderLeft: `2px solid ${c.is_active ? "var(--hd-ink)" : "var(--hd-line)"}`,
                  padding: 14,
                  background: "var(--hd-bg)",
                  opacity: c.is_active ? 1 : 0.55,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <code
                        className="hd-mono"
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--hd-ink)", letterSpacing: "0.05em" }}
                      >
                        {c.code}
                      </code>
                      <button
                        onClick={() => handleCopy(c.code)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                          color: "var(--hd-ink-60)",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                        title="コピー"
                      >
                        {copied === c.code ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="1" ry="1" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {c.label && (
                      <div style={{ fontSize: 11, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
                        {c.label}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(c.id, c.is_active)}
                    className="hd-mono"
                    style={{
                      flexShrink: 0,
                      padding: "6px 10px",
                      background: "transparent",
                      color: "var(--hd-ink)",
                      border: "1px solid var(--hd-ink)",
                      cursor: "pointer",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                    }}
                  >
                    {c.is_active ? "DISABLE" : "ENABLE"}
                  </button>
                </div>
                <div
                  className="hd-mono"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    color: "var(--hd-ink-60)",
                  }}
                >
                  <span style={{ color: c.max_uses > 0 && c.used_count >= c.max_uses ? "var(--hd-terra)" : "var(--hd-ink-60)" }}>
                    {c.used_count}/{c.max_uses > 0 ? c.max_uses : "∞"} USED
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(c.created_at).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }).replace("/", ".")}
                  </span>
                  <span>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: c.is_active ? "var(--hd-ink)" : "var(--hd-ink-40)" }}>
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: c.is_active ? "var(--hd-ink)" : "var(--hd-ink-40)",
                      }}
                    />
                    {c.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
