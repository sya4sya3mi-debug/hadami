"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import type { Product } from "@/types";
import { getGenreByKey } from "@/lib/productGenres";
import { StarIcon } from "@/components/ui/Icons";
import {
  formatAcquisitionDate,
  getFrameVariant,
  getRotation,
  type FrameVariant,
} from "@/lib/mineLayout";
import CleanFrame from "./frames/CleanFrame";
import PolaroidFrame from "./frames/PolaroidFrame";
import BorderedFrame from "./frames/BorderedFrame";
import MonoFrame from "./frames/MonoFrame";
import BrandMonogram from "./BrandMonogram";

interface EditorialCardProps {
  product: Product;
  index: number;
  hasImage: boolean;
  forceVariant?: FrameVariant;
  aspectRatio?: string;
  nameSize?: number;
  brandSize?: number;
  favSize?: number;
  priority?: boolean;
  onImageError?: () => void;
  editMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onToggleFavorite?: () => void;
  showFeaturedBadge?: boolean;
  serial?: string;
  enableRotation?: boolean;
}

export default function EditorialCard({
  product,
  index,
  hasImage,
  forceVariant,
  aspectRatio = "2/3",
  nameSize = 11,
  brandSize = 8,
  favSize = 22,
  priority,
  onImageError,
  editMode,
  selected,
  onSelect,
  onToggleFavorite,
  showFeaturedBadge = false,
  serial,
  enableRotation,
}: EditorialCardProps) {
  const router = useRouter();
  const variant: FrameVariant =
    forceVariant ?? getFrameVariant(product.id);
  // EDIT モード中はタップごとの :active flatten を抑止するため回転を切る
  const rotationActive = enableRotation ?? !editMode;
  const rotation = rotationActive ? getRotation(product.id) : 0;
  const genre = getGenreByKey(product.productType || "other");
  const genreInfo = genre ? { key: genre.key, color: genre.color } : null;
  const dateLabel =
    formatAcquisitionDate(product.purchasedAt) ??
    formatAcquisitionDate(product.lastUsedAt);
  const cardSerial =
    serial ?? `N°${String(index + 1).padStart(3, "0")}`;
  const ingredientCount = product.ingredients?.length ?? 0;

  const onClick = () => {
    if (editMode) {
      onSelect?.();
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const buttonStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    transform: `rotate(${rotation}deg)`,
    transition: editMode ? "box-shadow 200ms ease" : "transform 240ms ease, box-shadow 200ms ease",
    transformOrigin: "center center",
    willChange: rotation !== 0 ? "transform" : undefined,
  };

  // 各フレームの上部右に置くアクションボタン群
  const favoriteButton = onToggleFavorite ? (
    <button
      type="button"
      aria-label={product.isFavorite ? "お気に入り解除" : "お気に入りに追加"}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite();
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: favSize,
        height: favSize,
        borderRadius: 999,
        border: product.isFavorite
          ? "none"
          : variant === "polaroid" || variant === "bordered" || variant === "mono"
          ? "1px solid var(--hd-ink-20)"
          : "1px solid rgba(255,255,255,0.5)",
        background: product.isFavorite
          ? "var(--hd-moss)"
          : variant === "polaroid" || variant === "bordered" || variant === "mono"
          ? "rgba(255,255,255,0.92)"
          : "rgba(255,255,255,0.18)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
        padding: 0,
      }}
    >
      <StarIcon
        size={favSize * 0.45}
        filled={product.isFavorite}
        color={
          product.isFavorite
            ? "#fff"
            : variant === "polaroid" || variant === "bordered" || variant === "mono"
            ? "var(--hd-ink-40)"
            : "rgba(255,255,255,0.85)"
        }
      />
    </button>
  ) : null;

  // 左上: ブランドモノグラム or FEATURED バッジ
  const topLeftDecoration: ReactNode = showFeaturedBadge ? (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        className="hd-mono hd-caps"
        style={{
          background: "var(--hd-moss)",
          color: "#fff",
          fontSize: 8,
          letterSpacing: "0.18em",
          padding: "3px 8px",
          borderRadius: 0,
        }}
      >
        FEATURED
      </span>
    </div>
  ) : variant === "polaroid" || variant === "bordered" ? (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 2,
      }}
    >
      <BrandMonogram brand={product.brand} size={22} variant="light" />
    </div>
  ) : variant === "clean" ? (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 2,
        background: "rgba(255,255,255,0.9)",
        fontFamily: "var(--hd-mono)",
        fontSize: 8,
        letterSpacing: "0.16em",
        padding: "3px 8px",
        color: "var(--hd-ink)",
      }}
    >
      {cardSerial}
    </div>
  ) : null;

  const editOverlay = editMode ? (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 4,
        width: 22,
        height: 22,
        borderRadius: 999,
        background: selected ? "var(--hd-ink)" : "rgba(255,255,255,0.92)",
        border: selected ? "none" : "1px solid var(--hd-ink-20)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  ) : null;

  const frameContent = (() => {
    const sharedProps = {
      imageSrc: product.packageImageThumb ?? product.packageImage,
      imageAlt: product.name,
      hasImage,
      genre: genreInfo,
      name: product.name,
      brand: product.brand,
      priority,
      onImageError,
      topLeft: editMode ? editOverlay : topLeftDecoration,
      topRight: !editMode ? favoriteButton : null,
    };

    if (variant === "polaroid") {
      return <PolaroidFrame {...sharedProps} dateLabel={dateLabel} />;
    }
    if (variant === "bordered") {
      return <BorderedFrame {...sharedProps} />;
    }
    if (variant === "mono") {
      return (
        <MonoFrame
          {...sharedProps}
          serial={cardSerial}
          ingredientCount={ingredientCount}
        />
      );
    }
    return (
      <CleanFrame
        {...sharedProps}
        nameSize={nameSize}
        brandSize={brandSize}
        bottomRight={undefined}
      />
    );
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={editMode ? "hd-editorial-card hd-no-press" : "hd-editorial-card"}
      style={buttonStyle}
      aria-label={`${product.brand ? product.brand + " " : ""}${product.name}`}
    >
      {frameContent}
    </button>
  );
}
