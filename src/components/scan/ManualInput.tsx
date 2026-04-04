"use client";

import { useRef, useState } from "react";

async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIDE = 1800;
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        const scale = MAX_SIDE / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const d = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < d.data.length; i += 4) {
        const gray = Math.round(0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]);
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
        d.data[i] = d.data[i + 1] = d.data[i + 2] = contrast;
      }
      ctx.putImageData(d, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = dataUrl;
  });
}

interface ManualInputProps {
  onSubmit: (text: string, name: string, brand: string) => void;
  disabled?: boolean;
}

export default function ManualInput({ onSubmit, disabled }: ManualInputProps) {
  const [ingredientText, setIngredientText] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = ingredientText.trim().length > 0 && !disabled && !ocrLoading;

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrError("");
    e.target.value = "";
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const processed = await preprocessImage(dataUrl);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: processed }),
      });
      if (!res.ok) throw new Error("OCR failed");
      const { text } = await res.json();
      if (text) setIngredientText((prev) => prev ? prev + "\n" + text : text);
    } catch {
      setOcrError("テキスト認識に失敗しました。もう一度お試しください。");
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* iPhoneのテキストコピー案内バナー */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #FDE8F0 0%, #EEF6FF 100%)",
          border: "1.5px solid rgba(249,168,192,0.35)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📱</span>
          <span className="text-sm font-bold" style={{ color: "#2D2D2D" }}>
            iPhoneのテキストコピーが便利！
          </span>
        </div>
        <ol className="space-y-1.5 text-xs" style={{ color: "#555" }}>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "#C97A9A", flexShrink: 0 }}>①</span>
            <span>カメラロールで成分表の写真を開く</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "#C97A9A", flexShrink: 0 }}>②</span>
            <span>成分テキストを<span className="font-bold">長押し</span>して「すべてを選択」→「コピー」</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "#C97A9A", flexShrink: 0 }}>③</span>
            <span>下のテキストエリアに<span className="font-bold">ペースト</span>するだけ</span>
          </li>
        </ol>
        <div
          className="mt-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          style={{ background: "rgba(249,168,192,0.15)", color: "#C97A9A" }}
        >
          ✨ スキャン回数を消費しないのでどんどん使えます
        </div>
      </div>

      {/* カメラで撮影ボタン */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={ocrLoading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl py-4"
        style={{
          background: ocrLoading ? "#D0D0D0" : "rgba(255,255,255,0.8)",
          border: "2.5px dashed #F9A8C0",
          cursor: ocrLoading ? "not-allowed" : "pointer",
        }}
      >
        {ocrLoading ? (
          <>
            <span className="text-lg">⏳</span>
            <span className="text-sm font-bold" style={{ color: "#9B9B9B" }}>テキスト認識中...</span>
          </>
        ) : (
          <>
            <span className="text-2xl">📷</span>
            <div className="text-left">
              <div className="text-sm font-bold" style={{ color: "#2D2D2D" }}>成分表を撮影して読み取る</div>
              <div className="text-xs" style={{ color: "#9B9B9B" }}>カメラまたはアルバムから選択</div>
            </div>
          </>
        )}
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {ocrError && (
        <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#FFF3F3", color: "#E57373" }}>
          {ocrError}
        </div>
      )}

      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #F5E6EF" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📋</span>
          <span className="text-sm font-bold" style={{ color: "#2D2D2D" }}>
            成分テキストを貼り付け
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "#9B9B9B" }}>
          カンマ・改行・スペース区切りに対応しています。
        </p>
        <textarea
          value={ingredientText}
          onChange={(e) => setIngredientText(e.target.value)}
          placeholder="例: 水、グリセリン、BG、ナイアシンアミド、ヒアルロン酸Na..."
          rows={6}
          className="w-full rounded-xl p-3 text-sm outline-none resize-none"
          style={{
            background: "#FAFAFA",
            border: "1px solid #F2F2F2",
            color: "#2D2D2D",
          }}
        />
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #F5E6EF" }}
      >
        <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>
          製品名（任意）
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 薬用化粧水"
          className="w-full rounded-xl p-2.5 text-sm outline-none mb-3"
          style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
        />
        <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>
          ブランド（任意）
        </label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="例: 無印良品"
          className="w-full rounded-xl p-2.5 text-sm outline-none"
          style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
        />
      </div>

      <button
        onClick={() => onSubmit(ingredientText, name || "手動入力した製品", brand || "")}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-2xl text-white text-center text-sm font-bold"
        style={{
          background: canSubmit
            ? "linear-gradient(135deg, #5BBFAD 0%, #7DD3C8 100%)"
            : "#D0D0D0",
          boxShadow: canSubmit ? "0 4px 16px rgba(91,191,173,0.35)" : "none",
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        成分を解析する
      </button>

      <div
        className="rounded-xl p-3 text-xs"
        style={{ background: "#E8FAF8", color: "#5BBFAD" }}
      >
        💡 手動入力はAPIを使わないため、スキャン回数にカウントされません。
      </div>
    </div>
  );
}
