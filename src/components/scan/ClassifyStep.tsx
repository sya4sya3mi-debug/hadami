"use client";

import { PRODUCT_GENRES } from "@/lib/productGenres";
import { ProductGenre } from "@/types";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";

const SCAN_GENRES = PRODUCT_GENRES.filter((g) =>
  ["toner", "serum", "emulsion", "cream", "sunscreen", "mask_pack"].includes(g.key)
);

interface ClassifyStepProps {
  productName: string;
  brand: string;
  productType: ProductGenre;
  imagePreview?: string;
  onProductNameChange: (name: string) => void;
  onBrandChange: (brand: string) => void;
  onProductTypeChange: (type: ProductGenre) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export default function ClassifyStep({
  productName,
  brand,
  productType,
  imagePreview,
  onProductNameChange,
  onBrandChange,
  onProductTypeChange,
  onContinue,
  onBack,
}: ClassifyStepProps) {
  const needsType = !SCAN_GENRES.some((g) => g.key === productType);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "var(--hd-sans)",
    color: "var(--hd-ink)",
    background: "var(--hd-bg)",
    border: "1px solid var(--hd-line)",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top action bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {onBack ? (
          <button
            onClick={onBack}
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: "var(--hd-ink-60)",
              border: "1px solid var(--hd-line)",
              cursor: "pointer",
              fontFamily: "var(--hd-sans)",
              fontSize: 13,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            戻る
          </button>
        ) : <div />}
        <button
          onClick={onContinue}
          style={{
            padding: "13px 24px",
            background: "var(--hd-moss)",
            color: "#fff",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
            fontFamily: "var(--hd-sans)",
            fontSize: 14,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px oklch(0.38 0.05 155 / 0.22)",
          }}
        >
          成分を確認する
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Hero */}
      {imagePreview ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 120,
            overflow: "hidden",
            border: "1px solid var(--hd-hair)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, oklch(0.22 0.01 95 / 0.45), transparent 70%)",
            }}
          />
          <div
            className="hd-mono hd-caps"
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              fontSize: 9,
              color: "var(--hd-bg)",
              letterSpacing: "0.14em",
            }}
          >
            ✓ Captured
          </div>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            height: 120,
            border: "1px dashed var(--hd-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--hd-ink-40)",
            fontFamily: "var(--hd-sans)",
            fontSize: 12,
          }}
        >
          画像なし
        </div>
      )}

      {/* Editable fields */}
      <div
        style={{
          background: "var(--hd-surface)",
          border: "1px solid var(--hd-hair)",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <label
            className="hd-mono hd-caps"
            style={{
              display: "block",
              fontSize: 9,
              color: "var(--hd-ink-40)",
              marginBottom: 6,
              letterSpacing: "0.14em",
            }}
          >
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            style={inputStyle}
            placeholder="コスメ名を入力"
          />
        </div>
        <div>
          <label
            className="hd-mono hd-caps"
            style={{
              display: "block",
              fontSize: 9,
              color: "var(--hd-ink-40)",
              marginBottom: 6,
              letterSpacing: "0.14em",
            }}
          >
            Brand
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            style={inputStyle}
            placeholder="ブランド名を入力"
          />
        </div>
      </div>

      {/* Genre selector */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span
            className="hd-mono hd-caps"
            style={{
              fontSize: 9,
              color: "var(--hd-ink-40)",
              letterSpacing: "0.14em",
            }}
          >
            Type
          </span>
          {needsType && (
            <span
              className="hd-mono hd-caps"
              style={{
                fontSize: 9,
                color: "var(--hd-ink)",
                letterSpacing: "0.14em",
                padding: "2px 8px",
                border: "1px solid var(--hd-ink)",
              }}
            >
              Required
            </span>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {SCAN_GENRES.map((genre) => {
            const isSelected = productType === genre.key;
            return (
              <button
                key={genre.key}
                onClick={() => onProductTypeChange(genre.key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 8px",
                  background: isSelected ? "var(--hd-ink)" : "var(--hd-surface)",
                  color: isSelected ? "var(--hd-bg)" : "var(--hd-ink-60)",
                  border: `1px solid ${isSelected ? "var(--hd-ink)" : "var(--hd-hair)"}`,
                  cursor: "pointer",
                  fontFamily: "var(--hd-sans)",
                  fontSize: 11,
                  fontWeight: 500,
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                }}
              >
                <ProductGenreIcon genre={genre.key} size={20} />
                <span>{genre.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
