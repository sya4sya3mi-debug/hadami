"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/auth";
import { isAdminClient } from "@/lib/adminConfig";
import { INGREDIENT_GENRES } from "@/lib/ingredients";

interface UnknownItem {
  name: string;
  count: number;
  dismissed: boolean;
  dismissedAt: string | null;
  registered?: boolean;
}

const CATEGORIES = [
  { key: "moisturizing", label: "保湿" },
  { key: "brightening", label: "美白・整肌" },
  { key: "turnover", label: "ターンオーバー" },
  { key: "barrier", label: "バリア" },
  { key: "soothing", label: "鎮静" },
  { key: "keratin", label: "毛髪・角質" },
] as const;

interface RegisterDraft {
  nameJa: string;
  nameInci: string;
  genre: string;
  categories: string[];
  note: string;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="hd-mono"
      style={{
        display: "block",
        fontSize: 9,
        letterSpacing: "0.2em",
        color: "var(--hd-ink-60)",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function RegisterModal({
  draft,
  onChange,
  onSave,
  onClose,
  saving,
}: {
  draft: RegisterDraft;
  onChange: (d: Partial<RegisterDraft>) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={onClose}
    >
      <div
        className="hd-root"
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--hd-bg)",
          color: "var(--hd-ink)",
          padding: "20px 20px 32px",
          borderTop: "2px solid var(--hd-ink)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 className="hd-serif" style={{ fontSize: 16 }}>成分マスタへ登録</h2>
            <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
              REGISTER
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--hd-line)",
              color: "var(--hd-ink)",
              cursor: "pointer",
              width: 28,
              height: 28,
              fontSize: 14,
              lineHeight: 1,
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>NAME (JA)</FieldLabel>
          <input
            type="text"
            value={draft.nameJa}
            onChange={(e) => onChange({ nameJa: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>INCI (OPTIONAL)</FieldLabel>
          <input
            type="text"
            value={draft.nameInci}
            onChange={(e) => onChange({ nameInci: e.target.value })}
            placeholder="例: Niacinamide"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>GENRE</FieldLabel>
          <select
            value={draft.genre}
            onChange={(e) => onChange({ genre: e.target.value })}
            style={inputStyle}
          >
            {INGREDIENT_GENRES.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>CATEGORIES (MULTI)</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map((cat) => {
              const selected = draft.categories.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    onChange({
                      categories: selected
                        ? draft.categories.filter((c) => c !== cat.key)
                        : [...draft.categories, cat.key],
                    })
                  }
                  className="hd-mono"
                  style={{
                    padding: "6px 12px",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    background: selected ? "var(--hd-ink)" : "transparent",
                    color: selected ? "var(--hd-bg)" : "var(--hd-ink-60)",
                    border: `1px solid ${selected ? "var(--hd-ink)" : "var(--hd-line)"}`,
                    cursor: "pointer",
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <FieldLabel>NOTE (OPTIONAL)</FieldLabel>
          <textarea
            value={draft.note}
            onChange={(e) => onChange({ note: e.target.value })}
            rows={2}
            placeholder="成分の説明・補足など"
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        <button
          onClick={onSave}
          disabled={saving || !draft.nameJa.trim()}
          style={{
            width: "100%",
            padding: "16px 0",
            background: "var(--hd-ink)",
            color: "var(--hd-bg)",
            border: "1px solid var(--hd-ink)",
            cursor: saving ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: saving || !draft.nameJa.trim() ? 0.5 : 1,
          }}
        >
          <span className="hd-serif" style={{ fontSize: 14 }}>
            {saving ? "登録中" : "成分マスタへ登録"}
          </span>
          <span
            className="hd-mono"
            style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-bg)", opacity: 0.7 }}
          >
            REGISTER →
          </span>
        </button>
      </div>
    </div>
  );
}

export default function AdminUnknownIngredientsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<UnknownItem[]>([]);
  const [registeredNames, setRegisteredNames] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);
  const [processingName, setProcessingName] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [registerTarget, setRegisterTarget] = useState<string | null>(null);
  const [registerDraft, setRegisterDraft] = useState<RegisterDraft>({
    nameJa: "", nameInci: "", genre: "base", categories: [], note: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchItems = useCallback(async () => {
    setFetching(true);
    try {
      const [itemsRes, registeredRes] = await Promise.all([
        fetch("/api/admin/unknown-ingredients"),
        fetch("/api/admin/unknown-ingredients?registered=1"),
      ]);
      if (!itemsRes.ok) throw new Error("取得失敗");
      const data = await itemsRes.json();
      setItems(data.items ?? []);
      if (registeredRes.ok) {
        const rData = await registeredRes.json();
        setRegisteredNames(new Set((rData.names ?? []) as string[]));
      }
    } catch {
      setError("データの取得に失敗しました。");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdminClient(user.id)) fetchItems();
  }, [user, fetchItems]);

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
            ? { ...item, dismissed: !currentlyDismissed, dismissedAt: currentlyDismissed ? null : new Date().toISOString() }
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

  const openRegisterModal = (name: string) => {
    setRegisterTarget(name);
    setRegisterDraft({ nameJa: name, nameInci: "", genre: "base", categories: [], note: "" });
    setSaveError("");
  };

  const handleSaveRegistration = async () => {
    if (!registerDraft.nameJa.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/unknown-ingredients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerDraft),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "登録失敗");
      }
      setRegisteredNames((prev) => {
        const s = new Set(Array.from(prev));
        s.add(registerDraft.nameJa);
        return s;
      });
      setRegisterTarget(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "登録に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const visible = items.filter((i) => showDismissed || !i.dismissed);
  const activeCount = items.filter((i) => !i.dismissed).length;
  const dismissedCount = items.filter((i) => i.dismissed).length;
  const totalOccurrences = items.filter((i) => !i.dismissed).reduce((sum, i) => sum + i.count, 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="hd-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          未識別成分
        </h1>
        <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
          UNKNOWN
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { caps: "PENDING", value: activeCount, jp: "要確認" },
          { caps: "OCCURRENCES", value: totalOccurrences, jp: "総出現回数" },
          { caps: "DISMISSED", value: dismissedCount, jp: "無視済み" },
        ].map((s) => (
          <div
            key={s.caps}
            style={{ border: "1px solid var(--hd-line)", padding: "14px 10px", textAlign: "center", background: "var(--hd-bg)" }}
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

      {/* 説明 */}
      <div
        style={{
          border: "1px solid var(--hd-line)",
          padding: 14,
          marginBottom: 20,
          fontSize: 12,
          color: "var(--hd-ink)",
          fontFamily: "var(--hd-sans)",
          lineHeight: 1.7,
        }}
      >
        <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)", marginRight: 8 }}>
          NOTE
        </span>
        出現回数が多い成分から優先的に「REGISTER」でカスタム成分マスタへ追加できます。誤認識・ノイズは「DISMISS」で非表示にできます。
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

      {/* フィルター */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 className="hd-serif" style={{ fontSize: 14 }}>成分一覧</h2>
          <span className="hd-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--hd-ink-60)" }}>
            {String(visible.length).padStart(2, "0")} ITEMS
          </span>
        </div>
        <button
          onClick={() => setShowDismissed((v) => !v)}
          className="hd-mono"
          style={{
            background: "transparent",
            border: "1px solid var(--hd-line)",
            color: "var(--hd-ink-60)",
            cursor: "pointer",
            fontSize: 9,
            letterSpacing: "0.2em",
            padding: "5px 10px",
          }}
        >
          {showDismissed ? "HIDE DISMISSED" : "SHOW DISMISSED"}
        </button>
      </div>

      {fetching ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          読み込み中...
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontSize: 12, color: "var(--hd-ink-60)", fontFamily: "var(--hd-sans)" }}>
          {items.length === 0 ? "未識別成分はありません" : "表示できる成分がありません（すべて無視済み）"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((item) => {
            const isRegistered = registeredNames.has(item.name);
            const highCount = item.count >= 5;
            return (
              <div
                key={item.name}
                style={{
                  border: "1px solid var(--hd-line)",
                  borderLeft: `2px solid ${item.dismissed ? "var(--hd-line)" : "var(--hd-ink)"}`,
                  padding: 14,
                  background: "var(--hd-bg)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  opacity: item.dismissed ? 0.5 : 1,
                }}
              >
                {/* 出現回数 */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    minHeight: 44,
                    border: `1px solid ${highCount ? "var(--hd-ink)" : "var(--hd-line)"}`,
                    background: highCount ? "var(--hd-ink)" : "transparent",
                    color: highCount ? "var(--hd-bg)" : "var(--hd-ink)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 0",
                  }}
                >
                  <div className="hd-serif" style={{ fontSize: 18, lineHeight: 1 }}>{item.count}</div>
                  <div
                    className="hd-mono"
                    style={{ fontSize: 7, letterSpacing: "0.2em", marginTop: 2, opacity: 0.8 }}
                  >
                    HITS
                  </div>
                </div>

                {/* 成分名 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontFamily: "var(--hd-sans)",
                        color: item.dismissed ? "var(--hd-ink-60)" : "var(--hd-ink)",
                        textDecoration: item.dismissed ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => handleCopy(item.name)}
                      style={{
                        flexShrink: 0,
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
                      {copied === item.name ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="1" ry="1" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                    {isRegistered && (
                      <span
                        className="hd-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          color: "var(--hd-ink)",
                          border: "1px solid var(--hd-ink)",
                          padding: "2px 6px",
                        }}
                      >
                        REGISTERED ✓
                      </span>
                    )}
                  </div>
                  <div
                    className="hd-mono"
                    style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--hd-ink-60)" }}
                  >
                    {item.count} PRODUCTS
                    {item.dismissed && item.dismissedAt && (
                      <span style={{ marginLeft: 8 }}>
                        · DISMISSED{" "}
                        {new Date(item.dismissedAt)
                          .toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })
                          .replace("/", ".")}
                      </span>
                    )}
                  </div>
                </div>

                {/* アクション */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  {!item.dismissed && !isRegistered && (
                    <button
                      onClick={() => openRegisterModal(item.name)}
                      className="hd-mono"
                      style={{
                        padding: "6px 10px",
                        background: "var(--hd-ink)",
                        color: "var(--hd-bg)",
                        border: "1px solid var(--hd-ink)",
                        cursor: "pointer",
                        fontSize: 9,
                        letterSpacing: "0.2em",
                      }}
                    >
                      + REGISTER
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(item.name, item.dismissed)}
                    disabled={processingName === item.name}
                    className="hd-mono"
                    style={{
                      padding: "6px 10px",
                      background: "transparent",
                      color: "var(--hd-ink)",
                      border: "1px solid var(--hd-ink)",
                      cursor: "pointer",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      opacity: processingName === item.name ? 0.5 : 1,
                    }}
                  >
                    {processingName === item.name ? "..." : item.dismissed ? "RESTORE" : "DISMISS"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 登録モーダル */}
      {registerTarget !== null && (
        <RegisterModal
          draft={registerDraft}
          onChange={(d) => setRegisterDraft((prev) => ({ ...prev, ...d }))}
          onSave={handleSaveRegistration}
          onClose={() => setRegisterTarget(null)}
          saving={saving}
        />
      )}
      {saveError && registerTarget !== null && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "var(--hd-terra)",
            color: "var(--hd-bg)",
            fontSize: 12,
            fontFamily: "var(--hd-sans)",
            padding: "8px 16px",
            border: "1px solid var(--hd-terra)",
          }}
        >
          {saveError}
        </div>
      )}
    </>
  );
}
