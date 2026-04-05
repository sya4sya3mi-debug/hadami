"use client";

import { useState, useEffect } from "react";

export default function MockupPage() {
  const [mounted, setMounted] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)",
        minHeight: "100vh",
        maxWidth: 390,
        margin: "0 auto",
        padding: "32px 20px 100px",
        color: "#2D2D2D",
      }}
    >
      {/* Header + Deck Switcher (compact) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>{"\u2728"} マイデッキ</h1>
        <button style={{ padding: "5px 12px", borderRadius: 16, border: "none", fontSize: 12, fontWeight: 600, background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", color: "#fff" }}>
          共有
        </button>
      </div>

      {/* Deck Switcher - 1行 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "8px 12px", marginBottom: 12,
        border: "1px solid #F5E6EF",
      }}>
        <button style={{ background: "none", border: "none", fontSize: 16, color: "#C5C5C5", cursor: "pointer", padding: "0 4px" }}>{"\u25C0"}</button>
        <div style={{
          flex: 1, textAlign: "center",
          background: "linear-gradient(135deg, #FFD580, #FFBE5C)", borderRadius: 10,
          padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#fff",
          boxShadow: "0 2px 6px rgba(255,190,92,0.25)",
        }}>
          {"\uD83C\uDF38\u2600\uFE0F"} 春夏・朝デッキ
        </div>
        <button style={{ background: "none", border: "none", fontSize: 16, color: "#C5C5C5", cursor: "pointer", padding: "0 4px" }}>{"\u25B6"}</button>
      </div>

      {/* Hand Preview - タップで編集画面へ */}
      <div
        onClick={() => setShowEditor(true)}
        style={{
          background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "10px 10px 6px", marginBottom: 12,
          border: "1px solid #F5E6EF", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
          {HAND_ITEMS.map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 36 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: item.filled ? 16 : 12,
                border: item.filled ? `2px solid ${item.color}` : `1.5px dashed ${item.color}40`,
                background: item.filled ? `linear-gradient(135deg, ${item.color}20, ${item.color}08)` : `${item.color}06`,
                opacity: item.filled ? 1 : 0.4,
                boxShadow: item.filled ? `0 1px 4px ${item.color}20` : "none",
              }}>
                {item.filled ? item.icon : "\uFF0B"}
              </div>
              <span style={{ fontSize: 7, color: item.filled ? item.color : "#C5C5C5", fontWeight: 600, whiteSpace: "nowrap" }}>
                {item.genre}
              </span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: "#5BBFAD", fontWeight: 600 }}>
          編集 {"\u25B6"}
        </div>
      </div>

      {/* Completion Bar (inline) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "0 4px" }}>
        <span style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, whiteSpace: "nowrap" }}>5/8</span>
        <div style={{ display: "flex", gap: 2, height: 5, flex: 1 }}>
          {[
            { color: "#AB47BC", filled: true }, { color: "#42A5F5", filled: true },
            { color: "#4FC3F7", filled: true }, { color: "#CE93D8", filled: true },
            { color: "#FFB74D", filled: false }, { color: "#F9A8C0", filled: true },
            { color: "#FFD54F", filled: false }, { color: "#80CBC4", filled: false },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 3, background: s.color, opacity: s.filled ? 1 : 0.15 }} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { value: "4/6", label: "カバー", color: "#5BBFAD" },
          { value: "28", label: "成分数", color: "#F9A8C0" },
          { value: "5", label: "アイテム", color: "#B39DDB" },
          { value: "3", label: "好相性", color: "#5BBFAD" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", padding: "12px 0", borderRadius: 16, background: "#fff", border: "1px solid #F5E6EF", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Step Progress Timeline */}
      <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 20, padding: "16px 14px", border: "1px solid #F5E6EF", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2D2D2D", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 3, height: 14, borderRadius: 2, background: "linear-gradient(180deg, #F9A8C0, #5BBFAD)", display: "inline-block" }} />
          ルーティンステップ
        </div>
        {STEP_ITEMS.map((item, i, arr) => (
          <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "#fff",
                background: item.filled ? item.color : "#E0E0E0",
                boxShadow: item.filled ? `0 2px 6px ${item.color}30` : "none",
              }}>
                {item.filled ? "\u2713" : item.step}
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  width: 2, height: 28,
                  background: item.filled && arr[i+1].filled
                    ? `linear-gradient(180deg, ${item.color}, ${arr[i+1].color})`
                    : "#E8E8E8",
                }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 10 : 0, minHeight: 44 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.filled ? "#2D2D2D" : "#C5C5C5" }}>{item.genre}</span>
                {item.count && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: `${item.color}18`, color: item.color, fontWeight: 700 }}>{item.count}</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: item.filled ? "#9B9B9B" : "#D5D5D5", marginTop: 2, marginLeft: 20 }}>
                {item.product || "未セット"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Coverage Chart / Combinations */}
      <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 20, padding: 20, border: "1px solid #F5E6EF", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDEE1\uFE0F"}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D", marginBottom: 4 }}>カバレッジチャート・成分相性</div>
        <div style={{ fontSize: 11, color: "#9B9B9B" }}>（既存のレーダーチャート・相性カードがここに表示）</div>
      </div>

      {/* ========== EDITOR MODAL ========== */}
      {showEditor && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)",
            overflowY: "auto",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          <div style={{ maxWidth: 390, margin: "0 auto", padding: "0 20px 40px" }}>
            {/* Editor Header */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10, padding: "12px 0 8px",
              background: "linear-gradient(160deg, #F0FDFA 0%, #FFF0F5 100%)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <button onClick={() => setShowEditor(false)} style={{ background: "none", border: "none", fontSize: 13, color: "#5BBFAD", fontWeight: 600, cursor: "pointer", padding: "4px 0" }}>
                  {"\u2190"} 戻る
                </button>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{"\uD83C\uDCCF"} デッキ編集</span>
                <button onClick={() => setShowEditor(false)} style={{ background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 14, cursor: "pointer" }}>
                  完了
                </button>
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "6px 10px",
                border: "1px solid #F5E6EF",
              }}>
                <button style={{ background: "none", border: "none", fontSize: 14, color: "#C5C5C5", cursor: "pointer" }}>{"\u25C0"}</button>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E8950A" }}>{"\uD83C\uDF38\u2600\uFE0F"} 春夏・朝デッキ</span>
                <button style={{ background: "none", border: "none", fontSize: 14, color: "#C5C5C5", cursor: "pointer" }}>{"\u25B6"}</button>
              </div>
            </div>

            {/* Section: Base Care */}
            <SectionHeader step="STEP 1-3" label="ベースケア" />
            <FilledSlot color="#AB47BC" step={1} icon={"\u{1F9F4}"} name="DUO ザ クレンジングバーム" brand="DUO" genre="クレンジング" rarity="uncommon" />
            <FilledSlot color="#42A5F5" step={2} icon={"\u{1FAE7}"} name="ロゼット 洗顔パスタ" brand="ロゼット" genre="洗顔" rarity="common" />
            <FilledSlot color="#4FC3F7" step={3} icon={"\u{1F4A7}"} name="ナチュリエ ハトムギ化粧水" brand="ナチュリエ" genre="化粧水" rarity="rare" cats={[{ icon: "\u{1FAE7}", color: "#4FC3F7" }, { icon: "\uD83D\uDEE1\uFE0F", color: "#81C784" }]} />

            {/* Section: Intensive Care */}
            <SectionHeader step="STEP 4" label="集中ケア" />
            <FilledSlot color="#CE93D8" step={4} icon={"\u2728"} name="メラノCC 薬用しみ集中対策美容液" brand="ロート製薬" genre="美容液" rarity="legendary" cats={[{ icon: "\u2728", color: "#CE93D8" }, { icon: "\u{1FAE7}", color: "#4FC3F7" }, { icon: "\uD83D\uDCAA", color: "#FFB74D" }]} />
            <FilledSlot color="#CE93D8" step={4} icon={"\u2728"} name="SKIN1004 ヒアルロンアンプル" brand="SKIN1004" genre="美容液" rarity="uncommon" />
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 8, borderRadius: 12, border: "1.5px dashed #CE93D840", cursor: "pointer", fontSize: 12, fontWeight: 500, marginBottom: 8, background: "none", width: "100%", color: "#CE93D8" }}>
              {"\uFF0B"} 美容液を追加（最大3）
            </button>

            {/* Section: Protection */}
            <SectionHeader step="STEP 5-7" label="保護ケア" />
            <EmptySlot color="#FFB74D" icon={"\u{1F95B}"} name="乳液" />
            <FilledSlot color="#F9A8C0" step={6} icon={"\u{1FAD9}"} name="キュレル 潤浸保湿フェイスクリーム" brand="花王 キュレル" genre="クリーム" rarity="common" cats={[{ icon: "\u{1FAE7}", color: "#4FC3F7" }, { icon: "\uD83D\uDEE1\uFE0F", color: "#81C784" }]} />
            <EmptySlot color="#FFD54F" icon={"\u2600\uFE0F"} name="日焼け止め" />

            {/* Section: Special Care */}
            <SectionHeader step="SPECIAL" label="スペシャルケア" />
            <EmptySlot color="#80CBC4" icon={"\uD83C\uDFAD"} name="パック・マスク" />
            <EmptySlot color="#90A4AE" icon={"\uD83D\uDC41\uFE0F"} name="アイケア" />
            <EmptySlot color="#A5D6A7" icon={"\uD83D\uDC9B"} name="オイル" />
            <EmptySlot color="#B3E5FC" icon={"\uD83C\uDF2B\uFE0F"} name="ミスト" />

            {/* Auto recommend */}
            <button style={{
              width: "100%", padding: 14, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #F9A8C0, #5BBFAD)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(249,168,192,0.2)", marginTop: 8,
            }}>
              おすすめ自動選択
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Data =====

