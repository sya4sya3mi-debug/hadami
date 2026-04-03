"use client";

import { useRef, useCallback } from "react";

interface CameraViewProps {
  step: 1 | 2;
  onCapture: (imageData: string) => void;
  packagePreview?: string;
}

export default function CameraView({ step, onCapture, packagePreview }: CameraViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onCapture(reader.result as string);
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
          <span>STEP {step}/2</span>
        </div>
        <span className="text-sm" style={{ color: "#9B9B9B" }}>
          {isStep1 ? "パッケージを撮影" : "成分表を撮影"}
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
