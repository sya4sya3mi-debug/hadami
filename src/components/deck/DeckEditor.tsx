"use client";

import { useEffect, useRef } from "react";
import { Product, ProductGenre } from "@/types";
import DeckTray from "./DeckTray";

interface DeckEditorProps {
  routine: string;
  routineLabel: string;
  routineIcon: string;
  productsByGenre: Record<ProductGenre, Product[]>;
  allProducts: Product[];
  onClose: () => void;
  onPrevDeck: () => void;
  onNextDeck: () => void;
  onAddSlot: (genre: ProductGenre) => void;
  onRemoveProduct: (id: string) => void;
  onAutoRecommend: () => void;
}

export default function DeckEditor({
  routineLabel,
  routineIcon,
  productsByGenre,
  onClose,
  onPrevDeck,
  onNextDeck,
  onAddSlot,
  onRemoveProduct,
  onAutoRecommend,
}: DeckEditorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

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
      if (container) {
        container.style.top = "";
      }
      window.scrollTo(0, scrollY);
    };
  }, []);

  const totalProducts = Object.values(productsByGenre).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-bo-parchment" />
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-bo-ink font-sans">
              デッキ編集
            </h3>
            <button onClick={onClose} className="text-xl text-bo-ink-muted bg-transparent border-none cursor-pointer">
              ✕
            </button>
          </div>

          {/* Deck switcher */}
          <div className="flex items-center justify-between bg-bo-parchment rounded-r2 px-3 py-2">
            <button
              onClick={onPrevDeck}
              className="w-8 h-8 rounded-full flex items-center justify-center text-bo-ink-muted bg-white border-none cursor-pointer text-sm"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{routineIcon}</span>
              <span className="font-bold text-sm text-bo-ink font-sans">{routineLabel}</span>
              <span className="text-[11px] text-bo-ink-muted font-sans">{totalProducts}品</span>
            </div>
            <button
              onClick={onNextDeck}
              className="w-8 h-8 rounded-full flex items-center justify-center text-bo-ink-muted bg-white border-none cursor-pointer text-sm"
            >
              ›
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-6 pb-8 flex-1 min-h-0 touch-pan-y overscroll-contain"
        >
          <DeckTray
            productsByGenre={productsByGenre}
            onAddSlot={onAddSlot}
            onRemoveProduct={onRemoveProduct}
          />

          {/* Auto-recommend button */}
          <button
            onClick={onAutoRecommend}
            className="w-full py-3.5 rounded-r2 text-sm font-bold text-white font-sans bg-gradient-to-br from-bo-accent to-bo-accent-dark shadow-bo-accent mt-4 border-none cursor-pointer"
          >
            AIでデッキを自動構築
          </button>
        </div>
      </div>
    </div>
  );
}
