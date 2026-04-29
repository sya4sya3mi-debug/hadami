"use client";

import "@/styles/hadami-tokens.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/auth";

import AuthGuard from "@/components/ui/AuthGuard";
import { clearCachedUserData } from "@/lib/userData";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import {
  getProductCount,
  getAccountScanLimit,
  getLegacyUserMonthlyScanLimit,
  getMonthlyScanCount,
  getUserLimit,
} from "@/lib/db";

const sectionWrap: React.CSSProperties = {
  background: "var(--hd-surface)",
  border: "1px solid var(--hd-hair)",
  padding: "20px 20px 18px",
  marginBottom: 14,
};

function SectionHeader({ no, title }: { no: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        borderBottom: "1px solid var(--hd-ink)",
        paddingBottom: 10,
        marginBottom: 16,
      }}
    >
      <span className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
        {no}
      </span>
      <span className="hd-serif" style={{ fontSize: 17 }}>
        {title}
      </span>
    </div>
  );
}

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-pressed={on}
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      border: "1px solid var(--hd-line)",
      cursor: "pointer",
      position: "relative",
      background: on ? "var(--hd-ink)" : "var(--hd-bg)",
      transition: "background 200ms",
      flexShrink: 0,
    }}
  >
    <span
      style={{
        display: "block",
        width: 18,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--hd-bg)" : "var(--hd-ink)",
        position: "absolute",
        top: 2,
        left: on ? 22 : 2,
        transition: "left 200ms, background 200ms",
      }}
    />
  </button>
);

