"use client";

// H5: 円形ヒーロー＋サブ3円
// 中央上に大円、下部に3小円横並び。背景に accent 色のラジアルグラデーション。

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

const SUB_POSITIONS = [
  { x: 50, y: 400 },
  { x: 220, y: 420 },
  { x: 390, y: 400 },
];
const TYPE_LABELS = ["MAIN", "STEP 02", "STEP 03", "STEP 04"];

export default function H5HeroCircle({
  products,
  palette: p,
  deco,
  aspect: _aspect,
  username,
  skinType,
}: ShareTemplateProps) {
  const theme = buildShareDecoTheme(deco, p.accent);
  const dim = ASPECT_DIMENSIONS["1:1"];
  const main = products[0];
  const subs = products.slice(1, 4);

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        background: p.bg,
        fontFamily: "var(--hd-sans)",
        color: p.ink,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <ScatterDeco items={theme.scatter} seed={3} />
      {/* 右上のラジアルグラデーション */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.accent}1f 0%, transparent 70%)`,
        }}
      />

      {/* ヘッダー */}
      <div style={{ padding: "26px 32px 0", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          {theme.accent}
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              color: p.accent,
              textTransform: "uppercase",
            }}
          >
            MY 4 PICKS
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 28,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          私の<br />
          <span style={{ fontStyle: "italic", color: p.accent }}>新定番。</span>
        </div>
      </div>

      {/* メイン大円: 中央 */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            padding: 8,
            background: "#fff",
            boxShadow:
              "0 12px 32px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.08)",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          <ShareProductImage product={main} size={244} radius={122} fontSize={48} />
          <div
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
              background: p.accent,
              color: "#fff",
              padding: "4px 14px",
              borderRadius: 999,
              fontFamily: "var(--hd-mono)",
              fontSize: 8.5,
              letterSpacing: "0.18em",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            {React.cloneElement(theme.badge, { color: "#fff" })}
            MY PICK · 1
          </div>
        </div>
      </div>

      {/* サブ3円: 下部横並び */}
      {SUB_POSITIONS.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              padding: 5,
              background: "#fff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <ShareProductImage product={subs[i]} size={78} radius={39} fontSize={20} />
            <div
              style={{
                position: "absolute",
                bottom: -5,
                left: "50%",
                transform: "translateX(-50%)",
                background: p.bg,
                padding: "1px 8px",
                borderRadius: 999,
                fontFamily: "var(--hd-mono)",
                fontSize: 7,
                letterSpacing: "0.1em",
                color: p.ink60,
                border: `1px solid ${p.line}`,
                whiteSpace: "nowrap",
              }}
            >
              {i + 2}. {TYPE_LABELS[i + 1]}
            </div>
          </div>
        </div>
      ))}

      {/* フッター */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-mono)",
            fontSize: 8,
            color: p.ink40,
            letterSpacing: "0.14em",
          }}
        >
          {username ? `@${username}` : ""}
          {skinType ? ` · ${skinType}` : ""}
        </div>
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 14,
            fontStyle: "italic",
            color: p.accent,
            marginTop: 2,
          }}
        >
          HADAMI
        </div>
      </div>
    </div>
  );
}
