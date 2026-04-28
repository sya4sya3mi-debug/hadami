"use client";

import { useRef, useState } from "react";
import BottomSheet from "@/components/scan/BottomSheet";
import ProductShareCard, {
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

interface ProductShareCardSheetProps extends ProductShareCardProps {
  open: boolean;
  onClose: () => void;
}

export default function ProductShareCardSheet({
  open,
  onClose,
  ...cardProps
}: ProductShareCardSheetProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<"idle" | "shared" | "downloaded">("idle");

  const handleSave = async () => {
    if (!captureRef.current || isDownloading) return;
    setIsDownloading(true);
    setStatus("idle");

    try {
      const fontSet = document.fonts;
      if (fontSet?.ready) await fontSet.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      const { toBlob } = await import("html-to-image");
      const blob = await Promise.race([
        toBlob(captureRef.current, {
          pixelRatio: 2,
          cacheBust: false,
          skipFonts: true,
        }),
        new Promise<Blob | null>((_, reject) =>
          window.setTimeout(() => reject(new Error("timed out")), 15000)
        ),
      ]);

      if (!blob) throw new Error("no blob");

      const filename = `hadami-product-${Date.now()}.png`;
      const shareNavigator = navigator as ShareCapableNavigator;

      if (
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        const file = new File([blob], filename, { type: blob.type || "image/png" });
        const shareData: ShareData = { files: [file], title: "コスメカード" };
        if (!shareNavigator.canShare || shareNavigator.canShare(shareData)) {
          try {
            await shareNavigator.share(shareData);
            setStatus("shared");
            setTimeout(() => setStatus("idle"), 2500);
            return;
          } catch {
            // fallthrough to download
          }
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
    } finally {
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
        {/* Card preview — centered, scaled to fit */}
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
              <ProductShareCard {...cardProps} />
            </div>
          </div>
        </div>

        {/* Save button */}
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
