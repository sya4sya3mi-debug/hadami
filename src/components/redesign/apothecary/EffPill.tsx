import * as React from "react";
import { Ico } from "./Icons";
import type { Effect } from "./tokens";

type Props = { eff: Effect; filled?: boolean; size?: number };

export function EffPill({ eff, filled = false, size = 18 }: Props) {
  const icon = Ico[eff.icon];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: filled ? eff.bg : "transparent",
        border: filled ? "none" : "1px solid var(--hd-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "oklch(0.35 0.04 90)",
        flexShrink: 0,
      }}
    >
      {icon({ width: size * 0.55, height: size * 0.55 })}
    </div>
  );
}
