"use client";

import { useEffect, useCallback, useRef } from "react";
import { useScrollLock } from "@/lib/useScrollLock";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxHeight?: string;
  height?: string;
}

export default function BottomSheet({
  open,
  onClose,
  children,
  footer,
  title,
  subtitle,
  maxHeight = "calc(100dvh - 2rem)",
  height,
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useScrollLock(open, contentRef);

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex justify-center" style={{ touchAction: "none" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 w-full bg-white rounded-t-3xl animate-slide-up flex flex-col"
        style={{ maxHeight, height, maxWidth: "var(--app-shell-max-width, 430px)" }}
      >
        {/* Drag handle + header */}
        <div
          className="shrink-0 px-6 pt-3 pb-4"
          style={{ borderBottom: title ? "1px solid #e0e0e0" : undefined }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-bo-parchment" />
          </div>
          {title && (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-bo-ink">{title}</h3>
                {subtitle && <p className="text-xs mt-0.5 text-bo-ink-muted">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base text-bo-ink-muted
                           bg-bo-cream border-none cursor-pointer pressable shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {/* Content */}
        <div
          ref={contentRef}
          className="flex-auto min-h-0 overflow-y-auto px-5"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            paddingBottom: footer ? "12px" : "calc(24px + env(safe-area-inset-bottom))",
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
