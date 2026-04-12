"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  const [xLinked, setXLinked] = useState<boolean | null>(null);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const MAX_CHARS = 280;
  const isOverLimit = editableText.length > MAX_CHARS;
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Check X link status
  useEffect(() => {
    fetch("/api/x-auth/status")
      .then((r) => r.json())
      .then((d) => setXLinked(d.linked))
      .catch(() => setXLinked(false));
  }, []);

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

  // Scroll lock
  useEffect(() => {
    const container = document.getElementById("app-container");
    const nextDiv = document.getElementById("__next");
    const scrollY = window.scrollY;
    const topValue = `-${scrollY}px`;
    document.body.style.top = topValue;
    if (nextDiv) nextDiv.style.top = topValue;
    if (container) container.style.top = topValue;
    document.documentElement.classList.add("scroll-locked");

    const overlay = overlayRef.current;
    const content = contentRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (content && content.contains(e.target as Node)) {
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const touchY = e.touches[0].clientY;
        const deltaY = startYRef.current - touchY;
        if (scrollTop <= 0 && deltaY < 0) { e.preventDefault(); return; }
        if (scrollTop + clientHeight >= scrollHeight && deltaY > 0) { e.preventDefault(); return; }
        return;
      }
      e.preventDefault();
    };

    if (overlay) {
      overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
      overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      if (overlay) {
        overlay.removeEventListener("touchstart", handleTouchStart);
        overlay.removeEventListener("touchmove", handleTouchMove);
      }
      document.documentElement.classList.remove("scroll-locked");
      document.body.style.top = "";
      if (nextDiv) nextDiv.style.top = "";
      if (container) container.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(editableText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleXLink = useCallback(async () => {
    setLinkError(null);
    try {
      const res = await fetch("/api/x-auth/request-token");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setLinkError(data.error || "X連携に失敗しました");
      }
    } catch {
      setLinkError("通信エラーが発生しました");
    }
  }, []);

  const handlePostToX = useCallback(async () => {
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch("/api/x-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editableText,
          imageBase64: cardImage || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPostResult({
          success: true,
          message: `投稿しました！（残り${data.remaining}件/日）`,
        });
      } else {
        setPostResult({ success: false, message: data.error || "投稿に失敗しました" });
      }
    } catch {
      setPostResult({ success: false, message: "通信エラーが発生しました" });
    } finally {
      setPosting(false);
    }
  }, [editableText, cardImage]);

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
            <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>Xに投稿</h3>
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

          {/* Post result */}
          {postResult && (
            <div
              className="rounded-xl p-3 mb-4 text-sm font-medium text-center"
              style={{
                background: postResult.success ? "#E8F5E9" : "#FFEBEE",
                color: postResult.success ? "#2E7D32" : "#C62828",
              }}
            >
              {postResult.message}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-6 pb-8 pt-3 shrink-0 space-y-3">
          {/* X API post button (if linked) */}
          {xLinked === true && !postResult?.success && (
            <button
              onClick={handlePostToX}
              disabled={posting || capturing || isOverLimit}
              className="w-full py-3 rounded-2xl text-white text-center text-sm font-bold"
              style={{
                background: posting || capturing || isOverLimit
                  ? "#BDBDBD"
                  : "linear-gradient(135deg, #F9A8C0, #F48FB1)",
                opacity: posting || capturing || isOverLimit ? 0.7 : 1,
              }}
            >
              {posting ? "投稿中..." : cardImage ? "画像付きでXに投稿" : "Xに投稿する"}
            </button>
          )}

          {/* X link prompt */}
          {xLinked === false && (
            <>
              <button
                onClick={handleXLink}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{
                  background: "#F9F9F9",
                  color: "#2D2D2D",
                  border: "1.5px solid #E0E0E0",
                }}
              >
                Xアカウントを連携して画像付き投稿
              </button>
              {linkError && (
                <div
                  className="rounded-xl p-3 mt-2 text-sm font-medium text-center"
                  style={{ background: "#FFEBEE", color: "#C62828" }}
                >
                  {linkError}
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 rounded-2xl text-sm font-medium"
              style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
            >
              {copied ? "✓ コピー済み" : "コピー"}
            </button>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-2xl text-center text-sm font-medium"
              style={{ border: "1.5px solid #F2F2F2", color: "#9B9B9B" }}
            >
              Web版で投稿
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
