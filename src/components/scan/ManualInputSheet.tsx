"use client";

import { useState } from "react";
import BottomSheet from "./BottomSheet";

interface ManualInputSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, name: string, brand: string) => void;
}

export default function ManualInputSheet({ open, onClose, onSubmit }: ManualInputSheetProps) {
  const [ingredientText, setIngredientText] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");

  const canSubmit = ingredientText.trim().length > 0;

  const handleSubmit = () => {
    onSubmit(ingredientText, name || "手動入力したコスメ", brand || "");
    setIngredientText("");
    setName("");
    setBrand("");
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: "var(--hd-sans)",
    color: "var(--hd-ink)",
    background: "var(--hd-bg)",
    border: "1px solid var(--hd-line)",
    outline: "none",
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="成分を入力"
      subtitle="スキャン回数を消費しません"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8, paddingBottom: 16 }}>
        {/* Guide */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--hd-bg)",
            border: "1px solid var(--hd-hair)",
            borderLeft: "2px solid var(--hd-ink)",
          }}
        >
          <div
            className="hd-mono hd-caps"
            style={{
              fontSize: 9,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.14em",
              marginBottom: 6,
            }}
          >
            How to use
          </div>
          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: "var(--hd-ink-60)",
              fontFamily: "var(--hd-sans)",
              lineHeight: 1.8,
            }}
          >
            <li>カメラアプリで成分表を撮影</li>
            <li>写真アプリで画像を開き、テキストを長押しでコピー</li>
            <li>下の入力欄にペースト</li>
          </ol>
        </div>

        <div>
          <label
            className="hd-mono hd-caps"
            style={{
              display: "block",
              fontSize: 9,
              color: "var(--hd-ink-40)",
              marginBottom: 6,
              letterSpacing: "0.14em",
            }}
          >
            Ingredients
          </label>
          <textarea
            value={ingredientText}
            onChange={(e) => setIngredientText(e.target.value)}
            placeholder="成分をここにペースト&#10;例: 水、グリセリン、BG、ナイアシンアミド..."
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: 1.7,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label
              className="hd-mono hd-caps"
              style={{
                display: "block",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                marginBottom: 6,
                letterSpacing: "0.14em",
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="コスメ名（任意）"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              className="hd-mono hd-caps"
              style={{
                display: "block",
                fontSize: 9,
                color: "var(--hd-ink-40)",
                marginBottom: 6,
                letterSpacing: "0.14em",
              }}
            >
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="ブランド（任意）"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="hd-cta"
          style={{
            width: "100%",
            marginTop: 4,
            padding: "13px 22px",
            fontSize: 14,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          成分を解析する
        </button>
      </div>
    </BottomSheet>
  );
}
