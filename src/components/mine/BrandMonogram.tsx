"use client";

import { getBrandMonogram } from "@/lib/mineLayout";

interface BrandMonogramProps {
  brand: string;
  size?: number;
  variant?: "light" | "dark";
}

export default function BrandMonogram({
  brand,
  size = 24,
  variant = "light",
}: BrandMonogramProps) {
  const monogram = getBrandMonogram(brand);
  const isLight = variant === "light";

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: isLight ? "rgba(255,255,255,0.95)" : "var(--hd-ink)",
        color: isLight ? "var(--hd-ink)" : "#fff",
        border: isLight ? "1px solid var(--hd-ink-20)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--hd-serif)",
        fontStyle: "italic",
        fontSize: monogram.length >= 2 ? size * 0.42 : size * 0.5,
        letterSpacing: "-0.02em",
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
        userSelect: "none",
      }}
    >
      {monogram}
    </div>
  );
}
