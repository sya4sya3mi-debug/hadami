"use client";

import * as React from "react";

export function IPhoneFrame({ children }: { children: React.ReactNode }) {
  const W = 388;
  const H = 820;
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#f0eee9",
      }}
    >
      <div
        className="hd-frame"
        style={{
          width: W,
          height: H,
          maxWidth: "100vw",
          maxHeight: "100dvh",
          position: "relative",
          overflow: "hidden",
          background: "var(--hd-bg)",
          borderRadius: 44,
        }}
      >
        {children}
      </div>
      <style>{`
        @media (max-width: 420px) {
          .hd-frame {
            width: 100vw !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
