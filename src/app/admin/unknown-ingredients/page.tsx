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
  { key: "brightening",  label: "美白・整肌" },
  { key: "turnover",     label: "ターンオーバー" },
  { key: "barrier",      label: "バリア" },
  { key: "soothing",     label: "鎮静" },
  { key: "keratin",      label: "毛髪・角質" },
] as const;

interface RegisterDraft {
  nameJa: string;
  nameInci: string;
  genre: string;
  categories: string[];
  note: string;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[600px] bg-white rounded-t-[24px] p-5 pb-8 shadow-bo-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold font-sans text-bo-ink">
            成分マスタへ登録
          </h2>
          <button
            onClick={onClose}
            className="text-bo-ink-muted text-lg bg-transparent border-none cursor-pointer leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* 成分名 */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-bo-ink-muted font-sans block mb-1">
            成分名（日本語）
          </label>
          <input
            type="text"
            value={draft.nameJa}
            onChange={(e) => onChange({ nameJa: e.target.value })}
            className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors font-sans"
          />
        </div>

        {/* INCI名 */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-bo-ink-muted font-sans block mb-1">
            INCI名（任意）
          </label>
          <input
            type="text"
            value={draft.nameInci}
            onChange={(e) => onChange({ nameInci: e.target.value })}
            placeholder="例: Niacinamide"
            className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors font-sans"
          />
        </div>

        {/* ジャンル */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-bo-ink-muted font-sans block mb-1">
            ジャンル
          </label>
          <select
            value={draft.genre}
            onChange={(e) => onChange({ genre: e.target.value })}
            className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent font-sans"
          >
            {INGREDIENT_GENRES.map((g) => (
              <option key={g.key} value={g.key}>
                {g.icon} {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* カテゴリ */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-bo-ink-muted font-sans block mb-1.5">
            カテゴリ（複数選択可）
          </label>
          <div className="flex flex-wrap gap-1.5">
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
                  className={`px-3 py-1 rounded-full text-[11px] font-bold font-sans border transition-colors ${
                    selected
                      ? "bg-bo-accent text-white border-bo-accent"
                      : "bg-white text-bo-ink-muted border-bo-parchment hover:border-bo-accent"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* メモ */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-bo-ink-muted font-sans block mb-1">
            メモ（任意）
          </label>
          <textarea
            value={draft.note}
            onChange={(e) => onChange({ note: e.target.value })}
            rows={2}
            placeholder="成分の説明・補足など"
            className="w-full p-2.5 border-[1.5px] border-bo-parchment rounded-r1 text-sm bg-white outline-none focus:border-bo-accent focus:ring-1 focus:ring-bo-accent/30 transition-colors font-sans resize-none"
          />
        </div>

        <button
          onClick={onSave}
          disabled={saving || !draft.nameJa.trim()}
          className="w-full py-3 bg-bo-accent text-white rounded-r2 text-sm font-bold font-sans border-none cursor-pointer shadow-bo-accent disabled:opacity-60 transition-colors"
        >
          {saving ? "登録中..." : "成分マスタへ登録する"}
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

  // 登録モーダル
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
      setRegisteredNames((prev) => { const s = new Set(Array.from(prev)); s.add(registerDraft.nameJa); return s; });
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
  const totalOccurrences = items
    .filter((i) => !i.dismissed)
    .reduce((sum, i) => sum + i.count, 0);

  return (
    <>
      <h1 className="text-xl font-extrabold font-serif text-bo-ink mb-6">
        未識別成分
      </h1>

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
        出現回数が多い成分から優先的に「＋ 登録」でカスタム成分マスタへ追加できます。誤認識・ノイズは「無視」で非表示にできます。
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
          {visible.map((item) => {
            const isRegistered = registeredNames.has(item.name);
            return (
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
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                    {isRegistered && (
                      <span className="text-[10px] bg-bo-accent-soft text-bo-accent px-1.5 py-0.5 rounded font-bold font-sans shrink-0">
                        登録済み ✓
                      </span>
                    )}
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

                {/* アクションボタン */}
                <div className="shrink-0 flex flex-col gap-1.5 items-end">
                  {!item.dismissed && !isRegistered && (
                    <button
                      onClick={() => openRegisterModal(item.name)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors font-sans bg-[#FFF3DC] text-[#A07020] hover:bg-[#FDECC0]"
                    >
                      ＋ 登録
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(item.name, item.dismissed)}
                    disabled={processingName === item.name}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors font-sans disabled:opacity-50 ${
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-bo-danger text-white text-xs font-bold px-4 py-2 rounded-full shadow-bo2">
          {saveError}
        </div>
      )}
    </>
  );
}
