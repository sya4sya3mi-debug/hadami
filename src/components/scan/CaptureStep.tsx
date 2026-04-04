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
    <div className="space-y-5">
      {/* Hero capture card */}
      {!displayPreview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full rounded-3xl flex flex-col items-center justify-center gap-5 relative overflow-hidden"
          style={{
            height: 280,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(91,191,173,0.2)",
            boxShadow: "0 4px 24px rgba(91,191,173,0.08)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {/* Pulse ring */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse-ring"
            style={{ background: "linear-gradient(135deg, #E8FAF8, #D4F5EF)" }}
          >
            <span className="text-4xl">📷</span>
          </div>
          <div className="text-center">
            <div className="font-bold text-[15px]" style={{ color: "#2D2D2D" }}>
              タップして製品を撮影
            </div>
            <div className="text-xs mt-1.5" style={{ color: "#9B9B9B" }}>
              パッケージ正面がベストです
            </div>
          </div>
        </button>
      ) : (
        /* Image preview */
        <div
          className="w-full rounded-3xl relative overflow-hidden"
          style={{
            height: 280,
            border: "1px solid rgba(91,191,173,0.2)",
            boxShadow: "0 4px 24px rgba(91,191,173,0.08)",
          }}
        >
          <img
            src={displayPreview}
            alt="撮影した製品"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
          <button
            onClick={handleRetake}
            className="absolute bottom-4 right-4 px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            📷 撮り直す
          </button>
          <div
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: "rgba(91,191,173,0.85)", backdropFilter: "blur(8px)" }}
          >
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

      {/* Manual input link */}
      <button
        onClick={onManualInput}
        className="w-full py-3 text-center text-[13px] font-medium"
        style={{ color: "#9B9B9B" }}
      >
        📋 成分リストを直接入力する
      </button>

      {/* Tips */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "#E8FAF8", border: "1px solid rgba(91,191,173,0.15)" }}
      >
        <div className="text-xs font-bold mb-2" style={{ color: "#5BBFAD" }}>
          💡 撮影のコツ
        </div>
        <div className="space-y-1.5 text-xs" style={{ color: "#6B9E95" }}>
          <div>• パッケージ正面を明るい場所で撮影</div>
          <div>• 文字がはっきり読める距離で</div>
          <div>• ブレないようしっかり固定</div>
        </div>
      </div>
    </div>
  );
}
