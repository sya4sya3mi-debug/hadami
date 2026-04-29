"use client";

import { useRef, useState, useCallback } from "react";

async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIDE = 1600;
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
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.src = dataUrl;
  });
}

interface CaptureStepProps {
  onCapture: (imageData: string) => void;
  preview?: string;
  disabled?: boolean;
  hidden?: boolean;
}

export default function CaptureStep({ onCapture, preview, disabled, hidden }: CaptureStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        const processed = await preprocessImage(dataUrl);
        onCapture(processed);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const handleRetake = useCallback(() => {
    setLocalPreview(null);
    fileInputRef.current?.click();
  }, []);

  if (hidden) {
    return (
      <input
        id="hadami-camera-input"
        ref={(el) => { fileInputRef.current = el; }}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!displayPreview ? (
        <button
          onClick={() => { if (!disabled) fileInputRef.current?.click(); }}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "32px 20px",
            background: "var(--hd-surface)",
            border: "1px solid var(--hd-line)",
            borderRadius: 0,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            color: "var(--hd-ink)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              className="hd-mono hd-caps"
              style={{
                fontSize: 9,
                color: "var(--hd-ink-40)",
                letterSpacing: "0.14em",
                marginBottom: 6,
              }}
            >
              Step 1 · Capture
            </div>
            <div
              className="hd-serif"
              style={{
                fontSize: 18,
                color: "var(--hd-ink)",
                letterSpacing: "-0.01em",
                marginBottom: 4,
              }}
            >
              パッケージを撮影
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--hd-ink-60)",
                fontFamily: "var(--hd-sans)",
                lineHeight: 1.6,
              }}
            >
              ブランド名と製品名が見えるように<br />表面パッケージを撮影してください
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              padding: "12px 24px",
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span className="hd-serif" style={{ fontSize: 13 }}>撮影する</span>
            <span
              className="hd-mono hd-caps"
              style={{ fontSize: 9, letterSpacing: "0.18em", opacity: 0.7 }}
            >
              Capture →
            </span>
          </div>
        </button>
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 220,
            overflow: "hidden",
            border: "1px solid var(--hd-hair)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayPreview} alt="撮影したコスメ" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, oklch(0.22 0.01 95 / 0.55), transparent 60%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "6px 10px",
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="hd-mono hd-caps" style={{ fontSize: 9, letterSpacing: "0.14em" }}>
              Captured
            </span>
          </div>
          <button
            onClick={handleRetake}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              padding: "8px 14px",
              background: "var(--hd-bg)",
              color: "var(--hd-ink)",
              border: "1px solid var(--hd-ink)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="hd-serif" style={{ fontSize: 12 }}>撮り直す</span>
            <span className="hd-mono hd-caps" style={{ fontSize: 9, letterSpacing: "0.14em", opacity: 0.7 }}>
              Retake
            </span>
          </button>
        </div>
      )}

      <input
        id="hadami-camera-input"
        ref={(el) => { fileInputRef.current = el; }}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );
}
