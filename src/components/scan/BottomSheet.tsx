"use client";

import { useEffect, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-slide-up"
        style={{ maxHeight: "75vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#E0E0E0" }} />
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
