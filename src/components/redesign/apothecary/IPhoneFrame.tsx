"use client";

import * as React from "react";

export function IPhoneFrame({ children }: { children: React.ReactNode }) {
  const W = 388;
  const H = 820;
  const GUTTER = 20;
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0eee9",
        padding: `${GUTTER / 2}px 0`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          maxWidth: `calc(100vw - ${GUTTER}px)`,
          maxHeight: `calc(100dvh - ${GUTTER}px)`,
          position: "relative",
          overflow: "hidden",
          background: "var(--hd-bg)",
          borderRadius: 44,
        }}
      >
        {children}
      </div>
    </div>
  );
}
