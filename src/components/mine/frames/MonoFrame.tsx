"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import type { ProductGenre } from "@/types";

interface MonoFrameProps {
  imageSrc?: string;
  imageAlt: string;
  hasImage: boolean;
  genre: { key: ProductGenre; color: string } | null;
  name: string;
  brand: string;
  serial: string; // N°XXX
  ingredientCount: number;
  priority?: boolean;
  onImageError?: () => void;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}

export default function MonoFrame({
  imageSrc,
  imageAlt,
  hasImage,
  genre,
  name,
  brand,
  serial,
  ingredientCount,
  priority,
  onImageError,
  topLeft,
  topRight,
}: MonoFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--hd-bg)",
        border: "1px solid var(--hd-hair)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 上部: N° serial */}
      <div
        className="hd-mono hd-caps"
        style={{
          padding: "8px 10px 6px",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "var(--hd-ink-40)",
          borderBottom: "1px solid var(--hd-hair)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span>{serial}</span>
        <span style={{ fontSize: 8, color: "var(--hd-ink-20)" }}>
          {String(ingredientCount).padStart(2, "0")} ING
        </span>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: hasImage
            ? "var(--hd-surface-2)"
            : genre
            ? `linear-gradient(135deg, ${genre.color}25 0%, ${genre.color}08 100%)`
            : "var(--hd-mint-bg)",
          overflow: "hidden",
        }}
      >
        {hasImage && imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            style={{ objectFit: "cover", filter: "saturate(0.85)" }}
            sizes="(max-width:430px) 55vw, 300px"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={onImageError}
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
            {genre ? (
              <ProductGenreIcon genre={genre.key} size={40} />
            ) : (
              <span style={{ fontSize: 28 }}>📦</span>
            )}
          </div>
        )}
        {topLeft}
        {topRight}
      </div>

      {/* 下部: ブランド名 + 商品名 */}
      <div
        style={{
          padding: "8px 10px 10px",
          borderTop: "1px solid var(--hd-hair)",
          color: "var(--hd-ink)",
        }}
      >
        <div
          className="hd-mono hd-caps"
          style={{
            fontSize: 8,
            color: "var(--hd-ink-40)",
            letterSpacing: "0.18em",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {brand || "—"}
        </div>
        <div
          className="hd-serif"
          style={{
            fontSize: 11,
            lineHeight: 1.18,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}
