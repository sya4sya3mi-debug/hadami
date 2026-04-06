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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="成分を入力"
      subtitle="スキャン回数を消費しません"
    >
      <div className="flex flex-col gap-3 pt-2 pb-4">
        {/* カメラ起動ガイド */}
        <div className="w-full rounded-xl px-4 py-3 bg-gradient-to-br from-bo-accent-soft to-bo-cream border-[1.5px] border-bo-parchment">
          <div className="text-sm font-bold mb-1 text-bo-ink font-sans">
            📷 成分表の読み取り方
          </div>
          <ol className="text-[11px] leading-relaxed text-bo-ink-soft font-sans">
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
          className="w-full rounded-xl p-3 text-sm outline-none resize-y bg-bo-cream border-[1.5px] border-bo-parchment text-bo-ink font-sans leading-[1.7]"
        />

        {/* コスメ名・ブランド */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="コスメ名（任意）"
            className="flex-1 rounded-xl p-2.5 text-sm outline-none bg-bo-cream border border-bo-parchment text-bo-ink font-sans"
          />
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="ブランド（任意）"
            className="flex-1 rounded-xl p-2.5 text-sm outline-none bg-bo-cream border border-bo-parchment text-bo-ink font-sans"
          />
        </div>

        {/* 解析ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-r2 text-white text-sm font-bold font-sans mt-1 ${
            canSubmit
              ? "bg-gradient-to-br from-bo-accent to-bo-accent-dark shadow-bo-accent"
              : "bg-bo-ink-faint"
          }`}
        >
          成分を解析する
        </button>
      </div>
    </BottomSheet>
  );
}
