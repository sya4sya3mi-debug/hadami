"use client";

// M6: gakusou frame template
// Header (HADAMI logo + VOL) - framed hero - sub 3 grid - footer
// Constrained to 540x540: hero aspect 16:9, flex column with sub section taking remaining height.

import * as React from "react";
import ScatterDeco from "@/components/share/ScatterDeco";
import ShareProductImage from "@/components/share/ShareProductImage";
import { buildShareDecoTheme } from "@/lib/shareCardDeco";
import {
  ASPECT_DIMENSIONS,
  type ShareTemplateProps,
} from "./types";

export default function M6Frame({
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
        padding: "20px 22px 50px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScatterDeco items={theme.scatter} seed={13} />

      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBottom: 6,
          borderBottom: `2px solid ${p.ink}`,
          marginBottom: 10,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--hd-serif)",
            fontSize: 22,
            fontStyle: "italic",
            letterSpacing: "-0.025em",
          }}
        >
          HADAMI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {theme.badge}
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              letterSpacing: "0.22em",
              color: p.ink60,
              textTransform: "uppercase",
            }}
          >
            VOL.05 · 4 PICKS
          </div>
        </div>
      </div>

      {/* 額縁ヒーロー: aspectRatio を 16:9 に短縮して 540×540 に収める */}
      <div
        style={{
          position: "relative",
          marginBottom: 10,
          padding: 8,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            aspectRatio: "16 / 9",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <ShareProductImage product={main} size="100%" fontSize={48} />
          <div
            style={{
              position: "absolute",
              left: 10,
              bottom: 10,
              background: "rgba(255,255,255,0.96)",
              padding: "5px 9px",
              fontFamily: "var(--hd-serif)",
              fontSize: 13,
              letterSpacing: "-0.015em",
            }}
          >
            <span style={{ fontStyle: "italic", color: p.accent }}>&ldquo;</span>
            朝のはじまり
            <span style={{ fontStyle: "italic", color: p.accent }}>&rdquo;</span>
          </div>
        </div>
        <div
          style={{
            paddingTop: 5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: p.ink40,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 360,
            }}
          >
            FIG. 01 — {main?.brand || "BRAND"}
          </div>
          <div
            style={{
              fontFamily: "var(--hd-mono)",
              fontSize: 8,
              color: p.accent,
              letterSpacing: "0.14em",
              flexShrink: 0,
            }}
          >
            ★★★★☆
          </div>
        </div>
      </div>

      {/* サブ3点 */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 13,
              letterSpacing: "-0.015em",
            }}
          >
            <span style={{ fontStyle: "italic", color: p.accent }}>+</span> 同じく愛用中
          </div>
          <div style={{ flex: 1, height: 1, background: p.line }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            flex: 1,
            minHeight: 0,
          }}
        >
          {[0, 1, 2].map((i) => {
            const sub = subs[i];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    borderRadius: 6,
                    marginBottom: 4,
                    border: `1px solid ${p.line}`,
                    position: "relative",
                  }}
                >
                  <ShareProductImage product={sub} size="100%" fontSize={20} radius={6} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--hd-mono)",
                    fontSize: 7.5,
                    letterSpacing: "0.1em",
                    color: p.accent,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 0,
                  }}
                >
                  {sub?.brand?.slice(0, 12) || "—"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--hd-mono)",
                    fontSize: 7.5,
                    color: p.ink60,
                    marginTop: 1,
                    lineHeight: 1.2,
                    flexShrink: 0,
                  }}
                >
                  STEP {i + 2}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* フッター */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 22,
          right: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 6,
          borderTop: `1px solid ${p.line}`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {theme.badge}
          <div
            style={{
              fontFamily: "var(--hd-serif)",
              fontSize: 13,
              fontStyle: "italic",
              color: p.accent,
            }}
          >
            HADAMI
          </div>
        </div>
      </div>
    </div>
  );
}
