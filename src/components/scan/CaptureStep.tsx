"use client";

import { useRef, useState, useCallback } from "react";

interface PreprocessResult {
  processed: string;
  color: string;
}

async function preprocessImage(dataUrl: string): Promise<PreprocessResult> {
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

      const colorCanvas = document.createElement("canvas");
      colorCanvas.width = width;
      colorCanvas.height = height;
      const colorCtx = colorCanvas.getContext("2d")!;
      colorCtx.drawImage(img, 0, 0, width, height);
      const color = colorCanvas.toDataURL("image/jpeg", 0.92);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
        d[i] = d[i + 1] = d[i + 2] = contrast;
      }
      ctx.putImageData(imageData, 0, 0);
      const processed = canvas.toDataURL("image/jpeg", 0.92);
      resolve({ processed, color });
    };
    img.src = dataUrl;
  });
}

interface CaptureStepProps {
  onCapture: (imageData: string, colorImage?: string) => void;
  onManualInput: () => void;
  preview?: string;
  disabled?: boolean;
}

export default function CaptureStep({ onCapture, onManualInput, preview, disabled }: CaptureStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayPreview = preview || localPreview;

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setLocalPreview(dataUrl);
        const { processed, color } = await preprocessImage(dataUrl);
        onCapture(processed, color);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const handleRetake = useCallback(() => {
    setLocalPreview(null);
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Hero capture card */}
      {!displayPreview ? (
        <button
          onClick={() => { if (!disabled) fileInputRef.current?.click(); }}
          disabled={disabled}
          className={`w-full h-[200px] rounded-r3 flex flex-col items-center justify-center gap-5 relative overflow-hidden bg-white/70 backdrop-blur-[12px] border border-bo-accent/20 shadow-[0_4px_24px_rgba(58,143,122,0.08)] ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[32px] bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF] animate-pulse-ring">
            <span>📸</span>
          </div>
          <div className="text-center">
            <div className="font-bold text-[15px] text-bo-ink font-sans">
              まずは表のパッケージを撮影
            </div>
            <div className="text-xs mt-1.5 text-bo-ink-muted font-sans">
              STEP1: 商品の正面パッケージを撮ってください
            </div>
          </div>
        </button>
      ) : (
        <div className="w-full h-[200px] rounded-r3 relative overflow-hidden border border-bo-accent/20 shadow-[0_4px_24px_rgba(58,143,122,0.08)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPreview}
            alt="撮影したコスメ"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={handleRetake}
            className="absolute bottom-4 right-4 px-4 py-2 rounded-full text-xs font-bold text-white bg-black/50 backdrop-blur-lg"
          >
            📷 撮り直す
          </button>
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-bo-accent/85 backdrop-blur-lg">
            ✓ 撮影完了
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Manual input card */}
      <button
        onClick={onManualInput}
        className="w-full rounded-r2 p-4 text-left bg-white/85 border-[1.5px] border-bo-accent/15 shadow-[0_2px_12px_rgba(58,143,122,0.06)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-bo-accent-soft">
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-bo-ink font-sans">
              成分リストを直接入力
            </div>
            <div className="text-xs mt-0.5 text-bo-ink-muted font-sans">
              スキャン回数を消費しません
            </div>
          </div>
          <span className="text-bo-ink-faint text-lg">›</span>
        </div>
        <div className="mt-3 rounded-xl px-3 py-2 text-xs bg-bo-accent-soft/40 text-bo-accent font-sans">
          💡 iPhoneの写真でテキストを長押しコピー → 貼り付けるだけ
        </div>
      </button>

      {/* Tips */}
      <div className="rounded-r1 p-4 bg-bo-accent-soft border border-bo-accent/10">
        <div className="text-xs font-bold mb-2 text-bo-accent font-sans">
          📸 スキャンの流れ
        </div>
        <div className="space-y-1.5 text-xs text-bo-ink-soft font-sans leading-[1.8]">
          <div><span className="font-bold text-bo-accent">STEP1</span> 表のパッケージを撮影 → 商品名から成分を自動検索</div>
          <div><span className="font-bold text-bo-accent">STEP2</span> 見つからない場合 → 裏面の成分表を撮影して読み取り</div>
          <div className="text-[10px] text-bo-ink-faint">※ マイコスメの写真はSTEP1の表パッケージが使われます</div>
        </div>
      </div>
    </div>
  );
}
