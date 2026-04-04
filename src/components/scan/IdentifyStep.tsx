"use client";

import { useRef, useCallback } from "react";
import BottomSheet from "./BottomSheet";

interface ScannedProduct {
  productName: string;
  brand: string;
  productType: string;
  found: boolean;
  ingredients: string;
}

interface IdentifyStepProps {
  progress: number;
  message: string;
  imagePreview?: string;
  /** Show fallback UI for ingredients photo capture */
  showFallback?: boolean;
  onFallbackCapture?: (imageData: string) => void;
  /** Multi-product selection */
  multiProducts?: ScannedProduct[];
  onSelectProduct?: (product: ScannedProduct) => void;
  onSaveMulti?: (product: ScannedProduct, index: number) => void;
  multiSavedIndexes?: Set<number>;
  showMultiSheet?: boolean;
  onCloseMultiSheet?: () => void;
}

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

export default function IdentifyStep({
  progress,
  message,
  imagePreview,
  showFallback,
  onFallbackCapture,
  multiProducts,
  onSelectProduct,
  onSaveMulti,
  multiSavedIndexes,
  showMultiSheet,
  onCloseMultiSheet,
}: IdentifyStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFallbackFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onFallbackCapture) return;
      e.target.value = "";
      const reader = new FileReader();
      reader.onload = async () => {
        const processed = await preprocessImage(reader.result as string);
        onFallbackCapture(processed);
      };
      reader.readAsDataURL(file);
    },
    [onFallbackCapture]
  );

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Image preview */}
      {imagePreview && (
        <div
          className="w-[120px] h-[120px] rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
        >
          <img src={imagePreview} alt="撮影した製品" className="w-full h-full object-cover" />
        </div>
      )}

      {!showFallback ? (
        <>
          {/* Animated rings */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(91,191,173,0.3)", animation: "ripple 2s ease-in-out infinite" }}
            />
            <div
              className="absolute rounded-full"
              style={{ inset: 6, border: "2px solid rgba(249,168,192,0.3)", animation: "ripple 2s ease-in-out infinite 0.4s" }}
            />
            <div
              className="absolute rounded-full"
              style={{ inset: 12, border: "2px solid rgba(91,191,173,0.3)", animation: "ripple 2s ease-in-out infinite 0.8s" }}
            />
            <span className="text-2xl relative z-10">✨</span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-[240px]">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F2F2F2" }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #5BBFAD, #F9A8C0)" }}
              />
            </div>
          </div>

          {/* Status message */}
          <p
            key={message}
            className="text-sm font-medium text-center animate-float-up"
            style={{ color: "#5BBFAD" }}
          >
            {message}
          </p>
        </>
      ) : (
        /* Fallback: capture ingredients photo */
        <div className="w-full space-y-4">
          <div
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: "#FFF8E1", color: "#F59E0B", border: "1px solid #FDE68A" }}
          >
            <span>⚠️</span>
            <span>成分情報が見つかりませんでした</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 py-10"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(249,168,192,0.3)",
              boxShadow: "0 4px 16px rgba(249,168,192,0.08)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FFF0F5, #F9C8D8)" }}
            >
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>成分表を撮影してください</div>
              <div className="text-xs mt-1" style={{ color: "#9B9B9B" }}>裏面の成分一覧を直接読み取ります</div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFallbackFile}
            className="hidden"
          />
        </div>
      )}

      {/* Multi-product bottom sheet */}
      {multiProducts && multiProducts.length > 0 && (
        <BottomSheet open={!!showMultiSheet} onClose={onCloseMultiSheet || (() => {})}>
          <div className="space-y-3">
            <div className="text-center mb-2">
              <div className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                📦 {multiProducts.length}つの製品を検出
              </div>
              <div className="text-xs mt-1" style={{ color: "#9B9B9B" }}>確認したい製品を選んでください</div>
            </div>
            {multiProducts.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4"
                style={{ border: "1px solid #F5E6EF" }}
              >
                <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>{p.productName}</div>
                <div className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{p.brand} · {p.productType}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onSelectProduct?.(p)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #5BBFAD, #7DD3C8)" }}
                  >
                    詳細を見る
                  </button>
                  <button
                    onClick={() => onSaveMulti?.(p, i)}
                    disabled={multiSavedIndexes?.has(i)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                    style={{
                      background: multiSavedIndexes?.has(i) ? "#F2F2F2" : "#E8FAF8",
                      color: multiSavedIndexes?.has(i) ? "#9B9B9B" : "#5BBFAD",
                    }}
                  >
                    {multiSavedIndexes?.has(i) ? "✓ 保存済み" : "保存する"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
