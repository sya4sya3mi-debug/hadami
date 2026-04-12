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
      const MAX_SIDE = 2400;
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
      const color = colorCanvas.toDataURL("image/jpeg", 0.95);

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
    <div className="space-y-5 animate-fade-up">
      {/* Hero capture area */}
      {!displayPreview ? (
        <button
          onClick={() => { if (!disabled) fileInputRef.current?.click(); }}
          disabled={disabled}
          className={`w-full rounded-r3 overflow-hidden border-none bg-white shadow-bo2 pressable ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-bo-accent via-[#7DD3C8] to-bo-accent" />

          <div className="flex flex-col items-center py-8 px-6">
            {/* Camera icon container */}
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl mb-5
                            bg-gradient-to-br from-bo-accent-soft to-[#D4F5EF]
                            shadow-[0_8px_24px_rgba(58,143,122,0.15)]">
              <span className="animate-pulse-ring">📸</span>
            </div>

            <h2 className="text-base font-bold text-bo-ink font-sans mb-1.5">
              パッケージを撮影
            </h2>
            <p className="text-xs text-bo-ink-muted font-sans leading-relaxed text-center">
              化粧品の表面パッケージを撮影してください<br />
              ブランド名と製品名が見えるように
            </p>

            {/* CTA pill */}
            <div className="mt-6 px-8 py-3 rounded-full bg-bo-accent text-white text-sm font-bold font-sans
                            shadow-bo-accent inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              撮影する
            </div>
          </div>
        </button>
      ) : (
        <div className="w-full rounded-r3 relative overflow-hidden shadow-bo2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayPreview}
            alt="撮影したコスメ"
            className="w-full h-[200px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-3 left-3 px-3.5 py-2 rounded-r1 text-xs font-bold text-white
                          bg-bo-accent/90 backdrop-blur-lg shadow-bo-accent
                          inline-flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            撮影完了
          </div>

          {/* Retake button */}
          <button
            onClick={handleRetake}
            className="absolute bottom-3 right-3 px-4 py-2.5 rounded-r1 text-xs font-bold text-white
                       bg-black/40 backdrop-blur-xl border border-white/20
                       pressable"
          >
            📷 撮り直す
          </button>
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
