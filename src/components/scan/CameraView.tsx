"use client";

import { useRef, useCallback } from "react";

interface CameraViewProps {
  step: 1 | 2;
  onCapture: (imageData: string, colorImage?: string) => void;
  packagePreview?: string;
}

interface PreprocessResult {
  /** グレースケール＋コントラスト強調（API送信用） */
  processed: string;
  /** カラーのままリサイズ（保存用） */
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

      // カラー版（保存用）
      const colorCanvas = document.createElement("canvas");
      colorCanvas.width = width;
      colorCanvas.height = height;
      const colorCtx = colorCanvas.getContext("2d")!;
      colorCtx.drawImage(img, 0, 0, width, height);
      const color = colorCanvas.toDataURL("image/jpeg", 0.92);

      // グレースケール版（API送信用）
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

export default function CameraView({ step, onCapture, packagePreview }: CameraViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const { processed, color } = await preprocessImage(reader.result as string);
        onCapture(processed, color);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const isStep1 = step === 1;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Step indicator */}
      <div className="flex items-center gap-3 w-full">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
          style={{
            background: "linear-gradient(135deg, #3A8F7A, #7DD3C8)",
          }}
        >
          <span>{isStep1 ? "\uD83D\uDCE6" : "\uD83D\uDCCB"}</span>
          <span>{isStep1 ? "\u30D1\u30C3\u30B1\u30FC\u30B8\u64AE\u5F71" : "\u6210\u5206\u8868\u64AE\u5F71"}</span>
        </div>
        <span className="text-sm text-bo-ink-muted">
          {isStep1 ? "\u30B3\u30B9\u30E1\u540D\u3092\u81EA\u52D5\u3067\u691C\u7D2B\u3057\u307E\u3059" : "\u6210\u5206\u8868\u3092\u76F4\u63A5\u8AAD\u307F\u53D6\u308A\u307E\u3059"}
        </span>
      </div>

      {/* Package done badge */}
      {step === 2 && packagePreview && (
        <div className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm bg-bo-accent-soft text-bo-accent">
          <span>{"\u2705"}</span>
          <span className="font-medium">{"\u30D1\u30C3\u30B1\u30FC\u30B8\u64AE\u5F71\u5B8C\u4E86\uFF01"}</span>
        </div>
      )}

      {/* Camera area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-3xl flex flex-col items-center justify-center gap-4 py-16 border-[2.5px] border-dashed border-bo-accent shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        style={{
          background: "rgba(255,255,255,0.8)",
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: "linear-gradient(135deg, #e6f7d9, #c5f0a0)",
          }}
        >
          {isStep1 ? "\uD83D\uDCE6" : "\uD83D\uDCCB"}
        </div>
        <div className="text-center">
          <div className="font-bold text-sm text-bo-ink">
            {"\u30BF\u30C3\u30D7\u3057\u3066\u64AE\u5F71"}
          </div>
          <div className="text-xs mt-1 text-bo-ink-muted">
            {"\u30AB\u30E1\u30E9\u307E\u305F\u306F\u30A2\u30EB\u30D0\u30E0\u304B\u3089\u9078\u629E"}
          </div>
        </div>
      </button>

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
