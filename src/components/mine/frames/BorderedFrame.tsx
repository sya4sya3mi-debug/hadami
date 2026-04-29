"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import type { ProductGenre } from "@/types";

interface BorderedFrameProps {
  imageSrc?: string;
  imageAlt: string;
  hasImage: boolean;
  genre: { key: ProductGenre; color: string } | null;
  name: string;
  brand: string;
  priority?: boolean;
  onImageError?: () => void;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}

export default function BorderedFrame({
  imageSrc,
  imageAlt,
  hasImage,
  genre,
  name,
  brand,
  priority,
  onImageError,
  topLeft,
  topRight,
}: BorderedFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--hd-surface)",
        border: "1px solid var(--hd-ink)",
        padding: 4,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: hasImage
            ? "var(--hd-surface-2)"
            : genre
            ? `linear-gradient(135deg, ${genre.color}30 0%, ${genre.color}10 100%)`
            : "var(--hd-mint-bg)",
          overflow: "hidden",
        }}
      >
        {hasImage && imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            style={{ objectFit: "cover" }}
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
              <ProductGenreIcon genre={genre.key} size={42} />
            ) : (
              <span style={{ fontSize: 32 }}>📦</span>
            )}
          </div>
        )}
        {topLeft}
        {topRight}
      </div>

      <div
        style={{
          padding: "8px 6px 4px",
          borderTop: "1px solid var(--hd-hair)",
          marginTop: 4,
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
