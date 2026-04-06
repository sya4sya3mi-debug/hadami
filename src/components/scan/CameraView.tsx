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
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            background: isStep1
              ? "linear-gradient(135deg, #5BBFAD, #7DD3C8)"
              : "linear-gradient(135deg, #F9A8C0, #E879A0)",
            color: "#fff",
          }}
        >
          <span>{isStep1 ? "📦" : "📋"}</span>
          <span>{isStep1 ? "パッケージ撮影" : "成分表撮影"}</span>
        </div>
        <span className="text-sm" style={{ color: "#9B9B9B" }}>
          {isStep1 ? "コスメ名を自動で検索します" : "成分表を直接読み取ります"}
        </span>
      </div>

      {/* Package done badge */}
      {step === 2 && packagePreview && (
        <div
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: "#E8FAF8", color: "#5BBFAD" }}
        >
          <span>✅</span>
          <span className="font-medium">パッケージ撮影完了！</span>
        </div>
      )}

      {/* Camera area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-3xl flex flex-col items-center justify-center gap-4 py-16"
        style={{
          background: "rgba(255,255,255,0.8)",
          border: `2.5px dashed ${isStep1 ? "#5BBFAD" : "#F9A8C0"}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: isStep1
              ? "linear-gradient(135deg, #E8FAF8, #B2E8E0)"
              : "linear-gradient(135deg, #FFF0F5, #F9C8D8)",
          }}
        >
          {isStep1 ? "📦" : "📋"}
        </div>
        <div className="text-center">
          <div className="font-bold text-sm" style={{ color: "#2D2D2D" }}>
            タップして撮影
          </div>
          <div className="text-xs mt-1" style={{ color: "#9B9B9B" }}>
            カメラまたはアルバムから選択
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
