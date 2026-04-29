"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { RecommendationResult, Product } from "@/types";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import { getGenreByKey } from "@/lib/productGenres";

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

  // 背面スクロール抑止 + 他画面遷移ロック中の Esc キー処理
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    if (overlay) {
      overlay.addEventListener("touchstart", handleTouchStart, { passive: true });
      overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (overlay) {
        overlay.removeEventListener("touchstart", handleTouchStart);
        overlay.removeEventListener("touchmove", handleTouchMove);
      }
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.classList.remove("scroll-locked");
      document.body.style.top = "";
      if (nextDiv) nextDiv.style.top = "";
      if (container) container.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  const recommendedProducts = result.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(27, 38, 32, 0.55)",
    zIndex: 1000, // TabBar(200) 上 → モーダル中は他画面遷移不可
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    touchAction: "none",
  };

  const sheetStyle: CSSProperties = {
    width: "100%",
    maxWidth: 430,
    maxHeight: "90vh",
    background: "var(--hd-bg)",
    borderTop: "1px solid var(--hd-ink)",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div
      ref={overlayRef}
      className="hd-root hd-softa"
      style={overlayStyle}
      // overlay クリックでは閉じない（Confirm / Cancel 強制）
      role="dialog"
      aria-modal="true"
      aria-label="おすすめスキンケアルーティン"
    >
      <div
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid var(--hd-hair)",
            background: "var(--hd-bg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="hd-mono hd-caps"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: "var(--hd-ink-60)",
                  marginBottom: 4,
                }}
              >
                AUTO COMPOSE · STAFF EDIT
              </div>
              <div
                className="hd-serif"
                style={{
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  color: "var(--hd-ink)",
                }}
              >
                おすすめ
                <span style={{ fontStyle: "italic" }}>スキンケアルーティン.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              style={{
                width: 34,
                height: 34,
                borderRadius: 0,
                background: "transparent",
                border: "1px solid var(--hd-ink)",
                color: "var(--hd-ink)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px",
            overscrollBehavior: "contain",
          }}
        >
          {/* Score summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              border: "1px solid var(--hd-ink)",
              marginBottom: 24,
            }}
          >
            <ScoreCell
              label="推奨"
              sublabel="RECOMMENDED"
              value={result.recommendedCombinations.length}
              accent="moss"
            />
            <ScoreCell
              label="注意"
              sublabel="CAUTION"
              value={result.cautionCombinations.length}
              accent={result.cautionCombinations.length > 0 ? "terra" : "muted"}
              border="x"
            />
            <ScoreCell
              label="カバー"
              sublabel={`${result.coveredGenreCount} / 9`}
              value={`${Math.round((result.coveredGenreCount / 9) * 100)}%`}
              accent="ink"
            />
          </div>

          {/* Product list */}
          <SectionHeader title="SELECTED · 構成" count={recommendedProducts.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {recommendedProducts.map((product, idx) => (
              <ProductRow key={product.id} product={product} index={idx} />
            ))}
          </div>

          {/* Combination info */}
          {(result.recommendedCombinations.length > 0 ||
            result.cautionCombinations.length > 0) && (
            <>
              <SectionHeader title="COMBINATIONS · 組み合わせ" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {result.recommendedCombinations.map((combo, i) => (
                  <CombinationCard
                    key={`rec-${i}`}
                    label={combo.label}
                    desc={combo.desc}
                    type="recommended"
                  />
                ))}
                {result.cautionCombinations.map((combo, i) => (
                  <CombinationCard
                    key={`cau-${i}`}
                    label={combo.label}
                    desc={combo.desc}
                    type="caution"
                  />
                ))}
              </div>
            </>
          )}

          {/* Disclaimer */}
          <p
            className="hd-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.05em",
              color: "var(--hd-ink-40)",
              textAlign: "center",
              lineHeight: 1.7,
              margin: "0 0 20px",
            }}
          >
            ※ 一般的な成分の相性情報に基づく参考提案です。
            <br />
            個人の肌の状態により適切なケアは異なります。
          </p>
        </div>

        {/* Footer (sticky) */}
        <div
          style={{
            padding: "14px 20px calc(14px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid var(--hd-hair)",
            background: "var(--hd-bg)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "var(--hd-ink)",
              color: "var(--hd-bg)",
              border: "1px solid var(--hd-ink)",
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>この組み合わせを使う</span>
            <span
              className="hd-mono"
              style={{ fontSize: 9, letterSpacing: "0.22em", opacity: 0.7 }}
            >
              CONFIRM →
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "transparent",
              border: "1px solid var(--hd-ink-20)",
              color: "var(--hd-ink-60)",
              fontFamily: "var(--hd-sans)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  count?: number;
}
function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <span
        className="hd-mono hd-caps"
        style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "var(--hd-ink-60)",
        }}
      >
        {title}
      </span>
      <span
        aria-hidden
        style={{
          flex: 1,
          height: 1,
          background: "var(--hd-ink-20)",
        }}
      />
      {count !== undefined && (
        <span
          className="hd-mono"
          style={{
            fontSize: 9,
            letterSpacing: "0.18em",
            color: "var(--hd-ink-40)",
          }}
        >
          {String(count).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

type ScoreAccent = "moss" | "terra" | "ink" | "muted";
interface ScoreCellProps {
  label: string;
  sublabel: string;
  value: number | string;
  accent: ScoreAccent;
  border?: "x";
}
function ScoreCell({ label, sublabel, value, accent, border }: ScoreCellProps) {
  const accentColor =
    accent === "moss"
      ? "var(--hd-moss)"
      : accent === "terra"
      ? "var(--hd-terra)"
      : accent === "ink"
      ? "var(--hd-ink)"
      : "var(--hd-ink-40)";

  return (
    <div
      style={{
        padding: "14px 8px 12px",
        textAlign: "center",
        borderLeft: border === "x" ? "1px solid var(--hd-hair)" : undefined,
        borderRight: border === "x" ? "1px solid var(--hd-hair)" : undefined,
        background: "var(--hd-surface)",
      }}
    >
      <div
        className="hd-serif"
        style={{
          fontSize: 22,
          fontStyle: "italic",
          lineHeight: 1,
          color: accentColor,
          marginBottom: 6,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        className="hd-mono hd-caps"
        style={{
          fontSize: 8,
          letterSpacing: "0.18em",
          color: "var(--hd-ink-40)",
          marginBottom: 1,
        }}
      >
        {sublabel}
      </div>
      <div
        className="hd-sans"
        style={{
          fontSize: 10,
          color: "var(--hd-ink-60)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  index: number;
}
function ProductRow({ product, index }: ProductRowProps) {
  const genre = getGenreByKey(product.productType || "other");
  const hasImage = Boolean(product.packageImage);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 10,
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
      }}
    >
      <div
        style={{
          width: 12,
          color: "var(--hd-ink-40)",
          fontSize: 8,
          fontFamily: "var(--hd-mono)",
          letterSpacing: "0.12em",
          textAlign: "center",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          position: "relative",
          background: hasImage
            ? "var(--hd-surface-2)"
            : genre
            ? `linear-gradient(135deg, ${genre.color}30 0%, ${genre.color}10 100%)`
            : "var(--hd-mint-bg)",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          <Image
            src={product.packageImageThumb ?? product.packageImage!}
            alt={product.name}
            fill
            sizes="44px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ProductGenreIcon
              genre={(product.productType || "other")}
              size={20}
            />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="hd-mono hd-caps"
          style={{
            fontSize: 8,
            letterSpacing: "0.18em",
            color: "var(--hd-ink-40)",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.brand || "—"}
        </div>
        <div
          className="hd-serif"
          style={{
            fontSize: 13,
            lineHeight: 1.2,
            color: "var(--hd-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {product.name}
        </div>
      </div>
      {genre && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            background: `${genre.color}1A`,
            color: genre.color,
            fontSize: 9,
            fontFamily: "var(--hd-sans)",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <ProductGenreIcon genre={genre.key} size={10} />
          {genre.label}
        </div>
      )}
    </div>
  );
}

interface CombinationCardProps {
  label: string;
  desc: string;
  type: "recommended" | "caution";
}
function CombinationCard({ label, desc, type }: CombinationCardProps) {
  const isRec = type === "recommended";
  const accent = isRec ? "var(--hd-moss)" : "var(--hd-terra)";

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        className="hd-mono hd-caps"
        style={{
          fontSize: 8,
          letterSpacing: "0.18em",
          color: accent,
          marginBottom: 4,
        }}
      >
        {isRec ? "Recommended · 推奨" : "Note · 注意"}
      </div>
      <div
        className="hd-serif"
        style={{
          fontSize: 13,
          letterSpacing: "-0.01em",
          color: "var(--hd-ink)",
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      <p
        style={{
          fontFamily: "var(--hd-sans)",
          fontSize: 11,
          color: "var(--hd-ink-60)",
          lineHeight: 1.6,
          marginTop: 6,
          marginBottom: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}
