import { useEffect, useRef } from "react";
import { RecommendationResult, Product } from "@/types";
import DeckCard from "./DeckCard";

interface AutoRecommendModalProps {
  result: RecommendationResult;
  products: Product[];
  onConfirm: () => void;
  onClose: () => void;
}

export default function AutoRecommendModal({
  result,
  products,
  onConfirm,
  onClose,
}: AutoRecommendModalProps) {
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

  const recommendedProducts = result.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[430px] rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-bo-parchment" />
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-bo-ink font-sans">
              おすすめスキンケアデッキ
            </h3>
            <button onClick={onClose} className="text-xl text-bo-ink-muted">
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-6 pb-8 flex-1 min-h-0 touch-pan-y overscroll-contain"
        >
          {/* Score summary */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 text-center py-2.5 rounded-r2 bg-bo-accent-soft border border-bo-accent/20">
              <div className="text-lg font-bold text-bo-accent font-serif">
                {result.recommendedCombinations.length}件
              </div>
              <div className="text-[10px] text-bo-ink-muted font-sans">
                推奨の組み合わせ
              </div>
            </div>
            <div
              className={`flex-1 text-center py-2.5 rounded-r2 border ${
                result.cautionCombinations.length > 0
                  ? "bg-bo-danger-bg border-bo-danger/20"
                  : "bg-bo-parchment border-bo-parchment"
              }`}
            >
              <div
                className={`text-lg font-bold font-serif ${
                  result.cautionCombinations.length > 0 ? "text-bo-danger" : "text-bo-ink-muted"
                }`}
              >
                {result.cautionCombinations.length}件
              </div>
              <div className="text-[10px] text-bo-ink-muted font-sans">
                注意の組み合わせ
              </div>
            </div>
            <div className="flex-1 text-center py-2.5 rounded-r2 bg-[#F0EDF5] border border-[#B39DDB30]">
              <div className="text-lg font-bold text-[#7B68A8] font-serif">
                {result.coveredCategoryCount}/6
              </div>
              <div className="text-[10px] text-bo-ink-muted font-sans">
                カテゴリカバー
              </div>
            </div>
          </div>

          {/* Product list */}
          <div className="space-y-2 mb-4">
            {recommendedProducts.map((product) => (
              <DeckCard key={product.id} product={product} />
            ))}
          </div>

          {/* Combination info */}
          {(result.recommendedCombinations.length > 0 ||
            result.cautionCombinations.length > 0) && (
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-bo-ink font-sans">
                <span className="w-1 h-4 rounded-full inline-block bg-bo-accent" />
                組み合わせ情報
              </h4>
              <div className="space-y-2">
                {result.recommendedCombinations.map((combo, i) => (
                  <div
                    key={`rec-${i}`}
                    className="rounded-r2 p-3 bg-bo-accent-soft border border-bo-accent/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>📚</span>
                      <span className="font-bold text-xs text-bo-ink font-sans">
                        {combo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-bo-ink-muted font-sans">
                      {combo.desc}
                    </p>
                  </div>
                ))}
                {result.cautionCombinations.map((combo, i) => (
                  <div
                    key={`cau-${i}`}
                    className="rounded-r2 p-3 bg-bo-danger-bg border border-bo-danger/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>📋</span>
                      <span className="font-bold text-xs text-bo-ink font-sans">
                        {combo.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-bo-ink-muted font-sans">
                      {combo.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-center mb-4 text-bo-ink-faint font-sans">
            ※一般的な成分の相性情報に基づく参考提案です。個人の肌の状態により適切なケアは異なります。
          </p>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={onConfirm}
              className="w-full py-3.5 rounded-r2 text-sm font-bold text-white font-sans bg-gradient-to-br from-bo-accent to-bo-accent-dark shadow-bo-accent"
            >
              この組み合わせを使う
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-r2 text-sm font-medium text-bo-ink-muted font-sans"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