const HAND_ITEMS = [
  { icon: "\u{1F9F4}", color: "#AB47BC", filled: true, genre: "\u30AF\u30EC\u30F3\u30B8\u30F3\u30B0" },
  { icon: "\u{1FAE7}", color: "#42A5F5", filled: true, genre: "\u6D17\u986F" },
  { icon: "\u{1F4A7}", color: "#4FC3F7", filled: true, genre: "\u5316\u7CA7\u6C34" },
  { icon: "\u2728", color: "#CE93D8", filled: true, genre: "\u7F8E\u5BB9\u6DB2" },
  { icon: "\u2728", color: "#CE93D8", filled: true, genre: "\u7F8E\u5BB9\u6DB2" },
  { icon: "\u{1F95B}", color: "#FFB74D", filled: false, genre: "\u4E73\u6DB2" },
  { icon: "\u{1FAD9}", color: "#F9A8C0", filled: true, genre: "\u30AF\u30EA\u30FC\u30E0" },
  { icon: "\u2600\uFE0F", color: "#FFD54F", filled: false, genre: "\u65E5\u713C\u3051\u6B62\u3081" },
];

const STEP_ITEMS = [
  { step: 1, genre: "\u30AF\u30EC\u30F3\u30B8\u30F3\u30B0", icon: "\u{1F9F4}", color: "#AB47BC", product: "DUO \u30B6 \u30AF\u30EC\u30F3\u30B8\u30F3\u30B0\u30D0\u30FC\u30E0", filled: true },
  { step: 2, genre: "\u6D17\u986F", icon: "\u{1FAE7}", color: "#42A5F5", product: "\u30ED\u30BC\u30C3\u30C8 \u6D17\u984D\u30D1\u30B9\u30BF", filled: true },
  { step: 3, genre: "\u5316\u7CA7\u6C34", icon: "\u{1F4A7}", color: "#4FC3F7", product: "\u30CA\u30C1\u30E5\u30EA\u30A8 \u30CF\u30C8\u30E0\u30AE\u5316\u7CA7\u6C34", filled: true },
  { step: 4, genre: "\u7F8E\u5BB9\u6DB2", icon: "\u2728", color: "#CE93D8", product: "\u30E1\u30E9\u30CECC / SKIN1004", filled: true, count: "2/3" },
  { step: 5, genre: "\u4E73\u6DB2", icon: "\u{1F95B}", color: "#FFB74D", product: null, filled: false },
  { step: 6, genre: "\u30AF\u30EA\u30FC\u30E0", icon: "\u{1FAD9}", color: "#F9A8C0", product: "\u30AD\u30E5\u30EC\u30EB \u6F64\u6D78\u4FDD\u6E7F", filled: true },
  { step: 7, genre: "\u65E5\u713C\u3051\u6B62\u3081", icon: "\u2600\uFE0F", color: "#FFD54F", product: null, filled: false },
];