export default function SettingsPage() {
  const { user, profile, supabase, loading, refreshProfile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [personalize, setPersonalize] = useState(true);
  const [showHistoryConfirm, setShowHistoryConfirm] = useState(false);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [scanLimit, setScanLimit] = useState(getAccountScanLimit());
  const [productCount, setProductCount] = useState<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");
  const [usageReloadTick, setUsageReloadTick] = useState(0);

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("hadami-personalize-enabled");
    if (stored !== null) setPersonalize(stored === "true");
  }, []);

  useEffect(() => {
    const onFocus = () => setUsageReloadTick((n) => n + 1);
    const onVisible = () => {
      if (document.visibilityState === "visible") setUsageReloadTick((n) => n + 1);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handlePersonalizeToggle = () => {
    const next = !personalize;
    setPersonalize(next);
    localStorage.setItem("hadami-personalize-enabled", String(next));
  };

  const handleDeleteScanHistory = async () => {
    if (!user) return;
    setDeletingHistory(true);
    await supabase.from("scan_history").delete().eq("user_id", user.id);
    fetch("/api/refresh-profile", { method: "POST" }).catch(() => {});
    setDeletingHistory(false);
    setShowHistoryConfirm(false);
  };

  useEffect(() => {
    if (!user || pathname !== "/settings") return;
    let cancelled = false;
    const loadScanUsage = async () => {
      const nextProductCount = await getProductCount(supabase, user.id).catch(() => null);
      if (!cancelled) setProductCount(nextProductCount);
      const legacyOverride = await getLegacyUserMonthlyScanLimit(supabase, user.id).catch(() => null);
      try {
        const res = await fetch(`/api/scan-limit?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("scan-limit fetch failed");
        const data = (await res.json()) as { count?: number; limit?: number };
        if (cancelled) return;
        const apiLimit = typeof data.limit === "number" && data.limit > 0 ? data.limit : getAccountScanLimit();
        const resolvedLimit =
          typeof legacyOverride === "number" && legacyOverride > apiLimit ? legacyOverride : apiLimit;
        setScanCount(typeof data.count === "number" ? data.count : 0);
        setScanLimit(resolvedLimit);
      } catch {
        const fallbackCount = await getMonthlyScanCount(supabase, user.id).catch(() => null);
        if (cancelled) return;
        setScanCount(fallbackCount);
        if (typeof legacyOverride === "number" && legacyOverride > 0) setScanLimit(legacyOverride);
      }
    };
    loadScanUsage();
    return () => {
      cancelled = true;
    };
  }, [user, supabase, pathname, usageReloadTick]);

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
      const response = await fetch("/api/delete-account", { method: "DELETE" });
      if (!response.ok) throw new Error("アカウント削除に失敗しました");
      clearLocalData();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
      setDeleting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <AuthGuard>
      <div className="hd-root hd-softa" data-density="compact">
        <div
          className="hd hd-page"
          style={{ minHeight: "100vh", background: "var(--hd-bg)", color: "var(--hd-ink)" }}
        >
          {/* Sticky header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: "var(--hd-bg)",
              borderBottom: "1px solid var(--hd-hair)",
            }}
          >
            <button
              onClick={() => router.back()}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--hd-ink-60)",
                cursor: "pointer",
                fontFamily: "var(--hd-mono)",
                fontSize: 10,
                letterSpacing: "0.2em",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              BACK
            </button>
            <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
              Settings · 設定
            </div>
            <span style={{ width: 36 }} />
          </div>

          <div className="hd-stagger" style={{ padding: "24px 20px 80px" }}>
            {/* Account */}
            <div style={sectionWrap}>
              <SectionHeader no="No. 01" title="アカウント情報" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 999,
                    flexShrink: 0,
                    background: "var(--hd-moss-deep)",
                    color: "#f0eee9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--hd-serif)",
                    fontSize: 22,
                  }}
                >
                  {profile?.display_name?.charAt(0) || "？"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingNickname ? (
                    <div>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={20}
                        autoFocus
                        style={{
                          width: "100%",
                          fontSize: 14,
                          fontFamily: "var(--hd-sans)",
                          border: "1px solid var(--hd-ink)",
                          borderRadius: 0,
                          padding: "8px 12px",
                          outline: "none",
                          background: "var(--hd-bg)",
                          color: "var(--hd-ink)",
                          boxSizing: "border-box",
                        }}
                      />
                      {nicknameError && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--hd-terra)",
                            marginTop: 4,
                            fontFamily: "var(--hd-sans)",
                          }}
                        >
                          {nicknameError}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          onClick={handleNicknameSave}
                          disabled={nicknameSaving}
                          style={{
                            padding: "6px 16px",
                            background: "var(--hd-ink)",
                            color: "var(--hd-bg)",
                            border: "none",
                            fontFamily: "var(--hd-sans)",
                            fontSize: 11,
                            cursor: "pointer",
                            opacity: nicknameSaving ? 0.7 : 1,
                          }}
                        >
                          {nicknameSaving ? "保存中..." : "保存"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingNickname(false);
                            setNicknameError("");
                          }}
                          style={{
                            padding: "6px 16px",
                            background: "transparent",
                            color: "var(--hd-ink-60)",
                            border: "1px solid var(--hd-line)",
                            fontFamily: "var(--hd-sans)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                          Nickname
                        </div>
                        <div
                          className="hd-serif"
                          style={{
                            fontSize: 17,
                            marginTop: 2,
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {profile?.display_name || "未設定"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setNickname(profile?.display_name || "");
                          setEditingNickname(true);
                        }}
                        className="hd-mono hd-caps"
                        style={{
                          padding: "5px 14px",
                          background: "transparent",
                          color: "var(--hd-ink)",
                          border: "1px solid var(--hd-ink)",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: "1px solid var(--hd-hair)" }}>
                <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                  Email · メール
                </div>
                <div
                  className="hd-mono"
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: "var(--hd-ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>

            {/* Usage */}
            <div style={sectionWrap}>
              <SectionHeader no="No. 02" title="利用状況" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  border: "1px solid var(--hd-hair)",
                }}
              >
                {[
                  {
                    en: "MONTHLY SCANS",
                    label: "今月のスキャン",
                    value:
                      scanCount !== null ? `${scanCount} / ${scanLimit}` : "...",
                  },
                  {
                    en: "SAVED COSMETICS",
                    label: "保存コスメ",
                    value:
                      productCount !== null
                        ? `${productCount} / ${getUserLimit()}`
                        : "...",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 14px",
                      textAlign: "center",
                      borderLeft: i > 0 ? "1px solid var(--hd-hair)" : "none",
                    }}
                  >
                    <div
                      className="hd-serif"
                      style={{
                        fontSize: 22,
                        lineHeight: 1.1,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="hd-mono hd-caps"
                      style={{ color: "var(--hd-ink-40)", marginTop: 8 }}
                    >
                      {s.en}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--hd-sans)",
                        fontSize: 11,
                        color: "var(--hd-ink-60)",
                        marginTop: 3,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalization */}
            <div style={sectionWrap}>
              <SectionHeader no="No. 03" title="パーソナライズ" />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--hd-hair)",
                }}
              >
                <div>
                  <div
                    className="hd-serif"
                    style={{ fontSize: 14, letterSpacing: "-0.01em" }}
                  >
                    ダークモード
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 11,
                      color: "var(--hd-ink-60)",
                      marginTop: 2,
                    }}
                  >
                    画面の配色をダークテーマに切り替え
                  </div>
                </div>
                <Toggle
                  on={currentTheme === "dark"}
                  onClick={() => {
                    const next: Theme = currentTheme === "dark" ? "light" : "dark";
                    setTheme(next);
                    setCurrentTheme(next);
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 14,
                  paddingBottom: 14,
                  borderBottom: showHistoryConfirm ? "none" : "1px solid var(--hd-hair)",
                }}
              >
                <div>
                  <div
                    className="hd-serif"
                    style={{ fontSize: 14, letterSpacing: "-0.01em" }}
                  >
                    商品レコメンド
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 11,
                      color: "var(--hd-ink-60)",
                      marginTop: 2,
                    }}
                  >
                    スキャン履歴に基づく商品提案を表示
                  </div>
                </div>
                <Toggle on={personalize} onClick={handlePersonalizeToggle} />
              </div>

              {showHistoryConfirm ? (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    border: "1px solid var(--hd-terra)",
                  }}
                >
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 14,
                      color: "var(--hd-terra)",
                      marginBottom: 6,
                    }}
                  >
                    スキャン履歴をすべて削除しますか？
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--hd-sans)",
                      fontSize: 11,
                      color: "var(--hd-ink-60)",
                      marginBottom: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    レコメンドがリセットされます。この操作は取り消せません。
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleDeleteScanHistory}
                      disabled={deletingHistory}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        background: "var(--hd-terra)",
                        color: "#fff",
                        border: "none",
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
                        cursor: "pointer",
                        opacity: deletingHistory ? 0.7 : 1,
                      }}
                    >
                      {deletingHistory ? "削除中..." : "削除する"}
                    </button>
                    <button
                      onClick={() => setShowHistoryConfirm(false)}
                      disabled={deletingHistory}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        background: "transparent",
                        color: "var(--hd-ink-60)",
                        border: "1px solid var(--hd-line)",
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowHistoryConfirm(true)}
                  className="hd-mono hd-caps"
                  style={{
                    marginTop: 12,
                    background: "transparent",
                    border: "none",
                    color: "var(--hd-ink-60)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  スキャン履歴を削除
                </button>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={async () => {
                clearLocalData();
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              style={{
                width: "100%",
                background: "var(--hd-surface)",
                border: "1px solid var(--hd-hair)",
                padding: "16px 20px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span
                className="hd-serif"
                style={{ fontSize: 15, letterSpacing: "-0.01em" }}
              >
                ログアウト
              </span>
              <span
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)" }}
              >
                Sign Out →
              </span>
            </button>

            {/* Admin */}
            {user && ["751ac531-dcdb-4e77-a3ea-67a01677c432"].includes(user.id) && (
              <div style={sectionWrap}>
                <SectionHeader no="No. 04" title="管理者メニュー" />
                <Link
                  href="/admin/invites"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                      Invite Codes
                    </div>
                    <div
                      className="hd-serif"
                      style={{ fontSize: 14, marginTop: 2, letterSpacing: "-0.01em" }}
                    >
                      招待コード管理
                    </div>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--hd-ink-40)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Legal */}
            <div style={sectionWrap}>
              <SectionHeader no="No. 05" title="法的情報" />
              {[
                { label: "プライバシーポリシー", en: "Privacy Policy", href: "/privacy" },
                { label: "利用規約", en: "Terms of Use", href: "/terms" },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    textDecoration: "none",
                    color: "inherit",
                    borderTop: i > 0 ? "1px solid var(--hd-hair)" : "none",
                  }}
                >
                  <div>
                    <div className="hd-mono hd-caps" style={{ color: "var(--hd-ink-40)" }}>
                      {item.en}
                    </div>
                    <div
                      className="hd-serif"
                      style={{ fontSize: 14, marginTop: 2, letterSpacing: "-0.01em" }}
                    >
                      {item.label}
                    </div>
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--hd-ink-40)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Danger Zone */}
            <div
              style={{
                ...sectionWrap,
                border: "1px solid var(--hd-terra)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  borderBottom: "1px solid var(--hd-terra)",
                  paddingBottom: 10,
                  marginBottom: 14,
                }}
              >
                <span
                  className="hd-mono hd-caps"
                  style={{ color: "var(--hd-terra)" }}
                >
                  Danger
                </span>
                <span
                  className="hd-serif"
                  style={{ fontSize: 17, color: "var(--hd-terra)" }}
                >
                  アカウント削除
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 11,
                  color: "var(--hd-ink-60)",
                  lineHeight: 1.7,
                  marginBottom: 14,
                  marginTop: 0,
                }}
              >
                アカウントを削除すると、保存したコスメ・図鑑データ・写真がすべて完全に削除されます。この操作は取り消せません。
              </p>
              {showConfirm ? (
                <div
                  style={{
                    padding: 14,
                    border: "1px solid var(--hd-terra)",
                  }}
                >
                  <div
                    className="hd-serif"
                    style={{
                      fontSize: 14,
                      color: "var(--hd-terra)",
                      marginBottom: 12,
                    }}
                  >
                    本当に削除しますか？
                  </div>
                  {error && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--hd-terra)",
                        marginBottom: 8,
                        fontFamily: "var(--hd-sans)",
                      }}
                    >
                      {error}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        background: "var(--hd-terra)",
                        color: "#fff",
                        border: "none",
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
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
                        flex: 1,
                        padding: "10px 0",
                        background: "transparent",
                        color: "var(--hd-ink-60)",
                        border: "1px solid var(--hd-line)",
                        fontFamily: "var(--hd-sans)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  style={{
                    padding: "9px 18px",
                    border: "1px solid var(--hd-terra)",
                    background: "transparent",
                    color: "var(--hd-terra)",
                    fontFamily: "var(--hd-sans)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  アカウントを削除する
                </button>
              )}
            </div>

            {/* Version */}
            <div style={{ textAlign: "center", marginTop: 28, paddingBottom: 8 }}>
              <div
                className="hd-mono hd-caps"
                style={{ color: "var(--hd-ink-40)" }}
              >
                HADAMI v0.1.0 β
              </div>
              <div
                style={{
                  fontFamily: "var(--hd-sans)",
                  fontSize: 10,
                  color: "var(--hd-ink-40)",
                  marginTop: 4,
                }}
              >
                クローズドβ版 — 15名限定
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
