import * as React from "react";
import type { Product } from "./tokens";

type Props = {
  p: Product;
  size?: number | string;
  radius?: number;
  border?: boolean;
  apo?: boolean;
  labelSize?: number;
};

export function Thumb({ p, size = 44, radius = 2, border = true, apo = false, labelSize }: Props) {
  const numeric = typeof size === "number";
  const fs = labelSize ?? (numeric ? (size as number) * 0.24 : 14);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(145deg, ${p.color}, ${p.color})`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        border: border ? "1px solid var(--hd-hair)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(110deg, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,.08) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "18%",
          right: "18%",
          top: "30%",
          bottom: "30%",
          background: "rgba(255,255,255,0.72)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: apo ? "var(--hd-mono)" : "var(--hd-serif)",
          fontSize: fs,
          color: "oklch(0.3 0.02 90)",
          letterSpacing: apo ? "0.15em" : "0",
        }}
      >
        {p.initials}
      </div>
    </div>
  );
}
