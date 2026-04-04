"use client";

import { useEffect, useCallback, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function BottomSheet({ open, onClose, children, footer, title, subtitle }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);

    const container = document.getElementById("app-container");
    const nextDiv = document.getElementById("__next");
    const scrollY = container ? container.scrollTop : window.scrollY;
    const topValue = `-${scrollY}px`;

    document.body.style.top = topValue;
    if (nextDiv) nextDiv.style.top = topValue;
    if (container) container.style.top = topValue;
    document.documentElement.classList.add("scroll-locked");

    // overlayのtouchmoveをnon-passiveで直接ブロック
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const blockTouch = (e: TouchEvent) => {
      // contentRef内のタッチはスクロール許可
      if (content && content.contains(e.target as Node)) return;
      e.preventDefault();
    };
    if (overlay) {
      overlay.addEventListener("touchmove", blockTouch, { passive: false });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (overlay) {
        overlay.removeEventListener("touchmove", blockTouch);
      }
      document.documentElement.classList.remove("scroll-locked");
      document.body.style.top = "";
      if (nextDiv) nextDiv.style.top = "";
      if (container) {
        container.style.top = "";
        container.scrollTop = scrollY;
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50" style={{ touchAction: "none" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-slide-up max-h-[90vh] flex flex-col"
      >
        {/* Drag handle + header */}
        <div className="shrink-0 px-6 pt-3 pb-4" style={{ borderBottom: title ? "1px solid #F5F5F5" : undefined }}>
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full" style={{ background: "#E0E0E0" }} />
          </div>
          {title && (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base" style={{ color: "#2D2D2D" }}>{title}</h3>
                {subtitle && <p className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-xl" style={{ color: "#9B9B9B" }}>✕</button>
            </div>
          )}
        </div>
        {/* Content - ここだけスクロール許可 */}
        <div
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto px-5"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            paddingBottom: footer ? "12px" : "calc(32px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
        {/* Footer（常時表示） */}
        {footer && (
          <div
            className="shrink-0 px-5 pt-3"
            style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
