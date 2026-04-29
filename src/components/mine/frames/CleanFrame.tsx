"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import type { ProductGenre } from "@/types";

interface CleanFrameProps {
  imageSrc?: string;
  imageAlt: string;
  hasImage: boolean;
  genre: { key: ProductGenre; color: string } | null;
  name: string;
  brand: string;
  nameSize?: number;
  brandSize?: number;
  priority?: boolean;
  onImageError?: () => void;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
  gradientStop?: string;
}

export default function CleanFrame({
  imageSrc,
  imageAlt,
  hasImage,
  genre,
  name,
  brand,
  nameSize = 11,
  brandSize = 8,
  priority,
  onImageError,
  topLeft,
  topRight,
  bottomRight,
  gradientStop = "oklch(0.18 0.02 90 / 0.55)",
}: CleanFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: hasImage
          ? "var(--hd-surface)"
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
            <ProductGenreIcon genre={genre.key} size={48} />
          ) : (
            <span style={{ fontSize: 36 }}>📦</span>
          )}
        </div>
      )}

      {/* 下部グラデオーバーレイ（テキスト可読性） */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 35%, ${gradientStop})`,
          pointerEvents: "none",
        }}
      />

      {topLeft}
      {topRight}
      {bottomRight}

      {/* テキストオーバーレイ */}
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 8,
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="hd-mono hd-caps"
          style={{
            fontSize: brandSize,
            opacity: 0.85,
            letterSpacing: "0.14em",
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
            fontSize: nameSize,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}
