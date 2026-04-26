"use client";

import Image from "next/image";
import { Product, ProductGenre } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { getIngredientById, ACTIVE_CATEGORIES } from "@/lib/ingredients";
import { ActiveCategoryIcon } from "@/components/ui/CosmeticIcons";
import { Ico } from "@/components/redesign/apothecary/Icons";

interface GenreSlotProps {
  genre: ProductGenre;
  stepLabel: string;
  product?: Product;
  onAdd: () => void;
  onRemove?: () => void;
}

export default function GenreSlot({
  genre,
  stepLabel,
  product,
  onAdd,
  onRemove,
}: GenreSlotProps) {
  const genreInfo = getGenreByKey(genre);
  if (!genreInfo) return null;
  const { label } = genreInfo;

  // Empty slot
  if (!product) {
    return (
      <div
        onClick={onAdd}
        role="button"
        tabIndex={0}
        className="hd-softa-card hd-press"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          marginBottom: 10,
          background: "var(--hd-surface)",
          border: "1px solid var(--hd-hair)",
          cursor: "pointer",
        }}
      >
        <div
          className="hd-mono"
          style={{
            width: 26,
            fontSize: 11,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          {stepLabel}
        </div>
        <div
          className="hd-softa-thumb"
          style={{
            width: 50,
            height: 50,
            border: "1px dashed var(--hd-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--hd-ink-40)",
            flexShrink: 0,
          }}
        >
          {Ico.plus({ width: 14, height: 14 })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="hd-serif"
            style={{
              fontSize: 16,
              color: "var(--hd-ink-60)",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </div>
          <div
            className="hd-mono hd-caps"
            style={{ color: "var(--hd-ink-40)", marginTop: 3 }}
          >
            Tap to add · 追加
          </div>
        </div>
      </div>
    );
  }

  // Filled slot — collect active ingredient categories
  const categories = new Set<string>();
  product.ingredients.forEach((pi) => {
    const ing = getIngredientById(pi.ingredientId);
    if (ing?.activeIngredient) {
      ing.categories.forEach((cat) => categories.add(cat));
    }
  });

  return (
    <div
      className="hd-softa-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        marginBottom: 10,
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-hair)",
      }}
    >
      <div
        className="hd-mono"
        style={{
          width: 26,
          fontSize: 11,
          color: "var(--hd-ink-40)",
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}
      >
        {stepLabel}
      </div>

      <div
        className="hd-softa-thumb"
        style={{
          width: 50,
          height: 50,
          flexShrink: 0,
          overflow: "hidden",
          background: "var(--hd-surface-2)",
          position: "relative",
        }}
      >
        {product.packageImage ? (
          <Image
            src={product.packageImageThumb ?? product.packageImage}
            alt={product.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="50px"
            loading="lazy"
          />
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="hd-mono hd-caps"
          style={{
            color: "var(--hd-ink-40)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.brand}
        </div>
        <div
          className="hd-serif"
          style={{
            fontSize: 14,
            marginTop: 3,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </div>
        {categories.size > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {Array.from(categories)
              .slice(0, 5)
              .map((catKey) => {
                const info = ACTIVE_CATEGORIES.find((c) => c.key === catKey);
                return info ? (
                  <span
                    key={catKey}
                    title={info.label}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${info.color}1F`,
                      color: info.color,
                    }}
                  >
                    <ActiveCategoryIcon category={info.key} size={10} />
                  </span>
                ) : null;
              })}
          </div>
        )}
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="削除"
          style={{
            width: 24,
            height: 24,
            border: "1px solid var(--hd-hair)",
            background: "transparent",
            borderRadius: 999,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--hd-ink-40)",
            flexShrink: 0,
          }}
        >
          {Ico.close({ width: 10, height: 10 })}
        </button>
      )}
    </div>
  );
}
