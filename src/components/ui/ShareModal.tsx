"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { downloadShareImage } from "@/lib/downloadImage";

export interface ShareModalProps {
  text: string;
  onClose: () => void;
  /** DOM element to capture as share image (legacy, slow) */
  captureRef?: React.RefObject<HTMLElement | null>;
  /** Pre-generated base64 image — skips html2canvas entirely */
  imageBase64?: string;
}

export default function ShareModal({ text, onClose, captureRef, imageBase64: imageBase64Prop }: ShareModalProps) {
  const [editableText, setEditableText] = useState(text);
  const [copied, setCopied] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const MAX_CHARS = 280;
  const isOverLimit = editableText.length > MAX_CHARS;
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // imageBase64Prop が変わるたびに cardImage を同期
  useEffect(() => {
    if (imageBase64Prop) setCardImage(imageBase64Prop);
  }, [imageBase64Prop]);

  // imageBase64Prop が渡されている場合は html2canvas をスキップ
  useEffect(() => {
    if (imageBase64Prop) return;
    if (!captureRef?.current) return;
    setCapturing(true);

    const el = captureRef.current;
    const origDisplay = el.style.display;

    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(el, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      })
        .then((canvas) => {
          setCardImage(canvas.toDataURL("image/jpeg", 0.92));
        })
        .catch(() => {
          setCardImage(null);
        })
        .finally(() => {
          el.style.display = origDisplay;
          setCapturing(false);
        });
    });
  }, [captureRef, imageBase64Prop]);

  // Scroll lock — overflow: hidden only, no position:fixed to avoid broken cleanup on navigation
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(editableText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = useCallback(() => {
    if (!cardImage) return;
    downloadShareImage(cardImage);
    setDownloaded(true);
  }, [cardImage]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
      style={{ touchAction: "none" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-3xl flex flex-col"
        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E0E0E0" }} />
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>シェアカードを作成</h3>
            <button onClick={onClose} className="text-xl" style={{ color: "#9B9B9B" }}>✕</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-6 flex-1 min-h-0"
          style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {/* Card image preview */}
          {capturing && (
            <div className="mb-3 rounded-2xl p-8 text-center" style={{ background: "#F9F9F9" }}>
              <div className="text-sm" style={{ color: "#9B9B9B" }}>画像を生成中...</div>
            </div>
          )}
          {cardImage && !capturing && (
            <div className="mb-3 rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #F2F2F2" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardImage} alt="シェアカード" className="w-full h-auto" />
            </div>
          )}

          {/* Editable text */}
          <div className="relative mb-4">
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full rounded-2xl p-4 text-sm leading-relaxed resize-none outline-none"
              style={{
                background: "#F9F9F9",
                color: "#2D2D2D",
                border: isOverLimit ? "1.5px solid #E57373" : "1.5px solid transparent",
                minHeight: "120px",
              }}
              rows={6}
            />
            <div
              className="text-right text-xs mt-1 pr-1 font-medium"
              style={{ color: isOverLimit ? "#E57373" : "#9B9B9B" }}
            >
              {editableText.length}/{MAX_CHARS}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-8 pt-3 shrink-0 space-y-3">
          {/* Step indicator */}
          <div className="text-center text-xs font-medium mb-1" style={{ color: "#9B9B9B" }}>
            {downloaded ? "✓ 画像を保存しました — Xに投稿しましょう" : "① 画像を保存 → ② Xで投稿"}
          </div>

          {/* Download button */}
          {!downloaded && (
            <button
              onClick={handleDownload}
              disabled={!cardImage || capturing}
              className="w-full py-3 rounded-2xl text-white text-center text-sm font-bold transition-opacity"
              style={{
                background: !cardImage || capturing ? "#BDBDBD" : "#3A8F7A",
                opacity: !cardImage || capturing ? 0.7 : 1,
              }}
            >
              {capturing ? "画像を生成中..." : "画像をダウンロード"}
            </button>
          )}

          {/* X intent button (appears after download) */}
          {downloaded && (
            <a
              href={xIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-2xl text-white text-center text-sm font-bold"
              style={{ background: "#0F1419" }}
            >
              Xで投稿する（画像を添付してね）
            </a>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-2xl text-sm font-medium"
              style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
            >
              {copied ? "✓ コピー済み" : "コピー"}
            </button>
            {downloaded && (
              <button
                onClick={handleDownload}
                className="flex-1 py-3 rounded-2xl text-sm font-medium"
                style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
              >
                もう一度ダウンロード
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
