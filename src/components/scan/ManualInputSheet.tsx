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
  const [tab, setTab] = useState<"text" | "camera">("text");
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
      if (text) {
        setIngredientText((prev) => (prev ? prev + "\n" + text : text));
        setTab("text");
      }
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
    setTab("text");
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="成分を入力"
      subtitle="スキャン回数を消費しません"
    >
      <div className="pt-2">
        {/* タブ切り替え */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-4"
          style={{ background: "#F5F5F5" }}
        >
          <button
            onClick={() => setTab("text")}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={
              tab === "text"
                ? { background: "#fff", color: "#2D2D2D", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                : { color: "#9B9B9B" }
            }
          >
            ✏️ テキスト入力
          </button>
          <button
            onClick={() => setTab("camera")}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={
              tab === "camera"
                ? { background: "#fff", color: "#2D2D2D", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                : { color: "#9B9B9B" }
            }
          >
            📷 撮影して読み取る
          </button>
        </div>

        {/* テキスト入力タブ */}
        {tab === "text" && (
          <div className="space-y-3">
            <textarea
              value={ingredientText}
              onChange={(e) => setIngredientText(e.target.value)}
              placeholder="成分をここに貼り付け&#10;例: 水、グリセリン、BG、ナイアシンアミド..."
              rows={6}
              className="w-full rounded-2xl p-4 text-sm outline-none resize-none"
              style={{
                background: "#FAFAFA",
                border: "1.5px solid #F2F2F2",
                color: "#2D2D2D",
                lineHeight: 1.7,
              }}
            />
            <p className="text-[11px] text-center" style={{ color: "#BDBDBD" }}>
              カンマ・改行・スペース区切りに対応
            </p>
          </div>
        )}

        {/* 撮影タブ */}
        {tab === "camera" && (
          <div className="space-y-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={ocrLoading}
              className="w-full rounded-2xl py-10 flex flex-col items-center justify-center gap-3"
              style={{
                background: ocrLoading ? "#F2F2F2" : "linear-gradient(135deg, #FFF0F5 0%, #F0FDFA 100%)",
                border: "2px dashed #F9A8C0",
              }}
            >
              <span className="text-4xl">{ocrLoading ? "⏳" : "📷"}</span>
              <span className="text-sm font-bold" style={{ color: ocrLoading ? "#9B9B9B" : "#2D2D2D" }}>
                {ocrLoading ? "テキスト認識中..." : "成分表を撮影 / アルバムから選択"}
              </span>
              {!ocrLoading && (
                <span className="text-xs" style={{ color: "#9B9B9B" }}>
                  タップしてカメラを起動
                </span>
              )}
            </button>
            {ocrError && (
              <div className="rounded-xl px-3 py-2 text-xs text-center" style={{ background: "#FFF3F3", color: "#E57373" }}>
                {ocrError}
              </div>
            )}
            <div
              className="rounded-xl px-3 py-2.5 text-[11px] text-center leading-relaxed"
              style={{ background: "#FDE8F0", color: "#C97A9A" }}
            >
              📱 iPhoneは写真アプリで成分表を<strong>長押し</strong>→コピー→「テキスト入力」タブにペーストも便利
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {/* 製品名・ブランド */}
        <div className="flex gap-3 mt-4">
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

        {/* 解析ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl text-white text-sm font-bold mt-4"
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
