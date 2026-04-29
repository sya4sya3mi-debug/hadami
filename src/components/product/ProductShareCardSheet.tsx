"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import BottomSheet from "@/components/scan/BottomSheet";
import ProductShareCard, {
  CARD_COLORS,
  type CardPattern,
  type ProductShareCardProps,
} from "./ProductShareCard";
import { downloadShareImage } from "@/lib/downloadImage";

type ShareCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

function isMobileShareDevice() {
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

async function inlineImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface ProductShareCardSheetProps extends ProductShareCardProps {
  open: boolean;
  onClose: () => void;
}

const PATTERNS: { key: CardPattern; label: string; desc: string }[] = [
  { key: "A", label: "A", desc: "写真＋データ" },
  { key: "B", label: "B", desc: "ポスター" },
  { key: "C", label: "C", desc: "タイポ" },
];

export default function ProductShareCardSheet({
  open,
  onClose,
  ...cardProps
}: ProductShareCardSheetProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<"idle" | "shared" | "downloaded">("idle");
  const [pattern, setPattern] = useState<CardPattern>("A");
  const [accentColor, setAccentColor] = useState<string>(CARD_COLORS[0].value);
  const [imageOverride, setImageOverride] = useState<string | null>(null);
  const [captureImageUrl, setCaptureImageUrl] = useState<string | null>(null);

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください。");
      e.target.value = "";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("画像が大きすぎます（12MBまで）。");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setImageOverride(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleResetPhoto = () => setImageOverride(null);

  const handleSave = async () => {
    if (!captureRef.current || isDownloading) return;
    setIsDownloading(true);
    setStatus("idle");

    try {
      const fontSet = document.fonts;
      if (fontSet?.ready) await fontSet.ready;

      // 画像を data URL に事前インライン化。iOS Safari で <img src="https://r2..."> を
      // html2canvas/html-to-image が読み出せず、結果のシェアカードに画像が反映されない
      // 問題を回避する。
      const sourceUrl = imageOverride ?? cardProps.imageUrl ?? null;
      if (sourceUrl && !sourceUrl.startsWith("data:")) {
        const inlined = await inlineImageAsDataUrl(sourceUrl);
        flushSync(() => {
          setCaptureImageUrl(inlined ?? sourceUrl);
        });
      } else {
        flushSync(() => {
          setCaptureImageUrl(sourceUrl);
        });
      }

      // DOM 反映＋画像デコード待ち
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      const node = captureRef.current;
      if (node) {
        const imgs = Array.from(node.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => {
            const decodePromise = (img as HTMLImageElement).decode?.();
            if (decodePromise) return decodePromise.catch(() => undefined);
            return new Promise<void>((resolve) => {
              const finish = () => resolve();
              img.addEventListener("load", finish, { once: true });
              img.addEventListener("error", finish, { once: true });
              window.setTimeout(finish, 3000);
            });
          }),
        );
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      let blob: Blob | null = null;

      // html2canvas + JPEG (iOS Safari の Web Share API が WebP を弾くため)
      try {
        const { default: html2canvas } = await import("html2canvas");
        const canvas = await Promise.race([
          html2canvas(captureRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
            allowTaint: false,
            logging: false,
            imageTimeout: 15000,
          }),
          new Promise<never>((_, reject) =>
            window.setTimeout(() => reject(new Error("timed out")), 15000)
          ),
        ]);
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.92);
        });
        if (!blob) {
          blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png");
          });
        }
      } catch (captureError) {
        console.warn("html2canvas failed, falling back:", captureError);
      }

      if (!blob) {
        const { toBlob } = await import("html-to-image");
        blob = await Promise.race([
          toBlob(captureRef.current, {
            pixelRatio: 2,
            cacheBust: false,
            backgroundColor: "#ffffff",
            skipFonts: true,
            type: "image/jpeg",
            quality: 0.92,
          }),
          new Promise<Blob | null>((_, reject) =>
            window.setTimeout(() => reject(new Error("timed out")), 15000)
          ),
        ]);
      }

      if (!blob) throw new Error("画像の生成に失敗しました");

      const mime = blob.type || "image/jpeg";
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const filename = `hadami-product-${Date.now()}.${ext}`;
      const shareNavigator = navigator as ShareCapableNavigator;

      // canShare は iOS で偽陰性が多いため直接 share() を呼ぶ
      if (
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        const file = new File([blob], filename, { type: mime });
        try {
          await shareNavigator.share({ files: [file] });
          setStatus("shared");
          setTimeout(() => setStatus("idle"), 2500);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          console.warn("navigator.share failed, falling back:", error);
        }
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      await downloadShareImage(dataUrl, filename);
      setStatus("downloaded");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      console.error("ProductShareCard save error", e);
      const detail = e instanceof Error ? e.message : String(e);
      alert(`画像の保存に失敗しました。\n${detail}`);
    } finally {
      setCaptureImageUrl(null);
      setIsDownloading(false);
    }
  };

  const btnLabel = isDownloading
    ? "画像を作成中..."
    : status === "shared"
    ? "保存メニューを開きました"
    : status === "downloaded"
    ? "画像を保存しました"
    : "カードを保存";

  return (
    <BottomSheet open={open} onClose={onClose} title="シェアカード">
      <div style={{ paddingBottom: 24 }}>

        {/* ── Pattern selector ── */}
        <div style={{ marginBottom: 16 }}>
          <div
            className="hd-mono hd-caps"
            style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.14em", marginBottom: 8 }}
          >
            Pattern
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {PATTERNS.map((p) => {
              const active = pattern === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPattern(p.key)}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    background: active ? "var(--hd-ink)" : "var(--hd-surface)",
                    color: active ? "var(--hd-bg)" : "var(--hd-ink)",
                    border: active ? "1px solid var(--hd-ink)" : "1px solid var(--hd-line)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    className="hd-serif"
                    style={{ fontSize: 18, letterSpacing: "-0.01em", fontStyle: "italic" }}
                  >
                    {p.label}
                  </span>
                  <span
                    className="hd-mono hd-caps"
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.1em",
                      opacity: active ? 0.7 : 0.5,
                    }}
                  >
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Photo upload ── */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="hd-mono hd-caps"
            style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.14em", marginBottom: 8 }}
          >
            Photo
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handlePickPhoto}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "var(--hd-surface)",
                color: "var(--hd-ink)",
                border: "1px solid var(--hd-line)",
                fontFamily: "var(--hd-sans)",
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span>{imageOverride ? "写真を変更" : "写真を選択"}</span>
            </button>
            {imageOverride && (
              <button
                onClick={handleResetPhoto}
                style={{
                  padding: "10px 14px",
                  background: "transparent",
                  color: "var(--hd-ink-60)",
                  border: "1px solid var(--hd-line)",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                元に戻す
              </button>
            )}
          </div>
          <p
            style={{
              fontFamily: "var(--hd-sans)",
              fontSize: 10,
              color: "var(--hd-ink-40)",
              margin: "8px 0 0",
              lineHeight: 1.6,
            }}
          >
            ※ Pattern C は文字のみのため写真は使用されません。差し替えはこの画面のみで有効です。
          </p>
        </div>

        {/* ── Color swatches ── */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="hd-mono hd-caps"
            style={{ fontSize: 9, color: "var(--hd-ink-40)", letterSpacing: "0.14em", marginBottom: 8 }}
          >
            Accent Color
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {CARD_COLORS.map((c) => {
              const active = accentColor === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setAccentColor(c.value)}
                  title={c.label}
                  style={{
                    width: 36,
                    height: 36,
                    background: c.value,
                    border: active ? "2px solid var(--hd-ink)" : "2px solid transparent",
                    outline: active ? "2px solid var(--hd-bg)" : "none",
                    outlineOffset: -4,
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── Card preview ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div style={{ transform: "scale(0.54)", transformOrigin: "top center", height: 292 }}>
            <div ref={captureRef}>
              <ProductShareCard
                {...cardProps}
                imageUrl={captureImageUrl ?? imageOverride ?? cardProps.imageUrl}
                pattern={pattern}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={isDownloading}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "var(--hd-ink)",
            color: "var(--hd-bg)",
            border: "none",
            fontFamily: "var(--hd-sans)",
            fontSize: 14,
            fontWeight: 600,
            cursor: isDownloading ? "default" : "pointer",
            opacity: isDownloading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <span>{btnLabel}</span>
          <span
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.2em",
              opacity: 0.7,
            }}
          >
            SAVE →
          </span>
        </button>

        <p
          style={{
            fontFamily: "var(--hd-sans)",
            fontSize: 11,
            color: "var(--hd-ink-40)",
            marginTop: 12,
            lineHeight: 1.7,
          }}
        >
          ※ iPhoneやAndroidでは保存メニューから「画像を保存」を選ぶと写真に保存できます。
        </p>
      </div>
    </BottomSheet>
  );
}