// ===== Components =====

function SectionHeader({ step, label }: { step: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4, marginTop: 4 }}>
      <span style={{ fontSize: 10, color: "#C5C5C5", fontWeight: 600 }}>{step}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: 0.5 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E8E8E8" }} />
    </div>
  );
}

function EmptySlot({ color, icon, name }: { color: string; icon: string; name: string }) {
  return (
    <div style={{
      height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 16px",
      border: `2px dashed ${color}30`, borderRadius: 16, marginBottom: 8,
      background: `linear-gradient(90deg, rgba(255,255,255,0.5), ${color}06)`, cursor: "pointer",
    }}>
      <span style={{ fontSize: 22, opacity: 0.3, width: 36, textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#C5C5C5", fontWeight: 500, flex: 1 }}>{name}</span>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}18`, color, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {"\uFF0B"}
      </div>
    </div>
  );
}

const RARITY_STYLES: Record<string, React.CSSProperties> = {
  common: { boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" },
  uncommon: { boxShadow: "inset 0 0 0 1.5px rgba(76,175,80,0.3), 0 1px 4px rgba(76,175,80,0.08)" },
  rare: { boxShadow: "inset 0 0 0 1.5px rgba(233,30,140,0.25), 0 1px 6px rgba(233,30,140,0.1)" },
  legendary: { boxShadow: "inset 0 0 0 1.5px rgba(245,158,11,0.4), 0 2px 8px rgba(245,158,11,0.15)" },
};

function FilledSlot({ color, step, icon, name, brand, genre, rarity, cats }: {
  color: string; step: number; icon: string; name: string; brand: string; genre: string;
  rarity: string; cats?: { icon: string; color: string }[];
}) {
  return (
    <div style={{
      height: 72, display: "flex", alignItems: "center", position: "relative",
      background: `linear-gradient(90deg, #fff, ${color}08)`,
      borderRadius: 16, overflow: "hidden", marginBottom: 8,
      border: `1px solid ${color}20`, ...RARITY_STYLES[rarity],
    }}>
      <div style={{ width: 4, height: "100%", position: "absolute", left: 0, top: 0, background: color }} />
      <div style={{
        position: "absolute", top: 6, left: 10, width: 18, height: 18, borderRadius: "50%", background: color,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff",
      }}>{step}</div>
      <div style={{
        width: 44, height: 44, borderRadius: 10, marginLeft: 14,
        background: `linear-gradient(135deg, ${color}20, #FFF0F5)`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, padding: "0 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 1 }}>{brand}</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: `${color}18`, color, marginTop: 3 }}>
          {icon} {genre}
        </span>
      </div>
      {cats && cats.length > 0 && (
        <div style={{ display: "flex", gap: 3, marginRight: 8, flexShrink: 0 }}>
          {cats.map((c, i) => (
            <span key={i} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 8, background: `${c.color}20`, color: c.color }}>{c.icon}</span>
          ))}
        </div>
      )}
      <button style={{
        width: 26, height: 26, borderRadius: "50%", border: "none",
        background: "#FFF3F3", color: "#F48C8C", fontSize: 11, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0,
      }}>{"\u2715"}</button>
    </div>
  );
}
