"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { downloadShareImage } from "@/lib/downloadImage";

type ShareCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "png";
}

function dataUrlToBlob(dataUrl: string) {
  const matches = dataUrl.match(
    /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/,
  );

  if (!matches) {
    throw new Error("Invalid data URL");
  }

  const mimeType = matches[1] || "image/png";
  const isBase64 = Boolean(matches[2]);
  const body = matches[3] || "";

  let decoded = "";

  if (isBase64) {
    const normalized = body.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    decoded = atob(padded);
  } else {
    decoded = decodeURIComponent(body);
  }

  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function isMobileShareDevice() {
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export interface ShareModalProps {
  text: string;
  onClose: () => void;
  /** DOM element to capture as share image (legacy, slow) */
  captureRef?: React.RefObject<HTMLElement | null>;
  /** Pre-generated base64 image. Skips html2canvas entirely. */
  imageBase64?: string;
}

export default function ShareModal({
  text,
  onClose,
  captureRef,
  imageBase64: imageBase64Prop,
}: ShareModalProps) {
  const [editableText, setEditableText] = useState(text);
  const [copied, setCopied] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const MAX_CHARS = 280;
  const isOverLimit = editableText.length > MAX_CHARS;
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imageBase64Prop) return;
    setCardImage(imageBase64Prop);
    setDownloaded(false);
    setSaveError(null);
  }, [imageBase64Prop]);

  useEffect(() => {
    if (imageBase64Prop) return;
    if (!captureRef?.current) return;
    setCapturing(true);
    setDownloaded(false);
    setSaveError(null);

    const element = captureRef.current;
    const originalDisplay = element.style.display;

    import("html2canvas")
      .then(({ default: html2canvas }) =>
        html2canvas(element, {
          scale: 2,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        }),
      )
      .then((canvas) => {
        setCardImage(canvas.toDataURL("image/jpeg", 0.92));
      })
      .catch(() => {
        setCardImage(null);
      })
      .finally(() => {
        element.style.display = originalDisplay;
        setCapturing(false);
      });
  }, [captureRef, imageBase64Prop]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(editableText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = useCallback(async () => {
    if (!cardImage || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const imageBlob = dataUrlToBlob(cardImage);
      const filename = `hadami-share-${Date.now()}.${extensionForMimeType(imageBlob.type)}`;
      const shareNavigator = navigator as ShareCapableNavigator;

      if (
        isMobileShareDevice() &&
        typeof File !== "undefined" &&
        typeof shareNavigator.share === "function"
      ) {
        try {
          const file = new File([imageBlob], filename, {
            type: imageBlob.type || "image/png",
          });
          const shareData: ShareData = {
            files: [file],
            title: "HADAMI シェアカード",
          };

          if (!shareNavigator.canShare || shareNavigator.canShare(shareData)) {
            await shareNavigator.share(shareData);
            setDownloaded(true);
            return;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setSaveError("画像の保存をキャンセルしました。もう一度お試しください。");
            return;
          }
        }
      }

      const result = await downloadShareImage(cardImage, {
        filename,
        allowNativeShareFallback: false,
      });

      if (result === "downloaded" || result === "shared") {
        setDownloaded(true);
        return;
      }

      if (result === "cancelled") {
        setSaveError("画像の保存をキャンセルしました。もう一度お試しください。");
        return;
      }

      setSaveError("画像を保存できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }, [cardImage, saving]);

  const stepText = downloaded
    ? "1. 画像を保存しました  2. Xで投稿"
    : "1. 画像を保存  2. Xで投稿";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[430px] flex-col rounded-t-3xl bg-white"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)", maxHeight: "85vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-6 pb-3 pt-4">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full"
            style={{ background: "#E0E0E0" }}
          />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: "#2D2D2D" }}>
              シェアカードを保存
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xl"
              style={{ color: "#9B9B9B" }}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto px-6"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {capturing && (
            <div
              className="mb-3 rounded-2xl p-8 text-center"
              style={{ background: "#F9F9F9" }}
            >
              <div className="text-sm" style={{ color: "#9B9B9B" }}>
                画像を生成中...
              </div>
            </div>
          )}

          {cardImage && !capturing && (
            <div
              className="mb-3 overflow-hidden rounded-2xl shadow-sm"
              style={{ border: "1px solid #F2F2F2" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardImage} alt="シェアカード" className="h-auto w-full" />
            </div>
          )}

          <div className="relative mb-4">
            <textarea
              value={editableText}
              onChange={(event) => setEditableText(event.target.value)}
              className="w-full resize-none rounded-2xl p-4 text-sm leading-relaxed outline-none"
              style={{
                background: "#F9F9F9",
                color: "#2D2D2D",
                border: isOverLimit
                  ? "1.5px solid #E57373"
                  : "1.5px solid transparent",
                minHeight: "120px",
              }}
              rows={6}
            />
            <div
              className="mt-1 pr-1 text-right text-xs font-medium"
              style={{ color: isOverLimit ? "#E57373" : "#9B9B9B" }}
            >
              {editableText.length}/{MAX_CHARS}
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-3 px-6 pb-8 pt-3">
          <div
            className="mb-1 text-center text-xs font-medium"
            style={{ color: "#9B9B9B" }}
          >
            {stepText}
          </div>

          {saveError && (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: "#FFF4F4", color: "#C14B4B" }}
            >
              {saveError}
            </div>
          )}

          {!downloaded && (
            <button
              type="button"
              onClick={() => {
                void handleDownload();
              }}
              disabled={!cardImage || capturing || saving}
              className="w-full rounded-2xl py-3 text-center text-sm font-bold text-white transition-opacity"
              style={{
                background: !cardImage || capturing || saving ? "#BDBDBD" : "#3A8F7A",
                opacity: !cardImage || capturing || saving ? 0.7 : 1,
              }}
            >
              {capturing || saving ? "画像を保存中..." : "画像を保存"}
            </button>
          )}

          {downloaded && (
            <a
              href={xIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-2xl py-3 text-center text-sm font-bold text-white"
              style={{ background: "#0F1419" }}
            >
              Xで投稿する
            </a>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                void handleCopy();
              }}
              className="flex-1 rounded-2xl py-3 text-sm font-medium"
              style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
            >
              {copied ? "コピー済み" : "テキストをコピー"}
            </button>

            {downloaded && (
              <button
                type="button"
                onClick={() => {
                  void handleDownload();
                }}
                disabled={saving}
                className="flex-1 rounded-2xl py-3 text-sm font-medium"
                style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
              >
                {saving ? "保存中..." : "もう一度保存"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
