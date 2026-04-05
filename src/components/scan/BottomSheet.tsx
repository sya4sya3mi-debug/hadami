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
  const startYRef = useRef(0);

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
    const scrollY = window.scrollY;
    const topValue = `-${scrollY}px`;

    document.body.style.top = topValue;
    if (nextDiv) nextDiv.style.top = topValue;
    if (container) container.style.top = topValue;
    document.documentElement.classList.add("scroll-locked");

    const overlay = overlayRef.current;
    const content = contentRef.current;

    // Track touch start position
    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If touch is inside scrollable content, allow scroll only within bounds
      if (content && content.contains(e.target as Node)) {
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const touchY = e.touches[0].clientY;
        const deltaY = startYRef.current - touchY;

        // At top and scrolling up -> block
        if (scrollTop <= 0 && deltaY < 0) {
          e.preventDefault();
          return;
        }
        // At bottom and scrolling down -> block
        if (scrollTop + clientHeight >= scrollHeight && deltaY > 0) {
          e.preventDefault();
          return;
        }
        // Otherwise allow scroll within content
        return;
      }
      // Everything outside content -> block
      e.preventDefault();
    };

    if (overlay) {
      overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
      overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (overlay) {
        overlay.removeEventListener("touchstart", handleTouchStart);
        overlay.removeEventListener("touchmove", handleTouchMove);
      }
      document.documentElement.classList.remove("scroll-locked");
      document.body.style.top = "";
      if (nextDiv) nextDiv.style.top = "";
      if (container) {
        container.style.top = "";
      }
      window.scrollTo(0, scrollY);
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
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-slide-up flex flex-col"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
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
        {/* Content */}
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
        {/* Footer */}
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
