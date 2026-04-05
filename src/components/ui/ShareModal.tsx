"use client";

import { useState, useEffect, useRef } from "react";

interface ShareModalProps {
  text: string;
  onClose: () => void;
}

export default function ShareModal({ text, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  useEffect(() => {
    const container = document.getElementById("app-container");
    const nextDiv = document.getElementById("__next");
    const scrollY = container ? container.scrollTop : 0;
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
      if (container) {
        container.style.top = "";
        container.scrollTop = scrollY;
      }
    };
  }, []);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>Xに投稿 🐦</h3>
            <button onClick={onClose} className="text-xl" style={{ color: "#9B9B9B" }}>✕</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-6 flex-1 min-h-0"
          style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          <div
            className="rounded-2xl p-4 mb-4 text-sm whitespace-pre-wrap leading-relaxed"
            style={{ background: "#F9F9F9", color: "#2D2D2D" }}
          >
            {text}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-8 pt-3 shrink-0 flex gap-3">
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
            className="flex-1 py-3 rounded-2xl text-white text-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #F9A8C0, #F48FB1)" }}
          >
            Xで投稿する ✨
          </a>
        </div>
      </div>
    </div>
  );
}
