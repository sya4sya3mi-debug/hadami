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
  preview?: string;
  disabled?: boolean;
}

export default function CaptureStep({ onCapture, preview, disabled }: CaptureStepProps) {
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
    <div className="space-y-4 animate-fade-up">
      {/* Hero capture card */}
      {!displayPreview ? (
        <button
          onClick={() => { if (!disabled) fileInputRef.current?.click(); }}
          disabled={disabled}
          className={`w-full rounded-r3 flex items-center gap-3 relative overflow-hidden py-3 px-4 bg-white/70 backdrop-blur-[12px] border border-bo-accent/20 shadow-[0_4px_24px_rgba(58,143,122,0.08)] ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <div className="w-[44px] h-[44px] shrink-0 rounded-full flex items-center justify-center text-[22px] bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF] animate-pulse-ring">
            <span>📸</span>
          </div>
          <div className="text-left flex-1">
            <div className="font-bold text-[14px] text-bo-ink font-sans leading-tight">
              表のパッケージを撮影
            </div>
            <div className="text-[11px] mt-0.5 text-bo-ink-muted font-sans">
              <span className="text-bo-accent font-bold">STEP1</span> 表面 → <span className="text-bo-accent font-bold">STEP2</span> 成分表（裏面）
            </div>
          </div>
          <svg className="shrink-0 text-bo-accent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      ) : (
        <div className="w-full h-[168px] rounded-r3 relative overflow-hidden border border-bo-accent/20 shadow-[0_4px_24px_rgba(58,143,122,0.08)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPreview}
            alt="撮影したコスメ"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={handleRetake}
            className="absolute bottom-3 right-3 px-4 py-2 rounded-full text-xs font-bold text-white bg-black/50 backdrop-blur-lg"
          >
            📷 撮り直す
          </button>
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-bo-accent/85 backdrop-blur-lg">
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

    </div>
  );
}
