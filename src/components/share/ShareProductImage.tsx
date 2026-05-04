"use client";

// シェアカード内の商品画像タイル。
// 画像URLが無いときはイニシャル＋グラデーションのフォールバック。
// next/image は使わず素の <img> を使う。html2canvas キャプチャで CORS なしでも
// data URL 化済みの画像を確実に取り込めるため。

import * as React from "react";
import type { Product } from "@/types";
import { getInitials } from "@/components/share/templates/types";

type Props = {
  product: Product | undefined;
  size: number | string;
  radius?: number;
  fontSize?: number;
};

export default function ShareProductImage({ product, size, radius = 0, fontSize }: Props) {
  const name = product?.name ?? "";
  const brand = product?.brand ?? "";
  const initials = getInitials(name || brand);
  const imageUrl =
    product?.packageImage ??
    product?.packageImageThumb ??
    product?.packageImageShareUrl ??
    "";
  const hasImage = !!imageUrl;

  const style: React.CSSProperties = {
    width: typeof size === "number" ? size : size,
    height: typeof size === "number" ? size : size,
    borderRadius: radius,
    overflow: "hidden",
    position: "relative",
    background: "#cdc4b3",
    flexShrink: 0,
  };

  return (
    <div style={style}>
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          loading="eager"
          decoding="sync"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 8px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 6px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--hd-serif)",
              fontSize: fontSize ?? Math.max(18, (typeof size === "number" ? size : 100) * 0.22),
              fontStyle: "italic",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "-0.02em",
            }}
          >
            {initials}
          </div>
        </>
      )}
    </div>
  );
}
