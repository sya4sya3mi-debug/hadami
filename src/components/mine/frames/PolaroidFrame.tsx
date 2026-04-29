"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ProductGenreIcon } from "@/components/ui/CosmeticIcons";
import type { ProductGenre } from "@/types";

interface PolaroidFrameProps {
  imageSrc?: string;
  imageAlt: string;
  hasImage: boolean;
  genre: { key: ProductGenre; color: string } | null;
  name: string;
  brand: string;
  dateLabel?: string | null;
  priority?: boolean;
  onImageError?: () => void;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}

const FRAME_PADDING = 10;
const CAPTION_HEIGHT = 56;

export default function PolaroidFrame({
  imageSrc,
  imageAlt,
  hasImage,
  genre,
  name,
  brand,
  dateLabel,
  priority,
  onImageError,
  topLeft,
  topRight,
}: PolaroidFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#fdfcf8",
        padding: `${FRAME_PADDING}px ${FRAME_PADDING}px ${CAPTION_HEIGHT}px`,
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.08)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
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

      {/* キャプションストリップ */}
      <div
        style={{
          position: "absolute",
          left: FRAME_PADDING,
          right: FRAME_PADDING,
          bottom: 8,
          height: CAPTION_HEIGHT - 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "var(--hd-ink)",
        }}
      >
        <div
          className="hd-serif"
          style={{
            fontSize: 12,
            fontStyle: "italic",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          className="hd-mono hd-caps"
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            justifyContent: "space-between",
            fontSize: 8,
            color: "var(--hd-ink-60)",
            letterSpacing: "0.16em",
            marginTop: 3,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
              minWidth: 0,
            }}
          >
            {brand || "—"}
          </span>
          {dateLabel && (
            <span style={{ color: "var(--hd-ink-40)", flexShrink: 0 }}>
              {dateLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
