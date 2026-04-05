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
    onSubmit(ingredientText, name || "手動入力した製品", brand || "");
    setIngredientText("");
    setName("");
    setBrand("");
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="成分を入力"
      subtitle="スキャン回数を消費しません"
    >
      <div className="flex flex-col gap-3 pt-2 pb-4">
        {/* カメラ起動ガイド */}
        <div
          className="w-full rounded-xl px-4 py-3"
          style={{
            background: "linear-gradient(135deg, #FFF0F5, #F0FDFA)",
            border: "1.5px solid #F2E8ED",
          }}
        >
          <div className="text-sm font-bold mb-1" style={{ color: "#2D2D2D" }}>
            📷 成分表の読み取り方
          </div>
          <ol className="text-[11px] leading-relaxed" style={{ color: "#6B6B6B" }}>
            <li>1. カメラアプリで成分表を撮影</li>
            <li>2. 写真アプリで画像を開き、テキストを長押しでコピー</li>
            <li>3. 下の入力欄にペースト</li>
          </ol>
        </div>

        {/* テキストエリア */}
        <textarea
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          placeholder="成分をここにペースト&#10;例: 水、グリセリン、BG、ナイアシンアミド..."
          rows={4}
          className="w-full rounded-xl p-3 text-sm outline-none resize-y"
          style={{
            background: "#FAFAFA",
            border: "1.5px solid #F2F2F2",
            color: "#2D2D2D",
            lineHeight: 1.7,
          }}
        />

        {/* 製品名・ブランド */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="製品名（任意）"
            className="flex-1 rounded-xl p-2.5 text-sm outline-none"
            style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
          />
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="ブランド（任意）"
            className="flex-1 rounded-xl p-2.5 text-sm outline-none"
            style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
          />
        </div>

        {/* 解析ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl text-white text-sm font-bold mt-1"
          style={{
            background: canSubmit ? "linear-gradient(135deg, #F9A8C0, #F48FB1)" : "#D0D0D0",
            boxShadow: canSubmit ? "0 4px 16px rgba(249,168,192,0.4)" : "none",
          }}
        >
          成分を解析する
        </button>
      </div>
    </BottomSheet>
  );
}
