"use client";

import { useRef, useState } from "react";
import BottomSheet from "./BottomSheet";

async function preprocessForOcr(dataUrl: string): Promise<string> {
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

interface ManualInputSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, name: string, brand: string) => void;
}

export default function ManualInputSheet({ open, onClose, onSubmit }: ManualInputSheetProps) {
  const [ingredientText, setIngredientText] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = ingredientText.trim().length > 0 && !ocrLoading;

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
      const processed = await preprocessForOcr(dataUrl);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: processed }),
      });
      if (!res.ok) throw new Error("OCR failed");
      const { text } = await res.json();
      if (text) setIngredientText((prev) => (prev ? prev + "\n" + text : text));
    } catch {
      setOcrError("テキスト認識に失敗しました。もう一度お試しください。");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = () => {
    onSubmit(ingredientText, name || "手動入力した製品", brand || "");
    setIngredientText("");
    setName("");
    setBrand("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-center mb-2">
          <div className="text-lg font-bold" style={{ color: "#2D2D2D" }}>📋 手動入力</div>
          <div className="text-xs mt-1" style={{ color: "#9B9B9B" }}>APIを使わないため、スキャン回数にカウントされません</div>
        </div>

        {/* OCR camera button */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={ocrLoading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3"
          style={{
            background: ocrLoading ? "#F2F2F2" : "linear-gradient(135deg, #FFF0F5, #FFFFFF)",
            border: "1px solid #F9A8C020",
          }}
        >
          <span>{ocrLoading ? "⏳" : "📷"}</span>
          <span className="text-sm font-medium" style={{ color: ocrLoading ? "#9B9B9B" : "#2D2D2D" }}>
            {ocrLoading ? "テキスト認識中..." : "成分表を撮影して読み取る"}
          </span>
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

        {/* Textarea */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#9B9B9B" }}>
            成分テキスト
          </label>
          <textarea
            value={ingredientText}
            onChange={(e) => setIngredientText(e.target.value)}
            placeholder="例: 水、グリセリン、BG、ナイアシンアミド、ヒアルロン酸Na..."
            rows={5}
            className="w-full rounded-xl p-3 text-sm outline-none resize-none"
            style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
          />
          <div className="text-[10px] mt-1" style={{ color: "#BDBDBD" }}>
            カンマ・改行・スペース区切りに対応
          </div>
        </div>

        {/* Product name and brand */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>製品名（任意）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 薬用化粧水"
              className="w-full rounded-xl p-2.5 text-sm outline-none"
              style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>ブランド（任意）</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例: 無印良品"
              className="w-full rounded-xl p-2.5 text-sm outline-none"
              style={{ background: "#FAFAFA", border: "1px solid #F2F2F2", color: "#2D2D2D" }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-2xl text-white text-sm font-bold"
          style={{
            background: canSubmit ? "linear-gradient(135deg, #5BBFAD, #7DD3C8)" : "#D0D0D0",
            boxShadow: canSubmit ? "0 4px 16px rgba(91,191,173,0.35)" : "none",
          }}
        >
          成分を解析する
        </button>
      </div>
    </BottomSheet>
  );
}
